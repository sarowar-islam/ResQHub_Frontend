import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { MapPin, X } from "lucide-react";
import { reversePlace } from "../lib/geocode";

export interface UserLocation { lat: number; lng: number; label: string; }
type Status = "idle" | "asking" | "granted" | "denied" | "unsupported";

interface Ctx { location: UserLocation | null; status: Status; request: () => void; }
const LocationContext = createContext<Ctx>({ location: null, status: "idle", request: () => {} });

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [showPrompt, setShowPrompt] = useState(false);

  const request = useCallback(() => {
    if (!navigator.geolocation) { setStatus("unsupported"); return; }
    setStatus("asking");
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setLocation({ lat, lng, label: `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
        setStatus("granted");
        setShowPrompt(false);
        const label = await reversePlace(lat, lng);
        setLocation({ lat, lng, label });
      },
      () => { setStatus("denied"); setShowPrompt(false); },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }, []);

  // On first visit show the browser permission prompt; if it was already granted, just load it.
  useEffect(() => {
    if (!navigator.geolocation) { setStatus("unsupported"); return; }
    const perms = (navigator as any).permissions;
    if (perms?.query) {
      perms.query({ name: "geolocation" }).then((p: any) => {
        if (p.state === "granted") request();
        else if (p.state === "prompt") setShowPrompt(true);
        else setStatus("denied");
      }).catch(() => setShowPrompt(true));
    } else {
      setShowPrompt(true);
    }
  }, [request]);

  return (
    <LocationContext.Provider value={{ location, status, request }}>
      {children}
      {showPrompt && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:w-96 z-[100] bg-white rounded-2xl shadow-2xl border border-gray-100 p-4" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0"><MapPin className="w-4 h-4 text-[#1e3a5f]" /></div>
            <div className="flex-1">
              <p className="text-sm font-bold text-[#0f1b2d]">Share your location?</p>
              <p className="text-xs text-gray-500 mt-0.5">ResQHub uses it to centre maps on you and to speed up help requests.</p>
              <div className="flex gap-2 mt-3">
                <button onClick={request} className="px-3 py-1.5 rounded-lg bg-[#1e3a5f] text-white text-xs font-semibold">Allow location</button>
                <button onClick={() => setShowPrompt(false)} className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold">Not now</button>
              </div>
            </div>
            <button onClick={() => setShowPrompt(false)} className="text-gray-400"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </LocationContext.Provider>
  );
}

export const useUserLocation = () => useContext(LocationContext);
