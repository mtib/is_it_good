import type { DayScore } from "../lib/api";
import { DayCard } from "./DayCard";

interface Props {
  days: DayScore[];
  cutoff?: { score: number; mode: "gte" | "lte" } | null;
}

function passesFilter(overall: number, cutoff: { score: number; mode: "gte" | "lte" }): boolean {
  return cutoff.mode === "gte" ? overall >= cutoff.score : overall <= cutoff.score;
}

export function ForecastGrid({ days, cutoff }: Props) {
  if (days.length === 0) {
    return <p className="no-data">No forecast data available.</p>;
  }

  return (
    <div className="forecast-list">
      {days.map((day) => (
        <DayCard
          key={day.date}
          day={day}
          highlighted={cutoff ? passesFilter(day.overall, cutoff) : false}
        />
      ))}
    </div>
  );
}
