import type { DayScore } from "../lib/api";
import { DayCard } from "./DayCard";

interface Props {
  days: DayScore[];
}

export function ForecastGrid({ days }: Props) {
  if (days.length === 0) {
    return <p className="no-data">No forecast data available.</p>;
  }

  return (
    <div className="forecast-grid">
      {days.map((day) => (
        <DayCard key={day.date} day={day} />
      ))}
    </div>
  );
}
