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

  const handleCopy = async () => {
    if (!url) return;
    const fullUrl = window.location.origin + url;
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!url) {
    return (
      <div className="calendar-link">
        <button onClick={handleSubscribe} disabled={loading} className="subscribe-btn">
          {loading ? "Creating..." : "Get Calendar URL"}
        </button>
      </div>
    );
  }

  const fullUrl = window.location.origin + url;

  return (
    <div className="calendar-link">
      <div className="calendar-url-box">
        <code>{fullUrl}</code>
        <button onClick={handleCopy} className="copy-btn">
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <p className="calendar-hint">
        Add this URL as a subscription in your calendar app (Google Calendar: Other calendars &rarr; From URL)
      </p>
    </div>
  );
}
