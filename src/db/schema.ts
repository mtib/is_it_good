import { Database } from "bun:sqlite";
import { config } from "../config";

let db: Database | null = null;

export function getDb(): Database {
  if (db) return db;

  db = new Database(config.dbPath, { create: true });
  db.run("PRAGMA journal_mode = WAL");
  db.run("PRAGMA busy_timeout = 5000");

  db.run(`
    CREATE TABLE IF NOT EXISTS weather_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider TEXT NOT NULL,
      lat REAL NOT NULL,
      lon REAL NOT NULL,
      forecast_date TEXT NOT NULL,
      data TEXT NOT NULL,
      fetched_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      UNIQUE(provider, lat, lon, forecast_date)
    )
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_weather_cache_lookup
    ON weather_cache(provider, lat, lon, forecast_date)
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS calendar_subscriptions (
      token TEXT PRIMARY KEY,
      lat REAL NOT NULL,
      lon REAL NOT NULL,
      location_name TEXT,
      activity TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      UNIQUE(lat, lon, activity)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS geocode_cache (
      query TEXT PRIMARY KEY,
      lat REAL NOT NULL,
      lon REAL NOT NULL,
      display_name TEXT NOT NULL,
      fetched_at INTEGER NOT NULL
    )
  `);

  return db;
}
