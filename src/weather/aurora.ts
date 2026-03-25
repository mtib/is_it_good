import { getCachedForecast, setCachedForecast } from "../db/cache";
import { roundCoord } from "../util/geo";

const KP_FORECAST_URL = "https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json";
const CACHE_TTL = 3 * 3600; // 3 hours

export interface KpForecastEntry {
  date: string; // YYYY-MM-DD
  kp_max: number; // max Kp for that date's night (0-9)
  kp_avg: number;
  g_scale: string | null; // G1-G5 or null
}

interface RawKpEntry {
  time_tag: string;
  kp: number;
  observed: string;
  noaa_scale: string | null;
}

/**
 * Fetch Kp index forecast from NOAA SWPC.
 * Returns nightly Kp values (we only care about nighttime for aurora).
 * Lat is used for cache key only — Kp is a global index, but aurora visibility
 * depends on latitude (handled in scoring).
 */
export async function fetchKpForecast(lat: number, lon: number): Promise<KpForecastEntry[]> {
  const rlat = roundCoord(lat);
  const rlon = roundCoord(lon);

  // Kp is global so we use a fixed cache key per date, but still key by location
  // for cache structure consistency
  const cached = tryLoadCachedKp(rlat, rlon);
  if (cached) return cached;

  const res = await fetch(KP_FORECAST_URL);
  if (!res.ok) {
    const stale = tryLoadCachedKp(rlat, rlon, true);
    if (stale) return stale;
    throw new Error(`NOAA Kp forecast error: ${res.status}`);
  }

  const raw: RawKpEntry[] = await res.json();

  // Group by date and compute nightly stats
  // Night hours: 18:00-06:00 (generous window for aurora viewing)
  const byDate = new Map<string, { kps: number[]; scales: (string | null)[] }>();

  for (const entry of raw) {
    if (!entry.time_tag || entry.kp === undefined) continue;
    const dt = new Date(entry.time_tag + "Z");
    const hour = dt.getUTCHours();

    // Assign to the evening's date: hours 18-23 = that date, hours 0-5 = previous date
    let date: string;
    if (hour >= 18) {
      date = dt.toISOString().slice(0, 10);
    } else if (hour < 6) {
      const prev = new Date(dt);
      prev.setUTCDate(prev.getUTCDate() - 1);
      date = prev.toISOString().slice(0, 10);
    } else {
      continue; // Skip daytime hours
    }

    if (!byDate.has(date)) byDate.set(date, { kps: [], scales: [] });
    const group = byDate.get(date)!;
    group.kps.push(entry.kp);
    group.scales.push(entry.noaa_scale);
  }

  const entries: KpForecastEntry[] = [];
  for (const [date, { kps, scales }] of byDate) {
    const kp_max = Math.max(...kps);
    const kp_avg = kps.reduce((a, b) => a + b, 0) / kps.length;
    const g_scale = scales.find((s) => s !== null) || null;

    const entry: KpForecastEntry = {
      date,
      kp_max: Math.round(kp_max * 100) / 100,
      kp_avg: Math.round(kp_avg * 100) / 100,
      g_scale,
    };
    entries.push(entry);

    setCachedForecast("noaa_kp", rlat, rlon, date, JSON.stringify(entry), CACHE_TTL);
  }

  return entries.sort((a, b) => a.date.localeCompare(b.date));
}

function tryLoadCachedKp(lat: number, lon: number, allowStale = false): KpForecastEntry[] | null {
  const today = new Date().toISOString().slice(0, 10);
  const entries: KpForecastEntry[] = [];

  for (let i = 0; i < 5; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const date = d.toISOString().slice(0, 10);
    const cached = getCachedForecast("noaa_kp", lat, lon, date);
    if (cached && (!cached.stale || allowStale)) {
      entries.push(JSON.parse(cached.data));
    }
  }

  if (entries.length >= 1 && entries[0]?.date === today) return entries;
  return null;
}

/**
 * Score how visible aurora would be at a given latitude based on Kp index.
 * Higher latitudes need lower Kp, lower latitudes need much higher Kp.
 * Returns 0-10.
 */
export function auroraVisibilityScore(kpMax: number, latitudeDeg: number): number {
  const absLat = Math.abs(latitudeDeg);

  // Approximate minimum Kp needed to see aurora at a given latitude
  // Based on auroral oval expansion:
  // Kp 0-1: ~67°+ (northern Norway, Iceland)
  // Kp 2-3: ~62°+ (central Scandinavia, southern Alaska)
  // Kp 4-5: ~55°+ (southern Scandinavia, Scotland, southern Canada)
  // Kp 6-7: ~50°+ (northern Germany, northern US)
  // Kp 8-9: ~45°+ (central Europe, central US)
  const minKpForLatitude =
    absLat >= 67 ? 0 :
    absLat >= 62 ? 2 :
    absLat >= 55 ? 4 :
    absLat >= 50 ? 6 :
    absLat >= 45 ? 8 :
    10; // Below 45° essentially need extraordinary storms

  if (minKpForLatitude > 9) return 0; // Too far south

  // How much Kp exceeds the minimum needed
  const excess = kpMax - minKpForLatitude;

  if (excess < -2) return 0;
  if (excess < -1) return 1;
  if (excess < 0) return 3; // Close but probably not visible
  if (excess < 1) return 5; // Marginal
  if (excess < 2) return 7; // Likely visible
  if (excess < 3) return 8; // Good chance
  return 10; // Strong aurora likely
}
