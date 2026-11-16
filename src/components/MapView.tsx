import { useEffect, useMemo, useRef, useState } from "react";
import { Crosshair, Loader2, MapPin, Search } from "lucide-react";
import type { MapMarker } from "../data/mockData";
import { useUserLocation } from "../context/LocationContext";
import { searchPlace } from "../lib/geocode";

export interface PickedLocation { lat: number; lng: number; }

interface MapViewProps {
  markers: MapMarker[];
  className?: string;
  height?: string;
  /** When provided the map becomes a picker: search or use your location to choose a point. */
  onSelectLocation?: (label: string, point?: PickedLocation) => void;
}

const MARKER_CONFIG = {
  victim:    { color: "#dc2626", label: "Victims" },
  volunteer: { color: "#1e3a5f", label: "Volunteers" },
  shelter:   { color: "#16a34a", label: "Shelters" },
  medical:   { color: "#7c3aed", label: "Medical" },
  relief:    { color: "#f97316", label: "Relief" },
};

type Focus = { q: string; zoom: number };
const BANGLADESH: Focus = { q: "23.685,90.3563", zoom: 7 };
// Free Google Maps embed: no API key required.
const embedUrl = (f: Focus) => `https://maps.google.com/maps?q=${encodeURIComponent(f.q)}&z=${f.zoom}&hl=en&output=embed`;

export default function MapView({ markers, className = "", height = "h-80", onSelectLocation }: MapViewProps) {
  const { location: user, status, request } = useUserLocation();
  const selectable = !!onSelectLocation;
  const onSelectRef = useRef(onSelectLocation);
  onSelectRef.current = onSelectLocation;

  const [focus, setFocus] = useState<Focus | null>(null); // null = follow default
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState("");
  const [notFound, setNotFound] = useState(false);
  const autoPicked = useRef(false);

  const markerKey = markers.map(m => m.id).join("|");
  const defaultFocus: Focus = useMemo(() => {
    if (!selectable && markers.length) {
      return { q: `${markers[0].location.lat},${markers[0].location.lng}`, zoom: markers.length === 1 ? 14 : 10 };
    }
    if (user) return { q: `${user.lat},${user.lng}`, zoom: 15 };
    return BANGLADESH;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markerKey, selectable, user?.lat, user?.lng]);
  const current = focus ?? defaultFocus;

  // Picker: the first time the user's location is known, use it as the starting selection.
  useEffect(() => {
    if (selectable && user && !autoPicked.current && !picked) {
      autoPicked.current = true;
      setPicked(user.label);
      onSelectRef.current?.(user.label, { lat: user.lat, lng: user.lng });
    }
  }, [selectable, user, picked]);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setBusy(true); setNotFound(false);
    try {
      const place = await searchPlace(query);
      if (!place) { setNotFound(true); return; }
      setFocus({ q: `${place.lat},${place.lng}`, zoom: 15 });
      setPicked(place.label);
      onSelectRef.current?.(place.label, { lat: place.lat, lng: place.lng });
    } catch { setNotFound(true); }
    finally { setBusy(false); }
  }

  function useMyLocation() {
    if (user) {
      setFocus({ q: `${user.lat},${user.lng}`, zoom: 16 });
      setPicked(user.label);
      onSelectRef.current?.(user.label, { lat: user.lat, lng: user.lng });
    } else {
      request();
    }
  }

  async function showMarker(m: MapMarker) {
    setFocus({ q: `${m.location.lat},${m.location.lng}`, zoom: 15 });
    if (selectable) {
      setPicked(m.location.label);
      onSelectRef.current?.(m.location.label, { lat: m.location.lat, lng: m.location.lng });
    }
  }

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-gray-200 bg-[#e8eef4] ${height} ${className}`}>
      <iframe
        key={embedUrl(current)}
        title="Map"
        src={embedUrl(current)}
        className="absolute inset-0 w-full h-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />

      <form onSubmit={search} className="absolute top-2 left-2 right-2 z-10 flex gap-1.5 max-w-sm">
        <div className="flex-1 flex items-center gap-2 bg-white rounded-xl shadow-md border border-gray-100 px-2.5">
          <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setNotFound(false); }}
            placeholder="Search a place in Bangladesh…"
            className="w-full min-w-0 py-2 text-xs bg-transparent focus:outline-none text-[#0f1b2d]"
          />
          {busy && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400 shrink-0" />}
        </div>
        <button
          type="button"
          onClick={useMyLocation}
          title={status === "denied" ? "Location blocked in browser settings" : "Use my current location"}
          className="w-8 h-8 self-center bg-white rounded-xl shadow-md border border-gray-100 flex items-center justify-center text-[#1e3a5f] hover:bg-gray-50 shrink-0"
        >
          <Crosshair className="w-3.5 h-3.5" />
        </button>
      </form>
      {notFound && (
        <div className="absolute top-12 left-2 z-10 bg-white rounded-lg shadow px-2.5 py-1 text-[10px] text-red-600">No place found. Try a different search.</div>
      )}

      {selectable ? (
        <div className="absolute bottom-2 left-2 right-2 z-10 pointer-events-none flex justify-center">
          <div className="bg-white/95 rounded-xl shadow-md border border-gray-100 px-3 py-1.5 text-[10px] text-[#0f1b2d] flex items-center gap-1.5 max-w-full">
            <MapPin className="w-3 h-3 text-red-600 shrink-0" />
            <span className="truncate">{picked || "Search a place or use your location to choose"}</span>
          </div>
        </div>
      ) : markers.length > 0 && (
        <div className="absolute bottom-2 left-2 right-2 z-10 flex gap-1.5 overflow-x-auto pb-0.5">
          {markers.map(m => (
            <button
              key={m.id}
              onClick={() => showMarker(m)}
              title={`${m.location.label} — ${m.detail}`}
              className="shrink-0 flex items-center gap-1.5 bg-white/95 rounded-full shadow-md border border-gray-100 px-2.5 py-1 text-[10px] font-medium text-[#0f1b2d] hover:bg-white"
            >
              <span className="w-2 h-2 rounded-full" style={{ background: MARKER_CONFIG[m.type].color }} />
              {m.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
