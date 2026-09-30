# SaaS Subscription Eval

Sistema de gestión de suscripciones B2B: administradores de empresas cliente
asignan licencias a sus empleados, monitorean el consumo de API en tiempo real
y reciben alertas al superar el límite contratado.

## Stack

| Capa | Tecnología |
|---|---|
| Backend | NestJS 11 (TypeScript), Prisma 7 + PostgreSQL, JWT, Socket.IO |
| Frontend | Vue 3 (Composition API, TypeScript), Pinia, Vue Router, Tailwind CSS v4, Chart.js, Socket.IO client |
| Monorepo | pnpm workspaces |
| Infraestructura | Docker Compose (PostgreSQL + backend + frontend) |
| Pruebas | Jest (unit + e2e, backend) y Vitest + Vue Test Utils (frontend), ambos con umbral de cobertura ≥80% |
| CI | GitHub Actions — lint + tests en cada PR hacia `main` |

## Ejecución (un solo comando)

Requisitos: Docker Desktop.

```bash
docker compose up --build
```

Esto levanta:

- **PostgreSQL** en `localhost:5433` (healthcheck antes de continuar).
- **Backend** en `http://localhost:3001` — al arrancar corre `prisma migrate deploy` y luego un seed **idempotente** (se puede reiniciar el contenedor sin duplicar datos).
- **Frontend** en `http://localhost:5173`.

No se necesita ningún paso manual adicional: la base de datos queda migrada y con datos de demo listos para usar.

### Credenciales de demo (creadas por el seed)

| Rol | Email | Password |
|---|---|---|
| ADMIN | `admin@acme.test` | `Password123!` |
| USER | `employee1@acme.test` … `employee4@acme.test` | `Password123!` |

La empresa demo "Acme Corp" tiene `licenseLimit: 5`, `usageLimit: 1000` y ya trae 10 días de historial de consumo simulado para que el gráfico del dashboard no se vea vacío en el primer arranque.

### Desarrollo local sin Docker (opcional)

```bash
pnpm install
cp backend/.env.example backend/.env       # editar DATABASE_URL si aplica
cp frontend/.env.example frontend/.env
pnpm --filter saas-subscription-backend prisma:migrate:dev
pnpm --filter saas-subscription-backend prisma:seed
pnpm dev   # backend en :3001 y frontend en :5173 en paralelo
```

### Pruebas

```bash
pnpm --filter saas-subscription-backend test:cov   # unitarias, backend
pnpm --filter saas-subscription-backend test:e2e    # integración contra Postgres real
pnpm --filter frontend test:cov                     # unitarias, frontend
```

## Arquitectura

### Monorepo

`pnpm workspaces` con dos paquetes (`backend/`, `frontend/`) y un `package.json` raíz que delega scripts (`pnpm -r`, `pnpm --filter`). Se eligió sobre Turborepo/Nx por ser suficiente para dos paquetes sin añadir una capa de configuración extra que no aporta valor a este alcance.

### Backend — NestJS, hexagonal pragmático

Cada módulo con lógica de negocio (`licenses`, `usage`, `users`) sigue el mismo patrón de capas:

```
<modulo>/
├── domain/          # entidades + interfaz de repositorio ("puerto")
├── application/      # casos de uso / servicios (reglas de negocio, testeados con mocks)
├── infrastructure/    # implementación del repositorio con Prisma ("adaptador")
├── dto/              # DTOs de entrada/salida validados con class-validator
└── *.controller.ts   # capa HTTP
```

`auth` y `companies` se mantienen más planos porque su alcance no justifica la separación completa. Esto es **Clean/Hexagonal aplicado con criterio**, no por dogma: los casos de uso dependen de interfaces de repositorio (inyectadas por token de NestJS), lo que permite testear las reglas de negocio sin tocar la base de datos — así se llega al 80%+ de cobertura mayormente con tests unitarios rápidos, reservando Postgres real para los tests de integración.

**Principios SOLID aplicados donde aportan valor real:**
- **SRP**: Controller (HTTP) → Service/UseCase (negocio) → Repository (persistencia).
- **DIP**: los casos de uso dependen de `IUsersRepository`/`ILicensesRepository`/etc., no de `PrismaService` directamente.
- **OCP/ISP**: guards y decoradores (`@Roles()`, `RolesGuard`, `@Public()`) extienden el comportamiento sin modificar los controllers existentes.

**Módulos**: `PrismaModule` (global), `AuthModule` (JWT + Passport + `JwtAuthGuard` global), `CompaniesModule`, `UsersModule`, `LicensesModule`, `UsageModule`, `RealtimeModule` (gateway de WebSocket compartido por `licenses` y `usage`).

**Base de datos — por qué PostgreSQL + Prisma**: el dominio es completamente relacional (Company 1—N User, User 1—1 License, Company 1—N ApiUsageRecord) con integridad referencial y transacciones importantes (ver regla de asignación de licencias abajo); un modelo de documentos no aporta nada aquí y sí complicaría las consultas agregadas de consumo. Prisma 7 requiere un *driver adapter* explícito (`@prisma/adapter-pg`) en vez del motor de queries embebido de versiones anteriores — el `PrismaClient` se instancia con ese adapter en `PrismaService`.

**Regla de negocio central — `POST /api/v1/licenses/assign`**: corre dentro de una transacción Prisma con aislamiento `Serializable` que cuenta las licencias activas de la empresa contra su `licenseLimit` antes de insertar, evitando que dos asignaciones concurrentes superen el límite contratado (un conflicto de serialización se trata como "límite alcanzado" en vez de un 500).

**Tiempo real — WebSocket en vez de polling**: `RealtimeGateway` (Socket.IO) autentica el *handshake* con el mismo JWT del API REST y une al cliente a una *room* por `companyId` (aislamiento multi-tenant también a nivel de socket). Emite `usage:update` / `usage:alert` al simular consumo y `licenses:updated` al asignar una licencia.

**Resiliencia**: `ValidationPipe` global (`whitelist`, `forbidNonWhitelisted`, `transform`), `AllExceptionsFilter` que normaliza toda respuesta de error a `{ statusCode, message, error, timestamp, path }`, y `ThrottlerModule` como guard global (100 req/min) para mitigación básica de abuso.

### Frontend — Vue 3

```
src/
├── features/<dominio>/   # vistas + componentes propios de cada feature (auth, dashboard, licenses)
├── stores/                # Pinia (auth, usage, licenses)
├── services/              # cliente HTTP (fetch + JWT), API por dominio, servicio de socket
├── components/            # compartidos (nav bar)
├── router/                # rutas con lazy loading + guards de autenticación/rol
└── types/                 # tipos compartidos con los contratos del backend
```

- **Estado global**: Pinia (setup stores) — `authStore` persiste la sesión en `localStorage` y abre la conexión de socket tras login/rehidratación; `usageStore` y `licensesStore` se suscriben a los eventos del socket para reflejar cambios en tiempo real sin recargar.
- **Gráficos**: Chart.js vía `vue-chartjs` (Recharts es exclusivo de React).
- **Lazy loading**: cada ruta (`/login`, `/dashboard`, `/licenses`) es un chunk independiente (`() => import(...)`), verificable en el build (`vite build` genera un `.js` separado por vista).
- **Rendimiento**: lógica de filtrado/orden/paginación de la tabla de licencias extraída a un *composable* (`useLicensesTable`) con `computed` en vez de recalcular en el template; componentes de presentación puros donde no se necesita estado propio.
- **Tailwind v4**: integración vía plugin de Vite (`@tailwindcss/vite`), sin archivo `tailwind.config.js` — la v4 mueve la configuración a CSS (`@theme`).

### DevOps

- **Docker**: cada servicio (`backend/Dockerfile`, `frontend/Dockerfile`) instala con pnpm en modo workspace (necesita los tres `package.json` + el lockfile raíz), genera el cliente de Prisma, compila y arranca. El backend corre `prisma migrate deploy` + seed antes de levantar el servidor. El frontend recibe `VITE_API_URL`/`VITE_WS_URL` como *build args* (Vite las incrusta en el bundle en build-time, no en runtime) apuntando al puerto publicado en el host, porque ese bundle corre en el navegador del usuario, no dentro de la red interna de Docker.
- **CI** (`.github/workflows/ci.yml`): dos jobs paralelos (`backend`, `frontend`) en cada PR hacia `main`. El job de backend levanta un servicio de PostgreSQL efímero, corre lint, genera el cliente de Prisma, aplica migraciones, corre tests unitarios con cobertura, tests de integración y build. El job de frontend corre lint (oxlint + eslint), tests con cobertura y build.

## Supuestos

Ambigüedades del enunciado y cómo se resolvieron:

1. **"Consumo de API en tiempo real" sin una API real que medir.** Se modela como una tabla de eventos incrementales (`ApiUsageRecord`) alimentada por `POST /api/v1/usage/simulate` (cualquier usuario autenticado puede dispararlo — en el dashboard hay un botón "Simular consumo de API" para demostrarlo en vivo). El "tiempo real" se resuelve empujando el nuevo agregado por WebSocket en vez de que el frontend haga *polling*.
2. **Multi-tenancy.** Cada `User` pertenece a exactamente una `Company`. Un admin solo puede ver/gestionar usuarios y licencias de su propia empresa (filtrado siempre por el `companyId` del JWT, y por *room* a nivel de socket). No se soportan usuarios en múltiples empresas.
3. **Qué constituye una "alerta".** Evento `usage:alert` por WebSocket cuando el consumo supera `USAGE_ALERT_THRESHOLD` (80% por defecto, configurable). Es una alerta de UI en esta prueba, sin sistema de notificaciones externas (email/Slack), por no estar solicitado explícitamente.
4. **Límite de licencias vs. límite de consumo de API.** Son dos campos independientes en `Company` (`licenseLimit`, `usageLimit`): cuántos empleados pueden tener licencia vs. cuántas llamadas puede hacer la empresa, son dos dimensiones distintas del contrato B2B.
5. **Quién puede asignar licencias.** Solo `ADMIN`. `USER` solo consulta su propio consumo.
6. **Gestión de empleados.** El enunciado no especifica un endpoint de alta de empleados, pero es un prerrequisito para poder demostrar `licenses/assign` con datos reales — se agregó `POST /api/v1/users` (solo ADMIN) además del seed con datos de demo.
7. **Paginación de la tabla de licencias.** Client-side, dado el volumen esperable en una prueba técnica (decenas de empleados); en un escenario con miles se migraría a paginación server-side (`skip`/`take` en Prisma).
8. **NestJS 11 en vez de 12.** NestJS 12 se distribuye como ESM-only, lo que rompe `ts-jest` en modo CommonJS sin una migración mayor de todo el proyecto a ESM. Se fijó la v11.x (última con soporte CJS completo) para mantener el setup de Jest existente.
9. **Nombre del repositorio.** El enunciado pedía `saas-subscription-eval`; se documenta aquí por transparencia si el repositorio final tiene otro nombre.

## Estrategia de Git

Cada funcionalidad del backend se desarrolló en su propia rama (`feature/backend-scaffold` → `feature/backend-auth` → `feature/backend-licenses` → `feature/backend-usage` → `feature/backend-error-handling` → `feature/backend-e2e-tests`), apiladas incrementalmente, cada una compilando y con sus tests en verde de forma aislada antes de comitear. El frontend y DevOps (Docker, CI) siguen el mismo patrón. Historial con Conventional Commits (`feat(backend): ...`, `test(backend): ...`, etc.), sin commits gigantes.
