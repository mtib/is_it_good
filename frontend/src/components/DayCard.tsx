import React, { useState } from "react";
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
  const [expanded, setExpanded] = useState(false);
  const { weekday, date } = formatDate(day.date);

  return (
    <div className={`day-card${expanded ? " expanded" : ""}`} onClick={() => setExpanded(!expanded)}>
      <div className="day-header">
        <span className="day-weekday">{weekday}</span>
        <span className="day-date">{date}</span>
      </div>
      <div className="day-score" style={{ color: scoreColor(day.overall) }}>
        {day.overall}
      </div>
      <div className="day-label" style={{ color: scoreColor(day.overall) }}>
        {day.label}
      </div>
      {expanded && (
        <div className="day-details">
          {day.qualifiers.map((q) => (
            <React.Fragment key={q.id}>
              <span className="qualifier-name">{q.name}</span>
              <span className="qualifier-value">
                {q.value}{q.unit}
              </span>
              <span className="qualifier-score" style={{ color: q.weight > 0 ? scoreColor(q.score) : "#64748b" }}>
                {q.weight > 0 ? `${q.score}/10` : ""}
              </span>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
