# Build context is the monorepo root (see docker-compose.yml).
FROM node:24-slim

RUN corepack enable

WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json

RUN pnpm install --frozen-lockfile

COPY frontend ./frontend

WORKDIR /app/frontend

# Vite inlines VITE_* variables into the client bundle at build time, so they
# must be build args, not just runtime env vars. They point at the backend's
# host-published port because this bundle runs in the user's browser, not
# inside the Docker network.
ARG VITE_API_URL
ARG VITE_WS_URL
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_WS_URL=${VITE_WS_URL}

RUN pnpm run build

EXPOSE 5173

CMD ["pnpm", "exec", "vite", "preview", "--host", "0.0.0.0", "--port", "5173"]
