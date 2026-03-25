FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lock ./
COPY frontend/package.json frontend/bun.lock ./frontend/
RUN bun install --frozen-lockfile && cd frontend && bun install --frozen-lockfile

# Build frontend
FROM deps AS frontend-build
COPY frontend/ frontend/
RUN cd frontend && bunx vite build

# Production
FROM base AS production
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production
COPY src/ src/
COPY --from=frontend-build /app/frontend/dist frontend/dist

VOLUME /app/data
EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
