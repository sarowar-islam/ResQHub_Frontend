import { useState } from "react";
import {
  LayoutDashboard, ClipboardList, History, User,
  CheckCircle, XCircle, Navigation, MapPin, Phone,
  Clock, Star, Award, TrendingUp, ToggleLeft, ToggleRight,
  ChevronRight, Search, Filter, Camera, FileText,
  Heart, Anchor, Stethoscope, Car, ChefHat, Radio,
  LifeBuoy, Activity, Users
} from "lucide-react";
import { toast } from "sonner";
import { HELP_REQUESTS, VOLUNTEERS, NOTIFICATIONS } from "../data/mockData";
import PortalLayout from "../components/PortalLayout";
import MapView from "../components/MapView";
import { MAP_MARKERS } from "../data/mockData";

type VolunteerPage = "dashboard" | "missions" | "history" | "profile";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard",  icon: LayoutDashboard },
  { id: "missions",  label: "Missions",   icon: ClipboardList },
  { id: "history",   label: "My History", icon: History },
  { id: "profile",   label: "My Profile", icon: User },
];

const SKILL_CONFIG = {
  boat:          { icon: Anchor,      label: "Boat Rescue",    color: "#1e3a5f" },
  medical:       { icon: Stethoscope, label: "Medical",        color: "#dc2626" },
  driving:       { icon: Car,         label: "Driving",        color: "#6b7280" },
  cooking:       { icon: ChefHat,     label: "Cooking",        color: "#f97316" },
  search_rescue: { icon: LifeBuoy,    label: "Search & Rescue",color: "#0d9488" },
  first_aid:     { icon: Heart,       label: "First Aid",      color: "#dc2626" },
  communication: { icon: Radio,       label: "Communication",  color: "#7c3aed" },
};

const PRIORITY_CONFIG = {
  critical: { label: "Critical", color: "bg-red-100 text-red-700 border-red-200" },
  high:     { label: "High",     color: "bg-orange-100 text-orange-700 border-orange-200" },
  medium:   { label: "Medium",   color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  low:      { label: "Low",      color: "bg-gray-100 text-gray-600 border-gray-200" },
};

const TYPE_COLOR: Record<string, string> = {
  food: "#f97316", water: "#0d9488", medicine: "#7c3aed",
  medical: "#dc2626", rescue: "#dc2626", shelter: "#1e3a5f", other: "#6b7280",
};

const me = VOLUNTEERS[0]; // Karim Ahmed

// ─── Dashboard ───────────────────────────────────────────────────────────────
function VolunteerDashboard({ isAvailable, setIsAvailable }: { isAvailable: boolean; setIsAvailable: (v: boolean) => void }) {
  const pending = HELP_REQUESTS.filter(r => r.status === "pending" || r.status === "accepted");
  const assigned = HELP_REQUESTS.filter(r => r.status === "assigned");

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-[#1e3a5f] rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-blue-200 mb-1">Welcome back,</p>
            <h2 className="text-xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{me.name}</h2>
            <p className="text-xs text-blue-300 mt-0.5">Volunteer · {me.location.label}</p>
          </div>
          {/* Availability toggle */}
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={() => {
                const next = !isAvailable;
                setIsAvailable(next);
                toast[next ? "success" : "info"](next ? "You are now available for missions." : "You are now offline.");
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${isAvailable ? "bg-emerald-500 text-white" : "bg-white/10 text-blue-200"}`}
            >
              {isAvailable ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              {isAvailable ? "Available" : "Offline"}
            </button>
            <p className="text-[10px] text-blue-300">{isAvailable ? "You can receive missions" : "Missions paused"}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          {[
            { label: "Missions Today", value: "2" },
            { label: "Hours This Week", value: "18" },
            { label: "Rating", value: `${me.rating} ★` },
          ].map(s => (
            <div key={s.label} className="bg-white/8 rounded-xl px-3 py-2.5 text-center">
              <p className="text-base font-bold text-white">{s.value}</p>
              <p className="text-[10px] text-blue-300">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Assigned missions */}
      {assigned.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-[#0f1b2d] mb-3">Active Missions</h3>
          {assigned.map(req => (
            <div key={req.id} className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <LifeBuoy className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-bold text-amber-800 capitalize">{req.type} Request — {req.victimName}</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">{req.priority.toUpperCase()}</span>
                </div>
                <p className="text-xs text-amber-700 mb-2">{req.description.slice(0, 80)}…</p>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-amber-600 flex items-center gap-1"><MapPin className="w-3 h-3" />{req.location.label}</span>
                  <button onClick={() => toast.success("Navigation started!")} className="text-xs font-semibold text-white px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 flex items-center gap-1">
                    <Navigation className="w-3 h-3" /> Navigate
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Map */}
      <div>
        <h3 className="text-sm font-bold text-[#0f1b2d] mb-3">Nearby Requests Map</h3>
        <MapView markers={MAP_MARKERS} height="h-64" />
      </div>

      {/* Nearby requests */}
      <div>
        <h3 className="text-sm font-bold text-[#0f1b2d] mb-3">Nearby Emergency Requests ({pending.length})</h3>
        <div className="space-y-3">
          {pending.slice(0, 3).map(req => (
            <div key={req.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: (TYPE_COLOR[req.type] || "#6b7280") + "20" }}>
                <LifeBuoy className="w-4 h-4" style={{ color: TYPE_COLOR[req.type] || "#6b7280" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-xs font-bold text-[#0f1b2d] capitalize">{req.type} — {req.priority} priority</p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${PRIORITY_CONFIG[req.priority].color}`}>{PRIORITY_CONFIG[req.priority].label}</span>
                </div>
                <p className="text-xs text-gray-500 truncate">{req.description.slice(0, 70)}…</p>
                <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" />{req.location.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Missions ─────────────────────────────────────────────────────────────────
function Missions() {
  const [view, setView] = useState<"list" | "map">("list");
  const [requests, setRequests] = useState(HELP_REQUESTS.filter(r => r.status === "pending" || r.status === "accepted"));
  const [selected, setSelected] = useState<typeof HELP_REQUESTS[0] | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);
  const [report, setReport] = useState("");

  const accept = (id: string) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: "assigned" as const } : r));
    toast.success("Mission accepted! Navigate to location.");
  };

  const reject = (id: string) => {
    setRequests(prev => prev.filter(r => r.id !== id));
    toast.info("Mission declined.");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#0f1b2d]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Missions</h2>
          <p className="text-sm text-gray-500">{requests.length} requests awaiting response</p>
        </div>
        <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
          {(["list", "map"] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${view === v ? "bg-white shadow-sm text-[#1e3a5f]" : "text-gray-500"}`}
            >
              {v === "list" ? "List View" : "Map View"}
            </button>
          ))}
        </div>
      </div>

      {view === "map" && <MapView markers={MAP_MARKERS.filter(m => m.type === "victim")} height="h-72" />}

      {view === "list" && (
        <div className="space-y-4">
          {requests.map(req => {
            const isCompleting = completing === req.id;
            return (
              <div key={req.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: (TYPE_COLOR[req.type] || "#6b7280") + "15" }}>
                        <LifeBuoy className="w-5 h-5" style={{ color: TYPE_COLOR[req.type] || "#6b7280" }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-bold text-[#0f1b2d] capitalize">{req.type} Request</p>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${PRIORITY_CONFIG[req.priority].color}`}>{req.priority.toUpperCase()}</span>
                        </div>
                        <p className="text-xs text-gray-500">{req.victimName} · {req.victimPhone}</p>
                      </div>
                    </div>
                    <button onClick={() => setSelected(selected?.id === req.id ? null : req)} className="text-[#0d9488] hover:underline text-xs font-medium">
                      {selected?.id === req.id ? "Less" : "Details"}
                    </button>
                  </div>

                  <p className="text-xs text-gray-600 mb-3 leading-relaxed">{req.description}</p>

                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{req.location.label}</span>
                    <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(req.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>

                  {selected?.id === req.id && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-xl space-y-2 border border-gray-100">
                      <p className="text-xs font-semibold text-[#0f1b2d]">Victim Details</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-gray-400">Phone:</span> <span className="font-medium">{req.victimPhone}</span></div>
                        <div><span className="text-gray-400">District:</span> <span className="font-medium">{req.location.district}</span></div>
                        <div><span className="text-gray-400">Requested:</span> <span className="font-medium">{new Date(req.createdAt).toLocaleString()}</span></div>
                        <div><span className="text-gray-400">Priority:</span> <span className="font-medium capitalize">{req.priority}</span></div>
                      </div>
                    </div>
                  )}

                  {req.status !== "assigned" ? (
                    <div className="flex gap-2">
                      <button onClick={() => accept(req.id)} className="flex-1 py-2.5 rounded-xl text-white font-semibold text-xs transition-all hover:opacity-90 flex items-center justify-center gap-1.5" style={{ background: "#0d9488" }}>
                        <CheckCircle className="w-3.5 h-3.5" /> Accept Mission
                      </button>
                      <button onClick={() => reject(req.id)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-xs hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5" /> Decline
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <button onClick={() => toast.success("Navigation started.")} className="flex-1 py-2.5 rounded-xl text-white font-semibold text-xs hover:opacity-90 flex items-center justify-center gap-1.5" style={{ background: "#1e3a5f" }}>
                          <Navigation className="w-3.5 h-3.5" /> Navigate
                        </button>
                        <button onClick={() => toast.success(`Calling ${req.victimName}…`)} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold text-xs hover:bg-gray-200 flex items-center justify-center gap-1.5">
                          <Phone className="w-3.5 h-3.5" /> Call Victim
                        </button>
                      </div>
                      <button
                        onClick={() => setCompleting(isCompleting ? null : req.id)}
                        className="w-full py-2.5 rounded-xl border border-green-300 text-green-700 font-semibold text-xs hover:bg-green-50 flex items-center justify-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" /> {isCompleting ? "Cancel" : "Complete Mission"}
                      </button>
                      {isCompleting && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-xl space-y-3">
                          <p className="text-xs font-bold text-green-800">Mission Completion Report</p>
                          <textarea
                            value={report}
                            onChange={e => setReport(e.target.value)}
                            placeholder="Describe what was accomplished…"
                            rows={3}
                            className="w-full text-xs border border-green-200 rounded-xl px-3 py-2 focus:outline-none focus:border-green-400 resize-none bg-white"
                          />
                          <button
                            onClick={() => {
                              if (!report.trim()) { toast.error("Please write a report."); return; }
                              setRequests(prev => prev.filter(r => r.id !== req.id));
                              setCompleting(null);
                              toast.success("Mission completed! Great work.");
                            }}
                            className="w-full py-2 rounded-xl text-white text-xs font-semibold bg-green-600 hover:bg-green-700"
                          >
                            Submit & Complete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {requests.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <CheckCircle className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-400">No pending missions right now</p>
              <p className="text-xs text-gray-400 mt-1">New requests will appear here when available.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── History ──────────────────────────────────────────────────────────────────
function VolunteerHistory() {
  const completed = HELP_REQUESTS.filter(r => r.status === "completed");
  const leaderboard = VOLUNTEERS.sort((a, b) => b.missionsCompleted - a.missionsCompleted);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Missions Completed", value: me.missionsCompleted, icon: CheckCircle, color: "#16a34a" },
          { label: "Hours Served", value: me.hoursServed, icon: Clock, color: "#1e3a5f" },
          { label: "Rating", value: `${me.rating}★`, icon: Star, color: "#f59e0b" },
          { label: "District Rank", value: "#4", icon: TrendingUp, color: "#0d9488" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
              <Icon className="w-5 h-5 mx-auto mb-2" style={{ color: s.color }} />
              <p className="text-xl font-bold text-[#0f1b2d]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.value}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Badges */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-bold text-[#0f1b2d] mb-4">Badges Earned</h3>
        <div className="flex flex-wrap gap-2">
          {me.badges.map(badge => (
            <div key={badge} className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
              <Award className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-semibold text-amber-700">{badge}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Completed missions */}
      <div>
        <h3 className="text-sm font-bold text-[#0f1b2d] mb-3">Completed Missions</h3>
        <div className="space-y-3">
          {completed.map(req => (
            <div key={req.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-[#0f1b2d] capitalize">{req.type} Request — {req.victimName}</p>
                <p className="text-[10px] text-gray-400">{req.location.label} · {new Date(req.updatedAt).toLocaleDateString()}</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">Completed</span>
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-bold text-[#0f1b2d] mb-4">Volunteer Leaderboard</h3>
        <div className="space-y-2">
          {leaderboard.map((v, i) => (
            <div key={v.id} className={`flex items-center gap-3 p-3 rounded-xl ${v.id === me.id ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50"} transition-colors`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-amber-400 text-white" : i === 1 ? "bg-gray-300 text-gray-700" : i === 2 ? "bg-orange-300 text-white" : "bg-gray-100 text-gray-500"}`}>
                {i + 1}
              </span>
              <div className="w-7 h-7 rounded-full bg-[#1e3a5f] flex items-center justify-center text-white text-[10px] font-bold">
                {v.initials}
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-[#0f1b2d]">{v.name} {v.id === me.id && <span className="text-[10px] text-blue-500">(You)</span>}</p>
                <p className="text-[10px] text-gray-400">{v.location.district}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-[#0f1b2d]">{v.missionsCompleted}</p>
                <p className="text-[10px] text-gray-400">missions</p>
              </div>
              <div className="flex items-center gap-0.5">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span className="text-xs font-medium text-[#0f1b2d]">{v.rating}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Profile ──────────────────────────────────────────────────────────────────
function VolunteerProfile() {
  return (
    <div className="max-w-xl mx-auto space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-[#0d9488] flex items-center justify-center text-white text-lg font-bold">KA</div>
          <div>
            <p className="text-base font-bold text-[#0f1b2d]">{me.name}</p>
            <p className="text-xs text-gray-500">{me.location.label} · Joined {me.joinedAt}</p>
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-xs font-bold text-[#0f1b2d]">{me.rating}</span>
              <span className="text-[10px] text-gray-400">rating · {me.missionsCompleted} missions</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          {[
            { label: "Phone", value: me.phone },
            { label: "Email", value: me.email },
            { label: "District", value: me.location.district },
            { label: "Hours Served", value: `${me.hoursServed} hours` },
          ].map(f => (
            <div key={f.label}>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">{f.label}</p>
              <p className="text-sm font-medium text-[#0f1b2d]">{f.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Skills */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-bold text-[#0f1b2d] mb-3">Skills</h3>
        <div className="flex flex-wrap gap-2">
          {me.skills.map(skill => {
            const cfg = SKILL_CONFIG[skill];
            const Icon = cfg.icon;
            return (
              <div key={skill} className="flex items-center gap-2 px-3 py-2 rounded-xl border" style={{ borderColor: cfg.color + "40", background: cfg.color + "10" }}>
                <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                <span className="text-xs font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Languages */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-bold text-[#0f1b2d] mb-3">Languages</h3>
        <div className="flex flex-wrap gap-2">
          {me.languages.map(lang => (
            <span key={lang} className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full font-medium">{lang}</span>
          ))}
        </div>
      </div>

      {/* Availability schedule */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-bold text-[#0f1b2d] mb-3">Availability Schedule</h3>
        <div className="space-y-2">
          {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day, i) => (
            <div key={day} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
              <span className="text-xs font-medium text-[#0f1b2d] w-24">{day}</span>
              <div className="flex items-center gap-2">
                {i < 5 ? (
                  <span className="text-xs text-gray-500">8:00 AM – 8:00 PM</span>
                ) : (
                  <span className="text-xs text-gray-400">All day</span>
                )}
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${i < 5 ? "bg-green-100 text-green-700" : "bg-teal-100 text-teal-700"}`}>
                  {i < 5 ? "Weekday" : "Weekend"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Portal ──────────────────────────────────────────────────────────────
export default function VolunteerPortal({ onNavigate }: { onNavigate: (v: string) => void }) {
  const [activePage, setActivePage] = useState<VolunteerPage>("dashboard");
  const [isAvailable, setIsAvailable] = useState(true);
  const [notifs, setNotifs] = useState(NOTIFICATIONS);

  return (
    <PortalLayout
      navItems={NAV_ITEMS}
      activePage={activePage}
      onNavigate={p => setActivePage(p as VolunteerPage)}
      userName="Karim Ahmed"
      userRole="Volunteer"
      userInitials="KA"
      portalLabel="Volunteer Portal"
      onLogout={() => onNavigate("landing")}
      notifications={notifs}
      onMarkRead={id => setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))}
    >
      {activePage === "dashboard" && <VolunteerDashboard isAvailable={isAvailable} setIsAvailable={setIsAvailable} />}
      {activePage === "missions"  && <Missions />}
      {activePage === "history"   && <VolunteerHistory />}
      {activePage === "profile"   && <VolunteerProfile />}
    </PortalLayout>
  );
}
