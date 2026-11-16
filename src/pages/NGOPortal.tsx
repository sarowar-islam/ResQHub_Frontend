import { useState } from "react";
import {
  LayoutDashboard, Flag, Home, Package, BarChart2, Users,
  Plus, Edit3, Trash2, CheckCircle, Clock, Search,
  MapPin, Phone, TrendingUp, AlertTriangle, X,
  ChevronRight, Download, RefreshCw, Shield
} from "lucide-react";
import { toast } from "sonner";

import PortalLayout from "../components/PortalLayout";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { useSession } from "../context/SessionContext";
import { chartData, reliefDistribution, initialsOf } from "../lib/derive";
import { db, useDbRevision, usePersistedState, patchRecord, addToCollection, upsertRecord } from "../context/DataContext";
import MapView from "../components/MapView";
import type { Campaign, DisasterType, InventoryItem, InventoryStatus, NGO, Shelter } from "../types";

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

let meId = "";
const getMe = (): NGO =>
  db.ngos.find(n => n.id === meId) ?? {
    id: meId, name: "", initials: "", description: "", verified: false, location: "", contactEmail: "", contactPhone: "",
    totalRelief: 0, activeCampaigns: 0, volunteerCount: 0,
  };
const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a5f]";

// ─── Dashboard ───────────────────────────────────────────────────────────────
function NGODashboard() {
  const activeReqs = db.helpRequests.filter(r => r.status !== "completed" && r.status !== "cancelled");
  const availableVols = db.volunteers.filter(v => v.isAvailable).length;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#0f1b2d]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{getMe().name}</h2>
          <p className="text-sm text-gray-500 mt-0.5">Operations overview — {new Date().toLocaleDateString("en-BD", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
        {getMe().verified ? (
          <span className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-100 px-3 py-1.5 rounded-full border border-green-200">
            <Shield className="w-3.5 h-3.5" /> Verified NGO
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1.5 rounded-full border border-amber-200">
            <Clock className="w-3.5 h-3.5" /> Pending admin verification
          </span>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Campaigns",     value: db.campaigns.filter(c => c.status === "active").length.toString(), icon: Flag,        color: "#1e3a5f", change: "" },
          { label: "Volunteers Available",  value: `${availableVols}/${db.volunteers.length}`, icon: Users, color: "#0d9488", change: "" },
          { label: "Active Requests",      value: activeReqs.length.toString(), icon: AlertTriangle, color: "#f97316", change: `${activeReqs.filter(r=>r.priority==="critical").length} critical` },
          { label: "Requests Completed",  value: db.stats.completedRequests.toLocaleString(), icon: CheckCircle, color: "#16a34a", change: "" },
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
            <span className="text-[10px] text-gray-400">Last 7 days</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData()}>
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
              <Pie data={reliefDistribution()} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">
                {reliefDistribution().map((_, index) => (
                  <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {reliefDistribution().map((d, i) => (
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
          {db.campaigns.filter(c => c.status === "active").length === 0 && <p className="text-xs text-gray-400 bg-white rounded-2xl border border-gray-100 p-4">No active campaigns. Create one from the Campaigns tab.</p>}
          {db.campaigns.filter(c => c.status === "active").map(c => (
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

// ─── Campaigns ──────────────────────────────────────────────────────────────
const DISASTER_TYPES: DisasterType[] = ["flood", "cyclone", "landslide", "drought"];

function CampaignsPage() {
  const session = useSession();
  const [showCreate, setShowCreate] = useState(false);
  const [campaigns, setCampaigns] = usePersistedState("campaigns");
  const [form, setForm] = useState({ title: "", description: "", targetArea: "", totalNeeded: "100", disasterType: "flood" as DisasterType, days: "30" });

  const create = () => {
    if (!session.emailVerified) { toast.error("Please verify your email before creating campaigns."); return; }
    if (!form.title.trim()) { toast.error("Campaign title required."); return; }
    if (!form.targetArea.trim()) { toast.error("Target area required."); return; }
    const campaign: Campaign = {
      id: `camp-${Date.now()}`,
      title: form.title.trim(),
      description: form.description.trim(),
      ngoId: meId,
      targetArea: form.targetArea.trim(),
      status: "active",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + (Number(form.days) || 30) * 864e5).toISOString().slice(0, 10),
      assignedVolunteers: [],
      requestsHandled: 0,
      totalNeeded: Math.max(1, Number(form.totalNeeded) || 100),
      progress: 0,
      disasterType: form.disasterType,
    };
    setCampaigns(prev => [campaign, ...prev]);
    setForm({ title: "", description: "", targetArea: "", totalNeeded: "100", disasterType: "flood", days: "30" });
    setShowCreate(false);
    toast.success("Campaign created successfully.");
  };

  const setStatus = (id: string, status: Campaign["status"]) =>
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status } : c));

  const addProgress = (c: Campaign) => {
    const handled = Math.min(c.totalNeeded, c.requestsHandled + 1);
    const progress = Math.round((handled / c.totalNeeded) * 100);
    setCampaigns(prev => prev.map(x => x.id === c.id ? { ...x, requestsHandled: handled, progress, status: progress >= 100 ? "completed" : x.status } : x));
  };

  const assign = (c: Campaign, volunteerId: string) => {
    if (!volunteerId || c.assignedVolunteers.includes(volunteerId)) return;
    setCampaigns(prev => prev.map(x => x.id === c.id ? { ...x, assignedVolunteers: [...x.assignedVolunteers, volunteerId] } : x));
    toast.success("Volunteer assigned to campaign.");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#0f1b2d]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Campaign Management</h2>
          <p className="text-sm text-gray-500">{campaigns.length} total campaigns</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-semibold text-xs hover:opacity-90" style={{ background: "#1e3a5f" }}>
          <Plus className="w-3.5 h-3.5" /> New Campaign
        </button>
      </div>

      {showCreate && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-[#0f1b2d]">Create Campaign</p>
            <button onClick={() => setShowCreate(false)}><X className="w-4 h-4 text-gray-400" /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Campaign title" className={inputCls} />
            <input value={form.targetArea} onChange={e => setForm(f => ({ ...f, targetArea: e.target.value }))} placeholder="Target area (e.g. Sylhet Sadar)" className={inputCls} />
            <input value={form.totalNeeded} onChange={e => setForm(f => ({ ...f, totalNeeded: e.target.value }))} type="number" min={1} placeholder="Requests to handle" className={inputCls} />
            <input value={form.days} onChange={e => setForm(f => ({ ...f, days: e.target.value }))} type="number" min={1} placeholder="Duration (days)" className={inputCls} />
            <select value={form.disasterType} onChange={e => setForm(f => ({ ...f, disasterType: e.target.value as DisasterType }))} className={inputCls + " bg-white capitalize"}>
              {DISASTER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" rows={2} className={inputCls + " sm:col-span-2 resize-none"} />
          </div>
          <button onClick={create} className="px-4 py-2 rounded-xl text-white text-xs font-semibold hover:opacity-90" style={{ background: "#1e3a5f" }}>Create</button>
        </div>
      )}

      {campaigns.length === 0 && <p className="text-sm text-gray-400 bg-white rounded-2xl border border-gray-100 p-6 text-center">No campaigns yet. Create your first one above.</p>}

      <div className="space-y-4">
        {campaigns.map(c => (
          <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 pr-4">
                <p className="text-sm font-bold text-[#0f1b2d]">{c.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{c.description}</p>
              </div>
              <select value={c.status} onChange={e => setStatus(c.id, e.target.value as Campaign["status"])} className="text-[10px] font-bold px-2 py-1 rounded-lg border border-gray-200 bg-white capitalize">
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
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
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button onClick={() => addProgress(c)} className="text-xs font-semibold text-[#1e3a5f] hover:underline">+ Log a handled request</button>
                <select value="" onChange={e => assign(c, e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white">
                  <option value="">Assign volunteer…</option>
                  {db.volunteers.filter(v => !c.assignedVolunteers.includes(v.id)).map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Shelter Management ───────────────────────────────────────────────────────
function ShelterMgmt() {
  const [shelters, setShelters] = usePersistedState("shelters");
  const mine = shelters.filter(s => s.ngoId === meId);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", capacity: "", phone: "", medical: false, food: true });
  const [pin, setPin] = useState<{ lat: number; lng: number; label: string } | null>(null);

  const save = () => {
    if (!form.name.trim()) { toast.error("Shelter name is required."); return; }
    if (!(Number(form.capacity) > 0)) { toast.error("Enter a valid capacity."); return; }
    if (!pin) { toast.error("Choose the shelter location on the map."); return; }
    const shelter: Shelter = {
      id: `shelter-${Date.now()}`,
      name: form.name.trim(),
      location: { lat: pin.lat, lng: pin.lng, label: pin.label, district: pin.label.split(",").slice(-3, -2)[0]?.trim() ?? "" },
      capacity: Number(form.capacity),
      currentOccupancy: 0,
      facilities: [],
      hasMedical: form.medical,
      hasFood: form.food,
      contactPhone: form.phone.trim(),
      managedBy: getMe().name,
      ngoId: meId,
      status: "open",
      distance: 0,
    };
    setShelters(prev => [shelter, ...prev]);
    setForm({ name: "", capacity: "", phone: "", medical: false, food: true });
    setPin(null);
    setShowAdd(false);
    toast.success("Shelter added successfully.");
  };

  const setOccupancy = (s: Shelter, value: number) => {
    const occ = Math.max(0, Math.min(s.capacity, value));
    setShelters(prev => prev.map(x => x.id === s.id ? { ...x, currentOccupancy: occ, status: x.status === "closed" ? "closed" : occ >= x.capacity ? "full" : "open" } : x));
  };
  const toggleClosed = (s: Shelter) =>
    setShelters(prev => prev.map(x => x.id === s.id ? { ...x, status: x.status === "closed" ? (x.currentOccupancy >= x.capacity ? "full" : "open") : "closed" } : x));
  const remove = (s: Shelter) => {
    if (!confirm(`Delete ${s.name}?`)) return;
    setShelters(prev => prev.filter(x => x.id !== s.id));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#0f1b2d]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Shelter Management</h2>
          <p className="text-sm text-gray-500">{mine.length} shelters registered</p>
        </div>
        <button onClick={() => setShowAdd(v => !v)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-semibold text-xs hover:opacity-90" style={{ background: "#1e3a5f" }}>
          <Plus className="w-3.5 h-3.5" /> Add Shelter
        </button>
      </div>

      {showAdd && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-bold text-[#0f1b2d]">New Shelter Details</p>
          <div className="grid grid-cols-2 gap-3">
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Shelter name" className={inputCls} />
            <input value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} type="number" min={1} placeholder="Capacity" className={inputCls} />
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Contact phone" className={inputCls + " col-span-2"} />
          </div>
          <div className="flex gap-4 text-xs text-[#0f1b2d]">
            <label className="flex items-center gap-1.5"><input type="checkbox" checked={form.medical} onChange={e => setForm(f => ({ ...f, medical: e.target.checked }))} /> Medical care</label>
            <label className="flex items-center gap-1.5"><input type="checkbox" checked={form.food} onChange={e => setForm(f => ({ ...f, food: e.target.checked }))} /> Food available</label>
          </div>
          <MapView markers={[]} height="h-56" onSelectLocation={(label, point) => { if (point) setPin({ ...point, label }); }} />
          <button onClick={save} className="px-4 py-2 rounded-xl text-white text-xs font-semibold hover:opacity-90" style={{ background: "#1e3a5f" }}>Save Shelter</button>
        </div>
      )}

      {mine.length === 0 && <p className="text-sm text-gray-400 bg-white rounded-2xl border border-gray-100 p-6 text-center">No shelters yet. Add one so victims can find it.</p>}

      <div className="grid sm:grid-cols-2 gap-4">
        {mine.map(s => {
          const pct = Math.round((s.currentOccupancy / s.capacity) * 100);
          return (
            <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between mb-3">
                <p className="text-sm font-bold text-[#0f1b2d] leading-snug pr-3">{s.name}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${s.status === "open" ? "bg-green-100 text-green-700" : s.status === "full" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>{s.status}</span>
              </div>
              <p className="text-xs text-gray-400 flex items-center gap-1 mb-3"><MapPin className="w-3 h-3 shrink-0" /><span className="truncate">{s.location.label}</span></p>

              <div className="mb-3">
                <div className="flex justify-between text-[10px] text-gray-400 mb-1"><span>Occupancy</span><span>{s.currentOccupancy}/{s.capacity} ({pct}%)</span></div>
                <div className="h-2 bg-gray-100 rounded-full">
                  <div className={`h-2 rounded-full ${pct >= 100 ? "bg-red-500" : pct > 80 ? "bg-orange-400" : "bg-green-500"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <button onClick={() => setOccupancy(s, s.currentOccupancy - 1)} className="w-7 h-7 rounded-lg border border-gray-200 text-sm font-bold">−</button>
                  <input type="number" value={s.currentOccupancy} onChange={e => setOccupancy(s, Number(e.target.value))} className="w-20 text-center border border-gray-200 rounded-lg py-1 text-xs" />
                  <button onClick={() => setOccupancy(s, s.currentOccupancy + 1)} className="w-7 h-7 rounded-lg border border-gray-200 text-sm font-bold">+</button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3" />{s.contactPhone || "No phone"}</span>
                <div className="flex gap-3">
                  <button onClick={() => toggleClosed(s)} className="text-[#0d9488] font-medium hover:underline">{s.status === "closed" ? "Reopen" : "Close"}</button>
                  <button onClick={() => remove(s)} className="text-red-500 font-medium hover:underline">Delete</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Inventory ───────────────────────────────────────────────────────────
const statusOf = (qty: number, min: number): InventoryStatus => (qty <= min * 0.5 ? "critical" : qty <= min ? "low" : "adequate");

function InventoryPage() {
  const [inventory, setInventory] = usePersistedState("inventory");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", category: "food" as InventoryItem["category"], quantity: "", unit: "units", minimumStock: "", location: "" });

  const add = () => {
    if (!form.name.trim()) { toast.error("Item name is required."); return; }
    const quantity = Number(form.quantity), min = Number(form.minimumStock);
    if (!(quantity >= 0) || form.quantity === "") { toast.error("Enter a quantity."); return; }
    const item: InventoryItem = {
      id: `inv-${Date.now()}`, ngoId: meId, name: form.name.trim(), category: form.category, quantity, unit: form.unit.trim() || "units",
      lastUpdated: new Date().toISOString(), minimumStock: min > 0 ? min : 1, location: form.location.trim(), status: statusOf(quantity, min > 0 ? min : 1),
    };
    setInventory(prev => [item, ...prev]);
    setForm({ name: "", category: "food", quantity: "", unit: "units", minimumStock: "", location: "" });
    setShowAdd(false);
    toast.success("Inventory item added.");
  };

  const adjust = (item: InventoryItem, delta: number) => {
    const quantity = Math.max(0, item.quantity + delta);
    setInventory(prev => prev.map(i => i.id === item.id ? { ...i, quantity, lastUpdated: new Date().toISOString(), status: statusOf(quantity, i.minimumStock) } : i));
  };
  const remove = (item: InventoryItem) => {
    if (!confirm(`Remove ${item.name} from inventory?`)) return;
    setInventory(prev => prev.filter(i => i.id !== item.id));
  };

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
        <button onClick={() => setShowAdd(v => !v)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-semibold hover:opacity-90" style={{ background: "#1e3a5f" }}>
          <Plus className="w-3.5 h-3.5" /> Add Item
        </button>
      </div>

      {showAdd && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Item name" className={inputCls} />
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as InventoryItem["category"] }))} className={inputCls + " bg-white capitalize"}>
              {["food", "water", "medicine", "shelter", "clothing", "other"].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Warehouse / location" className={inputCls} />
            <input value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} type="number" min={0} placeholder="Quantity" className={inputCls} />
            <input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="Unit (kg, packs…)" className={inputCls} />
            <input value={form.minimumStock} onChange={e => setForm(f => ({ ...f, minimumStock: e.target.value }))} type="number" min={1} placeholder="Minimum stock" className={inputCls} />
          </div>
          <button onClick={add} className="px-4 py-2 rounded-xl text-white text-xs font-semibold hover:opacity-90" style={{ background: "#1e3a5f" }}>Save Item</button>
        </div>
      )}

      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus-within:border-[#1e3a5f] transition-all">
        <Search className="w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search inventory…" className="flex-1 text-sm bg-transparent border-none outline-none" />
      </div>

      {inventory.some(i => i.status === "critical") && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-800">Critical Stock Alert</p>
            <p className="text-xs text-red-600 mt-0.5">{inventory.filter(i => i.status === "critical").map(i => i.name).join(", ")} are critically low. Reorder immediately.</p>
          </div>
        </div>
      )}

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
              {filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No inventory items yet.</td></tr>}
              {filtered.map(item => (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-[#0f1b2d]">{item.name}</td>
                  <td className="px-4 py-3 capitalize text-gray-500">{item.category}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => adjust(item, -1)} className="w-5 h-5 rounded border border-gray-200 font-bold leading-none">−</button>
                      <span className="font-bold text-[#0f1b2d]">{item.quantity.toLocaleString()}</span>
                      <button onClick={() => adjust(item, 1)} className="w-5 h-5 rounded border border-gray-200 font-bold leading-none">+</button>
                      <span className="text-gray-400">{item.unit}</span>
                    </div>
                    <div className="mt-1 h-1 bg-gray-100 rounded-full w-24">
                      <div className={`h-1 rounded-full ${item.status === "critical" ? "bg-red-500" : item.status === "low" ? "bg-yellow-400" : "bg-green-500"}`} style={{ width: `${Math.min((item.quantity / (item.minimumStock * 4)) * 100, 100)}%` }} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{item.location}</td>
                  <td className="px-4 py-3 text-gray-400">{new Date(item.lastUpdated).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColor[item.status]}`}>{item.status.charAt(0).toUpperCase() + item.status.slice(1)}</span>
                  </td>
                  <td className="px-4 py-3"><button onClick={() => remove(item)} className="text-red-500 hover:underline font-medium">Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Reports ───────────────────────────────────────────────────────────────
function ReportsPage() {
  const reqs = db.helpRequests;
  const completed = reqs.filter(r => r.status === "completed");
  const rate = reqs.length ? Math.round((completed.length / reqs.length) * 100) : 0;
  const usedShelters = db.shelters.filter(s => s.ngoId === meId);
  const capacity = usedShelters.reduce((n, s) => n + s.capacity, 0);
  const occupied = usedShelters.reduce((n, s) => n + s.currentOccupancy, 0);
  const weekAgo = Date.now() - 7 * 864e5;
  const thisWeek = reqs.filter(r => new Date(r.createdAt).getTime() >= weekAgo).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#0f1b2d]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Reports & Analytics</h2>
          <p className="text-sm text-gray-500">{new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })} · live data</p>
        </div>
        <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50">
          <Download className="w-3.5 h-3.5" /> Print / Save PDF
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-bold text-[#0f1b2d] mb-4">Requests, completions and volunteers (last 7 days)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData()}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} />
            <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} allowDecimals={false} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5ecf3" }} />
            <Bar dataKey="requests" fill="#1e3a5f" radius={[4, 4, 0, 0]} name="Requests" />
            <Bar dataKey="completed" fill="#0d9488" radius={[4, 4, 0, 0]} name="Completed" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Requests", value: reqs.length.toLocaleString(), change: `${thisWeek} in the last 7 days` },
          { label: "Completion Rate", value: `${rate}%`, change: `${completed.length} completed` },
          { label: "Critical Open", value: String(db.stats.criticalRequests), change: "needs attention" },
          { label: "Registered Volunteers", value: String(db.volunteers.length), change: `${db.volunteers.filter(v => v.isAvailable).length} available` },
          { label: "Shelter Capacity Used", value: capacity ? `${Math.round((occupied / capacity) * 100)}%` : "—", change: `${occupied}/${capacity} places` },
          { label: "Your Shelters", value: String(usedShelters.length), change: `${usedShelters.filter(s => s.status === "open").length} open` },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xl font-bold text-[#0f1b2d]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            <p className="text-[10px] text-gray-400 font-medium mt-1.5">{s.change}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Volunteers ──────────────────────────────────────────────────────────────
function VolunteersPage() {
  const [search, setSearch] = useState("");
  const [assigning, setAssigning] = useState<string | null>(null);
  const open = db.helpRequests.filter(r => r.status === "pending" || r.status === "accepted");
  const filtered = db.volunteers.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.location.label.toLowerCase().includes(search.toLowerCase())
  );

  const assign = (volunteerId: string, requestId: string) => {
    const v = db.volunteers.find(x => x.id === volunteerId);
    const req = db.helpRequests.find(r => r.id === requestId);
    if (!v || !req) return;
    const now = new Date().toISOString();
    upsertRecord("helpRequests", {
      ...req, status: "assigned", assignedVolunteer: v.name, assignedVolunteerId: v.id, ngoId: meId, updatedAt: now,
      timeline: [...req.timeline, { status: "assigned", timestamp: now, note: `Assigned to ${v.name} by ${getMe().name}`, actor: getMe().name }],
    });
    addToCollection("notifications", { id: `n-${Date.now()}-v`, userId: v.id, type: "mission", title: "New mission assigned", message: `${getMe().name} assigned you a ${req.type} request.`, timestamp: now, read: false, priority: req.priority });
    if (req.ownerId) addToCollection("notifications", { id: `n-${Date.now()}-o`, userId: req.ownerId, type: "mission", title: "A volunteer is on the way", message: `${v.name} was assigned to your ${req.type} request.`, timestamp: now, read: false });
    setAssigning(null);
    toast.success(`Mission assigned to ${v.name}.`);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[#0f1b2d]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Volunteer Management</h2>
        <p className="text-sm text-gray-500">{db.volunteers.filter(v => v.isAvailable).length} available now · {db.volunteers.length} total · {open.length} open requests</p>
      </div>

      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus-within:border-[#1e3a5f] transition-all">
        <Search className="w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search volunteers…" className="flex-1 text-sm bg-transparent border-none outline-none" />
      </div>

      {filtered.length === 0 && <p className="text-sm text-gray-400 bg-white rounded-2xl border border-gray-100 p-6 text-center">No volunteers have registered yet.</p>}

      <div className="space-y-3">
        {filtered.map(v => (
          <div key={v.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-[#0d9488] flex items-center justify-center text-white text-sm font-bold">{v.initials || initialsOf(v.name)}</div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${v.isAvailable ? "bg-green-500" : "bg-gray-400"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#0f1b2d]">{v.name}</p>
                <p className="text-xs text-gray-400 truncate">{v.location.label} · {v.skills.length} skills</p>
                <div className="flex gap-1 mt-1">
                  {v.skills.slice(0, 3).map(s => (
                    <span key={s} className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-full capitalize">{s.replace("_", " ")}</span>
                  ))}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-bold text-[#0f1b2d]">{v.missionsCompleted} missions</p>
                <p className="text-[10px] text-gray-400">{v.rating ? `${v.rating}★ rating` : "No rating yet"}</p>
                <button
                  onClick={() => setAssigning(assigning === v.id ? null : v.id)}
                  className="mt-2 text-xs font-semibold text-white px-2.5 py-1 rounded-lg hover:opacity-90 disabled:opacity-60"
                  style={{ background: v.isAvailable && open.length ? "#0d9488" : "#9ca3af" }}
                  disabled={!v.isAvailable || open.length === 0}
                >
                  {!v.isAvailable ? "Busy" : open.length === 0 ? "No open requests" : "Assign"}
                </button>
              </div>
            </div>
            {assigning === v.id && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-[11px] font-semibold text-[#0f1b2d] mb-1.5">Choose a request for {v.name}</p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {open.map(r => (
                    <button key={r.id} onClick={() => assign(v.id, r.id)} className="w-full text-left p-2.5 rounded-xl border border-gray-100 hover:border-[#0d9488] hover:bg-teal-50/40 transition-colors">
                      <p className="text-xs font-semibold text-[#0f1b2d] capitalize">{r.type} · {r.priority} — {r.victimName}</p>
                      <p className="text-[10px] text-gray-500 truncate">{r.location.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Portal ─────────────────────────────────────────────────────────────
export default function NGOPortal({ onNavigate }: { onNavigate: (v: string) => void }) {
  useDbRevision();
  const session = useSession();
  meId = session.profile!.id;
  const [activePage, setActivePage] = useState<NGOPage>("dashboard");
  const [notifs, setNotifs] = usePersistedState("notifications");

  return (
    <PortalLayout
      navItems={NAV_ITEMS}
      activePage={activePage}
      onNavigate={p => setActivePage(p as NGOPage)}
      userName={session.name}
      userRole="NGO Admin"
      userInitials={initialsOf(session.name)}
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
