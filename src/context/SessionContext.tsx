import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { fetchBootstrap, fetchPublic } from "../lib/api";
import { applySnapshot, upsertRecord } from "./DataContext";
import type { AppUser } from "../types";

export type UserRole = "victim" | "volunteer" | "ngo" | "admin";

export interface SignUpInput {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: UserRole;
  lat?: number;
  lng?: number;
  locationLabel?: string;
}

interface SessionContextType {
  /** False while the session is restored or the signed-in user's data is loading. */
  ready: boolean;
  loadError: string;
  retry: () => void;
  profile: AppUser | null;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  emailVerified: boolean;
  /** Incremented after every background refresh so pages re-render with fresh data. */
  dataVersion: number;
  recovering: boolean;
  authNotice: string;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<{ needsConfirmation: boolean }>;
  resendConfirmation: (email: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (patch: Partial<AppUser>) => Promise<void>;
}

const SessionContext = createContext<SessionContextType | null>(null);
const REFRESH_MS = 15000;

export function SessionProvider({ children }: { children: ReactNode }) {
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [loadError, setLoadError] = useState("");
  const [authNotice, setAuthNotice] = useState("");
  const [recovering, setRecovering] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const loggingOut = useRef(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
      setUser(session?.user ?? null);
      setAuthReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const key = user?.id ?? "anon";

  // Load (or reload) everything the current user may see.
  useEffect(() => {
    if (!authReady) return;
    let cancelled = false;
    (async () => {
      setLoadError("");
      try {
        if (user && !loggingOut.current) {
          try {
            const snap = await fetchBootstrap();
            if (cancelled) return;
            applySnapshot(snap.data, snap.stats);
            setProfile(snap.profile);
            setLoadedKey(key);
            return;
          } catch (e: any) {
            // 401/403: account blocked, suspended or session invalid. Sign out and show why.
            if (e.status === 401 || e.status === 403) {
              setAuthNotice(e.message);
              loggingOut.current = true;
              await supabase.auth.signOut();
              loggingOut.current = false;
              return; // onAuthStateChange will trigger the anonymous load
            }
            throw e;
          }
        }
        const snap = await fetchPublic();
        if (cancelled) return;
        applySnapshot(snap.data, snap.stats);
        setProfile(null);
        setLoadedKey(key);
      } catch (e: any) {
        if (!cancelled) setLoadError(e.message || "Could not reach the ResQHub backend");
      }
    })();
    return () => { cancelled = true; };
  }, [authReady, key, attempt]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep data fresh so new requests, assignments and notifications appear without a reload.
  useEffect(() => {
    if (loadedKey !== key) return;
    const id = setInterval(async () => {
      if (document.hidden) return;
      try {
        const snap = user ? await fetchBootstrap() : await fetchPublic();
        applySnapshot(snap.data, snap.stats);
        if (snap.profile) setProfile(snap.profile);
        setDataVersion(v => v + 1);
      } catch { /* try again on the next tick */ }
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, [loadedKey, key, user]);

  const signIn = useCallback(async (email: string, password: string) => {
    setAuthNotice("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (/confirm/i.test(error.message)) throw new Error("Please confirm your email first. Check your inbox for the confirmation link.");
      throw new Error(error.message);
    }
  }, []);

  const signUp = useCallback(async (input: SignUpInput) => {
    setAuthNotice("");
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          name: input.name, phone: input.phone, role: input.role,
          lat: input.lat, lng: input.lng, locationLabel: input.locationLabel,
        },
      },
    });
    if (error) throw new Error(error.message);
    // An existing confirmed address returns a user with no identities.
    if (data.user && data.user.identities?.length === 0) throw new Error("An account with this email already exists. Please sign in.");
    return { needsConfirmation: !data.session };
  }, []);

  const resendConfirmation = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: window.location.origin } });
    if (error) throw new Error(error.message);
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    if (error) throw new Error(error.message);
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(error.message);
    setRecovering(false);
  }, []);

  const logout = useCallback(async () => {
    setProfile(null);
    await supabase.auth.signOut();
  }, []);

  const updateProfile = useCallback(async (patch: Partial<AppUser>) => {
    if (!profile) return;
    const next = { ...profile, ...patch };
    setProfile(next);
    await upsertRecord("users", next);
  }, [profile]);

  const ready = authReady && loadedKey === key && !loadError;
  const value: SessionContextType = {
    ready, loadError, retry: () => setAttempt(a => a + 1), profile,
    email: profile?.email ?? user?.email ?? "",
    name: profile?.name ?? "",
    phone: profile?.phone ?? "",
    role: (profile?.role as UserRole) ?? "victim",
    emailVerified: !!user?.email_confirmed_at,
    dataVersion, recovering, authNotice,
    signIn, signUp, resendConfirmation, sendPasswordReset, updatePassword, logout, updateProfile,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
