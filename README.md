# Is It Good?

A web app that tells you how good each day is for outdoor activities based on weather forecasts. Get a subscribable calendar URL that rates upcoming days for biking, drone flying, and more.

## Features

- **Activity scoring** — Each activity has weather qualifiers (rain, wind, temperature, etc.) with weights. Days are scored 0-10 with labels: Bad, Poor, Fair, Good, Great.
- **Subscribable calendars** — Generate an iCal URL you can add to Google Calendar, Apple Calendar, or any app that supports calendar subscriptions. Events update automatically as forecasts change.
- **Graceful degradation** — Uses OpenWeatherMap's free 5-day forecast. If a paid API key is provided, extends to 16-day forecasts. Serves stale cached data if the API is unreachable.
- **Aggressive caching** — Weather data is cached in SQLite (3h for 5-day, 6h for 16-day forecasts). Lat/lon rounded to ~1km precision to maximize cache hits.
- **Calendar cutoff filter** — Optionally filter calendar events by score threshold (e.g., only show days scoring >= 7) via query parameters on the `.ics` URL.
- **Location-aware dates** — Weather data is bucketed by the location's local date, not UTC, so days align correctly regardless of timezone.

## Activities

| Activity | Key Qualifiers |
|----------|---------------|
| Biking | Rain, wind speed, temperature, humidity, cloud cover |
| Drone Flying | Wind speed (heavily weighted), rain (very strict), visibility, temperature, cloud cover |
| Running | Temperature (heavily weighted), rain, wind speed, humidity, cloud cover |

## Quick Start

```bash
# Clone and install
bun install
cd frontend && bun install && cd ..

# Set your OpenWeatherMap API key
cp .env.example .env
# Edit .env and add your OWM_API_KEY

# Build frontend
bun run build:frontend

# Start server
bun run start
# → http://localhost:3000
```

## Development

```bash
# Backend with watch mode
bun run dev

# Frontend dev server (in another terminal)
bun run dev:frontend
# → http://localhost:5173 (proxies API to backend)
```

## Docker

```bash
# Set OWM_API_KEY in .env, then:
docker compose up
# → http://localhost:3000
```

## API

### Get available activities
```
GET /api/activities
```

### Search for a location
```
GET /api/geocode?q=Copenhagen
```

### Get scored forecast
```
GET /api/forecast?lat=55.68&lon=12.57&activity=biking
```

### Create calendar subscription
```
POST /api/calendar/subscribe
Content-Type: application/json

{"lat": 55.68, "lon": 12.57, "activity": "biking", "location_name": "Copenhagen"}
```

Returns a URL like `/cal/abc123xyz.ics` — add this to your calendar app as a subscription.

The calendar URL supports optional cutoff filtering via query parameters:
- `?cutoff=7&mode=gte` — only include days scoring >= 7
- `?cutoff=3&mode=lte` — only include days scoring <= 3

## How Scoring Works

Each activity defines weather qualifiers with:
- **Extract function** — pulls the relevant value from weather data
- **Score function** — piecewise linear mapping from weather value to 0-10 score
- **Weight** — relative importance of this qualifier

The overall day score is the weighted average of all qualifier scores. For example, drone flying weights wind at 6x and rain at 4x while temperature is only 1x, because drones are far more sensitive to wind and precipitation than to temperature. Drone wind scoring is strict — you need under 5 km/h to score 8+.

## License

MIT
