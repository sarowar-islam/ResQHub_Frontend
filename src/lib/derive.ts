import { db } from "../context/DataContext";
import type { MapMarker, HelpRequest } from "../types";

const dayKey = (d: Date) => d.toISOString().slice(0, 10);
const dayLabel = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
const validPoint = (p?: { lat: number; lng: number }) => !!p && Number.isFinite(p.lat) && Number.isFinite(p.lng) && !(p.lat === 0 && p.lng === 0);

/** Requests, completions and volunteer sign-ups for the last 7 days, computed from live records. */
export function chartData() {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  return days.map(d => {
    const key = dayKey(d);
    return {
      date: dayLabel(d),
      requests: db.helpRequests.filter(r => r.createdAt?.slice(0, 10) === key).length,
      completed: db.helpRequests.filter(r => r.status === "completed" && r.updatedAt?.slice(0, 10) === key).length,
      volunteers: db.volunteers.filter(v => (v.joinedAt ?? "").slice(0, 10) <= key).length,
    };
  });
}

/** Share of requests by type. */
export function reliefDistribution() {
  const counts: Record<string, number> = {};
  db.helpRequests.forEach(r => { counts[r.type] = (counts[r.type] ?? 0) + 1; });
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  return Object.entries(counts).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value: Math.round((value / total) * 100) }));
}

/** Map pins built from shelters, active requests and available volunteers the user may see. */
export function mapMarkers(): MapMarker[] {
  const markers: MapMarker[] = [];
  db.shelters.filter(s => validPoint(s.location)).forEach(s =>
    markers.push({
      id: `shelter-${s.id}`, type: "shelter", label: s.name, location: s.location,
      detail: `${s.currentOccupancy}/${s.capacity} capacity`, status: s.status,
    }));
  db.helpRequests
    .filter(r => ["pending", "accepted", "assigned"].includes(r.status) && validPoint(r.location))
    .forEach(r =>
      markers.push({
        id: `req-${r.id}`, type: "victim", label: r.victimName, location: r.location,
        detail: `${r.type} — ${r.description.slice(0, 60)}`, status: r.status,
      }));
  db.volunteers.filter(v => v.isAvailable && validPoint(v.location)).forEach(v =>
    markers.push({
      id: `vol-${v.id}`, type: "volunteer", label: v.name, location: v.location,
      detail: v.skills.length ? `Available — ${v.skills.join(", ")}` : "Available", status: "active",
    }));
  return markers;
}

export const activeRequests = (): HelpRequest[] =>
  db.helpRequests.filter(r => ["pending", "accepted", "assigned"].includes(r.status));

export const initialsOf = (name: string) =>
  name.split(/\s+/).filter(Boolean).map(p => p[0]).join("").slice(0, 2).toUpperCase() || "U";

export function timeAgo(iso?: string): string {
  if (!iso) return "";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/** Straight-line distance in km between two coordinates. */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371, rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
