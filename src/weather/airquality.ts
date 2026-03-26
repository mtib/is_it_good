import { getCachedForecast, setCachedForecast } from "../db/cache";
import { roundCoord } from "../util/geo";

const AQ_BASE = "https://air-quality-api.open-meteo.com/v1/air-quality";
const CACHE_TTL = 6 * 3600; // 6 hours

interface AQResponse {
  hourly: {
    time: string[];
    european_aqi: (number | null)[];
  };
}

export interface DailyAQI {
  date: string;
  aqi: number; // daily max European AQI
}

export async function fetchAirQuality(lat: number, lon: number): Promise<DailyAQI[]> {
  const rlat = roundCoord(lat);
  const rlon = roundCoord(lon);

  const cached = tryLoadCached(rlat, rlon);
  if (cached) return cached;

  const url = `${AQ_BASE}?latitude=${rlat}&longitude=${rlon}&hourly=european_aqi&forecast_days=7`;
  const res = await fetch(url);
  if (!res.ok) return [];

  const json = (await res.json()) as AQResponse;
  const days = aggregateHourlyToDaily(json.hourly.time, json.hourly.european_aqi);

  for (const day of days) {
    setCachedForecast("open_meteo_aqi", rlat, rlon, day.date, JSON.stringify(day), CACHE_TTL);
  }

  return days;
}

function aggregateHourlyToDaily(times: string[], values: (number | null)[]): DailyAQI[] {
  const byDate = new Map<string, number[]>();

  for (let i = 0; i < times.length; i++) {
    const date = times[i].slice(0, 10);
    const val = values[i];
    if (val == null) continue;
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date)!.push(val);
  }

  const days: DailyAQI[] = [];
  for (const [date, vals] of byDate) {
    days.push({ date, aqi: Math.max(...vals) });
  }

  return days.sort((a, b) => a.date.localeCompare(b.date));
}

function tryLoadCached(lat: number, lon: number): DailyAQI[] | null {
  const today = new Date().toISOString().slice(0, 10);
  const days: DailyAQI[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const date = d.toISOString().slice(0, 10);
    const entry = getCachedForecast("open_meteo_aqi", lat, lon, date);
    if (entry && !entry.stale) {
      days.push(JSON.parse(entry.data));
    }
  }

  if (days.length >= 2 && days[0]?.date === today) return days;
  return null;
}
