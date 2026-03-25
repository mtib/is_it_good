import { route, jsonResponse } from "./router";
import { findOrCreateSubscription, getSubscription } from "../db/cache";
import { activities } from "../scoring/activities";
import { scoreForecast } from "../scoring/engine";
import { getForecast } from "../weather/provider";
import { generateIcal } from "../calendar/ical";
import { config } from "../config";

route("POST", "/api/calendar/subscribe", async (req) => {
  const body = await req.json() as {
    lat?: number;
    lon?: number;
    activity?: string;
    location_name?: string;
  };

  if (!body.lat || !body.lon || !body.activity) {
    return jsonResponse({ error: "lat, lon, and activity are required" }, 400);
  }

  if (!activities[body.activity]) {
    return jsonResponse({ error: `Unknown activity: ${body.activity}` }, 400);
  }

  const token = findOrCreateSubscription(
    body.lat,
    body.lon,
    body.activity,
    body.location_name
  );

  const base = config.baseUrl || new URL(req.url).origin;
  const url = `${base}/cal/${token}.ics`;

  return jsonResponse({ token, url });
});

route("GET", "/cal/:token", async (req, params) => {
  const rawToken = params.token;
  const token = rawToken.endsWith(".ics") ? rawToken.slice(0, -4) : rawToken;

  const sub = getSubscription(token);
  if (!sub) {
    return new Response("Not found", { status: 404 });
  }

  const activity = activities[sub.activity];
  if (!activity) {
    return new Response("Activity not found", { status: 404 });
  }

  const forecast = await getForecast(sub.lat, sub.lon);
  const scores = scoreForecast(activity, forecast);

  const ical = generateIcal(
    activity.name,
    sub.location_name || `${sub.lat},${sub.lon}`,
    sub.lat,
    sub.lon,
    scores
  );

  return new Response(ical, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${sub.activity}.ics"`,
      "Cache-Control": "no-cache",
    },
  });
});
