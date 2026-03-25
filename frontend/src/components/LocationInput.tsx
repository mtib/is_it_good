import { useState, useEffect } from "react";
import { geocode, type GeocodeResult } from "../lib/api";

interface Props {
  onSelect: (result: GeocodeResult) => void;
  initialValue?: string;
}

export function LocationInput({ onSelect, initialValue }: Props) {
  const [query, setQuery] = useState(initialValue || "");

  useEffect(() => {
    if (initialValue && !query) {
      setQuery(initialValue);
    }
  }, [initialValue]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await geocode(query);
      onSelect(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Geocode failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="location-input">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
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
