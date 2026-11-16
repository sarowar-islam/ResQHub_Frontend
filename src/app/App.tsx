import { useEffect, useRef, useState } from "react";
import { Toaster } from "sonner";
import Landing from "../pages/Landing";
import Auth, { type UserRole } from "../pages/Auth";
import VictimPortal from "../pages/VictimPortal";
import VolunteerPortal from "../pages/VolunteerPortal";
import NGOPortal from "../pages/NGOPortal";
import AdminPortal from "../pages/AdminPortal";
import { SessionProvider, useSession } from "../context/SessionContext";
import { LocationProvider } from "../context/LocationContext";

type AppView = "landing" | "login" | "signup" | "victim" | "volunteer" | "ngo" | "admin";
type AuthMode = "login" | "signup";

function AppContent() {
  const [view, setView] = useState<AppView>("landing");
  const [authRole, setAuthRole] = useState<UserRole>("victim");
  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const session = useSession();

  // Send people to their own portal whenever a signed-in profile appears (login, signup or page reload).
  const lastProfileId = useRef<string | null>(null);
  useEffect(() => {
    const id = session.profile?.id ?? null;
    if (id && id !== lastProfileId.current) setView(session.profile!.role as AppView);
    if (!id && lastProfileId.current) setView("landing");
    lastProfileId.current = id;
  }, [session.profile]);

  const navigate = (v: string, role: UserRole = "victim", mode: AuthMode = "signup") => {
    if (v === "landing") {
      session.logout();
      setView("landing");
      return;
    }
    setView(v as AppView);
    if (v === "login" || v === "signup") {
      setAuthRole(role);
      setAuthMode(mode);
    }
  };

  const font = { fontFamily: "'DM Sans', system-ui, sans-serif" };

  let content: React.ReactNode;
  if (session.loadError) {
    content = (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f7fb] px-6">
        <div className="text-center max-w-sm">
          <p className="text-sm font-bold text-[#0f1b2d] mb-1">Could not reach the ResQHub backend</p>
          <p className="text-xs text-gray-500 mb-4 break-words">{session.loadError}</p>
          <button onClick={session.retry} className="px-4 py-2 rounded-xl bg-[#1e3a5f] text-white text-sm font-semibold">Retry</button>
        </div>
      </div>
    );
  } else if (!session.ready) {
    content = (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f7fb]">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-4 rounded-full border-4 border-[#1e3a5f]/20 border-t-[#1e3a5f] animate-spin" />
          <p className="text-sm font-semibold text-[#0f1b2d]">Loading ResQHub…</p>
        </div>
      </div>
    );
  } else if (session.recovering) {
    content = <Auth initialMode="login" defaultRole="victim" onNavigate={navigate} />;
  } else {
    content = (
      <>
        {view === "landing" && <Landing onNavigate={navigate} />}
        {view === "login" && <Auth initialMode={authMode === "signup" ? "signup" : "login"} defaultRole={authRole} onNavigate={navigate} />}
        {view === "signup" && <Auth initialMode={authMode === "login" ? "login" : "signup"} defaultRole={authRole} onNavigate={navigate} />}
        {session.profile && view === "victim" && <VictimPortal onNavigate={navigate} />}
        {session.profile && view === "volunteer" && <VolunteerPortal onNavigate={navigate} />}
        {session.profile && view === "ngo" && <NGOPortal onNavigate={navigate} />}
        {session.profile && view === "admin" && <AdminPortal onNavigate={navigate} />}
        {!session.profile && ["victim", "volunteer", "ngo", "admin"].includes(view) && <Auth initialMode="login" defaultRole="victim" onNavigate={navigate} />}
      </>
    );
  }

  return (
    <div className="min-h-screen" style={font}>
      <Toaster
        position="top-right"
        richColors
        toastOptions={{ style: { ...font, fontSize: "13px", borderRadius: "12px" }, duration: 3500 }}
      />
      {content}
    </div>
  );
}

export default function App() {
  return (
    <LocationProvider>
      <SessionProvider>
        <AppContent />
      </SessionProvider>
    </LocationProvider>
  );
}
