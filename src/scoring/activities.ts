import type { Activity } from "./types";
import { auroraVisibilityScore } from "../weather/aurora";

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

export const biking: Activity = {
  id: "biking",
  name: "Biking",
  times: new Set(["daytime"]),
  qualifiers: [
    {
      id: "rain",
      name: "Rain",
      unit: "mm",
      weight: 3,
      extract: (w) => w.rain_mm + w.snow_mm,
      scoreFn: piecewise([[0, 10], [1, 7], [5, 3], [10, 0]]),
    },
    {
      id: "wind",
      name: "Wind",
      unit: "km/h",
      weight: 2,
      extract: (w) => w.wind_speed,
      scoreFn: piecewise([[0, 10], [10, 10], [25, 4], [40, 0]]),
    },
    {
      id: "temperature",
      name: "Temperature",
      unit: "°C",
      weight: 2,
      extract: (w) => w.temp_avg,
      scoreFn: piecewise([[-10, 0], [0, 3], [10, 7], [18, 10], [25, 10], [32, 6], [40, 0]]),
    },
    {
      id: "humidity",
      name: "Humidity",
      unit: "%",
      weight: 0.5,
      extract: (w) => w.humidity,
      scoreFn: piecewise([[0, 6], [30, 10], [60, 10], [80, 6], [100, 3]]),
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

export const drone: Activity = {
  id: "drone",
  name: "Drone Flying",
  times: new Set(["daytime"]),
  qualifiers: [
    {
      id: "wind",
      name: "Wind",
      unit: "km/h",
      weight: 6,
      extract: (w) => w.wind_speed,
      scoreFn: piecewise([[0, 10], [5, 8], [12, 5], [20, 2], [30, 0]]),
    },
    {
      id: "rain",
      name: "Rain",
      unit: "mm",
      weight: 4,
      extract: (w) => w.rain_mm + w.snow_mm,
      scoreFn: piecewise([[0, 10], [0.5, 0]]),
    },
    {
      id: "visibility",
      name: "Visibility",
      unit: "km",
      weight: 2,
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
      name: "Rain",
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
      weight: 2,
      extract: (w) => w.visibility,
      scoreFn: piecewise([[0, 0], [2, 3], [5, 6], [10, 10]]),
    },
    {
      id: "rain",
      name: "Rain",
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
      weight: 2,
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
      weight: 3,
      extract: (w) => w.wind_speed,
      scoreFn: piecewise([[0, 10], [10, 10], [20, 7], [35, 3], [50, 0]]),
    },
    {
      id: "temperature",
      name: "Temperature",
      unit: "°C",
      weight: 2,
      extract: (w) => w.temp_avg,
      scoreFn: piecewise([[-10, 0], [0, 2], [10, 6], [18, 9], [25, 10], [32, 8], [40, 3]]),
    },
    {
      id: "clouds",
      name: "Cloud Cover",
      unit: "%",
      weight: 0.5,
      extract: (w) => w.cloud_cover,
      scoreFn: piecewise([[0, 10], [50, 8], [80, 6], [100, 4]]),
    },
  ],
};

export const activities: Record<string, Activity> = { biking, drone, running, stargazing, aurora, hide_and_seek: hideAndSeek };
