# is_it_good

Web server that rates how good each day is for outdoor activities based on weather forecasts, serving subscribable iCal calendars.

## Stack

- **Runtime:** Bun
- **Database:** bun:sqlite (WAL mode)
- **Frontend:** React + Vite
- **Deployment:** Docker + docker-compose
- **Weather:** OpenWeatherMap API (key via `OWM_API_KEY` env var)

## Commands

- `bun run dev` — start backend with watch mode
- `bun run dev:frontend` — start Vite dev server (port 5173, proxies to backend)
- `bun run build:frontend` — build frontend for production
- `bun run start` — start production server
- `docker compose up` — run via Docker

## Commit Convention

One-line semantic commits, no body. Never include co-author lines.

## Architecture

See [implementation plan](.claude/plans/majestic-conjuring-tulip.md) for full details.

**Key paths:**
- `src/index.ts` — Bun.serve() entry point
- `src/db/` — SQLite schema and cache layer
- `src/weather/` — Weather providers (OWM)
- `src/scoring/` — Activity definitions and scoring engine
- `src/calendar/` — iCal generation
- `src/api/` — REST API routes
- `frontend/` — React app (Vite)
