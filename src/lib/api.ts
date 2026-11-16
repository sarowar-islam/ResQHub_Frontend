import { projectId, publicAnonKey } from "../../utils/supabase/info";

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-5afd0f12`;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${publicAnonKey}`,
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`${path} failed: ${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

export const fetchCollections = () =>
  request<{ seeded: boolean; data: Record<string, any> }>("/collections");

export const seedCollections = (collections: Record<string, unknown>) =>
  request<{ seeded: number }>("/seed", { method: "POST", body: JSON.stringify({ collections }) });

export const saveCollection = (name: string, value: unknown) =>
  request<{ ok: boolean }>(`/collections/${name}`, { method: "PUT", body: JSON.stringify({ value }) });
