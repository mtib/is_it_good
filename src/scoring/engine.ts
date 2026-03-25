import type { Activity, DayScore, QualifierScore, ScoringContext } from "./types";
import type { DailyWeather } from "../weather/types";

export function scoreDay(activity: Activity, weather: DailyWeather, ctx?: ScoringContext): DayScore {
  let weightedSum = 0;
  let totalWeight = 0;
  const qualifiers: QualifierScore[] = [];

  for (const q of activity.qualifiers) {
    const value = q.extract(weather, ctx);
    const score = Math.max(0, Math.min(10, q.scoreFn(value)));

    qualifiers.push({
      id: q.id,
      name: q.name,
      value: Math.round(value * 10) / 10,
      unit: q.unit,
      score: Math.round(score * 10) / 10,
    });

    weightedSum += score * q.weight;
    totalWeight += q.weight;
  }

  const overall = totalWeight > 0 ? weightedSum / totalWeight : 5;
  const rounded = Math.round(overall * 10) / 10;

  return {
    date: weather.date,
    overall: rounded,
    label: getLabel(rounded),
    qualifiers,
    source: weather.source,
  };
}

function getLabel(score: number): string {
  if (score < 2) return "Bad";
  if (score < 4) return "Poor";
  if (score < 6) return "Fair";
  if (score < 8) return "Good";
  return "Great";
}

export function scoreForecast(activity: Activity, forecast: DailyWeather[], ctx?: ScoringContext): DayScore[] {
  return forecast.map((w) => scoreDay(activity, w, ctx));
}
