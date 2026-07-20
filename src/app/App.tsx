import { useState } from "react";
import { Toaster } from "sonner";
import { Shield, ChevronDown, X } from "lucide-react";
import Landing from "../pages/Landing";
import Auth from "../pages/Auth";
import VictimPortal from "../pages/VictimPortal";
import VolunteerPortal from "../pages/VolunteerPortal";
import NGOPortal from "../pages/NGOPortal";
import AdminPortal from "../pages/AdminPortal";

type AppView = "landing" | "login" | "signup" | "victim" | "volunteer" | "ngo" | "admin";

const DEMO_PORTALS: { label: string; view: AppView; color: string; desc: string }[] = [
  { label: "Victim Portal",    view: "victim",    color: "#dc2626", desc: "Request & track help" },
  { label: "Volunteer Portal", view: "volunteer", color: "#0d9488", desc: "Accept & complete missions" },
  { label: "NGO Portal",       view: "ngo",       color: "#1e3a5f", desc: "Manage operations" },
  { label: "Admin Dashboard",  view: "admin",     color: "#7c3aed", desc: "System control" },
  { label: "Public Site",      view: "landing",   color: "#6b7280", desc: "Landing page" },
  { label: "Auth Pages",       view: "login",     color: "#f97316", desc: "Login & signup" },
];

function DemoSwitcher({ current, onSwitch }: { current: AppView; onSwitch: (v: AppView) => void }) {
  const [open, setOpen] = useState(false);

  const portalViews: AppView[] = ["victim", "volunteer", "ngo", "admin"];
  const isInPortal = portalViews.includes(current);

  return (
    <div className="fixed bottom-5 right-5 z-[100]">
      {open && (
        <>
          <div className="fixed inset-0 z-[-1]" onClick={() => setOpen(false)} />
          <div className="absolute bottom-14 right-0 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden w-56 mb-2">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="text-xs font-bold text-[#0f1b2d]">Demo Switcher</p>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-2">
              {DEMO_PORTALS.map(p => (
                <button
                  key={p.view}
                  onClick={() => { onSwitch(p.view); setOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all hover:bg-gray-50 ${current === p.view ? "bg-gray-50" : ""}`}
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
                  <div>
                    <p className="text-xs font-semibold text-[#0f1b2d]">{p.label}</p>
                    <p className="text-[10px] text-gray-400">{p.desc}</p>
                  </div>
                  {current === p.view && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#0d9488]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-white text-xs font-semibold transition-all hover:scale-[1.03] active:scale-100"
        style={{ background: "#1e3a5f" }}
        title="Switch between demo portals"
      >
        <Shield className="w-3.5 h-3.5" />
        <span className="hidden sm:block">Demo Mode</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<AppView>("landing");

  const navigate = (v: string) => setView(v as AppView);

  return (
    <div className="min-h-screen" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <Toaster
        position="top-right"
        richColors
        toastOptions={{
          style: {
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontSize: "13px",
            borderRadius: "12px",
          },
          duration: 3500,
        }}
      />

      {view === "landing"   && <Landing onNavigate={navigate} />}
      {view === "login"     && <Auth initialMode="login"  onNavigate={navigate} />}
      {view === "signup"    && <Auth initialMode="signup" onNavigate={navigate} />}
      {view === "victim"    && <VictimPortal    onNavigate={navigate} />}
      {view === "volunteer" && <VolunteerPortal onNavigate={navigate} />}
      {view === "ngo"       && <NGOPortal       onNavigate={navigate} />}
      {view === "admin"     && <AdminPortal     onNavigate={navigate} />}

      <DemoSwitcher current={view} onSwitch={setView} />
    </div>
  );
}
