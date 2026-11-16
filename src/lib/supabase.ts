import { createClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "../../utils/supabase/info";

export const supabase = createClient(`https://${projectId}.supabase.co`, publicAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

/** Public site URL used in confirmation / reset emails. Must be in Supabase Auth > URL Configuration > Redirect URLs. */
export const SITE_URL: string = (import.meta.env.VITE_SITE_URL as string | undefined) || "https://resqhub-bd.netlify.app";
