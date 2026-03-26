import type { DayScore } from "../scoring/types";

const CRLF = "\r\n";

export function generateIcal(
  activityName: string,
  locationName: string,
  lat: number,
  lon: number,
  scores: DayScore[]
): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//is_it_good//EN",
    `X-WR-CALNAME:${escapeText(`${activityName} in ${locationName}`)}`,
    "METHOD:PUBLISH",
    "CALSCALE:GREGORIAN",
    "REFRESH-INTERVAL;VALUE=DURATION:PT6H",
    "X-PUBLISHED-TTL:PT6H",
  ];

  for (const day of scores) {
    const dateCompact = day.date.replace(/-/g, "");
    const nextDate = nextDay(day.date).replace(/-/g, "");
    const now = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const uid = `${activityName.toLowerCase().replace(/\s+/g, "-")}-${lat}-${lon}-${day.date}@is_it_good`;

    const description = day.qualifiers
      .filter((q) => q.value != null)
      .map((q) => {
        if (q.weight > 0) return `${q.name}: ${q.value}${q.unit} (${q.score}/10)`;
        return `${q.name}: ${q.value}${q.unit}`;
      })
      .join("\n");

    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${dateCompact}`,
      `DTEND;VALUE=DATE:${nextDate}`,
      `SUMMARY:${escapeText(`${activityName}: ${day.label} (${day.overall}/10)`)}`,
      `DESCRIPTION:${escapeText(description)}`,
      "STATUS:CONFIRMED",
      "TRANSP:TRANSPARENT",
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");

  return foldLines(lines.join(CRLF)) + CRLF;
}

function nextDay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function escapeText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

/** RFC 5545: fold lines longer than 75 octets */
function foldLines(text: string): string {
  const lines = text.split(CRLF);
  const folded: string[] = [];

  for (const line of lines) {
    if (new TextEncoder().encode(line).length <= 75) {
      folded.push(line);
    } else {
      let remaining = line;
      let first = true;
      while (new TextEncoder().encode(remaining).length > 75) {
        // Find a safe cut point (75 bytes for first line, 74 for continuations due to leading space)
        const maxBytes = first ? 75 : 74;
        let cutPoint = 0;
        let byteCount = 0;
        for (let i = 0; i < remaining.length; i++) {
          const charBytes = new TextEncoder().encode(remaining[i]).length;
          if (byteCount + charBytes > maxBytes) break;
          byteCount += charBytes;
          cutPoint = i + 1;
        }
        folded.push((first ? "" : " ") + remaining.slice(0, cutPoint));
        remaining = remaining.slice(cutPoint);
        first = false;
      }
      if (remaining) {
        folded.push((first ? "" : " ") + remaining);
      }
    }
  }

  return folded.join(CRLF);
}
