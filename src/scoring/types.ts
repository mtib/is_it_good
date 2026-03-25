import type { DailyWeather } from "../weather/types";

export type ScoreFn = (value: number) => number;

export interface Qualifier {
  id: string;
  name: string;
  unit: string;
  weight: number;
  extract: (w: DailyWeather) => number;
  scoreFn: ScoreFn;
}

export interface Activity {
  id: string;
  name: string;
  qualifiers: Qualifier[];
}

export interface QualifierScore {
  id: string;
  name: string;
  value: number;
  unit: string;
  score: number;
}

export interface DayScore {
  date: string;
  overall: number;
  label: string;
  qualifiers: QualifierScore[];
  source: string;
}
