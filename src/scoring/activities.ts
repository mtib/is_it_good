import type { Activity } from "./types";
import type { DailyWeather } from "../weather/types";
import { auroraVisibilityScore } from "../weather/aurora";

/** Calculate daylight hours from latitude and date using sunrise equation */
function daylightHours(lat: number, date: string): number {
  const d = new Date(date + "T12:00:00Z");
  const dayOfYear = Math.floor((d.getTime() - new Date(d.getUTCFullYear(), 0, 0).getTime()) / 86400000);
  const declination = 23.44 * Math.sin((2 * Math.PI / 365) * (dayOfYear - 81));
  const latRad = (lat * Math.PI) / 180;
  const declRad = (declination * Math.PI) / 180;
  const cosHourAngle = -Math.tan(latRad) * Math.tan(declRad);
  if (cosHourAngle <= -1) return 24; // midnight sun
  if (cosHourAngle >= 1) return 0; // polar night
  const hourAngle = Math.acos(cosHourAngle);
  return (2 * hourAngle * 180) / (15 * Math.PI);
}

/** Piecewise linear interpolation from breakpoints [[x, y], ...] */
function piecewise(points: [number, number][]): (value: number) => number {
  return (value: number) => {
    if (value <= points[0][0]) return points[0][1];
    if (value >= points[points.length - 1][0]) return points[points.length - 1][1];

    for (let i = 0; i < points.length - 1; i++) {
      const [x0, y0] = points[i];
      const [x1, y1] = points[i + 1];
      if (value >= x0 && value <= x1) {
        const t = (value - x0) / (x1 - x0);
        return y0 + t * (y1 - y0);
      }
    }
    return 5;
  };
}

const uvQualifier = {
  id: "uvi",
  name: "UV Index",
  unit: "",
  weight: 0,
  extract: (w: DailyWeather) => w.uvi ?? null,
  scoreFn: (v: number) => v,
} as const;

// European AQI: 0-20 good, 20-40 fair, 40-60 moderate, 60-80 poor, 80-100 very poor, 100+ extremely poor
const aqiOutdoorQualifier = {
  id: "aqi",
  name: "Air Quality",
  unit: " EAQI",
  weight: 1,
  extract: (w: DailyWeather) => w.aqi ?? null,
  scoreFn: piecewise([[0, 10], [20, 10], [40, 7], [60, 4], [80, 1], [100, 0]]),
} as const;

const aqiIndoorQualifier = {
  id: "aqi",
  name: "Air Quality",
  unit: " EAQI",
  weight: 1,
  extract: (w: DailyWeather) => w.aqi ?? null,
  scoreFn: piecewise([[0, 2], [20, 3], [40, 5], [60, 7], [80, 9], [100, 10]]),
} as const;

const bikingRainScore = piecewise([[0, 10], [1, 7], [5, 3], [10, 0]]);
const bikingWindScore = piecewise([[0, 10], [15, 10], [25, 6], [40, 2], [50, 0]]);

export const biking: Activity = {
  id: "biking",
  name: "Biking",
  times: new Set(["daytime"]),
  qualifiers: [
    {
      id: "rain",
      name: "Precipitation",
      unit: "mm",
      weight: 3,
      extract: (w) => w.rain_mm + w.snow_mm,
      scoreFn: bikingRainScore,
    },
    {
      id: "wind",
      name: "Wind",
      unit: "km/h",
      weight: 3,
      combine: "low-pass",
      extract: (w) => w.wind_speed,
      scoreFn: bikingWindScore,
    },
    {
      id: "temperature",
      name: "Temperature",
      unit: "°C",
      weight: 1,
      extract: (w) => w.temp_avg,
      scoreFn: piecewise([[-10, 0], [0, 3], [10, 7], [18, 10], [25, 10], [32, 6], [40, 0]]),
    },
    {
      id: "visibility",
      name: "Visibility",
      unit: "km",
      weight: 2,
      extract: (w) => w.visibility,
      scoreFn: piecewise([[0, 0], [1, 3], [5, 7], [10, 10]]),
    },
    {
      id: "clouds",
      name: "Cloud Cover",
      unit: "%",
      weight: 0.5,
      extract: (w) => w.cloud_cover,
      scoreFn: piecewise([[0, 10], [30, 10], [70, 7], [100, 6]]),
    },
    aqiOutdoorQualifier,
    uvQualifier,
  ],
};

const droneWindScore = piecewise([[0, 10], [5, 8], [12, 5], [20, 2], [30, 0]]);
const droneRainScore = piecewise([[0, 10], [0.5, 0]]);

export const drone: Activity = {
  id: "drone",
  name: "Drone Flying",
  times: new Set(["daytime"]),
  qualifiers: [
    {
      id: "wind",
      name: "Wind",
      unit: "km/h",
      weight: 3,
      combine: "low-pass",
      extract: (w) => w.wind_speed,
      scoreFn: droneWindScore,
    },
    {
      id: "rain",
      name: "Precipitation",
      unit: "mm",
      weight: 3,
      combine: "low-pass",
      extract: (w) => w.rain_mm + w.snow_mm,
      scoreFn: droneRainScore,
    },
    {
      id: "visibility",
      name: "Visibility",
      unit: "km",
      weight: 3,
      extract: (w) => w.visibility,
      scoreFn: piecewise([[0, 0], [1, 2], [5, 7], [10, 10]]),
    },
    {
      id: "temperature",
      name: "Temperature",
      unit: "°C",
      weight: 1,
      extract: (w) => w.temp_avg,
      scoreFn: piecewise([[-10, 0], [0, 4], [5, 8], [15, 10], [30, 10], [35, 7], [45, 0]]),
    },
    {
      id: "clouds",
      name: "Cloud Cover",
      unit: "%",
      weight: 1,
      extract: (w) => w.cloud_cover,
      scoreFn: piecewise([[0, 10], [50, 8], [80, 5], [100, 3]]),
    },
    aqiOutdoorQualifier,
    uvQualifier,
  ],
};

export const running: Activity = {
  id: "running",
  name: "Running",
  qualifiers: [
    {
      id: "rain",
      name: "Precipitation",
      unit: "mm",
      weight: 2,
      extract: (w) => w.rain_mm + w.snow_mm,
      scoreFn: piecewise([[0, 10], [2, 6], [8, 2], [15, 0]]),
    },
    {
      id: "wind",
      name: "Wind",
      unit: "km/h",
      weight: 1.5,
      extract: (w) => w.wind_speed,
      scoreFn: piecewise([[0, 10], [15, 10], [30, 5], [50, 0]]),
    },
    {
      id: "temperature",
      name: "Temperature",
      unit: "°C",
      weight: 3,
      extract: (w) => w.temp_avg,
      scoreFn: piecewise([[-15, 0], [-5, 2], [0, 5], [5, 8], [10, 10], [15, 10], [20, 8], [28, 5], [35, 2], [42, 0]]),
    },
    {
      id: "humidity",
      name: "Humidity",
      unit: "%",
      weight: 1,
      extract: (w) => w.humidity,
      scoreFn: piecewise([[0, 7], [30, 10], [60, 10], [75, 6], [90, 2], [100, 0]]),
    },
    {
      id: "clouds",
      name: "Cloud Cover",
      unit: "%",
      weight: 0.5,
      extract: (w) => w.cloud_cover,
      scoreFn: piecewise([[0, 9], [40, 10], [80, 7], [100, 6]]),
    },
    aqiOutdoorQualifier,
    uvQualifier,
  ],
};

export const stargazing: Activity = {
  id: "stargazing",
  name: "Stargazing",
  times: new Set(["nighttime"]),
  qualifiers: [
    {
      id: "clouds",
      name: "Cloud Cover",
      unit: "%",
      weight: 8,
      combine: "low-pass",
      extract: (w) => w.cloud_cover,
      scoreFn: piecewise([[0, 10], [10, 9], [30, 6], [60, 2], [80, 0]]),
    },
    {
      id: "humidity",
      name: "Humidity",
      unit: "%",
      weight: 2,
      extract: (w) => w.humidity,
      scoreFn: piecewise([[0, 10], [40, 10], [70, 7], [85, 3], [100, 0]]),
    },
    {
      id: "wind",
      name: "Wind",
      unit: "km/h",
      weight: 1,
      extract: (w) => w.wind_speed,
      scoreFn: piecewise([[0, 10], [15, 9], [30, 5], [50, 2]]),
    },
    {
      id: "visibility",
      name: "Visibility",
      unit: "km",
      weight: 3,
      combine: "low-pass",
      extract: (w) => w.visibility,
      scoreFn: piecewise([[0, 0], [2, 3], [5, 6], [10, 10]]),
    },
    {
      id: "rain",
      name: "Precipitation",
      unit: "mm",
      weight: 2,
      extract: (w) => w.rain_mm + w.snow_mm,
      scoreFn: piecewise([[0, 10], [0.5, 3], [2, 0]]),
    },
  ],
};

export const aurora: Activity = {
  id: "aurora",
  name: "Aurora Borealis",
  times: new Set(["nighttime"]),
  qualifiers: [
    {
      id: "kp_aurora",
      name: "Aurora Likelihood",
      unit: "Kp",
      weight: 8,
      combine: "low-pass",
      extract: (w, ctx) => {
        if (w.kp_max == null) return null;
        const lat = ctx?.lat ?? 60;
        return auroraVisibilityScore(w.kp_max, lat);
      },
      // extract already returns 0-10 via auroraVisibilityScore, pass through
      scoreFn: (v) => v,
    },
    {
      id: "clouds",
      name: "Cloud Cover",
      unit: "%",
      weight: 6,
      combine: "low-pass",
      extract: (w) => w.cloud_cover,
      scoreFn: piecewise([[0, 10], [10, 9], [30, 6], [60, 2], [80, 0]]),
    },
    {
      id: "rain",
      name: "Precipitation",
      unit: "mm",
      weight: 2,
      extract: (w) => w.rain_mm + w.snow_mm,
      scoreFn: piecewise([[0, 10], [0.5, 5], [2, 0]]),
    },
    {
      id: "visibility",
      name: "Visibility",
      unit: "km",
      weight: 3,
      combine: "low-pass",
      extract: (w) => w.visibility,
      scoreFn: piecewise([[0, 0], [2, 3], [5, 6], [10, 10]]),
    },
    {
      id: "humidity",
      name: "Humidity",
      unit: "%",
      weight: 1,
      extract: (w) => w.humidity,
      scoreFn: piecewise([[0, 10], [50, 10], [75, 5], [90, 2], [100, 0]]),
    },
  ],
};

export const hideAndSeek: Activity = {
  id: "hide_and_seek",
  name: "Hide and Seek",
  times: new Set(["daytime"]),
  qualifiers: [
    {
      id: "rain",
      name: "Rain",
      unit: "mm",
      weight: 4,
      extract: (w) => w.rain_mm + w.snow_mm,
      scoreFn: piecewise([[0, 10], [1, 5], [3, 2], [8, 0]]),
    },
    {
      id: "wind",
      name: "Wind",
      unit: "km/h",
      weight: 4,
      extract: (w) => w.wind_speed,
      scoreFn: piecewise([[0, 10], [10, 10], [20, 7], [35, 3], [50, 0]]),
    },
    {
      id: "temperature",
      name: "Temperature",
      unit: "°C",
      weight: 3,
      extract: (w) => w.temp_avg,
      scoreFn: piecewise([[-10, 0], [0, 2], [10, 6], [18, 9], [25, 10], [32, 8], [40, 3]]),
    },
    {
      id: "visibility",
      name: "Visibility",
      unit: "km",
      weight: 2,
      extract: (w) => w.visibility,
      scoreFn: piecewise([[0, 0], [1, 3], [5, 7], [10, 10]]),
    },
    {
      id: "clouds",
      name: "Cloud Cover",
      unit: "%",
      weight: 0.5,
      extract: (w) => w.cloud_cover,
      scoreFn: piecewise([[0, 10], [50, 8], [80, 6], [100, 4]]),
    },
    {
      id: "daylight",
      name: "Daylight Hours",
      unit: "h",
      weight: 2,
      extract: (w, ctx) => daylightHours(ctx?.lat ?? 50, w.date),
      scoreFn: piecewise([[0, 0], [6, 2], [10, 6], [14, 9], [18, 10]]),
    },
    aqiOutdoorQualifier,
    uvQualifier,
  ],
};

export const gaming: Activity = {
  id: "gaming",
  name: "Gaming",
  qualifiers: [
    {
      id: "rain",
      name: "Precipitation",
      unit: "mm",
      weight: 3,
      extract: (w) => w.rain_mm + w.snow_mm,
      scoreFn: piecewise([[0, 3], [2, 6], [8, 9], [15, 10]]),
    },
    {
      id: "wind",
      name: "Wind",
      unit: "km/h",
      weight: 2,
      extract: (w) => w.wind_speed,
      scoreFn: piecewise([[0, 3], [15, 5], [30, 8], [50, 10]]),
    },
    {
      id: "temperature",
      name: "Temperature",
      unit: "°C",
      weight: 3,
      extract: (w) => w.temp_avg,
      scoreFn: piecewise([[-15, 10], [-5, 9], [5, 7], [15, 4], [25, 2], [35, 1], [45, 0]]),
    },
    {
      id: "clouds",
      name: "Cloud Cover",
      unit: "%",
      weight: 2,
      extract: (w) => w.cloud_cover,
      scoreFn: piecewise([[0, 2], [30, 4], [70, 7], [100, 10]]),
    },
    aqiIndoorQualifier,
  ],
};

export const swimming: Activity = {
  id: "swimming",
  name: "Swimming (Casual)",
  times: new Set(["daytime"]),
  qualifiers: [
    {
      id: "water_temp",
      name: "Water Temp",
      unit: "°C",
      weight: 7,
      combine: "low-pass",
      extract: (w) => w.water_temp ?? null,
      scoreFn: piecewise([[0, 0], [5, 2], [10, 5], [14, 7], [17, 8], [21, 10], [29, 10], [33, 7], [37, 3]]),
    },
    {
      id: "temperature",
      name: "Air Temp",
      unit: "°C",
      weight: 3,
      combine: "low-pass",
      extract: (w) => w.temp_avg,
      scoreFn: piecewise([[0, 0], [8, 2], [15, 5], [20, 8], [25, 10], [32, 10], [38, 6], [44, 3]]),
    },
    {
      id: "waves",
      name: "Wave Height",
      unit: "m",
      weight: 3,
      combine: "low-pass",
      extract: (w) => w.wave_height ?? null,
      scoreFn: piecewise([[0, 10], [0.5, 9], [1, 7], [1.5, 4], [2.5, 1], [4, 0]]),
    },
    {
      id: "rain",
      name: "Precipitation",
      unit: "mm",
      weight: 0.5,
      combine: "low-pass",
      extract: (w) => w.rain_mm + w.snow_mm,
      scoreFn: piecewise([[0, 10], [3, 8], [8, 5], [15, 2]]),
    },
    {
      id: "wind",
      name: "Wind",
      unit: "km/h",
      weight: 2,
      combine: "low-pass",
      extract: (w) => w.wind_speed,
      scoreFn: piecewise([[0, 10], [15, 10], [25, 6], [40, 2], [50, 0]]),
    },
    {
      id: "clouds",
      name: "Cloud Cover",
      unit: "%",
      weight: 1,
      extract: (w) => w.cloud_cover,
      scoreFn: piecewise([[0, 10], [30, 10], [70, 7], [100, 5]]),
    },
    aqiOutdoorQualifier,
    uvQualifier,
  ],
};

export const swimmingSport: Activity = {
  id: "swimming_sport",
  name: "Swimming (Sport)",
  times: new Set(["daytime"]),
  qualifiers: [
    {
      id: "water_temp",
      name: "Water Temp",
      unit: "°C",
      weight: 3,
      extract: (w) => w.water_temp ?? null,
      scoreFn: piecewise([[0, 0], [5, 3], [10, 6], [14, 8], [18, 10], [26, 10], [32, 7], [36, 3]]),
    },
    {
      id: "waves",
      name: "Wave Height",
      unit: "m",
      weight: 3,
      combine: "low-pass",
      extract: (w) => w.wave_height ?? null,
      scoreFn: piecewise([[0, 10], [0.5, 9], [1, 7], [1.5, 4], [2.5, 1], [4, 0]]),
    },
    {
      id: "rain",
      name: "Precipitation",
      unit: "mm",
      weight: 0.5,
      extract: (w) => w.rain_mm + w.snow_mm,
      scoreFn: piecewise([[0, 10], [5, 8], [15, 5], [30, 2]]),
    },
    {
      id: "wind",
      name: "Wind",
      unit: "km/h",
      weight: 2,
      extract: (w) => w.wind_speed,
      scoreFn: piecewise([[0, 10], [15, 10], [25, 6], [40, 2], [50, 0]]),
    },
    {
      id: "clouds",
      name: "Cloud Cover",
      unit: "%",
      weight: 0.5,
      extract: (w) => w.cloud_cover,
      scoreFn: piecewise([[0, 10], [50, 10], [100, 7]]),
    },
    aqiOutdoorQualifier,
    uvQualifier,
  ],
};

export const lueften: Activity = {
  id: "lueften",
  name: "Lüften",
  qualifiers: [
    {
      id: "rain",
      name: "Precipitation",
      unit: "mm",
      weight: 10,
      combine: "low-pass",
      extract: (w) => w.rain_mm + w.snow_mm,
      scoreFn: piecewise([[0, 10], [0.1, 5], [0.2, 0]]),
    },
    {
      id: "wind",
      name: "Wind",
      unit: "km/h",
      weight: 5,
      combine: "low-pass",
      extract: (w) => w.wind_speed,
      scoreFn: piecewise([[0, 10], [5, 8], [10, 3], [20, 0]]),
    },
    {
      id: "humidity",
      name: "Humidity",
      unit: "%",
      weight: 1,
      extract: (w) => w.humidity,
      scoreFn: piecewise([[0, 10], [90, 10], [100, 5]]),
    },
  ],
};

export const activities: Record<string, Activity> = { biking, drone, running, swimming, swimming_sport: swimmingSport, stargazing, aurora, hide_and_seek: hideAndSeek, gaming, lueften };
