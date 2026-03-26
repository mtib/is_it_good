import { useState, useEffect } from "react";
import { geocode, type GeocodeResult } from "../lib/api";

interface Props {
  onSelect: (result: GeocodeResult) => void;
  initialValue?: string;
  location?: { lat: number; lon: number; name: string } | null;
}

export function LocationInput({ onSelect, initialValue, location }: Props) {
  const [query, setQuery] = useState(initialValue || "");
  const [editing, setEditing] = useState(!location);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialValue && !query) {
      setQuery(initialValue);
    }
  }, [initialValue]);

  useEffect(() => {
    if (location) setEditing(false);
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await geocode(query);
      setQuery(result.name);
      onSelect(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Geocode failed");
    } finally {
      setLoading(false);
    }
  };

  const displayValue = !editing && location
    ? `${location.name} (${location.lat.toFixed(2)}, ${location.lon.toFixed(2)})`
    : query;

  return (
    <form onSubmit={handleSubmit} className="location-input">
      <input
        type="text"
        value={displayValue}
        onChange={(e) => {
          setEditing(true);
          setQuery(e.target.value);
        }}
        onFocus={() => {
          if (!editing && location) {
            setEditing(true);
            setQuery(location.name);
          }
        }}
        placeholder="Enter a city or location..."
        disabled={loading}
      />
      <button type="submit" disabled={loading || !query.trim()}>
        {loading ? "Searching..." : "Search"}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
