import { getDb } from "./schema";
import { roundCoord } from "../util/geo";

export interface CachedWeather {
  data: string;
  fetched_at: number;
  stale: boolean;
}

export function getCachedForecast(
  provider: string,
  lat: number,
  lon: number,
  date: string
): CachedWeather | null {
  const db = getDb();
  const row = db
    .query<
      { data: string; fetched_at: number; expires_at: number },
      [string, number, number, string]
    >("SELECT data, fetched_at, expires_at FROM weather_cache WHERE provider = ? AND lat = ? AND lon = ? AND forecast_date = ?")
    .get(provider, roundCoord(lat), roundCoord(lon), date);

  if (!row) return null;

  const now = Math.floor(Date.now() / 1000);
  return {
    data: row.data,
    fetched_at: row.fetched_at,
    stale: now > row.expires_at,
  };
}

export function setCachedForecast(
  provider: string,
  lat: number,
  lon: number,
  date: string,
  data: string,
  ttlSeconds: number
): void {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  db.run(
    `INSERT OR REPLACE INTO weather_cache (provider, lat, lon, forecast_date, data, fetched_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [provider, roundCoord(lat), roundCoord(lon), date, data, now, now + ttlSeconds]
  );
}

export function getCachedGeocode(
  query: string
): { lat: number; lon: number; display_name: string } | null {
  const db = getDb();
  return db
    .query<
      { lat: number; lon: number; display_name: string },
      [string]
    >("SELECT lat, lon, display_name FROM geocode_cache WHERE query = ?")
    .get(query.toLowerCase().trim());
}

export function setCachedGeocode(
  query: string,
  lat: number,
  lon: number,
  displayName: string
): void {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  db.run(
    `INSERT OR REPLACE INTO geocode_cache (query, lat, lon, display_name, fetched_at)
     VALUES (?, ?, ?, ?, ?)`,
    [query.toLowerCase().trim(), roundCoord(lat), roundCoord(lon), displayName, now]
  );
}

export function getSubscription(token: string) {
  const db = getDb();
  return db
    .query<
      { token: string; lat: number; lon: number; location_name: string | null; activity: string },
      [string]
    >("SELECT token, lat, lon, location_name, activity FROM calendar_subscriptions WHERE token = ?")
    .get(token);
}

export function findOrCreateSubscription(
  lat: number,
  lon: number,
  activity: string,
  locationName?: string
): string {
  const db = getDb();
  const rlat = roundCoord(lat);
  const rlon = roundCoord(lon);

  const existing = db
    .query<{ token: string }, [number, number, string]>(
      "SELECT token FROM calendar_subscriptions WHERE lat = ? AND lon = ? AND activity = ?"
    )
    .get(rlat, rlon, activity);

  if (existing) return existing.token;

  const token = generateToken();
  const now = Math.floor(Date.now() / 1000);
  db.run(
    `INSERT INTO calendar_subscriptions (token, lat, lon, location_name, activity, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [token, rlat, rlon, locationName || null, activity, now]
  );
  return token;
}

function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  for (const b of bytes) {
    result += chars[b % chars.length];
  }
  return result;
}

export function cleanExpiredCache(): void {
  const db = getDb();
  const cutoff = Math.floor(Date.now() / 1000) - 86400;
  db.run("DELETE FROM weather_cache WHERE expires_at < ?", [cutoff]);
}
