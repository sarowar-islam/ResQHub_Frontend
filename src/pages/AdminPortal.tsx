import { useState } from "react";
import {
  LayoutDashboard, Users, AlertTriangle, BarChart2,
  CheckCircle, XCircle, Clock, Shield, Search,
  TrendingUp, Activity, Server, Bell, Megaphone,
  ChevronDown, Filter, Eye, Ban, UserCheck
} from "lucide-react";
import { toast } from "sonner";

import PortalLayout from "../components/PortalLayout";
import MapView from "../components/MapView";

import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { chartData, mapMarkers, initialsOf } from "../lib/derive";
import { useSession } from "../context/SessionContext";
import { db, useDbRevision, usePersistedState, patchRecord, addToCollection } from "../context/DataContext";
import type { Alert, Announcement, DisasterType } from "../types";

type AdminPage = "overview" | "users" | "verification" | "analytics" | "announcements";

const NAV_ITEMS = [
  { id: "overview",      label: "System Overview",     icon: LayoutDashboard },
  { id: "users",         label: "User Management",     icon: Users },
  { id: "verification",  label: "Verification Queue",  icon: Shield },
  { id: "analytics",     label: "Analytics",           icon: BarChart2 },
  { id: "announcements", label: "Announcements",       icon: Megaphone },
];

// ─── Overview ─────────────────────────────────────────────────────────────────
function Overview() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#0f1b2d]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>System Overview</h2>
        <p className="text-sm text-gray-500 mt-0.5">Real-time platform health and activity</p>
      </div>

      {/* System stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Users",         value: db.users.length.toString(), icon: Users, color: "#1e3a5f", sub: `${db.users.filter(u => Date.now() - new Date(u.joinedAt).getTime() < 864e5 * 1.5).length} joined in the last 24h` },
          { label: "Active Requests",     value: db.stats.activeRequests.toString(), icon: AlertTriangle, color: "#f97316", sub: `${db.stats.criticalRequests} critical` },
          { label: "Completed Requests",  value: db.stats.completedRequests.toString(), icon: CheckCircle, color: "#16a34a", sub: `${db.helpRequests.length ? Math.round((db.stats.completedRequests / db.helpRequests.length) * 100) : 0}% completion rate` },
          { label: "Open Shelters",       value: db.stats.activeShelters.toString(), icon: Activity, color: "#0d9488", sub: `${db.shelters.length} registered` },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: s.color + "15" }}>
                  <Icon className="w-4.5 h-4.5" style={{ color: s.color }} />
                </div>
              </div>
              <p className="text-2xl font-bold text-[#0f1b2d]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              <p className="text-[10px] text-gray-500 font-medium mt-1">{s.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Breakdown by role */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { role: "Victims",    count: db.users.filter(u => u.role === "victim").length,    color: "#dc2626", desc: "Registered individuals" },
          { role: "Volunteers", count: db.users.filter(u => u.role === "volunteer").length, color: "#0d9488", desc: "Trained responders" },
          { role: "NGOs",       count: db.users.filter(u => u.role === "ngo").length,       color: "#1e3a5f", desc: "Partner organizations" },
        ].map(r => (
          <div key={r.role} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
            <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2" style={{ background: r.color + "15" }}>
              <Users className="w-5 h-5" style={{ color: r.color }} />
            </div>
            <p className="text-2xl font-bold text-[#0f1b2d]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{r.count}</p>
            <p className="text-sm font-semibold text-[#0f1b2d]">{r.role}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{r.desc}</p>
          </div>
        ))}
      </div>

      {/* Map */}
      <div>
        <h3 className="text-sm font-bold text-[#0f1b2d] mb-3">National Operations Map</h3>
        <MapView markers={mapMarkers()} height="h-72" />
      </div>
    </div>
  );
}

// ─── User Management ──────────────────────────────────────────────────────────
function UserManagement() {
  const [users, setUsers] = usePersistedState("users");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchStatus = statusFilter === "all" || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const toggleStatus = (id: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === "active" ? "suspended" as const : "active" as const } : u));
    const user = users.find(u => u.id === id);
    toast.success(`${user?.name} status updated.`);
  };

  const roleColor: Record<string, string> = {
    victim: "bg-red-100 text-red-700 border-red-200",
    volunteer: "bg-teal-100 text-teal-700 border-teal-200",
    ngo: "bg-blue-100 text-blue-700 border-blue-200",
    admin: "bg-purple-100 text-purple-700 border-purple-200",
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#0f1b2d]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>User Management</h2>
          <p className="text-sm text-gray-500">{users.length} total users · {users.filter(u => u.status === "active").length} active</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus-within:border-[#1e3a5f] transition-all">
          <Search className="w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…" className="flex-1 text-sm bg-transparent border-none outline-none" />
        </div>
        <div className="flex gap-2">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#1e3a5f] bg-white"
          >
            <option value="all">All Roles</option>
            <option value="victim">Victims</option>
            <option value="volunteer">Volunteers</option>
            <option value="ngo">NGOs</option>
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#1e3a5f] bg-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {["User", "Role", "Status", "Location", "Joined", "Verified", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wider text-[10px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => (
                <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#1e3a5f] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                        {user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-[#0f1b2d]">{user.name}</p>
                        <p className="text-[10px] text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${roleColor[user.role] || "bg-gray-100 text-gray-600"}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${user.status === "active" ? "bg-green-100 text-green-700 border-green-200" : user.status === "suspended" ? "bg-red-100 text-red-700 border-red-200" : "bg-yellow-100 text-yellow-700 border-yellow-200"}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{user.location}</td>
                  <td className="px-4 py-3 text-gray-400">{user.joinedAt}</td>
                  <td className="px-4 py-3">
                    {user.verified
                      ? <CheckCircle className="w-4 h-4 text-green-500" />
                      : <Clock className="w-4 h-4 text-gray-300" />
                    }
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => toast.info(`${user.name} · ${user.email}${user.phone ? " · " + user.phone : ""}`)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors" title="View">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => toggleStatus(user.id)}
                        className={`p-1.5 rounded-lg transition-colors ${user.status === "active" ? "hover:bg-red-50 text-red-500" : "hover:bg-green-50 text-green-500"}`}
                        title={user.status === "active" ? "Suspend" : "Activate"}
                      >
                        {user.status === "active" ? <Ban className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">Showing {filtered.length} of {users.length} users</p>
        </div>
      </div>
    </div>
  );
}

// ─── Verification Queue ───────────────────────────────────────────────────────
function VerificationQueue() {
  const [ngos, setNgos] = usePersistedState("ngos");
  const [users, setUsers] = usePersistedState("users");
  const pendingNGOs = ngos.filter(n => !n.verified);
  const pendingVols = users
    .filter(u => u.role === "volunteer" && !u.verified && u.status !== "suspended")
    .map(u => ({ user: u, vol: db.volunteers.find(v => v.id === u.id) }));

  const notify = (userId: string, title: string, message: string) =>
    addToCollection("notifications", { id: `n-${Date.now()}-${userId}`, userId, type: "system", title, message, timestamp: new Date().toISOString(), read: false });

  const approveNGO = (id: string) => {
    setNgos(prev => prev.map(n => n.id === id ? { ...n, verified: true } : n));
    setUsers(prev => prev.map(u => u.id === id ? { ...u, verified: true, status: "active" as const } : u));
    notify(id, "Organization verified", "Your NGO has been approved. It is now listed as a verified partner.");
    toast.success("NGO approved and notified.");
  };

  const rejectNGO = (id: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: "suspended" as const } : u));
    toast.info("NGO application rejected and account suspended.");
  };

  const approveVolunteer = (id: string, name: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, verified: true } : u));
    notify(id, "Volunteer verified", "Your volunteer profile has been verified by an administrator.");
    toast.success(`${name} verified.`);
  };

  const rejectVolunteer = (id: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: "suspended" as const } : u));
    toast.info("Volunteer application rejected and account suspended.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#0f1b2d]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Verification Queue</h2>
        <p className="text-sm text-gray-500">{pendingNGOs.length + pendingVols.length} items awaiting review</p>
      </div>

      {/* NGO verifications */}
      <div>
        <h3 className="text-sm font-bold text-[#0f1b2d] mb-3 flex items-center gap-2">
          NGO Applications
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">{pendingNGOs.length}</span>
        </h3>
        {pendingNGOs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">All NGO applications reviewed</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingNGOs.map(ngo => (
              <div key={ngo.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">{ngo.initials}</div>
                    <div>
                      <p className="text-sm font-bold text-[#0f1b2d]">{ngo.name}</p>
                      <p className="text-xs text-gray-400">{ngo.location} · {ngo.contactEmail}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">Pending</span>
                </div>
                <p className="text-xs text-gray-500 mb-4 leading-relaxed">{ngo.description || "No description provided."}</p>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl mb-4 text-xs text-gray-500">
                  <Shield className="w-3.5 h-3.5 text-gray-400" />
                  Contact: {ngo.contactEmail}{ngo.contactPhone ? ` · ${ngo.contactPhone}` : ""}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => approveNGO(ngo.id)} className="flex-1 py-2.5 rounded-xl text-white font-semibold text-xs hover:opacity-90 flex items-center justify-center gap-1.5" style={{ background: "#16a34a" }}>
                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button onClick={() => rejectNGO(ngo.id)} className="flex-1 py-2.5 rounded-xl border border-red-200 text-red-600 font-semibold text-xs hover:bg-red-50 flex items-center justify-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Volunteer verifications */}
      <div>
        <h3 className="text-sm font-bold text-[#0f1b2d] mb-3 flex items-center gap-2">
          Volunteer Verifications
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">{pendingVols.length}</span>
        </h3>
        <div className="space-y-3">
          {pendingVols.length === 0 && <p className="text-xs text-gray-400 bg-white rounded-2xl border border-gray-100 p-4">No volunteers awaiting verification.</p>}
          {pendingVols.map(({ user, vol }) => (
            <div key={user.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#0d9488] flex items-center justify-center text-white text-sm font-bold">{initialsOf(user.name)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#0f1b2d]">{user.name}</p>
                <p className="text-xs text-gray-400 truncate">{user.email} · {vol?.location.label ?? user.location}{vol && vol.skills.length ? ` · ${vol.skills.join(", ")}` : ""}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => approveVolunteer(user.id, user.name)} className="px-3 py-1.5 rounded-lg text-white text-xs font-semibold" style={{ background: "#0d9488" }}>Approve</button>
                <button onClick={() => rejectVolunteer(user.id)} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-200 text-red-600 hover:bg-red-50">Reject</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Analytics ────────────────────────────────────────────────────────────────
function Analytics() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[#0f1b2d]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>System Analytics</h2>
        <p className="text-sm text-gray-500">Platform-wide performance — live data</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Line chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-[#0f1b2d] mb-4">Request Trends</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5ecf3" }} />
              <Line type="monotone" dataKey="requests" stroke="#dc2626" strokeWidth={2} dot={false} name="Requests" />
              <Line type="monotone" dataKey="completed" stroke="#16a34a" strokeWidth={2} dot={false} name="Completed" />
              <Line type="monotone" dataKey="volunteers" stroke="#1e3a5f" strokeWidth={2} dot={false} name="Volunteers" />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bar chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-[#0f1b2d] mb-4">Volunteer Activity</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5ecf3" }} />
              <Bar dataKey="volunteers" fill="#0d9488" radius={[4, 4, 0, 0]} name="Active Volunteers" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* KPI table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-bold text-[#0f1b2d] mb-4">Key Performance Indicators</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { kpi: "Total Requests",        val: db.helpRequests.length.toLocaleString() },
            { kpi: "Completion Rate",       val: `${db.helpRequests.length ? Math.round((db.stats.completedRequests / db.helpRequests.length) * 100) : 0}%` },
            { kpi: "Available Volunteers",  val: `${db.volunteers.filter(v => v.isAvailable).length}/${db.volunteers.length}` },
            { kpi: "Shelter Capacity Used", val: (() => { const cap = db.shelters.reduce((n, x) => n + x.capacity, 0); const occ = db.shelters.reduce((n, x) => n + x.currentOccupancy, 0); return cap ? `${Math.round((occ / cap) * 100)}%` : "—"; })() },
            { kpi: "Open Critical Requests", val: String(db.stats.criticalRequests) },
            { kpi: "Verified NGOs",         val: String(db.stats.partnerNGOs) },
          ].map(k => (
            <div key={k.kpi} className="p-3 bg-gray-50 rounded-xl">
              <p className="text-[10px] text-gray-400 mb-1">{k.kpi}</p>
              <p className="text-lg font-bold text-[#0f1b2d]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{k.val}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Announcements ────────────────────────────────────────────────────────────
function Announcements() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<Announcement["audience"]>("all");
  const [announcements, setAnnouncements] = usePersistedState("announcements");
  const [alerts, setAlerts] = usePersistedState("alerts");
  const [alertForm, setAlertForm] = useState({ title: "", description: "", location: "", type: "flood" as DisasterType, severity: "severe" as Alert["severity"], areas: "", evacuation: false });

  const post = () => {
    if (!title.trim() || !body.trim()) { toast.error("Title and message are required."); return; }
    const ann: Announcement = { id: `ann-${Date.now()}`, title: title.trim(), body: body.trim(), audience, date: new Date().toISOString().slice(0, 10) };
    setAnnouncements(prev => [ann, ...prev]);
    setTitle(""); setBody("");
    toast.success("Announcement published and delivered as a notification.");
  };

  const publishAlert = () => {
    if (!alertForm.title.trim() || !alertForm.description.trim() || !alertForm.location.trim()) { toast.error("Title, description and location are required."); return; }
    const alert: Alert = {
      id: `alert-${Date.now()}`, type: alertForm.type, severity: alertForm.severity, title: alertForm.title.trim(),
      description: alertForm.description.trim(), location: alertForm.location.trim(), timestamp: new Date().toISOString(),
      affectedAreas: alertForm.areas.split(",").map(a => a.trim()).filter(Boolean), evacuationOrder: alertForm.evacuation,
    };
    setAlerts(prev => [alert, ...prev]);
    setAlertForm({ title: "", description: "", location: "", type: "flood", severity: "severe", areas: "", evacuation: false });
    toast.success("Emergency alert published on the public site.");
  };

  const field = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] transition-all";

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[#0f1b2d]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Announcements & Alerts</h2>
        <p className="text-sm text-gray-500">Broadcast messages to users, or publish public emergency alerts</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-bold text-[#0f1b2d] mb-4">New Announcement</h3>
        <div className="space-y-3">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Announcement title…" className={field} />
          <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Announcement message…" rows={4} className={field + " resize-none"} />
          <select value={audience} onChange={e => setAudience(e.target.value as Announcement["audience"])} className={field + " bg-white"}>
            <option value="all">All Users</option>
            <option value="victim">Victims Only</option>
            <option value="volunteer">Volunteers Only</option>
            <option value="ngo">NGOs Only</option>
          </select>
          <button onClick={post} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm hover:opacity-90" style={{ background: "#1e3a5f" }}>
            <Megaphone className="w-4 h-4" /> Publish Announcement
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5">
        <h3 className="text-sm font-bold text-[#0f1b2d] mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-500" /> Publish Emergency Alert</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <input value={alertForm.title} onChange={e => setAlertForm(f => ({ ...f, title: e.target.value }))} placeholder="Alert title" className={field} />
          <input value={alertForm.location} onChange={e => setAlertForm(f => ({ ...f, location: e.target.value }))} placeholder="Location (e.g. Sylhet Division)" className={field} />
          <select value={alertForm.type} onChange={e => setAlertForm(f => ({ ...f, type: e.target.value as DisasterType }))} className={field + " bg-white capitalize"}>
            {(["flood", "cyclone", "landslide", "drought"] as DisasterType[]).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={alertForm.severity} onChange={e => setAlertForm(f => ({ ...f, severity: e.target.value as Alert["severity"] }))} className={field + " bg-white capitalize"}>
            {["extreme", "severe", "moderate", "minor"].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input value={alertForm.areas} onChange={e => setAlertForm(f => ({ ...f, areas: e.target.value }))} placeholder="Affected areas (comma separated)" className={field + " sm:col-span-2"} />
          <textarea value={alertForm.description} onChange={e => setAlertForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" rows={3} className={field + " sm:col-span-2 resize-none"} />
          <label className="flex items-center gap-2 text-xs text-[#0f1b2d] sm:col-span-2"><input type="checkbox" checked={alertForm.evacuation} onChange={e => setAlertForm(f => ({ ...f, evacuation: e.target.checked }))} /> Evacuation order in effect</label>
        </div>
        <button onClick={publishAlert} className="mt-3 px-5 py-2.5 rounded-xl text-white font-semibold text-sm hover:opacity-90 bg-red-600">Publish Alert</button>

        {alerts.length > 0 && (
          <div className="mt-5 space-y-2">
            <p className="text-xs font-semibold text-gray-500">Active alerts</p>
            {alerts.map(a => (
              <div key={a.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-red-50/50 border border-red-100">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#0f1b2d] truncate">{a.title}</p>
                  <p className="text-[10px] text-gray-500 capitalize">{a.type} · {a.severity} · {a.location}</p>
                </div>
                <button onClick={() => { setAlerts(prev => prev.filter(x => x.id !== a.id)); toast.info("Alert removed."); }} className="text-[11px] font-semibold text-red-600 hover:underline shrink-0">Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {announcements.length === 0 && <p className="text-sm text-gray-400 bg-white rounded-2xl border border-gray-100 p-6 text-center">No announcements published yet.</p>}
        {announcements.map(a => (
          <div key={a.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between mb-2">
              <p className="text-sm font-bold text-[#0f1b2d]">{a.title}</p>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[10px] text-gray-400">{a.date}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 capitalize">{a.audience}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">{a.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Portal ─────────────────────────────────────────────────────────────
export default function AdminPortal({ onNavigate }: { onNavigate: (v: string) => void }) {
  useDbRevision();
  const session = useSession();
  const [activePage, setActivePage] = useState<AdminPage>("overview");
  const [notifs, setNotifs] = usePersistedState("notifications");

  return (
    <PortalLayout
      navItems={NAV_ITEMS}
      activePage={activePage}
      onNavigate={p => setActivePage(p as AdminPage)}
      userName={session.name}
      userRole="Admin"
      userInitials={initialsOf(session.name)}
      portalLabel="Admin Dashboard"
      onLogout={() => onNavigate("landing")}
      notifications={notifs}
      onMarkRead={id => setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))}
    >
      {activePage === "overview"       && <Overview />}
      {activePage === "users"          && <UserManagement />}
      {activePage === "verification"   && <VerificationQueue />}
      {activePage === "analytics"      && <Analytics />}
      {activePage === "announcements"  && <Announcements />}
    </PortalLayout>
  );
}
