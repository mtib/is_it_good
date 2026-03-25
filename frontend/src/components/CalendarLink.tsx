import { useState, useEffect } from "react";
import { subscribe } from "../lib/api";

interface Props {
  lat: number;
  lon: number;
  activity: string;
  locationName: string;
}

export function CalendarLink({ lat, lon, activity, locationName }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cutoffEnabled, setCutoffEnabled] = useState(false);
  const [cutoffScore, setCutoffScore] = useState(6);
  const [cutoffMode, setCutoffMode] = useState<"gte" | "lte">("gte");

  useEffect(() => {
    setUrl(null);
  }, [lat, lon, activity]);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const result = await subscribe(lat, lon, activity, locationName);
      setUrl(result.url);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const buildFullUrl = (baseUrl: string) => {
    let full = window.location.origin + baseUrl;
    if (cutoffEnabled) {
      full += `?cutoff=${cutoffScore}&mode=${cutoffMode}`;
    }
    return full;
  };

  const handleCopy = async () => {
    if (!url) return;
    await navigator.clipboard.writeText(buildFullUrl(url));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="calendar-link">
      <div className="cutoff-controls">
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={cutoffEnabled}
            onChange={(e) => setCutoffEnabled(e.target.checked)}
          />
          <span>Filter by score cutoff</span>
        </label>
        {cutoffEnabled && (
          <div className="cutoff-options">
            <label className="cutoff-mode">
              <span>Only show days scoring</span>
              <select
                value={cutoffMode}
                onChange={(e) => setCutoffMode(e.target.value as "gte" | "lte")}
              >
                <option value="gte">&ge;</option>
                <option value="lte">&le;</option>
              </select>
              <input
                type="number"
                min={0}
                max={10}
                step={0.5}
                value={cutoffScore}
                onChange={(e) => setCutoffScore(parseFloat(e.target.value) || 0)}
                className="cutoff-input"
              />
            </label>
          </div>
        )}
      </div>

      {!url ? (
        <button onClick={handleSubscribe} disabled={loading} className="subscribe-btn">
          {loading ? "Creating..." : "Get Calendar URL"}
        </button>
      ) : (
        <>
          <div className="calendar-url-box">
            <code>{buildFullUrl(url)}</code>
            <button onClick={handleCopy} className="copy-btn">
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="calendar-hint">
            Add this URL as a subscription in your calendar app (Google Calendar: Other calendars &rarr; From URL)
          </p>
        </>
      )}
    </div>
  );
}
