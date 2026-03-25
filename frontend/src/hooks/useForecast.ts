import { useState, useCallback } from "react";
import { fetchForecast, type ForecastResponse } from "../lib/api";

export function useForecast() {
  const [data, setData] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (lat: number, lon: number, activity: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchForecast(lat, lon, activity);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load forecast");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, load };
}
