import { useState, useEffect, useCallback } from "react";
import { fetchActivities, type ActivityInfo, type GeocodeResult } from "./lib/api";
import { useForecast } from "./hooks/useForecast";
import { LocationInput } from "./components/LocationInput";
import { ActivityPicker } from "./components/ActivityPicker";
import { ForecastGrid } from "./components/ForecastGrid";
import { CalendarLink } from "./components/CalendarLink";
import "./App.css";

function parseUrlState(): { location: GeocodeResult | null; activity: string | null } {
  const params = new URLSearchParams(window.location.search);
  const lat = parseFloat(params.get("lat") || "");
  const lon = parseFloat(params.get("lon") || "");
  const name = params.get("name") || "";
  const activity = params.get("activity") || null;

  const location = !isNaN(lat) && !isNaN(lon) && name
    ? { lat, lon, name }
    : null;

  return { location, activity };
}

function updateUrl(location: GeocodeResult | null, activity: string) {
  const params = new URLSearchParams();
  if (location) {
    params.set("lat", location.lat.toFixed(4));
    params.set("lon", location.lon.toFixed(4));
    params.set("name", location.name);
  }
  if (activity) {
    params.set("activity", activity);
  }
  const qs = params.toString();
  const newUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  window.history.replaceState(null, "", newUrl);
}

export function App() {
  const [activities, setActivities] = useState<ActivityInfo[]>([]);
  const [selectedActivity, setSelectedActivity] = useState("");
  const [location, setLocation] = useState<GeocodeResult | null>(null);
  const { data, loading, error, load } = useForecast();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    fetchActivities().then((list) => {
      setActivities(list);
      const urlState = parseUrlState();
      const activityId = urlState.activity && list.some((a) => a.id === urlState.activity)
        ? urlState.activity
        : list[0]?.id || "";
      setSelectedActivity(activityId);
      if (urlState.location) {
        setLocation(urlState.location);
      }
      setInitialized(true);
    });
  }, []);

  // Sync state to URL
  useEffect(() => {
    if (initialized) {
      updateUrl(location, selectedActivity);
    }
  }, [location, selectedActivity, initialized]);

  useEffect(() => {
    if (location && selectedActivity) {
      load(location.lat, location.lon, selectedActivity);
    }
  }, [location, selectedActivity, load]);

  const handleSetLocation = useCallback((loc: GeocodeResult) => {
    setLocation(loc);
  }, []);

  const handleSetActivity = useCallback((id: string) => {
    setSelectedActivity(id);
  }, []);

  return (
    <div className="app">
      <header>
        <h1>Is It Good?</h1>
        <p className="subtitle">Check if the weather is right for your activity</p>
      </header>

      <main>
        <LocationInput onSelect={handleSetLocation} initialValue={location?.name} />

        {location && (
          <div className="location-display">
            <span>{location.name}</span>
            <span className="coords">
              ({location.lat.toFixed(2)}, {location.lon.toFixed(2)})
            </span>
          </div>
        )}

        {activities.length > 0 && (
          <ActivityPicker
            activities={activities}
            selected={selectedActivity}
            onSelect={handleSetActivity}
          />
        )}

        {loading && <p className="loading">Loading forecast...</p>}
        {error && <p className="error">{error}</p>}

        {data && <ForecastGrid days={data.days} />}

        {data && location && (
          <CalendarLink
            lat={location.lat}
            lon={location.lon}
            activity={selectedActivity}
            locationName={location.name}
          />
        )}
      </main>
    </div>
  );
}
