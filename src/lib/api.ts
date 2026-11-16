import { projectId, publicAnonKey } from "../../utils/supabase/info";
import { supabase } from "./supabase";

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-5afd0f12`;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token ?? publicAnonKey;
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(init?.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body?.error || `Request failed (${res.status})`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return body as T;
}

export type Snapshot = { data: Record<string, any[]>; stats: any; profile?: any };
export type ChatMessage = { role: "user" | "assistant"; content: string };

export const fetchPublic = () => request<Snapshot>("/public");
export const fetchBootstrap = () => request<Snapshot>("/bootstrap");

export const sendAiChat = (messages: ChatMessage[]) =>
  request<{ reply: string }>("/chat", {
    method: "POST",
    body: JSON.stringify({ messages }),
  });

export const saveRecords = (name: string, items: unknown[], deleted: string[]) =>
  request<{ saved: number; denied: number }>(`/collections/${name}`, {
    method: "PUT",
    body: JSON.stringify({ items, deleted }),
  });
