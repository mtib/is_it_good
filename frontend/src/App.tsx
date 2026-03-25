import { useState, useEffect } from "react";
import { fetchActivities, type ActivityInfo, type GeocodeResult } from "./lib/api";
import { useForecast } from "./hooks/useForecast";
import { LocationInput } from "./components/LocationInput";
import { ActivityPicker } from "./components/ActivityPicker";
import { ForecastGrid } from "./components/ForecastGrid";
import { CalendarLink } from "./components/CalendarLink";
import "./App.css";

export function App() {
  const [activities, setActivities] = useState<ActivityInfo[]>([]);
  const [selectedActivity, setSelectedActivity] = useState("");
  const [location, setLocation] = useState<GeocodeResult | null>(null);
  const { data, loading, error, load } = useForecast();

  useEffect(() => {
    fetchActivities().then((list) => {
      setActivities(list);
      if (list.length > 0) setSelectedActivity(list[0].id);
    });
  }, []);

  useEffect(() => {
    if (location && selectedActivity) {
      load(location.lat, location.lon, selectedActivity);
    }
  }, [location, selectedActivity, load]);

  return (
    <div className="app">
      <header>
        <h1>Is It Good?</h1>
        <p className="subtitle">Check if the weather is right for your activity</p>
      </header>

      <main>
        <LocationInput onSelect={setLocation} />

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
            onSelect={setSelectedActivity}
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
