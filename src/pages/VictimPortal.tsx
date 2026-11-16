import { useState } from "react";
import {
  LayoutDashboard, LifeBuoy, ClipboardList, Home, User,
  AlertTriangle, MapPin, Phone, CheckCircle, Clock, XCircle,
  Waves, Wind, Mountain, ChevronRight, Upload, Navigation,
  Search, Filter, Bed, Utensils, Stethoscope, Droplets,
  Package, Shield, Star, Edit3, Plus, Heart
} from "lucide-react";
import { toast } from "sonner";

import type { RescuePoll } from "../types";
import PortalLayout from "../components/PortalLayout";
import MapView from "../components/MapView";

import { useSession } from "../context/SessionContext";
import { useUserLocation } from "../context/LocationContext";
import { distanceKm, initialsOf, mapMarkers, timeAgo } from "../lib/derive";
import { db, useDbRevision, usePersistedState, addToCollection } from "../context/DataContext";

type VictimPage = "dashboard" | "request-help" | "track-requests" | "shelters" | "profile";

const NAV_ITEMS = [
  { id: "dashboard",       label: "Dashboard",      icon: LayoutDashboard },
  { id: "request-help",    label: "Request Help",   icon: LifeBuoy },
  { id: "track-requests",  label: "Track Requests", icon: ClipboardList },
  { id: "shelters",        label: "Nearby Shelters",icon: Home },
  { id: "profile",         label: "My Profile",     icon: User },
];

const REQUEST_TYPE_OPTIONS = [
  { id: "food",     label: "Food",     icon: Utensils,   color: "#f97316" },
  { id: "water",    label: "Water",    icon: Droplets,   color: "#0d9488" },
  { id: "medicine", label: "Medicine", icon: Package,    color: "#7c3aed" },
  { id: "medical",  label: "Medical",  icon: Stethoscope,color: "#dc2626" },
  { id: "rescue",   label: "Rescue",   icon: LifeBuoy,   color: "#dc2626" },
  { id: "shelter",  label: "Shelter",  icon: Home,       color: "#1e3a5f" },
  { id: "other",    label: "Other",    icon: Heart,      color: "#6b7280" },
];

const STATUS_CONFIG = {
  pending:  { label: "Pending",         color: "text-yellow-700 bg-yellow-50 border-yellow-200",  dot: "bg-yellow-400", icon: Clock },
  accepted: { label: "Accepted",        color: "text-blue-700 bg-blue-50 border-blue-200",        dot: "bg-blue-400",   icon: CheckCircle },
  assigned: { label: "Volunteer Assigned", color: "text-teal-700 bg-teal-50 border-teal-200",    dot: "bg-teal-400",   icon: Navigation },
  completed:{ label: "Completed",       color: "text-green-700 bg-green-50 border-green-200",     dot: "bg-green-500",  icon: CheckCircle },
  cancelled:{ label: "Cancelled",       color: "text-gray-600 bg-gray-50 border-gray-200",        dot: "bg-gray-400",   icon: XCircle },
};

function StatusBadge({ status }: { status: keyof typeof STATUS_CONFIG }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
function VictimDashboard({
  onNavigate,
  rescuePolls,
  onToggleHeart,
  userHearts,
}: {
  onNavigate: (p: VictimPage) => void;
  rescuePolls: RescuePoll[];
  onToggleHeart: (pollId: string) => void;
  userHearts: Record<string, boolean>;
}) {
  const session = useSession();
  const { location: userLoc } = useUserLocation();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning," : hour < 17 ? "Good afternoon," : "Good evening,";
  const alert = db.alerts[0];
  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-[#1e3a5f] rounded-2xl p-6 text-white">
        <p className="text-sm text-blue-200 mb-1">{greeting}</p>
        <h2 className="text-xl font-bold mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{session.name}</h2>
        <p className="text-xs text-blue-300">Stay safe. ResQHub is coordinating {db.stats.activeRequests} active {db.stats.activeRequests === 1 ? "request" : "requests"} right now.</p>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => onNavigate("request-help")}
            className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <LifeBuoy className="w-3.5 h-3.5" /> Request Help Now
          </button>
          <button
            onClick={() => onNavigate("track-requests")}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors"
          >
            Track My Requests
          </button>
        </div>
      </div>

      {/* Active Alert */}
      {alert && (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-4 h-4 text-red-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-red-800">{alert.title}</p>
          <p className="text-xs text-red-600 mt-0.5">{alert.description.slice(0, 120)}…</p>
          <div className="flex gap-1.5 mt-2">
            {alert.affectedAreas.map(a => (
              <span key={a} className="text-[10px] px-2 py-0.5 bg-red-100 text-red-700 rounded-full border border-red-200">{a}</span>
            ))}
          </div>
        </div>
      </div>
      )}

      {/* Rescue verification poll */}
      {rescuePolls.length > 0 && (
        <div className="bg-white border border-rose-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-[#0f1b2d] flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" /> Rescue verification polls
            </h3>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">Community Verified</span>
          </div>
          <div className="space-y-3">
            {[...rescuePolls].sort((a, b) => b.hearts - a.hearts).map(poll => {
              const hasHearted = userHearts[poll.id];

              return (
                <div key={poll.id} className="border border-rose-100 bg-rose-50/50 rounded-xl p-3">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="text-xs font-bold text-[#0f1b2d]">{poll.victimName}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{poll.location}</p>
                    </div>
                    <span className="text-[10px] text-gray-500">{poll.createdAt ? timeAgo(poll.createdAt) : poll.time}</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-3 leading-relaxed">{poll.note}</p>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => onToggleHeart(poll.id)}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${hasHearted ? "bg-rose-600 text-white shadow-sm scale-105" : "bg-white border border-rose-200 text-rose-600 hover:bg-rose-50"}`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${hasHearted ? "fill-white text-white" : "text-rose-500 fill-rose-500"}`} />
                      <span>{poll.hearts}</span>
                      <span className="text-[10px] opacity-80">{hasHearted ? "Supported" : "Support"}</span>
                    </button>
                    <span className="text-[10px] text-gray-500">{hasHearted ? "You supported this rescue" : "Click heart to verify & support"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <h3 className="text-sm font-bold text-[#0f1b2d] mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Request Help",       icon: LifeBuoy,      color: "#dc2626", nav: "request-help" },
            { label: "Track Requests",     icon: ClipboardList, color: "#0d9488", nav: "track-requests" },
            { label: "Find Shelter",       icon: Home,          color: "#1e3a5f", nav: "shelters" },
            { label: "Emergency Contacts", icon: Phone,         color: "#f97316", nav: "dashboard" },
          ].map(a => {
            const Icon = a.icon;
            return (
              <button
                key={a.label}
                onClick={() => onNavigate(a.nav as VictimPage)}
                className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center gap-2 hover:shadow-md transition-all hover:-translate-y-0.5 group"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: a.color + "15" }}>
                  <Icon className="w-5 h-5" style={{ color: a.color }} />
                </div>
                <span className="text-xs font-medium text-[#0f1b2d] text-center leading-tight">{a.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active requests */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-[#0f1b2d]">Active Requests</h3>
          <button onClick={() => onNavigate("track-requests")} className="text-xs text-[#0d9488] font-medium hover:underline flex items-center gap-1">
            View all <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="space-y-3">
          {db.helpRequests.filter(r => r.status !== "completed" && r.status !== "cancelled").length === 0 && (
            <p className="text-xs text-gray-400 bg-white rounded-2xl border border-gray-100 p-4">You have no active requests.</p>
          )}
          {db.helpRequests.filter(r => r.status !== "completed" && r.status !== "cancelled").slice(0, 2).map(req => (
            <div key={req.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">#{req.id}</span>
                  <p className="text-sm font-bold text-[#0f1b2d] capitalize">{req.type} Request</p>
                </div>
                <StatusBadge status={req.status} />
              </div>
              <p className="text-xs text-gray-500 mb-3 leading-relaxed">{req.description.slice(0, 90)}…</p>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <MapPin className="w-3 h-3" /> {req.location.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Nearby shelters */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-[#0f1b2d]">Nearby Shelters</h3>
          <button onClick={() => onNavigate("shelters")} className="text-xs text-[#0d9488] hover:underline flex items-center gap-1">
            View all <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {db.shelters.filter(s => s.status !== "closed").slice(0, 2).map(s => {
            const pct = Math.round((s.currentOccupancy / s.capacity) * 100);
            return (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-xs font-bold text-[#0f1b2d] leading-snug pr-2">{s.name}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${s.status === "open" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {s.status === "open" ? "Open" : "Full"}
                  </span>
                </div>
                <div className="mb-2">
                  <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                    <span>Capacity</span>
                    <span>{s.currentOccupancy}/{s.capacity}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100">
                    <div className={`h-1.5 rounded-full transition-all ${pct > 90 ? "bg-red-500" : pct > 70 ? "bg-orange-400" : "bg-green-500"}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 flex items-center gap-1"><MapPin className="w-3 h-3" />{userLoc ? `${distanceKm(userLoc, s.location).toFixed(1)} km away` : s.location.district || "Distance unknown"}</span>
                  <div className="flex gap-1">
                    {s.hasMedical && <span className="text-[9px] px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded-full">Medical</span>}
                    {s.hasFood && <span className="text-[9px] px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded-full">Food</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Request Help ─────────────────────────────────────────────────────────────
function RequestHelp({ onBroadcastRescue }: { onBroadcastRescue: (poll: RescuePoll) => void }) {
  const session = useSession();
  const [type, setType] = useState("");
  const [priority, setPriority] = useState("");
  const [description, setDescription] = useState("");
  const [contact, setContact] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [mode, setMode] = useState<"self" | "relay">("self");
  const [rescueName, setRescueName] = useState("");
  const [rescueLocation, setRescueLocation] = useState("");
  const [rescueNote, setRescueNote] = useState("");
  const emergencyContacts = session.profile?.emergencyContacts ?? [];
  const setEmergencyContacts = (fn: (prev: string[]) => string[]) => { session.updateProfile({ emergencyContacts: fn(emergencyContacts) }); };
  const [lastRequestId, setLastRequestId] = useState("");
  const [newContact, setNewContact] = useState("");
  const [mapSelectedLocation, setMapSelectedLocation] = useState("");
  const [requestPoint, setRequestPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [requestLabel, setRequestLabel] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Gate: Email must be verified
    if (!session.emailVerified) {
      toast.error("Please verify your email before requesting help.");
      return;
    }

    if (!type || !priority || !description) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (mode === "relay") {
      if (!rescueName || !rescueLocation || !rescueNote) {
        toast.error("Please provide the missing person details and rescue location.");
        return;
      }

      const poll: RescuePoll = {
        id: `rescue-${Date.now()}`,
        victimName: rescueName,
        location: rescueLocation,
        note: rescueNote,
        reporter: session.name || "Relative / Witness",
        time: "Just now",
        createdAt: new Date().toISOString(),
        hearts: 1,
        heartedBy: [session.profile!.id],
        ownerId: session.profile!.id,
      };

      onBroadcastRescue(poll);
      toast.success("Rescue request broadcasted. Volunteers and family members can confirm if the situation is real.");
      setMode("self");
      setRescueName("");
      setRescueLocation("");
      setRescueNote("");
    } else {
      if (!requestPoint) {
        toast.error("Please choose your location on the map.");
        return;
      }
      const now = new Date().toISOString();
      const requestId = `req-${Date.now()}`;
      setLastRequestId(requestId);
      addToCollection("helpRequests", {
        id: requestId,
        ownerId: session.profile!.id,
        victimName: session.name || "Anonymous",
        victimPhone: session.phone || contact,
        type: type as any,
        priority: priority as any,
        status: "pending",
        description,
        location: { lat: requestPoint.lat, lng: requestPoint.lng, label: requestLabel, district: requestLabel.split(",").slice(-3, -2)[0]?.trim() ?? "" },
        createdAt: now,
        updatedAt: now,
        timeline: [{ status: "pending", note: "Request submitted", timestamp: now }],
      }).catch(err => toast.error(`Could not save request: ${err.message}`));
      toast.success("Your help request has been submitted. We'll connect you with a volunteer shortly.");
    }

    setSubmitted(true);
  };

  const addEmergencyContact = () => {
    if (!newContact.trim()) {
      toast.error("Enter a phone number first.");
      return;
    }
    if (emergencyContacts.length >= 5) {
      toast.error("You can add up to 5 emergency contact numbers.");
      return;
    }
    setEmergencyContacts(prev => [...prev, newContact.trim()]);
    setNewContact("");
  };

  const removeEmergencyContact = (phone: string) => {
    setEmergencyContacts(prev => prev.filter(contact => contact !== phone));
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-[#0f1b2d] mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Request Submitted!</h2>
        <p className="text-sm text-gray-500 mb-2">Your request ID is <strong className="text-[#1e3a5f]">#{lastRequestId.replace("req-", "REQ-") || "pending"}</strong></p>
        <p className="text-sm text-gray-500 mb-6">A volunteer has been notified and will contact you shortly. Average response time is 2.4 hours.</p>
        <button onClick={() => setSubmitted(false)} className="px-5 py-2.5 rounded-xl text-white font-semibold text-sm hover:opacity-90" style={{ background: "#1e3a5f" }}>
          Submit Another Request
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#0f1b2d]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Request Emergency Help</h2>
        <p className="text-sm text-gray-500 mt-1">Fill in the details below. Our team will match you with the nearest available help.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Request type */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <label className="block text-sm font-bold text-[#0f1b2d] mb-3">What do you need? <span className="text-red-500">*</span></label>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {REQUEST_TYPE_OPTIONS.map(opt => {
              const Icon = opt.icon;
              const isActive = type === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setType(opt.id)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-center transition-all ${isActive ? "border-2" : "border-gray-200 hover:border-gray-300"}`}
                  style={isActive ? { borderColor: opt.color, background: opt.color + "10" } : {}}
                >
                  <Icon className="w-4 h-4" style={{ color: isActive ? opt.color : "#9ca3af" }} />
                  <span className="text-[10px] font-semibold" style={{ color: isActive ? opt.color : "#6b7280" }}>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

      

        {/* Description */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <label className="block text-sm font-bold text-[#0f1b2d] mb-2">Description <span className="text-red-500">*</span></label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe your situation in detail — number of people, current location, specific needs, any medical conditions…"
            rows={4}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/10 transition-all resize-none"
          />
          <p className="text-[10px] text-gray-400 mt-1.5">{description.length}/500 characters</p>
        </div>

        {/* Location */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <label className="block text-sm font-bold text-[#0f1b2d] mb-3">Your Location</label>
          <div className={`flex items-center gap-3 p-3 border rounded-xl mb-3 ${requestPoint ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
            <MapPin className={`w-4 h-4 flex-shrink-0 ${requestPoint ? "text-green-600" : "text-gray-400"}`} />
            <div className="min-w-0">
              <p className={`text-xs font-semibold ${requestPoint ? "text-green-800" : "text-gray-600"}`}>{requestPoint ? "Location selected" : "Choose your location"}</p>
              <p className={`text-[10px] truncate ${requestPoint ? "text-green-600" : "text-gray-400"}`}>
                {requestPoint ? `${requestLabel} — ${requestPoint.lat.toFixed(4)}°N, ${requestPoint.lng.toFixed(4)}°E` : "Search, tap the map, or use the locate button"}
              </p>
            </div>
            {requestPoint && <CheckCircle className="w-4 h-4 text-green-600 ml-auto flex-shrink-0" />}
          </div>
          <MapView
            markers={[]}
            height="h-56"
            onSelectLocation={(label, point) => {
              setRequestLabel(label);
              if (point) setRequestPoint(point);
            }}
          />
        </div>

        {/* Photo upload */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <label className="block text-sm font-bold text-[#0f1b2d] mb-2">Upload Photos (optional)</label>
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-gray-300 transition-colors cursor-pointer">
            <Upload className="w-6 h-6 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-500">Drag & drop photos or <span className="text-[#0d9488] font-medium">browse</span></p>
            <p className="text-[10px] text-gray-400 mt-1">Max 5 photos, 10MB each. JPG, PNG supported.</p>
          </div>
        </div>

        {/* Rescue / witness mode */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <label className="block text-sm font-bold text-[#0f1b2d] mb-3">Request Type</label>
          <div className="grid grid-cols-2 gap-2">
            {[{ id: "self", label: "My own rescue" }, { id: "relay", label: "Report someone else" }].map(option => (
              <button
                key={option.id}
                type="button"
                onClick={() => setMode(option.id as "self" | "relay")}
                className={`py-2.5 rounded-xl text-xs font-semibold transition-colors ${mode === option.id ? "bg-[#1e3a5f] text-white" : "bg-gray-50 text-gray-600 border border-gray-200"}`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {mode === "relay" && (
            <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
              <div>
                <label className="block text-xs font-semibold text-[#0f1b2d] mb-1.5">Missing / stranded person's name</label>
                <input
                  value={rescueName}
                  onChange={e => setRescueName(e.target.value)}
                  placeholder="Full name"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/10"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0f1b2d] mb-1.5">Location to rescue</label>
                <input
                  value={rescueLocation}
                  onChange={e => setRescueLocation(e.target.value)}
                  placeholder="Search the map below or type an address"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/10"
                />
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-[#0f1b2d]">Pick location from map</p>
                  <button
                    type="button"
                    onClick={() => {
                      const chosen = mapSelectedLocation;
                      if (!chosen) { toast.error("Pick a point on the map first."); return; }
                      setRescueLocation(chosen);
                      toast.success(`Rescue location set to ${chosen}.`);
                    }}
                    className="text-[10px] font-semibold text-[#1e3a5f] hover:underline"
                  >
                    Use selected map point
                  </button>
                </div>
                <div className="rounded-xl overflow-hidden border border-gray-200">
                  <MapView
                    markers={[]}
                    height="h-56"
                    onSelectLocation={(location) => {
                      setMapSelectedLocation(location);
                      setRescueLocation(location);
                    }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-gray-500">
                  <span>Selected point</span>
                  <span className="font-medium text-[#0f1b2d] truncate">{mapSelectedLocation || "None yet"}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0f1b2d] mb-1.5">What happened?</label>
                <textarea
                  value={rescueNote}
                  onChange={e => setRescueNote(e.target.value)}
                  rows={3}
                  placeholder="We lost contact with the victim near the flood embankment. They may be trapped and unable to call for help."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/10"
                />
              </div>
            </div>
          )}
        </div>

        {/* Emergency contact */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <label className="block text-sm font-bold text-[#0f1b2d] mb-2">Emergency Contact Numbers</label>
          <div className="space-y-2 mb-3">
            {emergencyContacts.map((phone, index) => (
              <div key={`${phone}-${index}`} className="flex items-center gap-3 border border-gray-200 rounded-xl px-3 py-2.5">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="flex-1 text-sm text-[#0f1b2d]">{phone}</span>
                <button
                  type="button"
                  onClick={() => removeEmergencyContact(phone)}
                  className="text-red-500 hover:text-red-700 text-xs font-semibold"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="tel"
              value={newContact}
              onChange={e => setNewContact(e.target.value)}
              placeholder="Add up to 5 contacts"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/10"
            />
            <button
              type="button"
              onClick={addEmergencyContact}
              className="px-4 py-2.5 rounded-xl bg-[#1e3a5f] text-white text-xs font-semibold hover:opacity-90"
            >
              Add
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-4 rounded-2xl text-white font-bold text-sm transition-all hover:opacity-90 hover:scale-[1.01] active:scale-100 flex items-center justify-center gap-2"
          style={{ background: "#dc2626" }}
        >
          <LifeBuoy className="w-4 h-4" />
          {mode === "relay" ? "Broadcast Rescue Request" : "Submit Emergency Request"}
        </button>
      </form>
    </div>
  );
}

// ─── Track Requests ───────────────────────────────────────────────────────────
function TrackRequests() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#0f1b2d]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Track Requests</h2>
          <p className="text-sm text-gray-500 mt-0.5">{db.helpRequests.length} total requests</p>
        </div>
        <div className="flex gap-2">
          {(["all", "pending", "assigned", "completed"] as const).map(f => (
            <button key={f} className={`text-xs px-3 py-1.5 rounded-full border transition-colors capitalize ${f === "all" ? "bg-[#1e3a5f] text-white border-[#1e3a5f]" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {[...db.helpRequests].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(req => {
        const isOpen = expanded === req.id;
        return (
          <div key={req.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <button
              onClick={() => setExpanded(isOpen ? null : req.id)}
              className="w-full flex items-start gap-4 p-5 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-bold text-gray-400">#{req.id}</span>
                  <StatusBadge status={req.status} />
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${req.priority === "critical" ? "bg-red-50 text-red-700 border-red-200" : req.priority === "high" ? "bg-orange-50 text-orange-700 border-orange-200" : "bg-gray-50 text-gray-600 border-gray-200"}`}>
                    {req.priority.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm font-semibold text-[#0f1b2d] capitalize">{req.type} Request</p>
                <p className="text-xs text-gray-500 mt-0.5">{req.description.slice(0, 70)}…</p>
                <p className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1"><MapPin className="w-3 h-3" />{req.location.label}</p>
              </div>
              <ChevronRight className={`w-4 h-4 text-gray-400 flex-shrink-0 mt-1 transition-transform ${isOpen ? "rotate-90" : ""}`} />
            </button>

            {isOpen && (
              <div className="px-5 pb-5 border-t border-gray-100">
                {/* Timeline */}
                <h4 className="text-xs font-bold text-[#0f1b2d] mt-4 mb-3">Request Timeline</h4>
                <div className="relative pl-5">
                  <div className="absolute left-2 top-0 bottom-0 w-px bg-gray-200" />
                  {req.timeline.map((event, i) => {
                    const cfg = STATUS_CONFIG[event.status];
                    const Icon = cfg.icon;
                    return (
                      <div key={i} className="relative mb-4 last:mb-0">
                        <div className={`absolute -left-3.5 w-4 h-4 rounded-full flex items-center justify-center ${i === 0 ? "bg-gray-200" : "bg-[#0d9488]"}`}>
                          <Icon className="w-2.5 h-2.5 text-white" />
                        </div>
                        <div className="ml-4">
                          <p className="text-xs font-semibold text-[#0f1b2d] capitalize">{event.status.replace("-", " ")}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">{event.note}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{new Date(event.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                    );
                  })}
                  {/* Upcoming steps */}
                  {req.status !== "completed" && req.status !== "cancelled" && (
                    <>
                      {["assigned", "completed"].filter(s => {
                        const order = ["pending", "accepted", "assigned", "completed"];
                        return order.indexOf(s) > order.indexOf(req.status);
                      }).map(s => (
                        <div key={s} className="relative mb-4 opacity-40">
                          <div className="absolute -left-3.5 w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center">
                            <Clock className="w-2.5 h-2.5 text-gray-400" />
                          </div>
                          <div className="ml-4">
                            <p className="text-xs font-medium text-gray-400 capitalize">{s.replace("-", " ")}</p>
                            <p className="text-[10px] text-gray-300">Upcoming</p>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                {req.assignedVolunteer && (
                  <div className="mt-4 p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#0d9488] flex items-center justify-center text-white text-xs font-bold">{initialsOf(req.assignedVolunteer)}</div>
                    <div>
                      <p className="text-xs font-semibold text-teal-800">{req.assignedVolunteer} — Assigned Volunteer</p>
                      {(() => { const v = db.volunteers.find(x => x.id === req.assignedVolunteerId); return v ? <p className="text-[10px] text-teal-600">Skills: {v.skills.join(", ") || "General"} · Rating: {v.rating ? `${v.rating} ★` : "New"}</p> : null; })()}
                    </div>
                    <button onClick={() => { const v = db.volunteers.find(x => x.id === req.assignedVolunteerId); if (v?.phone) window.location.href = `tel:${v.phone}`; else toast.info("No phone number on file for this volunteer."); }} className="ml-auto p-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors">
                      <Phone className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Shelters ─────────────────────────────────────────────────────────────────
function SheltersPage() {
  const { location: userLoc } = useUserLocation();
  const [search, setSearch] = useState("");
  const [filterMedical, setFilterMedical] = useState(false);
  const [filterFood, setFilterFood] = useState(false);

  const filtered = db.shelters.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.location.district.toLowerCase().includes(search.toLowerCase());
    const matchMedical = !filterMedical || s.hasMedical;
    const matchFood = !filterFood || s.hasFood;
    return matchSearch && matchMedical && matchFood;
  });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[#0f1b2d] mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Nearby Shelters</h2>
        <p className="text-sm text-gray-500">Find the nearest available emergency shelter.</p>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus-within:border-[#1e3a5f] transition-all">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or district…"
            className="flex-1 text-sm bg-transparent border-none outline-none"
          />
        </div>
        <div className="flex gap-2">
          {[
            { label: "Medical", state: filterMedical, toggle: () => setFilterMedical(v => !v) },
            { label: "Food",    state: filterFood,    toggle: () => setFilterFood(v => !v) },
          ].map(f => (
            <button
              key={f.label}
              onClick={f.toggle}
              className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all ${f.state ? "bg-[#1e3a5f] text-white border-[#1e3a5f]" : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map */}
      <MapView markers={mapMarkers().filter(m => m.type === "shelter")} height="h-56" />

      {/* Shelter cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        {filtered.map(s => {
          const pct = Math.round((s.currentOccupancy / s.capacity) * 100);
          return (
            <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 pr-3">
                  <p className="text-sm font-bold text-[#0f1b2d] leading-snug">{s.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" />{s.location.label}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${s.status === "open" ? "bg-green-100 text-green-700" : s.status === "full" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>
                  {s.status === "open" ? "Available" : s.status === "full" ? "Full" : "Closed"}
                </span>
              </div>

              {/* Occupancy bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                  <span>Occupancy</span>
                  <span>{s.currentOccupancy}/{s.capacity} ({pct}%)</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100">
                  <div
                    className={`h-2 rounded-full transition-all ${pct >= 100 ? "bg-red-500" : pct > 80 ? "bg-orange-400" : "bg-green-500"}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>

              {/* Facilities */}
              <div className="flex flex-wrap gap-1 mb-3">
                {s.hasMedical && (
                  <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded-full">
                    <Stethoscope className="w-2.5 h-2.5" /> Medical
                  </span>
                )}
                {s.hasFood && (
                  <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded-full">
                    <Utensils className="w-2.5 h-2.5" /> Food
                  </span>
                )}
                {s.facilities.slice(0, 3).map(f => (
                  <span key={f} className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">{f}</span>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 flex items-center gap-1"><Navigation className="w-3 h-3" />{userLoc ? `${distanceKm(userLoc, s.location).toFixed(1)} km away` : "Allow location for distance"}</span>
                <button
                  onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${s.location.lat},${s.location.lng}`, "_blank", "noopener")}
                  className="text-xs font-semibold text-white px-3 py-1.5 rounded-lg transition-colors hover:opacity-90"
                  style={{ background: "#1e3a5f" }}
                >
                  Get Directions
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Profile ──────────────────────────────────────────────────────────────────
function ListEditor({ title, items, placeholder, onChange, max = 8, emptyText }: {
  title: string; items: string[]; placeholder: string; onChange: (next: string[]) => void; max?: number; emptyText: string;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    if (items.length >= max) { toast.error(`You can add up to ${max} entries.`); return; }
    onChange([...items, v]);
    setDraft("");
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-sm font-bold text-[#0f1b2d] mb-3">{title}</h3>
      <div className="space-y-2 mb-3">
        {items.length === 0 && <p className="text-xs text-gray-500">{emptyText}</p>}
        {items.map((item, i) => (
          <div key={`${item}-${i}`} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
            <span className="text-xs text-[#0f1b2d]">{item}</span>
            <button onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700 text-[11px] font-semibold">Remove</button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }} placeholder={placeholder}
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#1e3a5f]" />
        <button onClick={add} className="px-3 py-2 rounded-xl bg-[#1e3a5f] text-white text-xs font-semibold hover:opacity-90">Add</button>
      </div>
    </div>
  );
}

function VictimProfile() {
  const session = useSession();
  const profile = session.profile!;
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: profile.name, phone: profile.phone ?? "", location: profile.location, bloodGroup: profile.bloodGroup ?? "" });

  const save = async () => {
    if (!form.name.trim()) { toast.error("Name is required."); return; }
    await session.updateProfile({ name: form.name.trim(), phone: form.phone.trim(), location: form.location.trim(), bloodGroup: form.bloodGroup });
    setEditing(false);
    toast.success("Profile updated.");
  };

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#1e3a5f] flex items-center justify-center text-white text-lg font-bold">{initialsOf(profile.name)}</div>
            <div>
              <p className="text-base font-bold text-[#0f1b2d]">{profile.name}</p>
              <p className="text-xs text-gray-500">Victim{profile.location ? ` · ${profile.location}` : ""}</p>
              {session.emailVerified ? (
                <span className="inline-flex items-center gap-1 text-[10px] text-green-700 bg-green-100 px-2 py-0.5 rounded-full mt-1"><CheckCircle className="w-3 h-3" /> Email verified</span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full mt-1"><Clock className="w-3 h-3" /> Email not verified</span>
              )}
            </div>
          </div>
          <button onClick={() => setEditing(v => !v)} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
            <Edit3 className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>

        {editing ? (
          <div className="grid grid-cols-2 gap-3 text-sm">
            {([["name", "Full Name"], ["phone", "Phone"], ["location", "District / Area"], ["bloodGroup", "Blood Group"]] as const).map(([k, label]) => (
              <div key={k}>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-1">{label}</p>
                <input value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a5f]" />
              </div>
            ))}
            <div className="col-span-2 flex gap-2 mt-1">
              <button onClick={save} className="px-4 py-2 rounded-xl bg-[#1e3a5f] text-white text-xs font-semibold">Save changes</button>
              <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 text-xs font-semibold">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              { label: "Full Name", value: profile.name },
              { label: "Phone", value: profile.phone || "Not added" },
              { label: "Email", value: profile.email },
              { label: "District / Area", value: profile.location || "Not added" },
              { label: "Blood Group", value: profile.bloodGroup || "Not added" },
              { label: "Member since", value: profile.joinedAt },
            ].map(f => (
              <div key={f.label}>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">{f.label}</p>
                <p className="text-sm font-medium text-[#0f1b2d] break-words">{f.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <ListEditor title="Family Members" items={profile.familyMembers ?? []} placeholder="e.g. Amena Begum (Wife, 45)" emptyText="No family members added yet." onChange={v => session.updateProfile({ familyMembers: v })} />
      <ListEditor title="Medical Conditions" items={profile.medicalConditions ?? []} placeholder="e.g. Diabetes" emptyText="No conditions listed." onChange={v => session.updateProfile({ medicalConditions: v })} />
      <ListEditor title="Emergency Contacts" items={profile.emergencyContacts ?? []} placeholder="+880 1XXXXXXXXX" max={5} emptyText="No emergency contacts added yet." onChange={v => session.updateProfile({ emergencyContacts: v })} />
    </div>
  );
}

// ─── Main Portal ──────────────────────────────────────────────────────────────
export default function VictimPortal({ onNavigate }: { onNavigate: (v: string) => void }) {
  useDbRevision();
  const session = useSession();
  const uid = session.profile!.id;
  const [activePage, setActivePage] = useState<VictimPage>("dashboard");
  const [notifs, setNotifs] = usePersistedState("notifications");
  const [rescuePolls, setRescuePolls] = usePersistedState("rescuePolls");
  const userHearts: Record<string, boolean> = Object.fromEntries(rescuePolls.map(p => [p.id, !!p.heartedBy?.includes(uid)]));

  const handleToggleHeart = (pollId: string) => {
    const hasHearted = userHearts[pollId];
    setRescuePolls(prev => prev.map(poll => {
      if (poll.id !== pollId) return poll;
      const heartedBy = hasHearted ? (poll.heartedBy ?? []).filter(id => id !== uid) : [...(poll.heartedBy ?? []), uid];
      return { ...poll, heartedBy, hearts: Math.max(0, poll.hearts + (hasHearted ? -1 : 1)) };
    }));
    toast.success(hasHearted ? "Removed heart support." : "Added heart support for rescue alert");
  };

  return (
    <PortalLayout
      navItems={NAV_ITEMS}
      activePage={activePage}
      onNavigate={p => setActivePage(p as VictimPage)}
      userName={session.name}
      userRole="Victim"
      userInitials={initialsOf(session.name)}
      portalLabel="Victim Portal"
      onLogout={() => onNavigate("landing")}
      notifications={notifs}
      onMarkRead={id => setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))}
    >
      {activePage === "dashboard"       && <VictimDashboard onNavigate={setActivePage} rescuePolls={rescuePolls} onToggleHeart={handleToggleHeart} userHearts={userHearts} />}
      {activePage === "request-help"    && <RequestHelp onBroadcastRescue={(poll) => setRescuePolls(prev => [poll, ...prev])} />}
      {activePage === "track-requests"  && <TrackRequests />}
      {activePage === "shelters"        && <SheltersPage />}
      {activePage === "profile"         && <VictimProfile />}
    </PortalLayout>
  );
}
