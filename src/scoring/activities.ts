import type { Activity } from "./types";
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

const bikingRainScore = piecewise([[0, 10], [1, 7], [5, 3], [10, 0]]);
const bikingWindScore = piecewise([[0, 10], [10, 10], [25, 4], [40, 0]]);

export const biking: Activity = {
  id: "biking",
  name: "Biking",
  times: new Set(["daytime"]),
  qualifiers: [
    {
      id: "conditions",
      name: "Safety",
      unit: "%",
      weight: 6,
      extract: (w) => {
        const rain = bikingRainScore(w.rain_mm + w.snow_mm);
        const wind = bikingWindScore(w.wind_speed);
        return rain * wind;
      },
      scoreFn: (v) => v / 10,
    },
    {
      id: "rain",
      name: "Precipitation",
      unit: "mm",
      weight: 0.5,
      extract: (w) => w.rain_mm + w.snow_mm,
      scoreFn: bikingRainScore,
    },
    {
      id: "wind",
      name: "Wind",
      unit: "km/h",
      weight: 0.5,
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
      id: "conditions",
      name: "Safety",
      unit: "%",
      weight: 8,
      extract: (w) => {
        const wind = droneWindScore(w.wind_speed);
        const rain = droneRainScore(w.rain_mm + w.snow_mm);
        return wind * rain;
      },
      scoreFn: (v) => v / 10,
    },
    {
      id: "wind",
      name: "Wind",
      unit: "km/h",
      weight: 0.5,
      extract: (w) => w.wind_speed,
      scoreFn: droneWindScore,
    },
    {
      id: "rain",
      name: "Precipitation",
      unit: "mm",
      weight: 0.5,
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
      scoreFn: piecewise([[-15, 0], [-5, 3], [5, 7], [12, 10], [20, 10], [28, 7], [35, 3], [42, 0]]),
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
      required: true,
      extract: (w, ctx) => {
        const kp = w.kp_max ?? 0;
        const lat = ctx?.lat ?? 60;
        return auroraVisibilityScore(kp, lat);
      },
      // extract already returns 0-10 via auroraVisibilityScore, pass through
      scoreFn: (v) => v,
    },
    {
      id: "clouds",
      name: "Cloud Cover",
      unit: "%",
      weight: 6,
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
  ],
};

export const activities: Record<string, Activity> = { biking, drone, running, stargazing, aurora, hide_and_seek: hideAndSeek, gaming };
