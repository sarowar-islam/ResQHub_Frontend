// Free OpenStreetMap Nominatim lookups (no API key) used to turn embed searches into coordinates.
export interface Place { lat: number; lng: number; label: string; }

export async function searchPlace(query: string): Promise<Place | null> {
  const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=bd&q=${encodeURIComponent(query)}`);
  if (!res.ok) return null;
  const [r] = await res.json();
  return r ? { lat: parseFloat(r.lat), lng: parseFloat(r.lon), label: r.display_name } : null;
}

export async function reversePlace(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
    if (res.ok) {
      const r = await res.json();
      if (r?.display_name) return r.display_name as string;
    }
  } catch { /* fall through */ }
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}
