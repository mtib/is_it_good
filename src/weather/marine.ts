import { getCachedForecast, setCachedForecast } from "../db/cache";
import { roundCoord } from "../util/geo";

const MARINE_BASE = "https://marine-api.open-meteo.com/v1/marine";
const CACHE_TTL = 6 * 3600; // 6 hours

interface MarineResponse {
  daily: {
    time: string[];
    wave_height_max: (number | null)[];
    wave_period_max: (number | null)[];
  };
}

export interface DailyMarine {
  date: string;
  wave_height: number; // meters
  wave_period: number; // seconds
}

export async function fetchMarineForecast(lat: number, lon: number): Promise<DailyMarine[]> {
  const rlat = roundCoord(lat);
  const rlon = roundCoord(lon);

  const cached = tryLoadCached(rlat, rlon);
  if (cached) return cached;

  const url = `${MARINE_BASE}?latitude=${rlat}&longitude=${rlon}&daily=wave_height_max,wave_period_max&timezone=auto&forecast_days=7`;
  const res = await fetch(url);
  if (!res.ok) return [];

  const json = (await res.json()) as MarineResponse;
  const days: DailyMarine[] = [];

  for (let i = 0; i < json.daily.time.length; i++) {
    const day: DailyMarine = {
      date: json.daily.time[i],
      wave_height: json.daily.wave_height_max[i] ?? 0,
      wave_period: json.daily.wave_period_max[i] ?? 0,
    };
    days.push(day);
    setCachedForecast("open_meteo_marine", rlat, rlon, day.date, JSON.stringify(day), CACHE_TTL);
  }

  return days;
}

function tryLoadCached(lat: number, lon: number): DailyMarine[] | null {
  const today = new Date().toISOString().slice(0, 10);
  const days: DailyMarine[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const date = d.toISOString().slice(0, 10);
    const entry = getCachedForecast("open_meteo_marine", lat, lon, date);
    if (entry && !entry.stale) {
      days.push(JSON.parse(entry.data));
    }
  }

  if (days.length >= 2 && days[0]?.date === today) return days;
  return null;
}
