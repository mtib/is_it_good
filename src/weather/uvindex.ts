import { getCachedForecast, setCachedForecast } from "../db/cache";
import { roundCoord } from "../util/geo";

const FORECAST_BASE = "https://api.open-meteo.com/v1/forecast";
const CACHE_TTL = 6 * 3600; // 6 hours

interface UVResponse {
  daily: {
    time: string[];
    uv_index_max: (number | null)[];
  };
}

export interface DailyUV {
  date: string;
  uvi: number;
}

export async function fetchUVIndex(lat: number, lon: number): Promise<DailyUV[]> {
  const rlat = roundCoord(lat);
  const rlon = roundCoord(lon);

  const cached = tryLoadCached(rlat, rlon);
  if (cached) return cached;

  const url = `${FORECAST_BASE}?latitude=${rlat}&longitude=${rlon}&daily=uv_index_max&timezone=auto&forecast_days=7`;
  const res = await fetch(url);
  if (!res.ok) return [];

  const json = (await res.json()) as UVResponse;
  const days: DailyUV[] = [];

  for (let i = 0; i < json.daily.time.length; i++) {
    const uvi = json.daily.uv_index_max[i];
    if (uvi == null) continue;
    const day: DailyUV = { date: json.daily.time[i], uvi };
    days.push(day);
    setCachedForecast("open_meteo_uv", rlat, rlon, day.date, JSON.stringify(day), CACHE_TTL);
  }

  return days;
}

function tryLoadCached(lat: number, lon: number): DailyUV[] | null {
  const today = new Date().toISOString().slice(0, 10);
  const days: DailyUV[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const date = d.toISOString().slice(0, 10);
    const entry = getCachedForecast("open_meteo_uv", lat, lon, date);
    if (entry && !entry.stale) {
      days.push(JSON.parse(entry.data));
    }
  }

  if (days.length >= 2 && days[0]?.date === today) return days;
  return null;
}
