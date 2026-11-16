import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";

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
    write: (u, old, nw) => !!u && (old ? true : nw.ownerId === u.id),
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

const ROLES: Role[] = ["victim", "volunteer", "ngo", "admin"];
const initialsOf = (name: string) =>
  name.split(/\s+/).filter(Boolean).map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "U";

// Creates the profile (and role-specific records) the first time a verified account signs in.
async function ensureProfile(user: any): Promise<{ profile?: Rec; error?: string }> {
  const existing = (await kv.get(rk("users", user.id))) as Rec | undefined;
  const emailVerified = !!user.email_confirmed_at;
  if (existing) {
    if (existing.emailVerified !== emailVerified) {
      existing.emailVerified = emailVerified;
      await kv.set(rk("users", user.id), existing);
    }
    return { profile: existing };
  }

  const meta = user.user_metadata ?? {};
  const role: Role = ROLES.includes(meta.role) ? meta.role : "victim";
  if (role === "admin" && (await list("users")).some((u) => u.role === "admin")) {
    return { error: "Admin accounts are invite-only. An administrator already exists." };
  }

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

Deno.serve(app.fetch);
