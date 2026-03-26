export interface DailyWeather {
  date: string; // YYYY-MM-DD
  temp_min: number; // °C
  temp_max: number;
  temp_avg: number;
  humidity: number; // %
  wind_speed: number; // km/h
  wind_gust: number; // km/h
  rain_mm: number;
  snow_mm: number;
  cloud_cover: number; // %
  visibility: number; // km
  weather_main: string; // e.g. "Clear", "Rain"
  weather_icon: string;
  uvi?: number; // UV index (0-11+)
  aqi?: number; // European Air Quality Index (0-100+, lower is better)
  wave_height?: number; // max wave height in meters
  wave_period?: number; // max wave period in seconds
  source: string; // provider id
  kp_max?: number; // geomagnetic Kp index (0-9), from NOAA SWPC
  kp_avg?: number;
  g_scale?: string | null; // NOAA G-scale (G1-G5)
}
