# is_it_good

Web server that rates how good each day is for outdoor activities based on weather forecasts, serving subscribable iCal calendars.

## Stack

- **Runtime:** Bun
- **Database:** bun:sqlite (WAL mode)
- **Frontend:** React + Vite
- **Deployment:** Docker + docker-compose
- **Weather:** OpenWeatherMap API (key via `OWM_API_KEY` env var)

## Commands

- `bun run dev` — start backend with watch mode (port 3000)
- `bun run dev:frontend` — start Vite dev server (port 5173, proxies API to backend)
- `bun run build:frontend` — build frontend for production
- `bun run start` — start production server
- `docker compose up` — run via Docker
- `bunx tsc --noEmit` — type-check backend

## Commit Convention

One-line semantic commits, no body. Never include co-author lines.

## Architecture

See [implementation plan](.claude/plans/majestic-conjuring-tulip.md) for full details.

**Key paths:**
- `src/index.ts` — Bun.serve() entry point, static file serving, CORS
- `src/config.ts` — Environment variable configuration
- `src/db/schema.ts` — SQLite initialization (WAL mode), table creation
- `src/db/cache.ts` — Weather cache, geocode cache, calendar subscription CRUD
- `src/weather/types.ts` — Normalized DailyWeather interface
- `src/weather/openweathermap.ts` — OWM client (5-day free + 16-day paid tier)
- `src/weather/provider.ts` — Multi-provider aggregator (prefers higher-res sources)
- `src/scoring/activities.ts` — Biking and Drone activity definitions with piecewise-linear score functions
- `src/scoring/engine.ts` — Weighted average scoring engine
- `src/calendar/ical.ts` — RFC 5545 iCal generation with deterministic UIDs
- `src/api/router.ts` — Pattern-match route dispatcher
- `src/api/` — REST endpoints (activities, forecast, calendar, geocode)
- `frontend/` — React app (Vite)

## API Endpoints

- `GET /api/activities` — list available activities
- `GET /api/forecast?lat=&lon=&activity=` — scored forecast per day
- `GET /api/geocode?q=` — location search
- `POST /api/calendar/subscribe` — create calendar subscription, returns URL
- `GET /cal/:token.ics` — subscribable iCal feed

## Environment Variables

- `OWM_API_KEY` (required) — OpenWeatherMap API key
- `DB_PATH` — SQLite database path (default: `./data/is_it_good.db`)
- `PORT` — Server port (default: `3000`)
- `BASE_URL` — External base URL for calendar URLs (optional)
