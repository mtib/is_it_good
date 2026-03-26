import { config } from "./config";
import { getDb } from "./db/schema";
import { cleanExpiredCache } from "./db/cache";
import { matchRoute } from "./api/router";
import { existsSync } from "fs";
import { join } from "path";
import { createHash } from "crypto";

// Register routes
import "./api/activities";
import "./api/forecast";
import "./api/calendar";
import "./api/geocode";

// Initialize database
getDb();

// Clean expired cache every hour
setInterval(cleanExpiredCache, 3600_000);

const FRONTEND_DIR = join(import.meta.dir, "../frontend/dist");
const hasFrontend = existsSync(FRONTEND_DIR);

const STATIC_MAX_AGE = 86400; // 24 hours
const API_MAX_AGE = 10800; // 3 hours (matches shortest server-side cache TTL)

function etag(body: string | ArrayBuffer): string {
  const hash = createHash("md5");
  hash.update(typeof body === "string" ? body : Buffer.from(body));
  return `"${hash.digest("hex")}"`;
}

async function withEtag(req: Request, response: Response, maxAge: number): Promise<Response> {
  const buf = await response.clone().arrayBuffer();
  const tag = etag(buf);
  const ifNoneMatch = req.headers.get("if-none-match");
  if (ifNoneMatch === tag) {
    return new Response(null, {
      status: 304,
      headers: response.headers,
    });
  }
  response.headers.set("ETag", tag);
  response.headers.set("Cache-Control", `public, max-age=${maxAge}`);
  return response;
}

const server = Bun.serve({
  port: config.port,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    // CORS headers for API
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // Try API routes
    const matched = matchRoute(req.method, path);
    if (matched) {
      try {
        const response = await matched.handler(req, matched.params);
        response.headers.set("Access-Control-Allow-Origin", "*");
        if (req.method === "GET") {
          return withEtag(req, response, API_MAX_AGE);
        }
        return response;
      } catch (err) {
        console.error("API error:", err);
        return new Response(JSON.stringify({ error: "Internal server error" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Serve frontend static files
    if (hasFrontend) {
      let filePath = join(FRONTEND_DIR, path === "/" ? "index.html" : path);
      const isSpaFallback = !existsSync(filePath);
      if (isSpaFallback) {
        filePath = join(FRONTEND_DIR, "index.html");
      }

      if (existsSync(filePath)) {
        const file = Bun.file(filePath);
        const response = new Response(file);
        // Hashed assets get long cache, HTML/SPA fallback gets short cache
        const isHashed = /\.[a-f0-9]{8,}\.\w+$/.test(path);
        const maxAge = isSpaFallback ? 0 : isHashed ? 31536000 : STATIC_MAX_AGE;
        if (isSpaFallback) {
          response.headers.set("Cache-Control", "no-cache");
        }
        return withEtag(req, response, maxAge);
      }
    }

    return new Response("Not found", { status: 404 });
  },
});

console.log(`is_it_good running on http://localhost:${server.port}`);
