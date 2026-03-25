import { config } from "../config";
import { getCachedForecast, setCachedForecast } from "../db/cache";
import { roundCoord } from "../util/geo";
import type { DailyWeather } from "./types";

const OWM_BASE = "https://api.openweathermap.org";
const CACHE_TTL_5D = 3 * 3600; // 3 hours
const CACHE_TTL_16D = 6 * 3600; // 6 hours

interface OWM5DayEntry {
  dt: number;
  main: { temp: number; temp_min: number; temp_max: number; humidity: number };
  wind: { speed: number; gust?: number };
  clouds: { all: number };
  visibility?: number;
  rain?: { "3h"?: number };
  snow?: { "3h"?: number };
  weather: { main: string; icon: string }[];
}

/** Convert a unix timestamp to YYYY-MM-DD in a given timezone offset (seconds) */
function toLocalDate(dt: number, tzOffsetSeconds: number): string {
  const localMs = (dt + tzOffsetSeconds) * 1000;
  return new Date(localMs).toISOString().slice(0, 10);
}

/** Get today's date string in a given timezone offset (seconds) */
function localToday(tzOffsetSeconds: number): string {
  const nowUtc = Math.floor(Date.now() / 1000);
  return toLocalDate(nowUtc, tzOffsetSeconds);
}

export async function fetch5DayForecast(lat: number, lon: number): Promise<DailyWeather[]> {
  const rlat = roundCoord(lat);
  const rlon = roundCoord(lon);

  const url = `${OWM_BASE}/data/2.5/forecast?lat=${rlat}&lon=${rlon}&appid=${config.owmApiKey}&units=metric`;
  const res = await fetch(url);
  if (!res.ok) {
    // Try stale cache (use UTC offset 0 as fallback — close enough for cache keys)
    const stale = tryLoadCached("owm_5d", rlat, rlon, 0, true);
    if (stale) return stale;
    throw new Error(`OWM 5-day API error: ${res.status}`);
  }

  const json = await res.json() as { city: { timezone: number }; list: OWM5DayEntry[] };
  const tzOffset = json.city.timezone; // seconds from UTC

  // Check cache using location-local dates
  const cached = tryLoadCached("owm_5d", rlat, rlon, tzOffset);
  if (cached) return cached;

  const days = aggregate3HourlyToDaily(json.list, tzOffset);

  for (const day of days) {
    setCachedForecast("owm_5d", rlat, rlon, day.date, JSON.stringify(day), CACHE_TTL_5D);
  }

  return days;
}

export async function fetch16DayForecast(lat: number, lon: number): Promise<DailyWeather[]> {
  const rlat = roundCoord(lat);
  const rlon = roundCoord(lon);

  // 16-day endpoint returns one entry per local day already, but we still
  // need the tz offset for cache key lookups. Try fetching first.
  const url = `${OWM_BASE}/data/2.5/forecast/daily?lat=${rlat}&lon=${rlon}&cnt=16&appid=${config.owmApiKey}&units=metric`;
  const res = await fetch(url);
  if (!res.ok) return []; // Paid tier not available — degrade gracefully

  const json = await res.json() as {
    city: { timezone: number };
    list: {
      dt: number;
      temp: { min: number; max: number; day: number };
      humidity: number;
      speed: number;
      gust?: number;
      rain?: number;
      snow?: number;
      clouds: number;
      weather: { main: string; icon: string }[];
    }[];
  };

  const tzOffset = json.city.timezone;

  const cached = tryLoadCached("owm_16d", rlat, rlon, tzOffset);
  if (cached) return cached;

  const days: DailyWeather[] = json.list.map((entry) => {
    const date = toLocalDate(entry.dt, tzOffset);
    return {
      date,
      temp_min: entry.temp.min,
      temp_max: entry.temp.max,
      temp_avg: entry.temp.day,
      humidity: entry.humidity,
      wind_speed: entry.speed * 3.6, // m/s → km/h
      wind_gust: (entry.gust || entry.speed) * 3.6,
      rain_mm: entry.rain || 0,
      snow_mm: entry.snow || 0,
      cloud_cover: entry.clouds,
      visibility: 10, // not provided in daily, assume good
      weather_main: entry.weather[0]?.main || "Clear",
      weather_icon: entry.weather[0]?.icon || "01d",
      source: "owm_16d",
    };
  });

  for (const day of days) {
    setCachedForecast("owm_16d", rlat, rlon, day.date, JSON.stringify(day), CACHE_TTL_16D);
  }

  return days;
}

function tryLoadCached(
  provider: string,
  lat: number,
  lon: number,
  tzOffset: number,
  allowStale = false
): DailyWeather[] | null {
  const today = localToday(tzOffset);
  const days: DailyWeather[] = [];

  for (let i = 0; i < 16; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    // Use the location-local date for cache lookup
    const date = toLocalDate(Math.floor(d.getTime() / 1000), tzOffset);
    const entry = getCachedForecast(provider, lat, lon, date);
    if (entry && (!entry.stale || allowStale)) {
      days.push(JSON.parse(entry.data));
    }
  }

  // Only return if we have today + at least one more day
  if (days.length >= 2 && days[0]?.date === today) return days;
  return null;
}

function aggregate3HourlyToDaily(entries: OWM5DayEntry[], tzOffset: number): DailyWeather[] {
  const byDate = new Map<string, OWM5DayEntry[]>();

  for (const entry of entries) {
    const date = toLocalDate(entry.dt, tzOffset);
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date)!.push(entry);
  }

  const days: DailyWeather[] = [];

  for (const [date, slots] of byDate) {
    const temps = slots.map((s) => s.main.temp);
    const humidities = slots.map((s) => s.main.humidity);
    const winds = slots.map((s) => s.wind.speed * 3.6); // m/s → km/h
    const gusts = slots.map((s) => (s.wind.gust || s.wind.speed) * 3.6);
    const clouds = slots.map((s) => s.clouds.all);
    const visibilities = slots.map((s) => (s.visibility || 10000) / 1000); // m → km

    const totalRain = slots.reduce((sum, s) => sum + (s.rain?.["3h"] || 0), 0);
    const totalSnow = slots.reduce((sum, s) => sum + (s.snow?.["3h"] || 0), 0);

    // Pick the most representative weather (most frequent main)
    const weatherCounts = new Map<string, number>();
    for (const s of slots) {
      const main = s.weather[0]?.main || "Clear";
      weatherCounts.set(main, (weatherCounts.get(main) || 0) + 1);
    }
    const weatherMain = [...weatherCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "Clear";
    const icon = slots.find((s) => s.weather[0]?.main === weatherMain)?.weather[0]?.icon || "01d";

    days.push({
      date,
      temp_min: Math.min(...temps),
      temp_max: Math.max(...temps),
      temp_avg: temps.reduce((a, b) => a + b, 0) / temps.length,
      humidity: humidities.reduce((a, b) => a + b, 0) / humidities.length,
      wind_speed: Math.max(...winds),
      wind_gust: Math.max(...gusts),
      rain_mm: totalRain,
      snow_mm: totalSnow,
      cloud_cover: clouds.reduce((a, b) => a + b, 0) / clouds.length,
      visibility: Math.min(...visibilities),
      weather_main: weatherMain,
      weather_icon: icon,
      source: "owm_5d",
    });
  }

  return days.sort((a, b) => a.date.localeCompare(b.date));
}
