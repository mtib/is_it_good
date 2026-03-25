import type { DailyWeather } from "./types";
import type { TimeOfDay } from "../scoring/types";
import { fetch5DayForecast, fetch16DayForecast } from "./openweathermap";

export async function getForecast(lat: number, lon: number, times?: Set<TimeOfDay>): Promise<DailyWeather[]> {
  // Fetch all available sources in parallel
  const [days5, days16] = await Promise.all([
    fetch5DayForecast(lat, lon, times).catch(() => [] as DailyWeather[]),
    fetch16DayForecast(lat, lon, times).catch(() => [] as DailyWeather[]),
  ]);

  // Merge: prefer 5-day (higher resolution) for overlapping dates, then fill with 16-day
  const byDate = new Map<string, DailyWeather>();

  // Add 16-day first (lower priority)
  for (const day of days16) {
    byDate.set(day.date, day);
  }

  // Override with 5-day (higher priority)
  for (const day of days5) {
    byDate.set(day.date, day);
  }

  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}
