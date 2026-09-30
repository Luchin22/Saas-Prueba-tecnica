# Build context is the monorepo root (see docker-compose.yml), so the pnpm
# workspace lockfile and both package manifests are available to `pnpm install`.
FROM node:24-slim

# Prisma's engine postinstall needs OpenSSL to detect the right build at runtime.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable

WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json

RUN pnpm install --frozen-lockfile

COPY backend ./backend

WORKDIR /app/backend

# Run by directory (not `pnpm --filter backend`): the package's "name" field
# is "saas-subscription-backend", not "backend", so a name-based filter would
# silently match zero projects instead of failing loudly.
RUN pnpm exec prisma generate
RUN pnpm run build

EXPOSE 3001

CMD ["sh", "-c", "pnpm exec prisma migrate deploy && pnpm exec prisma db seed && node dist/src/main.js"]
