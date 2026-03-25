import type { DailyWeather } from "./types";
import type { TimeOfDay } from "../scoring/types";
import { fetch5DayForecast, fetch16DayForecast } from "./openweathermap";
import { fetchKpForecast } from "./aurora";

export async function getForecast(lat: number, lon: number, times?: Set<TimeOfDay>): Promise<DailyWeather[]> {
  // Fetch all available sources in parallel
  const [days5, days16, kpData] = await Promise.all([
    fetch5DayForecast(lat, lon, times).catch(() => [] as DailyWeather[]),
    fetch16DayForecast(lat, lon, times).catch(() => [] as DailyWeather[]),
    fetchKpForecast(lat, lon).catch(() => []),
  ]);

  // Merge weather: prefer 5-day (higher resolution) for overlapping dates, then fill with 16-day
  const byDate = new Map<string, DailyWeather>();

  for (const day of days16) {
    byDate.set(day.date, day);
  }

  for (const day of days5) {
    byDate.set(day.date, day);
  }

  // Merge Kp data into weather days
  const kpByDate = new Map(kpData.map((k) => [k.date, k]));
  for (const [date, day] of byDate) {
    const kp = kpByDate.get(date);
    if (kp) {
      day.kp_max = kp.kp_max;
      day.kp_avg = kp.kp_avg;
      day.g_scale = kp.g_scale;
    }
  }

  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}
