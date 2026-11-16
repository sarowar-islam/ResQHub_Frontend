import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-5afd0f12/health", (c) => {
  return c.json({ status: "ok" });
});

const PREFIX = "/make-server-5afd0f12";
const COLLECTIONS = [
  "alerts", "helpRequests", "volunteers", "shelters", "ngos", "campaigns",
  "inventory", "notifications", "testimonials", "news", "users", "chartData",
  "reliefDistribution", "mapMarkers", "stats", "emergencyContacts",
  "partnerNames", "rescuePolls", "aiResponses",
];
const key = (name: string) => `resqhub:${name}`;

// Read every collection. `seeded` is false until the first seed call.
app.get(`${PREFIX}/collections`, async (c) => {
  try {
    const values = await kv.mget(COLLECTIONS.map(key));
    const data: Record<string, unknown> = {};
    COLLECTIONS.forEach((name, i) => {
      if (values[i] !== undefined && values[i] !== null) data[name] = values[i];
    });
    return c.json({ seeded: Object.keys(data).length === COLLECTIONS.length, data });
  } catch (e) {
    console.log("collections read failed", e);
    return c.json({ error: String(e) }, 500);
  }
});

// Insert starter data for any collection that does not exist yet (never overwrites).
app.post(`${PREFIX}/seed`, async (c) => {
  try {
    const body = await c.req.json();
    const incoming = (body?.collections ?? {}) as Record<string, unknown>;
    const existing = await kv.mget(COLLECTIONS.map(key));
    const keys: string[] = [];
    const values: unknown[] = [];
    COLLECTIONS.forEach((name, i) => {
      if ((existing[i] === undefined || existing[i] === null) && incoming[name] !== undefined) {
        keys.push(key(name));
        values.push(incoming[name]);
      }
    });
    if (keys.length) await kv.mset(keys, values);
    return c.json({ seeded: keys.length });
  } catch (e) {
    console.log("seed failed", e);
    return c.json({ error: String(e) }, 500);
  }
});

// Replace one collection.
app.put(`${PREFIX}/collections/:name`, async (c) => {
  const name = c.req.param("name");
  if (!COLLECTIONS.includes(name)) return c.json({ error: "Unknown collection" }, 404);
  try {
    const body = await c.req.json();
    await kv.set(key(name), body?.value);
    return c.json({ ok: true });
  } catch (e) {
    console.log("write failed", name, e);
    return c.json({ error: String(e) }, 500);
  }
});

Deno.serve(app.fetch);