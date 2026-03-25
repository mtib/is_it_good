import { config } from "./config";
import { getDb } from "./db/schema";
import { cleanExpiredCache } from "./db/cache";
import { matchRoute } from "./api/router";
import { existsSync } from "fs";
import { join } from "path";

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

      if (existsSync(filePath)) {
        return new Response(Bun.file(filePath));
      }

      // SPA fallback
      return new Response(Bun.file(join(FRONTEND_DIR, "index.html")));
    }

    return new Response("Not found", { status: 404 });
  },
});

console.log(`is_it_good running on http://localhost:${server.port}`);
