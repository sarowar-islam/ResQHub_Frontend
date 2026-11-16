import { useEffect, useRef, useState } from "react";
import { Crosshair, Loader2, MapPin, Search } from "lucide-react";
import type { MapMarker } from "../data/mockData";
import { GOOGLE_MAPS_API_KEY, loadGoogleMaps } from "../lib/googleMaps";

export interface PickedLocation { lat: number; lng: number; }

interface MapViewProps {
  markers: MapMarker[];
  className?: string;
  height?: string;
  /** When provided the map becomes a picker: click the map, search, or use your location. */
  onSelectLocation?: (label: string, point?: PickedLocation) => void;
}

const MARKER_CONFIG = {
  victim:    { color: "#dc2626", label: "Victims" },
  volunteer: { color: "#1e3a5f", label: "Volunteers" },
  shelter:   { color: "#16a34a", label: "Shelters" },
  medical:   { color: "#7c3aed", label: "Medical" },
  relief:    { color: "#f97316", label: "Relief" },
};

const BANGLADESH_CENTER = { lat: 23.685, lng: 90.3563 };
const BANGLADESH_BOUNDS = { south: 20.5, west: 88.0, north: 26.7, east: 92.8 };

const esc = (v: string) => v.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

export default function MapView({ markers, className = "", height = "h-80", onSelectLocation }: MapViewProps) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const gRef = useRef<any>(null);
  const markerObjs = useRef<any[]>([]);
  const pickMarker = useRef<any>(null);
  const info = useRef<any>(null);
  const onSelectRef = useRef(onSelectLocation);
  onSelectRef.current = onSelectLocation;

  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [errorKind, setErrorKind] = useState("");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState("");
  const selectable = !!onSelectLocation;
  const markerKey = markers.map(m => m.id).join("|");

  // Initialise the map once
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then(google => {
        if (cancelled || !el.current) return;
        gRef.current = google;
        map.current = new google.maps.Map(el.current, {
          center: BANGLADESH_CENTER,
          zoom: 7,
          minZoom: 5,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          clickableIcons: false,
          gestureHandling: "cooperative",
        });
        info.current = new google.maps.InfoWindow();
        if (onSelectRef.current) {
          map.current.addListener("click", (e: any) => pick(e.latLng.lat(), e.latLng.lng()));
        }
        setState("ready");
      })
      .catch((e: Error) => { if (!cancelled) { setErrorKind(e.message); setState("error"); } });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Draw data markers whenever they change
  useEffect(() => {
    if (state !== "ready") return;
    const g = gRef.current;
    markerObjs.current.forEach(m => m.setMap(null));
    markerObjs.current = markers.map(m => {
      const cfg = MARKER_CONFIG[m.type];
      const marker = new g.maps.Marker({
        map: map.current,
        position: { lat: m.location.lat, lng: m.location.lng },
        title: m.label,
        icon: { path: g.maps.SymbolPath.CIRCLE, scale: 8, fillColor: cfg.color, fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2 },
      });
      marker.addListener("click", () => {
        info.current.setContent(
          `<div style="font-family:DM Sans,system-ui,sans-serif;max-width:220px">
            <div style="font-weight:700;font-size:13px;color:#0f1b2d">${esc(m.label)}</div>
            <div style="font-size:11px;color:#5a7190;margin-top:2px">${esc(m.location.label)}</div>
            <div style="font-size:11px;color:#0f1b2d;margin-top:4px">${esc(m.detail)}</div>
            ${m.status ? `<div style="display:inline-block;margin-top:6px;font-size:10px;font-weight:600;padding:2px 8px;border-radius:99px;background:${cfg.color}22;color:${cfg.color}">${esc(m.status)}</div>` : ""}
          </div>`,
        );
        info.current.open({ map: map.current, anchor: marker });
        onSelectRef.current?.(m.location.label, { lat: m.location.lat, lng: m.location.lng });
        if (onSelectRef.current) setPicked(m.location.label);
      });
      return marker;
    });
    if (markers.length > 1 && !pickMarker.current) {
      const b = new g.maps.LatLngBounds();
      markers.forEach(m => b.extend({ lat: m.location.lat, lng: m.location.lng }));
      map.current.fitBounds(b, 48);
    } else if (markers.length === 1 && !pickMarker.current) {
      map.current.setCenter({ lat: markers[0].location.lat, lng: markers[0].location.lng });
      map.current.setZoom(11);
    }
  }, [markerKey, state]);

  function placePin(lat: number, lng: number) {
    const g = gRef.current;
    if (!pickMarker.current) {
      pickMarker.current = new g.maps.Marker({
        map: map.current,
        animation: g.maps.Animation.DROP,
        icon: { path: g.maps.SymbolPath.BACKWARD_CLOSED_ARROW, scale: 6, fillColor: "#dc2626", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2 },
      });
    }
    pickMarker.current.setPosition({ lat, lng });
  }

  async function pick(lat: number, lng: number, knownLabel?: string) {
    placePin(lat, lng);
    let label = knownLabel ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    if (!knownLabel) {
      try {
        const res = await new gRef.current.maps.Geocoder().geocode({ location: { lat, lng } });
        if (res.results?.[0]) label = res.results[0].formatted_address;
      } catch { /* keep coordinates as the label */ }
    }
    setPicked(label);
    onSelectRef.current?.(label, { lat, lng });
  }

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || state !== "ready") return;
    setBusy(true);
    try {
      const res = await new gRef.current.maps.Geocoder().geocode({
        address: query,
        region: "bd",
        bounds: BANGLADESH_BOUNDS,
      });
      const r = res.results?.[0];
      if (r) {
        const loc = r.geometry.location;
        if (r.geometry.viewport) map.current.fitBounds(r.geometry.viewport);
        else { map.current.setCenter(loc); map.current.setZoom(15); }
        if (selectable) await pick(loc.lat(), loc.lng(), r.formatted_address);
        else placePin(loc.lat(), loc.lng());
      }
    } catch { /* no results */ }
    setBusy(false);
  }

  function locateMe() {
    if (!navigator.geolocation || state !== "ready") return;
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        map.current.setCenter({ lat: latitude, lng: longitude });
        map.current.setZoom(15);
        (selectable ? pick(latitude, longitude) : Promise.resolve(placePin(latitude, longitude))).finally(() => setBusy(false));
      },
      () => setBusy(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-gray-200 bg-[#e8eef4] ${height} ${className}`}>
      <div ref={el} className="absolute inset-0" />

      {state === "ready" && (
        <>
          <form onSubmit={search} className="absolute top-2 left-2 right-14 z-10 flex gap-1.5 max-w-sm">
            <div className="flex-1 flex items-center gap-2 bg-white rounded-xl shadow-md border border-gray-100 px-2.5">
              <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search a place in Bangladesh…"
                className="w-full min-w-0 py-2 text-xs bg-transparent focus:outline-none text-[#0f1b2d]"
              />
              {busy && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400 shrink-0" />}
            </div>
            <button type="button" onClick={locateMe} title="Use my current location" className="w-8 h-8 self-center bg-white rounded-xl shadow-md border border-gray-100 flex items-center justify-center text-[#1e3a5f] hover:bg-gray-50 shrink-0">
              <Crosshair className="w-3.5 h-3.5" />
            </button>
          </form>

          {selectable && (
            <div className="absolute bottom-2 left-2 right-2 z-10 pointer-events-none flex justify-center">
              <div className="bg-white/95 rounded-xl shadow-md border border-gray-100 px-3 py-1.5 text-[10px] text-[#0f1b2d] flex items-center gap-1.5 max-w-full">
                <MapPin className="w-3 h-3 text-red-600 shrink-0" />
                <span className="truncate">{picked || "Tap the map or search to choose a location"}</span>
              </div>
            </div>
          )}

          {!selectable && (
            <div className="absolute bottom-6 left-2 z-10 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-sm border border-gray-100">
              <div className="flex flex-col gap-1">
                {Object.entries(MARKER_CONFIG).map(([type, cfg]) => (
                  <div key={type} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full border border-white/50 shadow-sm" style={{ background: cfg.color }} />
                    <span className="text-[9px] font-medium text-[#5a7190]">{cfg.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {state === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500 gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading map…
        </div>
      )}

      {state === "error" && (
        <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
          <div className="max-w-xs">
            <MapPin className="w-6 h-6 text-gray-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-[#0f1b2d]">Map unavailable</p>
            <p className="text-[11px] text-gray-500 mt-1">
              {errorKind === "MISSING_KEY" || !GOOGLE_MAPS_API_KEY
                ? "Add VITE_GOOGLE_MAPS_API_KEY to enable Google Maps."
                : errorKind === "AUTH_FAILURE"
                  ? "Google rejected the API key. Enable the Maps JavaScript and Geocoding APIs and allow this site's domain."
                  : "Google Maps could not be loaded. Check your connection."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
