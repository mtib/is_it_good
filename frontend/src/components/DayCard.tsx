import type { DayScore, QualifierScore } from "../lib/api";

interface Props {
  day: DayScore;
  highlighted?: boolean;
}

function scoreColor(score: number): string {
  if (score < 2) return "var(--score-bad)";
  if (score < 4) return "var(--score-poor)";
  if (score < 6) return "var(--score-fair)";
  if (score < 8) return "var(--score-good)";
  return "var(--score-great)";
}

function formatDate(dateStr: string): { weekday: string; date: string } {
  const d = new Date(dateStr + "T12:00:00Z");
  return {
    weekday: d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
    date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
  };
}

function hasValue(q: QualifierScore): boolean {
  return q.value !== null && q.value !== undefined;
}

function QualifierCol({ qualifiers }: { qualifiers: QualifierScore[] }) {
  return (
    <div className="qualifier-col">
      {qualifiers.map((q) => (
        <div key={q.id} className="qualifier-row">
          <span className="qualifier-name">{q.name}</span>
          <span className="qualifier-score" style={{ color: hasValue(q) && q.weight > 0 ? scoreColor(q.score) : "var(--text-muted)" }}>
            {hasValue(q) && q.weight > 0 ? `${q.score}/10` : ""}
          </span>
          <span className="qualifier-value">{hasValue(q) ? `${q.value}${q.unit}` : "~"}</span>
        </div>
      ))}
    </div>
  );
}

export function DayCard({ day, highlighted }: Props) {
  const { weekday, date } = formatDate(day.date);
  const useTwo = day.qualifiers.length > 6;
  const mid = useTwo ? Math.ceil(day.qualifiers.length / 2) : day.qualifiers.length;
  const col1 = day.qualifiers.slice(0, mid);
  const col2 = useTwo ? day.qualifiers.slice(mid) : [];

  return (
    <div className={`day-row${highlighted ? " day-row-highlighted" : ""}`}>
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
        <QualifierCol qualifiers={col1} />
        {useTwo && <QualifierCol qualifiers={col2} />}
      </div>
    </div>
  );
}
