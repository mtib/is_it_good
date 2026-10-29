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

# Server: `bun build --compile --aot` type checks the program and compiles it to machine code (no JIT). Canary Bun for now:
# --aot is not in a stable release as of 1.4.4. The build must run on the platform it deploys to (amd64 on hetzner).
FROM oven/bun:canary-slim AS aot
WORKDIR /app
COPY package.json bun.lock tsconfig.json ./
RUN bun install --frozen-lockfile --production
COPY src/ src/
RUN bun build --compile --aot src/index.ts --outfile /is-it-good

# Production: the binary carries its own runtime, so plain Debian is enough
FROM debian:bookworm-slim AS production
WORKDIR /app
ENV FRONTEND_DIR=/app/frontend/dist
COPY --from=aot /is-it-good /usr/local/bin/is-it-good
COPY --from=frontend-build /app/frontend/dist frontend/dist

VOLUME /app/data
EXPOSE 3000

CMD ["is-it-good"]
