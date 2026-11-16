import { useCallback, useEffect, useRef, useState, useSyncExternalStore, Dispatch, SetStateAction } from "react";
import { toast } from "sonner";
import type {
  Alert, Announcement, Campaign, HelpRequest, InventoryItem, NGO, NewsItem, Notification,
  RescuePoll, Shelter, Stats, Testimonial, AppUser, Volunteer,
} from "../types";
import { saveRecords } from "../lib/api";

export interface Collections {
  alerts: Alert[];
  announcements: Announcement[];
  campaigns: Campaign[];
  helpRequests: HelpRequest[];
  inventory: InventoryItem[];
  news: NewsItem[];
  ngos: NGO[];
  notifications: Notification[];
  rescuePolls: RescuePoll[];
  shelters: Shelter[];
  testimonials: Testimonial[];
  users: AppUser[];
  volunteers: Volunteer[];
}
export type CollectionName = keyof Collections;

const EMPTY_STATS: Stats = {
  victimsHelped: 0, registeredVolunteers: 0, partnerNGOs: 0, activeShelters: 0,
  activeRequests: 0, completedRequests: 0, criticalRequests: 0,
};

/** Live copy of what the signed-in user may see, loaded from Supabase before any page renders. */
export const db: Collections & { stats: Stats } = {
  alerts: [], announcements: [], campaigns: [], helpRequests: [], inventory: [], news: [], ngos: [],
  notifications: [], rescuePolls: [], shelters: [], testimonials: [], users: [], volunteers: [],
  stats: EMPTY_STATS,
};

const listeners = new Set<() => void>();
export const subscribeDb = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };

export function applySnapshot(data: Record<string, any[]>, stats: Stats) {
  (Object.keys(db) as (keyof typeof db)[]).forEach(k => { if (k !== "stats") (db as any)[k] = data[k] ?? []; });
  db.stats = stats ?? EMPTY_STATS;
  listeners.forEach(fn => fn());
  bump();
}

// Re-renders any component using useDbRevision() when records change anywhere in the app.
let revision = 0;
const revListeners = new Set<() => void>();
const bump = () => { revision++; revListeners.forEach(fn => fn()); };
export const useDbRevision = () =>
  useSyncExternalStore(fn => { revListeners.add(fn); return () => { revListeners.delete(fn); }; }, () => revision);

const pending = new Set<string>();

function persist(name: CollectionName, items: unknown[], deleted: string[]) {
  const key = `${name}:${Math.random()}`;
  pending.add(key);
  return saveRecords(name, items, deleted)
    .then(res => {
      if (res.denied > 0) toast.error("Some changes were not permitted for your account.");
    })
    .catch(err => toast.error(`Could not save ${name}: ${err.message}`))
    .finally(() => pending.delete(key));
}

/** Create or replace a single record and save it. */
export function upsertRecord<K extends CollectionName>(name: K, record: Collections[K][number]) {
  const list = db[name] as unknown as { id: string }[];
  const idx = list.findIndex(r => r.id === (record as any).id);
  (db as any)[name] = idx >= 0 ? list.map((r, i) => (i === idx ? record : r)) : [record, ...list];
  bump();
  return persist(name, [record], []);
}

/** Merge changes into one existing record and save it. */
export function patchRecord<K extends CollectionName>(name: K, id: string, patch: Partial<Collections[K][number]>) {
  const list = db[name] as unknown as { id: string }[];
  const current = list.find(r => r.id === id);
  if (!current) return Promise.resolve();
  return upsertRecord(name, { ...current, ...patch } as any);
}

/** Delete one record. */
export function removeRecord(name: CollectionName, id: string) {
  (db as any)[name] = (db[name] as unknown as { id: string }[]).filter(r => r.id !== id);
  bump();
  return persist(name, [], [id]);
}

/** Prepend one item to a collection and save it. */
export const addToCollection = upsertRecord;

const snapshotOf = (list: { id: string }[]) => new Map(list.map(r => [r.id, JSON.stringify(r)]));

/**
 * Like useState for a whole collection, but every change is diffed against the last saved copy
 * and only the changed/removed records are sent to Supabase. Background refreshes update it too.
 */
export function usePersistedState<K extends CollectionName>(
  name: K,
): [Collections[K], Dispatch<SetStateAction<Collections[K]>>] {
  const [value, setValue] = useState<Collections[K]>(db[name]);
  const [dirty, setDirty] = useState(0);
  const synced = useRef(snapshotOf(db[name] as any));

  const set: Dispatch<SetStateAction<Collections[K]>> = useCallback((next) => {
    setDirty(d => d + 1);
    setValue(next);
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const list = value as unknown as { id: string }[];
    const changed = list.filter(r => synced.current.get(r.id) !== JSON.stringify(r));
    const ids = new Set(list.map(r => r.id));
    const deleted = [...synced.current.keys()].filter(id => !ids.has(id));
    if (!changed.length && !deleted.length) return;
    synced.current = snapshotOf(list);
    (db as any)[name] = value;
    bump();
    persist(name, changed, deleted);
  }, [value, dirty, name]);

  // Pick up background refreshes unless local edits are still being saved.
  useEffect(() => subscribeDb(() => {
    if (pending.size) return;
    synced.current = snapshotOf(db[name] as any);
    setValue(db[name]);
  }), [name]);

  return [value, set];
}
