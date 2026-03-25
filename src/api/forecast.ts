import { route, jsonResponse } from "./router";
import { activities } from "../scoring/activities";
import { scoreForecast } from "../scoring/engine";
import { getForecast } from "../weather/provider";

route("GET", "/api/forecast", async (req) => {
  const url = new URL(req.url);
  const lat = parseFloat(url.searchParams.get("lat") || "");
  const lon = parseFloat(url.searchParams.get("lon") || "");
  const activityId = url.searchParams.get("activity") || "";

  if (isNaN(lat) || isNaN(lon)) {
    return jsonResponse({ error: "lat and lon are required" }, 400);
  }

  const activity = activities[activityId];
  if (!activity) {
    return jsonResponse({ error: `Unknown activity: ${activityId}` }, 400);
  }

  const forecast = await getForecast(lat, lon, activity.times);
  if (forecast.length === 0) {
    return jsonResponse({ error: "No forecast data available" }, 503);
  }

  const scores = scoreForecast(activity, forecast);

  return jsonResponse({
    location: { lat, lon },
    activity: activityId,
    days: scores,
  });
});
