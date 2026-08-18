import { useState, useEffect } from "react";
import {
  Shield, Menu, X, AlertTriangle, ArrowRight, Users, Heart,
  Building2, MapPin, Phone, ChevronRight, CheckCircle, Star,
  Waves, Wind, Mountain, Clock, Globe, Activity, Package,
  LifeBuoy, Bell, Zap, Map, FileText, Bot
} from "lucide-react";
import {
  ALERTS, STATS, TESTIMONIALS, NEWS, EMERGENCY_CONTACTS,
  PARTNER_NAMES, MAP_MARKERS
} from "../data/mockData";
import MapView from "../components/MapView";
import type { UserRole } from "./Auth";

type AppView = string;
type LandingPage = "Home" | "About" | "Portals" | "Emergency Contacts" | "News";
type AuthMode = "login" | "signup";

const NAV_ITEMS: LandingPage[] = ["Home", "About", "Portals", "Emergency Contacts", "News"];

const severityStyles = {
  extreme: { bg: "bg-red-600", text: "EXTREME", dot: "bg-red-300" },
  severe:  { bg: "bg-orange-500", text: "SEVERE",  dot: "bg-orange-300" },
  moderate:{ bg: "bg-yellow-500", text: "MODERATE",dot: "bg-yellow-200" },
  minor:   { bg: "bg-blue-500",   text: "MINOR",   dot: "bg-blue-300" },
};

const disasterIcons = {
  flood: Waves,
  cyclone: Wind,
  landslide: Mountain,
  drought: Activity,
};

function formatNumber(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1) + "K+";
  return n.toString();
}

export default function Landing({ onNavigate }: { onNavigate: (v: string, role?: UserRole, mode?: AuthMode) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [tickerIndex, setTickerIndex] = useState(0);
  const [activePage, setActivePage] = useState<LandingPage>("Home");
  const [isAlertExpanded, setIsAlertExpanded] = useState(false);

  const activeAlert = ALERTS[tickerIndex];

  useEffect(() => {
    if (isAlertExpanded) return;

    const t = setInterval(() => setTickerIndex(i => (i + 1) % ALERTS.length), 4000);
    return () => clearInterval(t);
  }, [isAlertExpanded]);

  const renderPageContent = () => {
    if (activePage === "About") {
      return (
        <main className="bg-[#f3f7fb]">
          <section className="bg-[#0f1b2d] text-white py-20">
            <div className="max-w-7xl mx-auto px-4">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#5eead4] mb-4">About ResQHub</p>
              <h1 className="text-4xl lg:text-5xl font-extrabold mb-5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Helping communities respond before the next crisis hits.</h1>
              <p className="max-w-2xl text-base text-slate-300 leading-relaxed">ResQHub connects urgent requests, trained volunteers, local shelters, and NGO partners in one transparent response system built for fast, trusted action.</p>
            </div>
          </section>

          <section className="max-w-7xl mx-auto px-4 py-16">
            <div className="grid lg:grid-cols-3 gap-6 mb-10">
              {[
                { title: "Mission", text: "Reduce response delays by turning local need into immediate action with clear coordination and trusted communication." },
                { title: "Vision", text: "Build a resilient emergency network where volunteers, NGOs, and families can move from panic to coordinated care quickly." },
                { title: "Approach", text: "Unify requests, shelter capacity, logistics, and communication around a single live operations map." }
              ].map(item => (
                <div key={item.title} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <p className="text-sm font-bold text-[#0f1b2d] mb-3">{item.title}</p>
                  <p className="text-sm leading-relaxed text-slate-600">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { label: "People reached", value: "1.2M+" },
                { label: "Volunteer response time", value: "12 mins" },
                { label: "Operational districts", value: "64" },
                { label: "Shelters coordinated", value: "234" }
              ].map(item => (
                <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
                  <p className="text-3xl font-extrabold text-[#0f1b2d] mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{item.value}</p>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">{item.label}</p>
                </div>
              ))}
            </div>
          </section>
        </main>
      );
    }

    if (activePage === "Portals") {
      return (
        <main className="bg-[#f3f7fb]">
          <section className="bg-[#0f1b2d] text-white py-20">
            <div className="max-w-7xl mx-auto px-4">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#5eead4] mb-4">Portal Directory</p>
              <h1 className="text-4xl lg:text-5xl font-extrabold mb-5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Choose the role that matches your response.</h1>
            </div>
          </section>

          <section className="max-w-7xl mx-auto px-4 py-16">
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
              {[
                { name: "Victim Portal", color: "#dc2626", desc: "Request help, track relief, and update your situation in real time.", role: "victim" as UserRole, action: () => onNavigate("signup", "victim", "signup") },
                { name: "Volunteer Portal", color: "#0d9488", desc: "Accept assignments, coordinate routes, and join active emergency missions.", role: "volunteer" as UserRole, action: () => onNavigate("signup", "volunteer", "signup") },
                { name: "NGO Portal", color: "#1e3a5f", desc: "Manage shelters, volunteers, inventory, and district response operations.", role: "ngo" as UserRole, action: () => onNavigate("signup", "ngo", "signup") }
              ].map(portal => (
                <div key={portal.name} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm transition-transform hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: `${portal.color}15` }}>
                    <div className="w-3 h-3 rounded-full" style={{ background: portal.color }} />
                  </div>
                  <h3 className="text-lg font-bold text-[#0f1b2d] mb-2">{portal.name}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-5">{portal.desc}</p>
                  <button onClick={portal.action} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: portal.color }}>Open portal</button>
                </div>
              ))}
            </div>
          </section>
        </main>
      );
    }

    if (activePage === "Emergency Contacts") {
      return (
        <main className="bg-[#f3f7fb]">
          <section className="bg-[#0f1b2d] text-white py-20">
            <div className="max-w-7xl mx-auto px-4">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#5eead4] mb-4">Emergency Contacts</p>
              <h1 className="text-4xl lg:text-5xl font-extrabold mb-5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Critical response numbers when every second matters.</h1>
            </div>
          </section>

          <section className="max-w-7xl mx-auto px-4 py-16">
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
              {EMERGENCY_CONTACTS.map(contact => (
                <div key={contact.name} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#dffaf6] flex items-center justify-center"><Phone className="w-4 h-4 text-[#0d9488]" /></div>
                      <div>
                        <p className="text-sm font-bold text-[#0f1b2d]">{contact.name}</p>
                        <p className="text-[11px] text-slate-500">{contact.available}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-[#0d9488]">24/7</span>
                  </div>
                  <p className="text-xl font-extrabold text-[#0f1b2d]">{contact.number}</p>
                </div>
              ))}
            </div>
          </section>
        </main>
      );
    }

    if (activePage === "News") {
      return (
        <main className="bg-[#f3f7fb]">
          <section className="bg-[#0f1b2d] text-white py-20">
            <div className="max-w-7xl mx-auto px-4">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#5eead4] mb-4">Latest News</p>
              <h1 className="text-4xl lg:text-5xl font-extrabold mb-5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Situation updates and relief coverage across the network.</h1>
            </div>
          </section>

          <section className="max-w-7xl mx-auto px-4 py-16">
            <div className="grid md:grid-cols-3 gap-6">
              {NEWS.map(article => (
                <article key={article.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <img src={article.image} alt={article.title} className="h-40 w-full object-cover" />
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white rounded-full px-2 py-1" style={{ background: article.category === "Flood" ? "#1e3a5f" : article.category === "Cyclone" ? "#7c3aed" : "#0d9488" }}>{article.category}</span>
                      <span className="text-[10px] text-slate-400">{article.source}</span>
                    </div>
                    <h3 className="text-base font-bold text-[#0f1b2d] mb-2 leading-snug">{article.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{article.summary}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </main>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Emergency Alert Bar */}
      <div className="bg-red-600 text-white py-2 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            Live Alert
          </span>
          <p className="text-xs font-medium truncate">{activeAlert.title} — {activeAlert.location}</p>
          <button
            type="button"
            onClick={() => setIsAlertExpanded(prev => !prev)}
            className="ml-auto flex-shrink-0 text-xs underline underline-offset-2 hover:no-underline"
          >
            {isAlertExpanded ? "Hide Details" : "Details →"}
          </button>
        </div>
      </div>

      {isAlertExpanded && (
        <div className="bg-[#fef2f2] border-b border-red-200 px-4 py-4">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-[1.3fr_0.7fr] gap-5">
            <div className="rounded-2xl border border-red-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center">
                    {(() => {
                      const DisasterIcon = disasterIcons[activeAlert.type];
                      return <DisasterIcon className="w-4 h-4 text-red-600" />;
                    })()}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${severityStyles[activeAlert.severity].bg}`}>
                    {severityStyles[activeAlert.severity].text}
                  </span>
                </div>
                {activeAlert.evacuationOrder && (
                  <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">EVACUATE</span>
                )}
              </div>
              <h3 className="text-base font-bold text-[#0f1b2d] mb-2">{activeAlert.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">{activeAlert.description}</p>
              <div className="flex flex-wrap gap-2">
                {activeAlert.affectedAreas.map(area => (
                  <span key={area} className="text-[10px] px-2 py-0.5 bg-red-50 text-red-700 rounded-full border border-red-100">{area}</span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-red-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Alert Summary</p>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between gap-3">
                  <span>Location</span>
                  <span className="font-medium text-[#0f1b2d] text-right">{activeAlert.location}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Updated</span>
                  <span className="font-medium text-[#0f1b2d] text-right">{new Date(activeAlert.timestamp).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Status</span>
                  <span className="font-medium text-red-700">{activeAlert.evacuationOrder ? "Immediate response required" : "Monitoring"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#1e3a5f" }}>
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-[#0f1b2d]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>ResQHub</span>
          </div>

          <div className="hidden lg:flex items-center gap-6 ml-6">
            {NAV_ITEMS.map(item => (
              <button
                key={item}
                type="button"
                onClick={() => setActivePage(item)}
                className={`text-sm font-medium transition-colors ${activePage === item ? "text-[#1e3a5f]" : "text-gray-600 hover:text-[#1e3a5f]"}`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={() => onNavigate("login", "victim", "login")}
              className="text-sm font-medium text-[#1e3a5f] hover:underline"
            >Sign In</button>
            <button
              onClick={() => onNavigate("signup", "victim", "signup")}
              className="text-sm font-semibold text-white px-4 py-2 rounded-xl transition-all hover:opacity-90"
              style={{ background: "#1e3a5f" }}
            >Register</button>
          </div>

          <button className="lg:hidden text-gray-600" onClick={() => setMenuOpen(v => !v)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3">
            {NAV_ITEMS.map(item => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setActivePage(item);
                  setMenuOpen(false);
                }}
                className="block w-full text-left text-sm text-gray-700 py-1"
              >
                {item}
              </button>
            ))}
            <div className="flex gap-2 pt-2">
              <button onClick={() => onNavigate("login", "victim", "login")} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm font-medium text-[#1e3a5f]">Sign In</button>
              <button onClick={() => onNavigate("signup", "victim", "signup")} className="flex-1 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: "#1e3a5f" }}>Register</button>
            </div>
          </div>
        )}
      </nav>

      {activePage !== "Home" ? renderPageContent() : (
        <>
          {/* HERO */}
          <section className="relative overflow-hidden" style={{ background: "#0f1b2d", minHeight: "92vh" }}>
        {/* Geometric pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg width="100%" height="100%" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
            {Array.from({ length: 8 }).map((_, r) =>
              Array.from({ length: 12 }).map((_, c) => (
                <circle key={`${r}-${c}`} cx={c * 80 + 40} cy={r * 80 + 40} r="30" fill="none" stroke="white" strokeWidth="1" />
              ))
            )}
          </svg>
        </div>
        {/* Gradient overlay */}
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 70% 50%, rgba(13,148,136,0.15) 0%, transparent 60%)" }} />

        <div className="relative max-w-7xl mx-auto px-4 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 bg-white/8 border border-white/10 rounded-full px-4 py-1.5 mb-6">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-medium text-emerald-300">{STATS.activeRequests} active emergencies being handled</span>
              </div>

              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-3.5 py-1.5 mb-5 text-sm font-medium text-teal-200">
                <span className="w-2 h-2 rounded-full bg-teal-400" />
                A Volunteer Coordination Platform
              </div>

              <h1 className="text-4xl lg:text-6xl font-extrabold text-white leading-tight mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Coordinate help.<br />
                <span style={{ color: "#0d9488" }}>Deliver support faster</span>
              </h1>

              <p className="text-lg text-gray-300 leading-relaxed mb-8 max-w-lg">
                ResQHub brings people in need, volunteers, and partner organizations together on one trusted platform — from the first request to the final delivery of support.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => onNavigate("signup", "victim", "signup")}
                  className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white transition-all hover:opacity-90 hover:scale-[1.02] active:scale-100"
                  style={{ background: "#dc2626" }}
                >
                  <LifeBuoy className="w-4 h-4" />
                  Request Help
                </button>
                <button
                  onClick={() => onNavigate("signup", "volunteer", "signup")}
                  className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white transition-all hover:opacity-90 hover:scale-[1.02]"
                  style={{ background: "#0d9488" }}
                >
                  <Heart className="w-4 h-4" />
                  Become Volunteer
                </button>
                <button
                  onClick={() => onNavigate("signup", "ngo", "signup")}
                  className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white border border-white/20 hover:bg-white/10 transition-all hover:scale-[1.02]"
                >
                  <Building2 className="w-4 h-4" />
                  NGO Register
                </button>
              </div>
            </div>

            {/* Right — Live map preview */}
            <div className="relative">
              <div className="absolute -top-3 -right-3 bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full z-10 animate-pulse">
                LIVE
              </div>
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                <div className="px-4 py-3 flex items-center gap-2" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <Map className="w-3.5 h-3.5 text-teal-400" />
                  <span className="text-xs font-medium text-gray-300">Real-time Operations Map — Bangladesh</span>
                </div>
                <MapView markers={MAP_MARKERS} height="h-72" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white py-14 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Victims Helped", value: formatNumber(STATS.victimsHelped), icon: Heart, color: "#dc2626", bg: "bg-red-50" },
              { label: "Registered Volunteers", value: formatNumber(STATS.registeredVolunteers), icon: Users, color: "#0d9488", bg: "bg-teal-50" },
              { label: "Partner NGOs", value: STATS.partnerNGOs.toString(), icon: Building2, color: "#1e3a5f", bg: "bg-blue-50" },
              { label: "Active Shelters", value: STATS.activeShelters.toString(), icon: MapPin, color: "#f97316", bg: "bg-orange-50" },
            ].map(stat => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="text-center group">
                  <div className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" style={{ color: stat.color }} />
                  </div>
                  <p className="text-3xl font-extrabold text-[#0f1b2d] mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Current Alerts */}
      <section className="py-10" style={{ background: "#f0f4f8" }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Active Emergency Alerts</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {ALERTS.map(alert => {
              const DisasterIcon = disasterIcons[alert.type];
              const sev = severityStyles[alert.severity];
              const isExpanded = alert.id === activeAlert.id && isAlertExpanded;

              return (
                <div key={alert.id} className={`bg-white rounded-2xl border p-5 shadow-sm transition-all ${isExpanded ? "border-red-200 shadow-md ring-2 ring-red-100" : "border-gray-100 hover:shadow-md"}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
                        <DisasterIcon className="w-4 h-4 text-gray-600" />
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${sev.bg}`}>{sev.text}</span>
                    </div>
                    {alert.evacuationOrder && (
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">EVACUATE</span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-[#0f1b2d] mb-1 leading-snug">{alert.title}</h3>
                  <p className="text-xs text-gray-500 mb-3 leading-relaxed">{isExpanded ? alert.description : `${alert.description.slice(0, 100)}…`}</p>

                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
                    <MapPin className="w-3 h-3" />
                    {alert.location}
                  </div>

                  {isExpanded && (
                    <div className="space-y-3 rounded-xl bg-red-50 border border-red-100 p-3 mb-3">
                      <div className="flex items-center justify-between text-[10px] text-gray-600">
                        <span className="font-semibold text-red-700">Updated</span>
                        <span>{new Date(alert.timestamp).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Affected areas</p>
                        <div className="flex flex-wrap gap-1">
                          {alert.affectedAreas.map(a => (
                            <span key={a} className="text-[10px] px-2 py-0.5 bg-white border border-red-100 text-red-700 rounded-full">{a}</span>
                          ))}
                        </div>
                      </div>
                      <div className="text-[10px] text-gray-700">
                        {alert.evacuationOrder
                          ? "Mandatory evacuation is in effect for the listed zones. Follow local guidance and move to the nearest safe shelter."
                          : "Residents should stay alert and monitor official updates while emergency crews assess the situation."}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1 mb-3">
                    {alert.affectedAreas.slice(0, 2).map(a => (
                      <span key={a} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{a}</span>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (alert.id === activeAlert.id) {
                        setIsAlertExpanded(prev => !prev);
                      }
                    }}
                    className="w-full text-xs font-semibold text-[#1e3a5f] hover:text-[#0f1b2d] transition-colors"
                  >
                    {isExpanded ? "Hide details" : "View details"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-[#0d9488] mb-3">How It Works</p>
            <h2 className="text-3xl font-extrabold text-[#0f1b2d]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Three roles. One mission.</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto text-sm">Every person can play a part — whether you need help, can give it, or can coordinate it at scale.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                color: "#dc2626", bg: "bg-red-50", border: "border-red-100",
                icon: LifeBuoy, title: "Victims", cta: "Request Help", nav: "victim",
                steps: ["Submit a rescue or relief request", "Get matched with nearby volunteers", "Track your request in real-time", "Receive help and stay safe"],
              },
              {
                color: "#0d9488", bg: "bg-teal-50", border: "border-teal-100",
                icon: Heart, title: "Volunteers", cta: "Join as Volunteer", nav: "volunteer",
                steps: ["Create your volunteer profile", "Set your skills and availability", "Accept emergency missions near you", "Complete missions and earn recognition"],
              },
              {
                color: "#1e3a5f", bg: "bg-blue-50", border: "border-blue-100",
                icon: Building2, title: "NGOs", cta: "Register Your NGO", nav: "ngo",
                steps: ["Register and verify your organization", "Manage campaigns and shelters", "Deploy volunteers efficiently", "Track inventory and generate reports"],
              },
            ].map(role => {
              const Icon = role.icon;
              return (
                <div key={role.title} className={`${role.bg} ${role.border} border rounded-2xl p-6`}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: role.color }}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-base font-bold text-[#0f1b2d] mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{role.title}</h3>
                  <ul className="space-y-2.5 mb-5">
                    {role.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                        <span className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: role.color }}>{i + 1}</span>
                        {step}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => onNavigate(role.nav)}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                    style={{ background: role.color }}
                  >
                    {role.cta}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16" style={{ background: "#f0f4f8" }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-[#0d9488] mb-3">Platform Features</p>
            <h2 className="text-3xl font-extrabold text-[#0f1b2d]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Built for real emergencies.</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Activity, title: "Real-time Tracking", desc: "Every request, volunteer, and delivery tracked live. No black boxes.", color: "#1e3a5f" },
              { icon: Zap, title: "Smart Matching", desc: "AI matches victims with the nearest available volunteers based on skills and location.", color: "#0d9488" },
              { icon: MapPin, title: "Shelter Network", desc: "234 shelters across Bangladesh with live capacity, facilities, and distance data.", color: "#f97316" },
              { icon: Bot, title: "AI Emergency Assistant", desc: "Summarize reports, prioritize requests, and generate insights — all AI-powered.", color: "#7c3aed" },
              { icon: Package, title: "Inventory Management", desc: "Track food, water, medicine, and supplies across all warehouses in real time.", color: "#16a34a" },
              { icon: Globe, title: "Multi-district Coverage", desc: "Deployed across all 64 districts with offline-ready capabilities for remote areas.", color: "#dc2626" },
            ].map(f => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: f.color + "15" }}>
                    <Icon className="w-4.5 h-4.5" style={{ color: f.color }} />
                  </div>
                  <h3 className="text-sm font-bold text-[#0f1b2d] mb-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{f.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interactive Map Preview */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#0d9488] mb-3">Live Operations Map</p>
              <h2 className="text-3xl font-extrabold text-[#0f1b2d] mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>See every operation at a glance.</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-5">From trapped families to deployed volunteers, every actor in the relief ecosystem is visible on the operations map. Click any marker for details.</p>
              <div className="space-y-3">
                {[
                  { color: "#dc2626", label: "Victims — active help requests" },
                  { color: "#1e3a5f", label: "Volunteers — deployed and available" },
                  { color: "#16a34a", label: "Shelters — capacity and facilities" },
                  { color: "#7c3aed", label: "Medical camps — 24/7 emergency care" },
                  { color: "#f97316", label: "Relief centers — food and supplies" },
                ].map(m => (
                  <div key={m.label} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: m.color }} />
                    <span className="text-sm text-gray-600">{m.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <MapView markers={MAP_MARKERS} height="h-96" />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16" style={{ background: "#f0f4f8" }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-[#0d9488] mb-3">Testimonials</p>
            <h2 className="text-3xl font-extrabold text-[#0f1b2d]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>From the people we serve.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed flex-1 mb-5">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full text-white text-xs font-bold flex items-center justify-center" style={{ background: "#1e3a5f" }}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#0f1b2d]">{t.name}</p>
                    <p className="text-[10px] text-gray-400">{t.role} · {t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest News */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#0d9488] mb-1">Disaster News</p>
              <h2 className="text-2xl font-extrabold text-[#0f1b2d]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Latest Updates</h2>
            </div>
            <button className="text-sm font-medium text-[#1e3a5f] flex items-center gap-1 hover:underline">View all <ChevronRight className="w-4 h-4" /></button>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {NEWS.map(article => (
              <div key={article.id} className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
                <div className="h-36 bg-gray-100 overflow-hidden">
                  <img src={article.image} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: article.category === "Flood" ? "#1e3a5f" : article.category === "Cyclone" ? "#7c3aed" : "#0d9488" }}>
                      {article.category}
                    </span>
                    <span className="text-[10px] text-gray-400">{article.source}</span>
                  </div>
                  <h3 className="text-sm font-bold text-[#0f1b2d] mb-2 leading-snug group-hover:text-[#1e3a5f] transition-colors">{article.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{article.summary.slice(0, 90)}…</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency Contacts */}
      <section className="py-10" style={{ background: "#1e3a5f" }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2.5 mb-6">
            <Phone className="w-4 h-4 text-teal-400" />
            <h2 className="text-base font-bold text-white">Emergency Contacts</h2>
            <span className="text-xs text-blue-300 bg-white/8 px-2 py-0.5 rounded-full">Bangladesh</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {EMERGENCY_CONTACTS.map(c => (
              <div key={c.name} className="flex items-center gap-3 bg-white/8 rounded-xl px-4 py-3 hover:bg-white/12 transition-colors cursor-pointer">
                <Phone className="w-4 h-4 text-teal-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{c.name}</p>
                  <p className="text-[10px] text-blue-300">{c.available}</p>
                </div>
                <span className="text-sm font-bold text-teal-300 flex-shrink-0">{c.number}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="py-10 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">Trusted Partner Organizations</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {PARTNER_NAMES.map(name => (
              <div key={name} className="px-5 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-semibold text-gray-500 hover:border-gray-200 hover:text-gray-700 transition-colors cursor-pointer">
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-14" style={{ background: "#0d9488" }}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Be the difference in someone's survival.</h2>
          <p className="text-teal-100 mb-7 text-sm">Join 12,000+ volunteers and 89 NGOs already using ResQHub to coordinate fast, dependable response.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => onNavigate("victim")} className="px-7 py-3.5 bg-white text-[#0d9488] font-bold rounded-xl hover:bg-gray-50 transition-colors text-sm flex items-center justify-center gap-2">
              <LifeBuoy className="w-4 h-4" /> I Need Help
            </button>
            <button onClick={() => onNavigate("volunteer")} className="px-7 py-3.5 bg-[#1e3a5f] text-white font-bold rounded-xl hover:opacity-90 transition-opacity text-sm flex items-center justify-center gap-2">
              <Heart className="w-4 h-4" /> I Want to Help
            </button>
          </div>
        </div>
      </section>

        </>
      )}

      {/* Footer */}
      <footer style={{ background: "#0f1b2d" }} className="pt-12 pb-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center">
                  <Shield className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-base font-bold text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>ResQHub</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">A modern volunteer coordination platform that helps communities connect support, volunteers, and relief resources in real time.</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">Platform</p>
              <div className="space-y-2">
                {["Request Help", "Volunteer Portal", "NGO Portal", "Admin Dashboard", "Emergency Map"].map(l => (
                  <p key={l} className="text-xs text-gray-500 hover:text-gray-300 cursor-pointer transition-colors">{l}</p>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">Resources</p>
              <div className="space-y-2">
                {["Disaster Preparedness Guide", "Relief Standards", "Volunteer Training", "NGO Certification", "API Docs"].map(l => (
                  <p key={l} className="text-xs text-gray-500 hover:text-gray-300 cursor-pointer transition-colors">{l}</p>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">Contact</p>
              <div className="space-y-2 text-xs text-gray-500">
                <p>hello@resqhub.org</p>
                <p>+880-2-12345678</p>
                <p>Dhaka, Bangladesh</p>
              </div>
            </div>
          </div>
          <div className="border-t border-white/8 pt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-gray-500">© 2024 ResQHub. All rights reserved.</p>
            <div className="flex gap-4">
              {["Privacy Policy", "Terms of Service", "Contact"].map(l => (
                <span key={l} className="text-[11px] text-gray-500 hover:text-gray-300 cursor-pointer">{l}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
