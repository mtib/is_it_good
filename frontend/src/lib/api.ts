const BASE = "";

export interface ActivityInfo {
  id: string;
  name: string;
  qualifiers: { id: string; name: string; unit: string; weight: number }[];
}

export interface QualifierScore {
  id: string;
  name: string;
  value: number;
  unit: string;
  score: number;
}

export interface DayScore {
  date: string;
  overall: number;
  label: string;
  qualifiers: QualifierScore[];
  source: string;
}

export interface ForecastResponse {
  location: { lat: number; lon: number };
  activity: string;
  days: DayScore[];
}

export interface GeocodeResult {
  lat: number;
  lon: number;
  name: string;
}

export interface SubscribeResult {
  token: string;
  url: string;
}

export async function fetchActivities(): Promise<ActivityInfo[]> {
  const res = await fetch(`${BASE}/api/activities`);
  return res.json();
}

export async function fetchForecast(lat: number, lon: number, activity: string): Promise<ForecastResponse> {
  const res = await fetch(`${BASE}/api/forecast?lat=${lat}&lon=${lon}&activity=${activity}`);
  if (!res.ok) throw new Error((await res.json()).error || "Forecast failed");
  return res.json();
}

export async function geocode(q: string): Promise<GeocodeResult> {
  const res = await fetch(`${BASE}/api/geocode?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error((await res.json()).error || "Geocode failed");
  return res.json();
}

export async function subscribe(lat: number, lon: number, activity: string, locationName: string): Promise<SubscribeResult> {
  const res = await fetch(`${BASE}/api/calendar/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lat, lon, activity, location_name: locationName }),
  });
  if (!res.ok) throw new Error((await res.json()).error || "Subscribe failed");
  return res.json();
}
