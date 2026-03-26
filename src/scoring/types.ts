import type { DailyWeather } from "../weather/types";

export type ScoreFn = (value: number) => number;

export interface ScoringContext {
  lat: number;
  lon: number;
}

/**
 * When `combine` is set, the qualifier still participates in the weighted average
 * like normal. After the weighted average is computed, qualifiers with `combine`
 * are applied as post-processing filters in ascending order of weight:
 *
 * - "low-pass":  score = min(score, qualifier_score)  — caps the overall score
 * - "high-pass": score = max(score, qualifier_score)  — floors the overall score
 */
export interface Qualifier {
  id: string;
  name: string;
  unit: string;
  weight: number;
  combine?: "low-pass" | "high-pass";
  extract: (w: DailyWeather, ctx?: ScoringContext) => number;
  scoreFn: ScoreFn;
}

export type TimeOfDay = "daytime" | "nighttime";

export interface Activity {
  id: string;
  name: string;
  times?: Set<TimeOfDay>;
  qualifiers: Qualifier[];
}

export interface QualifierScore {
  id: string;
  name: string;
  value: number;
  unit: string;
  score: number;
  weight: number;
}

export interface DayScore {
  date: string;
  overall: number;
  label: string;
  qualifiers: QualifierScore[];
  source: string;
}
