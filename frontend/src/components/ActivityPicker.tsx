import type { ActivityInfo } from "../lib/api";

interface Props {
  activities: ActivityInfo[];
  selected: string;
  onSelect: (id: string) => void;
}

export function ActivityPicker({ activities, selected, onSelect }: Props) {
  return (
    <div className="activity-picker">
      {activities.map((a) => (
        <button
          key={a.id}
          className={`activity-btn ${selected === a.id ? "active" : ""}`}
          onClick={() => onSelect(a.id)}
        >
          {a.name}
        </button>
      ))}
    </div>
  );
}
