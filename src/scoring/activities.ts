import type { Activity } from "./types";

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
  qualifiers: [
    {
      id: "wind",
      name: "Wind",
      unit: "km/h",
      weight: 4,
      extract: (w) => w.wind_speed,
      scoreFn: piecewise([[0, 10], [10, 10], [20, 5], [35, 0]]),
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

export const activities: Record<string, Activity> = { biking, drone };
