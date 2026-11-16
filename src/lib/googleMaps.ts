// Loads the Google Maps JavaScript API once. Needs VITE_GOOGLE_MAPS_API_KEY.
export const GOOGLE_MAPS_API_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) ?? "";

let loader: Promise<any> | null = null;

export function loadGoogleMaps(): Promise<any> {
  const w = window as any;
  if (w.google?.maps) return Promise.resolve(w.google);
  if (!GOOGLE_MAPS_API_KEY) return Promise.reject(new Error("MISSING_KEY"));
  if (!loader) {
    loader = new Promise((resolve, reject) => {
      w.__resqhubMapsReady = () => resolve(w.google);
      w.gm_authFailure = () => reject(new Error("AUTH_FAILURE"));
      const s = document.createElement("script");
      s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}&v=weekly&region=BD&callback=__resqhubMapsReady`;
      s.async = true;
      s.onerror = () => { loader = null; reject(new Error("LOAD_FAILURE")); };
      document.head.appendChild(s);
    });
  }
  return loader;
}
