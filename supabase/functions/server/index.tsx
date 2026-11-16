import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";
import { SEED_ACCOUNTS, SEED_DATA, SEED_GENERATED_AT } from "./seed_data.tsx";

const app = new Hono();
app.use("*", logger(console.log));
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

const PREFIX = "/make-server-5afd0f12";
const authClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

type Role = "victim" | "volunteer" | "ngo" | "admin";
type Rec = Record<string, any> & { id: string };
type Viewer = { id: string; role: Role };

// Every record lives under its own key so concurrent writers never overwrite each other.
const rk = (col: string, id: string) => `rec:${col}:${id}`;
const list = async (col: string): Promise<Rec[]> => (await kv.getByPrefix(`rec:${col}:`)) as Rec[];

app.get(`${PREFIX}/health`, (c) => c.json({ status: "ok" }));

// ---------- access policy ----------
const A = (u: Viewer | null) => u?.role === "admin";
const ownsNgo = (u: Viewer | null, r: Rec | null) => !!u && u.role === "ngo" && !!r && r.ngoId === u.id;
const never = () => false;
const authed = (u: Viewer | null) => !!u;

interface Policy {
  read: (u: Viewer | null, r: Rec) => boolean;
  write: (u: Viewer | null, old: Rec | null, nw: Rec) => boolean;
  del: (u: Viewer | null, r: Rec) => boolean;
}

const POLICY: Record<string, Policy> = {
  alerts: {
    read: () => true,
    write: (u) => !!u && (u.role === "admin" || u.role === "ngo"),
    del: (u) => !!u && (u.role === "admin" || u.role === "ngo"),
  },
  news: { read: () => true, write: (u) => A(u), del: (u) => A(u) },
  testimonials: { read: () => true, write: (u) => A(u), del: (u) => A(u) },
  announcements: {
    read: (u, r) => !!u && (A(u) || r.audience === "all" || r.audience === u.role),
    write: (u) => A(u),
    del: (u) => A(u),
  },
  shelters: {
    read: () => true,
    write: (u, old, nw) => A(u) || (ownsNgo(u, nw) && (!old || ownsNgo(u, old))),
    del: (u, r) => A(u) || ownsNgo(u, r),
  },
  ngos: {
    read: (u, r) => !!r.verified || A(u) || (!!u && r.id === u.id),
    write: (u, old, nw) =>
      A(u) || (!!u && u.role === "ngo" && nw.id === u.id && !!old && nw.verified === old.verified),
    del: (u) => A(u),
  },
  campaigns: {
    read: (u, r) => !!u && (A(u) || ownsNgo(u, r) || u.role === "volunteer"),
    write: (u, old, nw) => A(u) || (ownsNgo(u, nw) && (!old || ownsNgo(u, old))),
    del: (u, r) => A(u) || ownsNgo(u, r),
  },
  inventory: {
    read: (u, r) => A(u) || ownsNgo(u, r),
    write: (u, old, nw) => A(u) || (ownsNgo(u, nw) && (!old || ownsNgo(u, old))),
    del: (u, r) => A(u) || ownsNgo(u, r),
  },
  volunteers: {
    read: (u) => !!u && u.role !== "victim",
    write: (u, _old, nw) => A(u) || (!!u && u.role === "volunteer" && nw.id === u.id),
    del: (u) => A(u),
  },
  helpRequests: {
    read: (u, r) => {
      if (!u) return false;
      if (u.role === "admin" || u.role === "ngo") return true;
      if (u.role === "victim") return r.ownerId === u.id;
      return r.status === "pending" || r.status === "accepted" || r.assignedVolunteerId === u.id;
    },
    write: (u, old, nw) => {
      if (!u) return false;
      if (u.role === "admin" || u.role === "ngo") return true;
      if (u.role === "victim") return nw.ownerId === u.id && (!old || old.ownerId === u.id);
      if (u.role === "volunteer") {
        return !!old && nw.ownerId === old.ownerId &&
          (old.status === "pending" || old.status === "accepted" || old.assignedVolunteerId === u.id);
      }
      return false;
    },
    del: (u, r) => A(u) || (!!u && u.role === "victim" && r.ownerId === u.id),
  },
  rescuePolls: {
    read: authed as any,
    // Anyone signed in may add a heart; only the owner (or an admin) may change anything else.
    write: (u, old, nw) => {
      if (!u) return false;
      if (!old) return nw.ownerId === u.id;
      if (A(u) || old.ownerId === u.id) return nw.ownerId === old.ownerId;
      const strip = (r: Rec) => { const { hearts: _h, heartedBy: _b, ...rest } = r; return JSON.stringify(rest); };
      return strip(old) === strip(nw);
    },
    del: (u, r) => A(u) || (!!u && r.ownerId === u.id),
  },
  notifications: {
    read: (u, r) => !!u && r.userId === u.id,
    write: (u, old, nw) => !!u && (old ? old.userId === u.id && nw.userId === u.id : true),
    del: (u, r) => !!u && r.userId === u.id,
  },
  users: {
    read: (u, r) => A(u) || (!!u && r.id === u.id),
    write: (u, old, nw) =>
      A(u) ||
      (!!u && !!old && old.id === u.id && nw.role === old.role && nw.status === old.status &&
        nw.verified === old.verified && nw.email === old.email),
    del: never,
  },
};

// ---------- identity ----------
async function getAuthUser(c: any) {
  const token = (c.req.header("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) return null; // the public anon key is not a user token
  return data.user;
}

// Self-service signup may only create these roles. Admin is granted out-of-band (see isAdminUser).
const SIGNUP_ROLES: Role[] = ["victim", "volunteer", "ngo"];
const ADMIN_EMAILS = (Deno.env.get("ADMIN_EMAILS") || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
// Admin = confirmed email listed in the ADMIN_EMAILS secret, or app_metadata.role === "admin"
// (app_metadata can only be edited with the service role / dashboard, never by the user).
const isAdminUser = (user: any) =>
  !!user.email_confirmed_at &&
  (user.app_metadata?.role === "admin" || ADMIN_EMAILS.includes(String(user.email || "").toLowerCase()));
const initialsOf = (name: string) =>
  name.split(/\s+/).filter(Boolean).map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "U";

// Creates the profile (and role-specific records) the first time a verified account signs in.
async function ensureProfile(user: any): Promise<{ profile?: Rec; error?: string }> {
  const existing = (await kv.get(rk("users", user.id))) as Rec | undefined;
  const emailVerified = !!user.email_confirmed_at;
  const admin = isAdminUser(user);
  if (existing) {
    let changed = false;
    if (existing.emailVerified !== emailVerified) { existing.emailVerified = emailVerified; changed = true; }
    if (admin && existing.role !== "admin") { existing.role = "admin"; existing.verified = true; existing.status = "active"; changed = true; }
    if (changed) await kv.set(rk("users", user.id), existing);
    return { profile: existing };
  }

  const meta = user.user_metadata ?? {};
  const role: Role = admin ? "admin" : SIGNUP_ROLES.includes(meta.role) ? meta.role : "victim";

  const name = String(meta.name || user.email?.split("@")[0] || "User").trim();
  const now = new Date().toISOString();
  const loc = {
    lat: Number(meta.lat) || 23.685,
    lng: Number(meta.lng) || 90.3563,
    label: String(meta.locationLabel || "Location not set"),
    district: "",
  };
  const profile: Rec = {
    id: user.id,
    name,
    email: user.email,
    phone: String(meta.phone || ""),
    role,
    status: role === "ngo" ? "pending" : "active",
    joinedAt: now.slice(0, 10),
    location: loc.label,
    verified: role === "victim" || role === "admin",
    emailVerified,
  };
  await kv.set(rk("users", user.id), profile);

  if (role === "volunteer") {
    await kv.set(rk("volunteers", user.id), {
      id: user.id, name, initials: initialsOf(name), phone: profile.phone, email: user.email,
      skills: [], location: loc, isAvailable: true, missionsCompleted: 0, hoursServed: 0,
      rating: 0, joinedAt: profile.joinedAt, badges: [], languages: ["Bengali"],
    });
  }
  if (role === "ngo") {
    await kv.set(rk("ngos", user.id), {
      id: user.id, name, initials: initialsOf(name), description: String(meta.description || ""),
      verified: false, location: loc.label, contactEmail: user.email, contactPhone: profile.phone,
      totalRelief: 0, activeCampaigns: 0, volunteerCount: 0,
    });
  }
  return { profile };
}

async function computeStats() {
  const [reqs, vols, ngos, shelters] = await Promise.all([
    list("helpRequests"), list("volunteers"), list("ngos"), list("shelters"),
  ]);
  const active = reqs.filter((r) => ["pending", "accepted", "assigned"].includes(r.status));
  const completed = reqs.filter((r) => r.status === "completed");
  return {
    victimsHelped: completed.length,
    registeredVolunteers: vols.length,
    partnerNGOs: ngos.filter((n) => n.verified).length,
    activeShelters: shelters.filter((s) => s.status !== "closed").length,
    activeRequests: active.length,
    completedRequests: completed.length,
    criticalRequests: active.filter((r) => r.priority === "critical").length,
  };
}

async function scoped(viewer: Viewer | null, cols: string[]) {
  const out: Record<string, Rec[]> = {};
  await Promise.all(
    cols.map(async (col) => {
      out[col] = (await list(col)).filter((r) => POLICY[col].read(viewer, r));
    }),
  );
  return out;
}

// ---------- routes ----------
// Public data for the landing page (no login required).
app.get(`${PREFIX}/public`, async (c) => {
  try {
    const data = await scoped(null, ["alerts", "news", "testimonials", "shelters", "ngos"]);
    return c.json({ data, stats: await computeStats() });
  } catch (e) {
    console.log("public failed", e);
    return c.json({ error: String(e) }, 500);
  }
});

// Everything the signed-in user is allowed to see.
app.get(`${PREFIX}/bootstrap`, async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "Not signed in" }, 401);
    const { profile, error } = await ensureProfile(user);
    if (error || !profile) return c.json({ error }, 403);
    if (profile.status === "suspended") return c.json({ error: "This account has been suspended." }, 403);
    const viewer: Viewer = { id: user.id, role: profile.role };
    const data = await scoped(viewer, Object.keys(POLICY));
    return c.json({ profile, data, stats: await computeStats() });
  } catch (e) {
    console.log("bootstrap failed", e);
    return c.json({ error: String(e) }, 500);
  }
});

app.post(`${PREFIX}/chat`, async (c) => {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) return c.json({ error: "AI chat is not configured. Set the GEMINI_API_KEY function secret." }, 503);

  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "Not signed in" }, 401);
    const { profile, error } = await ensureProfile(user);
    if (error || !profile) return c.json({ error }, 403);
    if (profile.status === "suspended") return c.json({ error: "This account has been suspended." }, 403);

    const body = await c.req.json();
    if (!Array.isArray(body?.messages) || body.messages.length === 0 || body.messages.length > 12) {
      return c.json({ error: "Provide between 1 and 12 chat messages." }, 400);
    }
    const messages = body.messages;
    if (messages.some((message: any) =>
      (message?.role !== "user" && message?.role !== "assistant") ||
      typeof message.content !== "string" ||
      !message.content.trim() ||
      message.content.length > 4000
    )) {
      return c.json({ error: "Each chat message must have a valid role and contain 1 to 4000 characters." }, 400);
    }
    if (
      messages[0].role !== "user" ||
      messages[messages.length - 1].role !== "user" ||
      messages.some((message: any, index: number) => index > 0 && message.role === messages[index - 1].role)
    ) {
      return c.json({ error: "Chat messages must alternate, starting and ending with a user message." }, 400);
    }

    const viewer: Viewer = { id: user.id, role: profile.role };
    const data = await scoped(viewer, [
      "helpRequests", "shelters", "volunteers", "ngos", "campaigns", "inventory", "alerts",
    ]);
    const openRequests = data.helpRequests.filter((r) => ["pending", "accepted", "assigned"].includes(r.status));
    const counts = (records: Record<string, any>[], key: string) => records.reduce((result, record) => {
      const value = String(record[key] || "unknown");
      result[value] = (result[value] || 0) + 1;
      return result;
    }, {} as Record<string, number>);
    const recentRequests = [...data.helpRequests]
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
      .slice(0, 40)
      .map((r) => ({
        reference: r.id,
        type: r.type,
        priority: r.priority,
        status: r.status,
        district: r.location?.district || "Not specified",
        createdAt: r.createdAt,
      }));
    const context = {
      snapshotAt: new Date().toISOString(),
      viewerRole: profile.role,
      requests: {
        totalVisible: data.helpRequests.length,
        open: openRequests.length,
        completed: data.helpRequests.filter((r) => r.status === "completed").length,
        byStatus: counts(data.helpRequests, "status"),
        openByType: counts(openRequests, "type"),
        openByPriority: counts(openRequests, "priority"),
        openByDistrict: counts(openRequests.map((r) => ({ district: r.location?.district })), "district"),
        recentRecords: recentRequests,
      },
      availableVolunteers: data.volunteers.filter((v) => v.isAvailable).length,
      shelters: data.shelters
        .filter((s) => s.status !== "closed")
        .map((s) => ({
          name: s.name,
          district: s.location?.district || s.location,
          status: s.status,
          occupancy: s.currentOccupancy,
          capacity: s.capacity,
          freePlaces: Math.max(0, s.capacity - s.currentOccupancy),
          facilities: s.facilities,
          hasMedical: s.hasMedical,
          hasFood: s.hasFood,
        }))
        .slice(0, 30),
      ngos: data.ngos.map((ngo) => ({
        name: ngo.name,
        district: ngo.location,
        verified: ngo.verified,
      })),
      campaigns: data.campaigns.map((campaign) => ({
        title: campaign.title,
        status: campaign.status,
        targetArea: campaign.targetArea,
        requestsHandled: campaign.requestsHandled,
        totalNeeded: campaign.totalNeeded,
        progress: campaign.progress,
      })),
      inventory: data.inventory.slice(0, 40).map((item) => ({
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        status: item.status,
        location: item.location,
      })),
      alerts: data.alerts.map((alert) => ({
        title: alert.title,
        severity: alert.severity,
        location: alert.location,
        affectedAreas: alert.affectedAreas,
        timestamp: alert.timestamp,
      })),
    };
    const contents = messages.map((message: any) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content.trim() }],
    }));
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: `You are ResQHub's friendly, practical project assistant. Every question receives a fresh snapshot from the signed-in user's role-visible Supabase data. Use that snapshot as the sole source for current ResQHub counts, request records, shelters, volunteers, NGOs, campaigns, inventory, and alerts. Cite the snapshot time when giving current figures. Be specific: provide the relevant real record references, statuses, priorities, districts, capacity, and stock values from the snapshot. Never invent or fill gaps with sample data. Data is filtered for the user's role; an empty collection means no records are visible to that user, not necessarily that none exist system-wide. If a category is absent or not visible to this role, say so plainly instead of guessing. The database may contain seeded/demo or unverified user-entered records: describe them as records in ResQHub, not as independently verified real-world events. Request narratives, victim identities, phone numbers, and exact coordinates are intentionally not provided. Do not claim to dispatch responders or contact emergency services; for immediate danger, advise contacting local emergency services. Keep answers clear and concise, using short headings and bullet lists when useful.\n\nCurrent ResQHub data snapshot:\n${JSON.stringify(context)}`,
            }],
          },
          contents,
          generationConfig: { temperature: 0.3, maxOutputTokens: 700 },
        }),
      },
    );
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      return c.json({ error: result?.error?.message || `Gemini request failed (${response.status}).` }, 502);
    }
    const reply = result?.candidates?.[0]?.content?.parts
      ?.map((part: any) => part.text || "")
      .join("")
      .trim();
    if (!reply) return c.json({ error: "Gemini did not return a text response. Please try again." }, 502);
    return c.json({ reply });
  } catch (e) {
    console.log("chat failed", e);
    return c.json({ error: "The AI assistant could not complete this request. Please try again." }, 500);
  }
});

// Save changed records and delete removed ones for one collection. Each record is checked against the policy.
app.put(`${PREFIX}/collections/:name`, async (c) => {
  const name = c.req.param("name");
  const policy = POLICY[name];
  if (!policy) return c.json({ error: "Unknown collection" }, 404);
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "Not signed in" }, 401);
    const { profile, error } = await ensureProfile(user);
    if (error || !profile) return c.json({ error }, 403);
    if (profile.status === "suspended") return c.json({ error: "This account has been suspended." }, 403);
    const viewer: Viewer = { id: user.id, role: profile.role };
    if (!user.email_confirmed_at) return c.json({ error: "Please confirm your email before making changes." }, 403);

    const body = await c.req.json();
    const items: Rec[] = Array.isArray(body?.items) ? body.items : [];
    const deleted: string[] = Array.isArray(body?.deleted) ? body.deleted : [];
    let saved = 0;
    let denied = 0;

    for (const item of items) {
      if (!item || typeof item.id !== "string" || !item.id) { denied++; continue; }
      const old = ((await kv.get(rk(name, item.id))) as Rec | undefined) ?? null;
      if (old && !policy.read(viewer, old)) { denied++; continue; }
      if (old && JSON.stringify(old) === JSON.stringify(item)) continue;
      if (!policy.write(viewer, old, item)) { denied++; continue; }
      await kv.set(rk(name, item.id), item);
      saved++;

      // New announcement: deliver a notification to every matching user.
      if (name === "announcements" && !old) {
        const users = await list("users");
        const targets = users.filter((u) => item.audience === "all" || u.role === item.audience);
        if (targets.length) {
          await kv.mset(
            targets.map((u) => rk("notifications", `ann-${item.id}-${u.id}`)),
            targets.map((u) => ({
              id: `ann-${item.id}-${u.id}`, userId: u.id, type: "system", title: item.title,
              message: item.body, timestamp: new Date().toISOString(), read: false,
            })),
          );
        }
      }
    }
    for (const id of deleted) {
      const old = (await kv.get(rk(name, id))) as Rec | undefined;
      if (!old) continue;
      if (!policy.read(viewer, old) || !policy.del(viewer, old)) { denied++; continue; }
      await kv.del(rk(name, id));
      saved++;
    }
    return c.json({ saved, denied });
  } catch (e) {
    console.log("write failed", name, e);
    return c.json({ error: String(e) }, 500);
  }
});

// ---------- demo data seeding ----------
// POST /seed with header x-seed-secret = SEED_SECRET (an Edge Function secret). Disabled when the secret is not set.
// Creates confirmed demo Auth users and writes every demo record. Safe to run repeatedly.
app.post(`${PREFIX}/seed`, async (c) => {
  const secret = Deno.env.get("SEED_SECRET");
  if (!secret) return c.json({ error: "Seeding is disabled. Set the SEED_SECRET function secret first." }, 404);
  if (c.req.header("x-seed-secret") !== secret) return c.json({ error: "Forbidden" }, 403);
  try {
    // 1. Auth users
    const existing = new Map<string, string>();
    for (let page = 1; page < 20; page++) {
      const { data, error } = await authClient.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw error;
      data.users.forEach((u) => existing.set(String(u.email).toLowerCase(), u.id));
      if (data.users.length < 1000) break;
    }
    const ids: Record<string, string> = {};
    const failures: string[] = [];
    const makeUser = async (a: (typeof SEED_ACCOUNTS)[number]) => {
      const attrs: any = {
        email: a.email, password: a.password, email_confirm: true,
        user_metadata: { name: a.name, phone: a.phone, role: a.role },
        app_metadata: a.role === "admin" ? { role: "admin" } : {},
      };
      const known = existing.get(a.email.toLowerCase());
      if (known) {
        const { error } = await authClient.auth.admin.updateUserById(known, attrs);
        if (error) { failures.push(`${a.email}: ${error.message}`); return; }
        ids[a.key] = known;
      } else {
        const { data, error } = await authClient.auth.admin.createUser(attrs);
        if (error || !data.user) { failures.push(`${a.email}: ${error?.message}`); return; }
        ids[a.key] = data.user.id;
      }
    };
    for (let i = 0; i < SEED_ACCOUNTS.length; i += 6) await Promise.all(SEED_ACCOUNTS.slice(i, i + 6).map(makeUser));
    if (failures.length) return c.json({ error: "Some accounts failed", failures }, 500);

    // 2. Records: swap "@key" for real user ids and move every timestamp so the data looks current.
    const shift = Date.now() - SEED_GENERATED_AT;
    const fix = (v: any): any => {
      if (typeof v === "string") {
        if (v.startsWith("@") && ids[v.slice(1)]) return ids[v.slice(1)];
        if (/^\d{4}-\d{2}-\d{2}T/.test(v)) return new Date(new Date(v).getTime() + shift).toISOString();
        if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return new Date(new Date(v).getTime() + shift).toISOString().slice(0, 10);
        return v;
      }
      if (Array.isArray(v)) return v.map(fix);
      if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fix(x)]));
      return v;
    };
    const counts: Record<string, number> = {};
    for (const [col, rows] of Object.entries(SEED_DATA)) {
      const recs = (rows as Rec[]).map((r) => fix(r) as Rec);
      counts[col] = recs.length;
      for (let i = 0; i < recs.length; i += 100) {
        const chunk = recs.slice(i, i + 100);
        await kv.mset(chunk.map((r) => rk(col, r.id)), chunk);
      }
    }
    return c.json({ ok: true, accounts: Object.keys(ids).length, records: counts });
  } catch (e) {
    console.log("seed failed", e);
    return c.json({ error: String(e) }, 500);
  }
});

Deno.serve(app.fetch);
