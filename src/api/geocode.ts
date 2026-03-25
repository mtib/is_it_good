import { route, jsonResponse } from "./router";
import { config } from "../config";
import { getCachedGeocode, setCachedGeocode } from "../db/cache";

route("GET", "/api/geocode", async (req) => {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";

  if (!q.trim()) {
    return jsonResponse({ error: "q parameter is required" }, 400);
  }

  // Check cache
  const cached = getCachedGeocode(q);
  if (cached) {
    return jsonResponse({
      lat: cached.lat,
      lon: cached.lon,
      name: cached.display_name,
    });
  }

  // Fetch from OWM geocoding
  const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=1&appid=${config.owmApiKey}`;
  const res = await fetch(geoUrl);
  if (!res.ok) {
    return jsonResponse({ error: "Geocoding failed" }, 502);
  }

  const results = await res.json() as { lat: number; lon: number; name: string; country: string; state?: string }[];
  if (results.length === 0) {
    return jsonResponse({ error: "Location not found" }, 404);
  }

  const r = results[0];
  const displayName = r.state ? `${r.name}, ${r.state}, ${r.country}` : `${r.name}, ${r.country}`;

  setCachedGeocode(q, r.lat, r.lon, displayName);

  return jsonResponse({
    lat: r.lat,
    lon: r.lon,
    name: displayName,
  });
});
