import { useState } from "react";
import {
  LayoutDashboard, Users, AlertTriangle, BarChart2,
  CheckCircle, XCircle, Clock, Shield, Search,
  TrendingUp, Activity, Server, Bell, Megaphone,
  ChevronDown, Filter, Eye, Ban, UserCheck
} from "lucide-react";
import { toast } from "sonner";
import { USERS, CHART_DATA, STATS, NOTIFICATIONS, NGOS, VOLUNTEERS } from "../data/mockData";
import PortalLayout from "../components/PortalLayout";
import MapView from "../components/MapView";
import { MAP_MARKERS } from "../data/mockData";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

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
          { label: "Total Users",         value: USERS.length.toString(), icon: Users,         color: "#1e3a5f", sub: "+12 today" },
          { label: "Active Requests",     value: STATS.activeRequests.toString(), icon: AlertTriangle, color: "#f97316", sub: "47 critical" },
          { label: "System Uptime",       value: "99.97%", icon: Activity,       color: "#16a34a", sub: "No incidents" },
          { label: "Avg Response Time",   value: "2.4h",   icon: Clock,          color: "#0d9488", sub: "-12% vs last week" },
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
              <p className="text-[10px] text-green-600 font-medium mt-1">{s.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Breakdown by role */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { role: "Victims",    count: USERS.filter(u => u.role === "victim").length,    color: "#dc2626", desc: "Registered individuals" },
          { role: "Volunteers", count: USERS.filter(u => u.role === "volunteer").length, color: "#0d9488", desc: "Trained responders" },
          { role: "NGOs",       count: USERS.filter(u => u.role === "ngo").length,       color: "#1e3a5f", desc: "Partner organizations" },
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

      {/* System health */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-bold text-[#0f1b2d] mb-4">System Health</h3>
        <div className="space-y-3">
          {[
            { name: "API Gateway",          status: "operational", latency: "45ms" },
            { name: "Database Cluster",     status: "operational", latency: "12ms" },
            { name: "SMS Notification Service", status: "operational", latency: "890ms" },
            { name: "Map & Geolocation API", status: "degraded",   latency: "1,340ms" },
            { name: "File Storage (S3)",    status: "operational", latency: "67ms" },
          ].map(svc => (
            <div key={svc.name} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-2.5">
                <div className={`w-2 h-2 rounded-full ${svc.status === "operational" ? "bg-green-500" : svc.status === "degraded" ? "bg-yellow-500 animate-pulse" : "bg-red-500"}`} />
                <span className="text-xs font-medium text-[#0f1b2d]">{svc.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-gray-400">{svc.latency}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${svc.status === "operational" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                  {svc.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
      <div>
        <h3 className="text-sm font-bold text-[#0f1b2d] mb-3">National Operations Map</h3>
        <MapView markers={MAP_MARKERS} height="h-72" />
      </div>
    </div>
  );
}

// ─── User Management ──────────────────────────────────────────────────────────
function UserManagement() {
  const [users, setUsers] = useState(USERS);
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
                      <button onClick={() => toast.info(`Viewing ${user.name}'s profile…`)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors" title="View">
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
          <div className="flex gap-1">
            {[1, 2, 3].map(p => (
              <button key={p} className={`w-7 h-7 rounded-lg text-xs font-medium ${p === 1 ? "bg-[#1e3a5f] text-white" : "text-gray-500 hover:bg-gray-100"}`}>{p}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Verification Queue ───────────────────────────────────────────────────────
function VerificationQueue() {
  const [pendingNGOs, setPendingNGOs] = useState(NGOS.filter(n => !n.verified));
  const [pendingVols, setPendingVols] = useState(VOLUNTEERS.filter(v => !v.ngoId).slice(0, 2));

  const approveNGO = (id: string) => {
    setPendingNGOs(prev => prev.filter(n => n.id !== id));
    toast.success("NGO approved and notified.");
  };

  const rejectNGO = (id: string) => {
    setPendingNGOs(prev => prev.filter(n => n.id !== id));
    toast.info("NGO application rejected.");
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
                <p className="text-xs text-gray-500 mb-4 leading-relaxed">{ngo.description}</p>
                <div className="flex items-center gap-3 mb-3 text-xs text-gray-500">
                  <span>Campaigns: {ngo.activeCampaigns}</span>
                  <span>·</span>
                  <span>People helped: {ngo.totalRelief.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl mb-4 text-xs text-gray-500">
                  <Shield className="w-3.5 h-3.5 text-gray-400" />
                  Awaiting: Registration certificate, NGO bureau approval, tax exemption docs
                </div>
                <div className="flex gap-2">
                  <button onClick={() => approveNGO(ngo.id)} className="flex-1 py-2.5 rounded-xl text-white font-semibold text-xs hover:opacity-90 flex items-center justify-center gap-1.5" style={{ background: "#16a34a" }}>
                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button onClick={() => rejectNGO(ngo.id)} className="flex-1 py-2.5 rounded-xl border border-red-200 text-red-600 font-semibold text-xs hover:bg-red-50 flex items-center justify-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                  <button onClick={() => toast.info("Requesting more documents…")} className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-xs hover:bg-gray-50">
                    Request Docs
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
          {pendingVols.map(v => (
            <div key={v.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#0d9488] flex items-center justify-center text-white text-sm font-bold">{v.initials}</div>
              <div className="flex-1">
                <p className="text-sm font-bold text-[#0f1b2d]">{v.name}</p>
                <p className="text-xs text-gray-400">{v.location.district} · {v.skills.join(", ")}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setPendingVols(prev => prev.filter(vv => vv.id !== v.id)); toast.success(`${v.name} verified.`); }} className="px-3 py-1.5 rounded-lg text-white text-xs font-semibold bg-green-600 hover:bg-green-700">
                  Approve
                </button>
                <button onClick={() => { setPendingVols(prev => prev.filter(vv => vv.id !== v.id)); toast.info("Volunteer application rejected."); }} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-200 text-red-600 hover:bg-red-50">
                  Reject
                </button>
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
        <p className="text-sm text-gray-500">Platform-wide performance — June 2024</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Line chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-[#0f1b2d] mb-4">Request Trends</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={CHART_DATA}>
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
            <BarChart data={CHART_DATA}>
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
            { kpi: "Total Requests",        val: STATS.activeRequests + STATS.completedRequests, change: "+12.4%", up: true },
            { kpi: "Completion Rate",       val: "87.3%",   change: "+3.1%", up: true },
            { kpi: "Avg Response Time",     val: "2.4 hrs", change: "-18%",  up: true },
            { kpi: "Volunteer Utilization", val: "94.2%",   change: "+7%",   up: true },
            { kpi: "Shelter Capacity Used", val: "72.1%",   change: "+15%",  up: false },
            { kpi: "Critical Requests",     val: "47",      change: "+8",    up: false },
          ].map(k => (
            <div key={k.kpi} className="p-3 bg-gray-50 rounded-xl">
              <p className="text-[10px] text-gray-400 mb-1">{k.kpi}</p>
              <p className="text-lg font-bold text-[#0f1b2d]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{k.val.toLocaleString()}</p>
              <p className={`text-[10px] font-medium mt-1 ${k.up ? "text-green-600" : "text-red-500"}`}>
                {k.change} vs last week
              </p>
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
  const [audience, setAudience] = useState("all");
  const [announcements, setAnnouncements] = useState([
    { id: "1", title: "System Maintenance — June 20", body: "ResQHub will undergo scheduled maintenance on June 20 from 2:00–4:00 AM. All services will be temporarily unavailable.", audience: "all", date: "2024-06-15", pinned: true },
    { id: "2", title: "New Cyclone Shelter Protocol", body: "Updated evacuation and shelter assignment protocols for cyclone response have been published. All NGOs and volunteers must review.", audience: "ngo,volunteer", date: "2024-06-14", pinned: false },
  ]);

  const post = () => {
    if (!title.trim() || !body.trim()) { toast.error("Title and message are required."); return; }
    setAnnouncements(prev => [{
      id: Date.now().toString(), title, body, audience, date: new Date().toISOString().slice(0, 10), pinned: false
    }, ...prev]);
    setTitle(""); setBody("");
    toast.success("Announcement published to all users.");
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[#0f1b2d]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Announcements</h2>
        <p className="text-sm text-gray-500">Broadcast messages to all users or specific groups</p>
      </div>

      {/* Compose */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-bold text-[#0f1b2d] mb-4">New Announcement</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[#0f1b2d] mb-1.5">Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Announcement title…"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#0f1b2d] mb-1.5">Message</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Announcement message…"
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a5f] transition-all resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#0f1b2d] mb-1.5">Target Audience</label>
            <select value={audience} onChange={e => setAudience(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] bg-white">
              <option value="all">All Users</option>
              <option value="victim">Victims Only</option>
              <option value="volunteer">Volunteers Only</option>
              <option value="ngo">NGOs Only</option>
            </select>
          </div>
          <button onClick={post} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm hover:opacity-90" style={{ background: "#1e3a5f" }}>
            <Megaphone className="w-4 h-4" /> Publish Announcement
          </button>
        </div>
      </div>

      {/* Published */}
      <div className="space-y-3">
        {announcements.map(a => (
          <div key={a.id} className={`bg-white rounded-2xl border shadow-sm p-5 ${a.pinned ? "border-orange-200 bg-orange-50/30" : "border-gray-100"}`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {a.pinned && <Bell className="w-3.5 h-3.5 text-orange-500" />}
                <p className="text-sm font-bold text-[#0f1b2d]">{a.title}</p>
              </div>
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

// ─── Main Portal ──────────────────────────────────────────────────────────────
export default function AdminPortal({ onNavigate }: { onNavigate: (v: string) => void }) {
  const [activePage, setActivePage] = useState<AdminPage>("overview");
  const [notifs, setNotifs] = useState(NOTIFICATIONS);

  return (
    <PortalLayout
      navItems={NAV_ITEMS}
      activePage={activePage}
      onNavigate={p => setActivePage(p as AdminPage)}
      userName="System Administrator"
      userRole="Admin"
      userInitials="SA"
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
