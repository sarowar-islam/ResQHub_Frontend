import { createContext, useCallback, useContext, useEffect, useState, ReactNode, Dispatch, SetStateAction } from "react";
import { SEED_COLLECTIONS } from "../data/mockData";
import { fetchCollections, saveCollection, seedCollections } from "../lib/api";

export type Collections = typeof SEED_COLLECTIONS;
export type CollectionName = keyof Collections;

/**
 * Live copy of the Supabase data. It is filled before any page renders
 * (DataProvider gates the app), so pages can read `db.helpRequests` etc. directly.
 */
export const db = {} as Collections;

const DataContext = createContext<{ reload: () => Promise<void> } | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      let res = await fetchCollections();
      if (!res.seeded) {
        // First run (or a missing collection): upload starter data, never overwriting existing rows.
        await seedCollections(SEED_COLLECTIONS);
        res = await fetchCollections();
      }
      Object.assign(db, res.data);
      setStatus("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (status !== "ready") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f7fb] px-6" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <div className="text-center max-w-sm">
          {status === "loading" ? (
            <>
              <div className="w-10 h-10 mx-auto mb-4 rounded-full border-4 border-[#1e3a5f]/20 border-t-[#1e3a5f] animate-spin" />
              <p className="text-sm font-semibold text-[#0f1b2d]">Loading ResQHub…</p>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-[#0f1b2d] mb-1">Could not reach the ResQHub backend</p>
              <p className="text-xs text-gray-500 mb-4 break-words">{error}</p>
              <button onClick={load} className="px-4 py-2 rounded-xl bg-[#1e3a5f] text-white text-sm font-semibold">Retry</button>
            </>
          )}
        </div>
      </div>
    );
  }

  return <DataContext.Provider value={{ reload: load }}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}

/** Prepend one item to a collection and save it. */
export function addToCollection<K extends CollectionName>(name: K, item: Collections[K] extends (infer T)[] ? T : never) {
  const next = [item, ...(db[name] as unknown as unknown[])] as unknown as Collections[K];
  db[name] = next;
  return saveCollection(name, next);
}

/** Drop-in replacement for useState(MOCK_DATA): same API, but every change is saved to Supabase. */
export function usePersistedState<K extends CollectionName>(
  name: K,
  initial: Collections[K] = db[name],
): [Collections[K], Dispatch<SetStateAction<Collections[K]>>] {
  const [value, setValue] = useState<Collections[K]>(initial);
  const [dirty, setDirty] = useState(false);

  const set: Dispatch<SetStateAction<Collections[K]>> = useCallback((next) => {
    setDirty(true);
    setValue(next);
  }, []);

  useEffect(() => {
    if (!dirty) return;
    // Only persist when the state is the full collection (not a filtered view).
    if (initial !== db[name]) return;
    db[name] = value;
    saveCollection(name, value).catch(err => console.error(`Failed to save ${name}`, err));
  }, [value, dirty, name, initial]);

  return [value, set];
}
