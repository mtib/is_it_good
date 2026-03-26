import type { ActivityInfo } from "../lib/api";

interface Props {
  activities: ActivityInfo[];
  selected: string;
  onSelect: (id: string) => void;
}

export function ActivityPicker({ activities, selected, onSelect }: Props) {
  const sorted = [...activities].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="activity-picker">
      <select
        className="activity-select"
        value={selected}
        onChange={(e) => onSelect(e.target.value)}
      >
        {sorted.map((a) => (
          <option key={a.id} value={a.id}>{a.name}</option>
        ))}
      </select>
    </div>
  );
}
