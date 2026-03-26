import React from "react";
import type { DayScore } from "../lib/api";

interface Props {
  day: DayScore;
}

function scoreColor(score: number): string {
  if (score < 2) return "#ef4444";
  if (score < 4) return "#f97316";
  if (score < 6) return "#eab308";
  if (score < 8) return "#22c55e";
  return "#16a34a";
}

function formatDate(dateStr: string): { weekday: string; date: string } {
  const d = new Date(dateStr + "T12:00:00Z");
  return {
    weekday: d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
    date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
  };
}

export function DayCard({ day }: Props) {
  const { weekday, date } = formatDate(day.date);
  const useTwo = day.qualifiers.length > 6;
  const mid = useTwo ? Math.ceil(day.qualifiers.length / 2) : day.qualifiers.length;
  const col1 = day.qualifiers.slice(0, mid);
  const col2 = useTwo ? day.qualifiers.slice(mid) : [];

  return (
    <div className="day-row">
      <div className="day-date-col">
        <span className="day-weekday">{weekday}</span>
        <span className="day-date">{date}</span>
      </div>
      <div className="day-score-col">
        <span className="day-score" style={{ color: scoreColor(day.overall) }}>
          {day.overall}
        </span>
        <span className="day-label" style={{ color: scoreColor(day.overall) }}>
          {day.label}
        </span>
      </div>
      <div className={`day-qualifiers${useTwo ? " two-col" : ""}`}>
        <div className="qualifier-col">
          {col1.map((q) => (
            <div key={q.id} className="qualifier-row">
              <span className="qualifier-name">{q.name}</span>
              <span className="qualifier-score" style={{ color: q.weight > 0 ? scoreColor(q.score) : "#64748b" }}>
                {q.weight > 0 ? `${q.score}/10` : ""}
              </span>
              <span className="qualifier-value">{q.value}{q.unit}</span>
            </div>
          ))}
        </div>
        {useTwo && (
          <div className="qualifier-col">
            {col2.map((q) => (
              <div key={q.id} className="qualifier-row">
                <span className="qualifier-name">{q.name}</span>
                <span className="qualifier-score" style={{ color: q.weight > 0 ? scoreColor(q.score) : "#64748b" }}>
                  {q.weight > 0 ? `${q.score}/10` : ""}
                </span>
                <span className="qualifier-value">{q.value}{q.unit}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
