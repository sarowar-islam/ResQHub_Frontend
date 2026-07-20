import { useState } from "react";
import {
  LayoutDashboard, Flag, Home, Package, BarChart2, Users,
  Plus, Edit3, Trash2, CheckCircle, Clock, Search,
  MapPin, Phone, TrendingUp, AlertTriangle, X,
  ChevronRight, Download, RefreshCw, Shield
} from "lucide-react";
import { toast } from "sonner";
import {
  CAMPAIGNS, SHELTERS, INVENTORY, VOLUNTEERS, NOTIFICATIONS,
  CHART_DATA, RELIEF_DISTRIBUTION_DATA, HELP_REQUESTS, NGOS
} from "../data/mockData";
import PortalLayout from "../components/PortalLayout";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

type NGOPage = "dashboard" | "campaigns" | "shelters" | "inventory" | "reports" | "volunteers";

const NAV_ITEMS = [
  { id: "dashboard",  label: "Dashboard",          icon: LayoutDashboard },
  { id: "campaigns",  label: "Campaigns",           icon: Flag },
  { id: "shelters",   label: "Shelter Management",  icon: Home },
  { id: "inventory",  label: "Inventory",           icon: Package },
  { id: "reports",    label: "Reports & Analytics", icon: BarChart2 },
  { id: "volunteers", label: "Volunteers",          icon: Users },
];

const PIE_COLORS = ["#1e3a5f", "#0d9488", "#f97316", "#16a34a", "#dc2626"];

const me = NGOS[0]; // BRAC

// ─── Dashboard ───────────────────────────────────────────────────────────────
function NGODashboard() {
  const activeReqs = HELP_REQUESTS.filter(r => r.status !== "completed" && r.status !== "cancelled");
  const availableVols = VOLUNTEERS.filter(v => v.isAvailable).length;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#0f1b2d]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>BRAC Disaster Response</h2>
          <p className="text-sm text-gray-500 mt-0.5">Operations overview — {new Date().toLocaleDateString("en-BD", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
        <span className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-100 px-3 py-1.5 rounded-full border border-green-200">
          <Shield className="w-3.5 h-3.5" /> Verified NGO
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Campaigns",     value: me.activeCampaigns.toString(), icon: Flag,        color: "#1e3a5f", change: "+2" },
          { label: "Volunteers Deployed",  value: `${availableVols}/${me.volunteerCount}`, icon: Users, color: "#0d9488", change: "" },
          { label: "Active Requests",      value: activeReqs.length.toString(), icon: AlertTriangle, color: "#f97316", change: `${activeReqs.filter(r=>r.priority==="critical").length} critical` },
          { label: "Total People Helped",  value: me.totalRelief.toLocaleString() + "+", icon: CheckCircle, color: "#16a34a", change: "+1,200 today" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: s.color + "15" }}>
                  <Icon className="w-4.5 h-4.5" style={{ color: s.color }} />
                </div>
                {s.change && <span className="text-[10px] font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{s.change}</span>}
              </div>
              <p className="text-2xl font-bold text-[#0f1b2d]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Area chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#0f1b2d]">Relief Requests Over Time</h3>
            <span className="text-[10px] text-gray-400">Last 6 days</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={CHART_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5ecf3" }} />
              <Area type="monotone" dataKey="requests" stroke="#dc2626" fill="#dc262615" strokeWidth={2} name="Total Requests" />
              <Area type="monotone" dataKey="completed" stroke="#16a34a" fill="#16a34a15" strokeWidth={2} name="Completed" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-[#0f1b2d] mb-4">Relief by Type</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={RELIEF_DISTRIBUTION_DATA} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">
                {RELIEF_DISTRIBUTION_DATA.map((_, index) => (
                  <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {RELIEF_DISTRIBUTION_DATA.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i] }} />
                  <span className="text-[10px] text-gray-600">{d.name}</span>
                </div>
                <span className="text-[10px] font-bold text-[#0f1b2d]">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active campaigns */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-[#0f1b2d]">Active Campaigns</h3>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
        <div className="space-y-3">
          {CAMPAIGNS.filter(c => c.status === "active").map(c => (
            <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-bold text-[#0f1b2d]">{c.title}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{c.targetArea}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">Active</span>
              </div>
              <div className="mt-2">
                <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                  <span>Progress</span>
                  <span>{c.requestsHandled}/{c.totalNeeded} requests ({c.progress}%)</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100">
                  <div className="h-2 rounded-full bg-[#0d9488] transition-all" style={{ width: `${c.progress}%` }} />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2.5">
                <span className="text-[10px] text-gray-400">{c.assignedVolunteers.length} volunteers · {c.startDate} – {c.endDate}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Campaigns ────────────────────────────────────────────────────────────────
function CampaignsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [campaigns, setCampaigns] = useState(CAMPAIGNS);
  const [newTitle, setNewTitle] = useState("");

  const create = () => {
    if (!newTitle.trim()) { toast.error("Campaign title required."); return; }
    const newC = {
      id: `camp-new-${Date.now()}`,
      title: newTitle,
      description: "Newly created campaign.",
      ngoId: "ngo-001",
      targetArea: "Bangladesh",
      status: "active" as const,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10),
      assignedVolunteers: [],
      requestsHandled: 0,
      totalNeeded: 100,
      progress: 0,
      disasterType: "flood" as const,
    };
    setCampaigns(prev => [newC, ...prev]);
    setNewTitle("");
    setShowCreate(false);
    toast.success("Campaign created successfully.");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#0f1b2d]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Campaign Management</h2>
          <p className="text-sm text-gray-500">{campaigns.length} total campaigns</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-semibold text-xs hover:opacity-90"
          style={{ background: "#1e3a5f" }}
        >
          <Plus className="w-3.5 h-3.5" /> New Campaign
        </button>
      </div>

      {showCreate && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-[#0f1b2d]">Create Campaign</p>
            <button onClick={() => setShowCreate(false)}><X className="w-4 h-4 text-gray-400" /></button>
          </div>
          <input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Campaign title…"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none focus:border-[#1e3a5f]"
          />
          <button onClick={create} className="px-4 py-2 rounded-xl text-white text-xs font-semibold hover:opacity-90" style={{ background: "#1e3a5f" }}>
            Create
          </button>
        </div>
      )}

      <div className="space-y-4">
        {campaigns.map(c => (
          <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 pr-4">
                <p className="text-sm font-bold text-[#0f1b2d]">{c.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{c.description}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${c.status === "active" ? "bg-green-100 text-green-700 border-green-200" : c.status === "completed" ? "bg-gray-100 text-gray-600 border-gray-200" : "bg-yellow-100 text-yellow-700 border-yellow-200"}`}>
                  {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                </span>
                <button onClick={() => toast.info("Edit campaign")} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                  <Edit3 className="w-3.5 h-3.5 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-3 text-xs">
              <div><p className="text-gray-400 mb-0.5">Target Area</p><p className="font-semibold text-[#0f1b2d]">{c.targetArea}</p></div>
              <div><p className="text-gray-400 mb-0.5">Volunteers</p><p className="font-semibold text-[#0f1b2d]">{c.assignedVolunteers.length}</p></div>
              <div><p className="text-gray-400 mb-0.5">Period</p><p className="font-semibold text-[#0f1b2d]">{c.startDate} – {c.endDate}</p></div>
            </div>

            <div className="mb-2">
              <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                <span>Progress</span>
                <span>{c.requestsHandled}/{c.totalNeeded} ({c.progress}%)</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full">
                <div className={`h-2 rounded-full ${c.progress === 100 ? "bg-green-500" : "bg-[#0d9488]"}`} style={{ width: `${c.progress}%` }} />
              </div>
            </div>

            {c.status === "active" && (
              <button onClick={() => toast.info("Assign volunteers to this campaign.")} className="mt-2 text-xs font-semibold text-[#0d9488] hover:underline flex items-center gap-1">
                <Users className="w-3 h-3" /> Assign Volunteers
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Shelter Management ───────────────────────────────────────────────────────
function ShelterMgmt() {
  const [shelters, setShelters] = useState(SHELTERS);
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#0f1b2d]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Shelter Management</h2>
          <p className="text-sm text-gray-500">{shelters.length} shelters registered</p>
        </div>
        <button onClick={() => setShowAdd(v => !v)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-semibold text-xs hover:opacity-90" style={{ background: "#1e3a5f" }}>
          <Plus className="w-3.5 h-3.5" /> Add Shelter
        </button>
      </div>

      {showAdd && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <p className="text-sm font-bold text-[#0f1b2d] mb-3">New Shelter Details</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {["Shelter Name", "Location", "Capacity", "Contact Phone"].map(f => (
              <input key={f} placeholder={f} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a5f]" />
            ))}
          </div>
          <button onClick={() => { setShowAdd(false); toast.success("Shelter added successfully."); }} className="px-4 py-2 rounded-xl text-white text-xs font-semibold hover:opacity-90" style={{ background: "#1e3a5f" }}>
            Save Shelter
          </button>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {shelters.map(s => {
          const pct = Math.round((s.currentOccupancy / s.capacity) * 100);
          return (
            <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between mb-3">
                <p className="text-sm font-bold text-[#0f1b2d] leading-snug pr-3">{s.name}</p>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.status === "open" ? "bg-green-100 text-green-700" : s.status === "full" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>
                    {s.status}
                  </span>
                  <button onClick={() => toast.info("Edit shelter")} className="p-1 hover:bg-gray-100 rounded-lg">
                    <Edit3 className="w-3 h-3 text-gray-400" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-400 flex items-center gap-1 mb-3"><MapPin className="w-3 h-3" />{s.location.label}</p>

              <div className="mb-3">
                <div className="flex justify-between text-[10px] text-gray-400 mb-1"><span>Occupancy</span><span>{s.currentOccupancy}/{s.capacity}</span></div>
                <div className="h-2 bg-gray-100 rounded-full">
                  <div className={`h-2 rounded-full ${pct >= 100 ? "bg-red-500" : pct > 80 ? "bg-orange-400" : "bg-green-500"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3" />{s.contactPhone}</span>
                <button onClick={() => toast.info(`Update occupancy for ${s.name}`)} className="text-[#0d9488] font-medium hover:underline">
                  Update
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Inventory ────────────────────────────────────────────────────────────────
function InventoryPage() {
  const [inventory, setInventory] = useState(INVENTORY);
  const [search, setSearch] = useState("");

  const filtered = inventory.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.category.toLowerCase().includes(search.toLowerCase())
  );

  const statusColor = { adequate: "bg-green-100 text-green-700 border-green-200", low: "bg-yellow-100 text-yellow-700 border-yellow-200", critical: "bg-red-100 text-red-700 border-red-200" };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#0f1b2d]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Inventory Management</h2>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-red-600 font-semibold">{inventory.filter(i => i.status === "critical").length} critical</span>
            <span className="text-xs text-yellow-600 font-semibold">{inventory.filter(i => i.status === "low").length} low</span>
            <span className="text-xs text-green-600 font-semibold">{inventory.filter(i => i.status === "adequate").length} adequate</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => toast.info("Refreshing inventory…")} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50">
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
          <button onClick={() => toast.info("Add inventory item")} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-semibold hover:opacity-90" style={{ background: "#1e3a5f" }}>
            <Plus className="w-3.5 h-3.5" /> Add Item
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus-within:border-[#1e3a5f] transition-all">
        <Search className="w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search inventory…" className="flex-1 text-sm bg-transparent border-none outline-none" />
      </div>

      {/* Low stock alert */}
      {inventory.some(i => i.status === "critical") && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-800">Critical Stock Alert</p>
            <p className="text-xs text-red-600 mt-0.5">
              {inventory.filter(i => i.status === "critical").map(i => i.name).join(", ")} are critically low. Reorder immediately.
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {["Item", "Category", "Quantity", "Location", "Last Updated", "Status", ""].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wider text-[10px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-[#0f1b2d]">{item.name}</td>
                  <td className="px-4 py-3 capitalize text-gray-500">{item.category}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#0f1b2d]">{item.quantity.toLocaleString()}</span>
                      <span className="text-gray-400">{item.unit}</span>
                    </div>
                    <div className="mt-1 h-1 bg-gray-100 rounded-full w-24">
                      <div
                        className={`h-1 rounded-full ${item.status === "critical" ? "bg-red-500" : item.status === "low" ? "bg-yellow-400" : "bg-green-500"}`}
                        style={{ width: `${Math.min((item.quantity / (item.minimumStock * 4)) * 100, 100)}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{item.location}</td>
                  <td className="px-4 py-3 text-gray-400">{new Date(item.lastUpdated).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColor[item.status]}`}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toast.info(`Reorder ${item.name}`)} className="text-[#0d9488] hover:underline font-medium">Reorder</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Reports ──────────────────────────────────────────────────────────────────
function ReportsPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#0f1b2d]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Reports & Analytics</h2>
          <p className="text-sm text-gray-500">June 2024 · All Campaigns</p>
        </div>
        <button onClick={() => toast.success("Report exported as PDF.")} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50">
          <Download className="w-3.5 h-3.5" /> Export PDF
        </button>
      </div>

      {/* Bar chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-bold text-[#0f1b2d] mb-4">Daily Volunteer Deployment</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={CHART_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} />
            <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5ecf3" }} />
            <Bar dataKey="volunteers" fill="#1e3a5f" radius={[4, 4, 0, 0]} name="Volunteers" />
            <Bar dataKey="completed" fill="#0d9488" radius={[4, 4, 0, 0]} name="Completed" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Requests Handled", value: "1,048", change: "+287 this week" },
          { label: "Average Response Time", value: "2.4h", change: "-0.3h vs last week" },
          { label: "Completion Rate", value: "87%", change: "+3% improvement" },
          { label: "Volunteer Hours", value: "8,420", change: "This month" },
          { label: "Beneficiaries Reached", value: "48,250+", change: "All campaigns" },
          { label: "Shelters Active", value: "5 / 5", change: "100% operational" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xl font-bold text-[#0f1b2d]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            <p className="text-[10px] text-green-600 font-medium mt-1.5">{s.change}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Volunteers ───────────────────────────────────────────────────────────────
function VolunteersPage() {
  const [search, setSearch] = useState("");
  const filtered = VOLUNTEERS.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.location.district.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#0f1b2d]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Volunteer Management</h2>
          <p className="text-sm text-gray-500">{VOLUNTEERS.filter(v => v.isAvailable).length} available now · {VOLUNTEERS.length} total</p>
        </div>
        <button onClick={() => toast.info("Invite volunteer")} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-semibold hover:opacity-90" style={{ background: "#1e3a5f" }}>
          <Plus className="w-3.5 h-3.5" /> Invite
        </button>
      </div>

      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus-within:border-[#1e3a5f] transition-all">
        <Search className="w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search volunteers…" className="flex-1 text-sm bg-transparent border-none outline-none" />
      </div>

      <div className="space-y-3">
        {filtered.map(v => (
          <div key={v.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-[#0d9488] flex items-center justify-center text-white text-sm font-bold">{v.initials}</div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${v.isAvailable ? "bg-green-500" : "bg-gray-400"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#0f1b2d]">{v.name}</p>
              <p className="text-xs text-gray-400">{v.location.district} · {v.skills.length} skills</p>
              <div className="flex gap-1 mt-1">
                {v.skills.slice(0, 3).map(s => (
                  <span key={s} className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-full capitalize">{s.replace("_", " ")}</span>
                ))}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs font-bold text-[#0f1b2d]">{v.missionsCompleted} missions</p>
              <p className="text-[10px] text-gray-400">{v.rating}★ rating</p>
              <button
                onClick={() => toast.success(`Assigning mission to ${v.name}…`)}
                className="mt-2 text-xs font-semibold text-white px-2.5 py-1 rounded-lg hover:opacity-90"
                style={{ background: v.isAvailable ? "#0d9488" : "#9ca3af" }}
                disabled={!v.isAvailable}
              >
                {v.isAvailable ? "Assign" : "Busy"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Portal ──────────────────────────────────────────────────────────────
export default function NGOPortal({ onNavigate }: { onNavigate: (v: string) => void }) {
  const [activePage, setActivePage] = useState<NGOPage>("dashboard");
  const [notifs, setNotifs] = useState(NOTIFICATIONS);

  return (
    <PortalLayout
      navItems={NAV_ITEMS}
      activePage={activePage}
      onNavigate={p => setActivePage(p as NGOPage)}
      userName="BRAC Disaster Response"
      userRole="NGO Admin"
      userInitials="BR"
      portalLabel="NGO Portal"
      onLogout={() => onNavigate("landing")}
      notifications={notifs}
      onMarkRead={id => setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))}
    >
      {activePage === "dashboard"  && <NGODashboard />}
      {activePage === "campaigns"  && <CampaignsPage />}
      {activePage === "shelters"   && <ShelterMgmt />}
      {activePage === "inventory"  && <InventoryPage />}
      {activePage === "reports"    && <ReportsPage />}
      {activePage === "volunteers" && <VolunteersPage />}
    </PortalLayout>
  );
}
