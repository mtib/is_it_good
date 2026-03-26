import type { DailyWeather } from "./types";
import type { TimeOfDay } from "../scoring/types";
import { fetch5DayForecast, fetch16DayForecast } from "./openweathermap";
import { fetchKpForecast } from "./aurora";
import { fetchAirQuality } from "./airquality";
import { fetchMarineForecast } from "./marine";

export async function getForecast(lat: number, lon: number, times?: Set<TimeOfDay>): Promise<DailyWeather[]> {
  // Fetch all available sources in parallel
  const [days5, days16, kpData, aqiData, marineData] = await Promise.all([
    fetch5DayForecast(lat, lon, times).catch(() => [] as DailyWeather[]),
    fetch16DayForecast(lat, lon, times).catch(() => [] as DailyWeather[]),
    fetchKpForecast(lat, lon).catch(() => []),
    fetchAirQuality(lat, lon).catch(() => []),
    fetchMarineForecast(lat, lon).catch(() => []),
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

  // Merge AQI data into weather days
  const aqiByDate = new Map(aqiData.map((a) => [a.date, a]));
  for (const [date, day] of byDate) {
    const aqi = aqiByDate.get(date);
    if (aqi) {
      day.aqi = aqi.aqi;
    }
  }

  // Merge marine data into weather days
  const marineByDate = new Map(marineData.map((m) => [m.date, m]));
  for (const [date, day] of byDate) {
    const marine = marineByDate.get(date);
    if (marine) {
      day.wave_height = marine.wave_height;
      day.wave_period = marine.wave_period;
    }
  }

  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}
