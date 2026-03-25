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
  source: string; // provider id
}
