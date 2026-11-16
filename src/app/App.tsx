import { useState } from "react";
import { Toaster } from "sonner";
import Landing from "../pages/Landing";
import Auth, { type UserRole } from "../pages/Auth";
import VictimPortal from "../pages/VictimPortal";
import VolunteerPortal from "../pages/VolunteerPortal";
import NGOPortal from "../pages/NGOPortal";
import AdminPortal from "../pages/AdminPortal";
import { SessionProvider, useSession } from "../context/SessionContext";
import { DataProvider } from "../context/DataContext";

type AppView = "landing" | "login" | "signup" | "victim" | "volunteer" | "ngo" | "admin";
type AuthMode = "login" | "signup";

function AppContent() {
  const [view, setView] = useState<AppView>("landing");
  const [authRole, setAuthRole] = useState<UserRole>("victim");
  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const session = useSession();

  const navigate = (v: string, role: UserRole = "victim", mode: AuthMode = "signup") => {
    setView(v as AppView);
    if (v === "login" || v === "signup") {
      setAuthRole(role);
      setAuthMode(mode);
    }
    if (v === "landing") {
      session.logout();
    }
  };

  return (
    <div className="min-h-screen" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <Toaster
        position="top-right"
        richColors
        toastOptions={{
          style: {
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontSize: "13px",
            borderRadius: "12px",
          },
          duration: 3500,
        }}
      />

      {view === "landing" && <Landing onNavigate={navigate} />}
      {view === "login" && <Auth initialMode={authMode === "signup" ? "signup" : "login"} defaultRole={authRole} onNavigate={navigate} />}
      {view === "signup" && <Auth initialMode={authMode === "login" ? "login" : "signup"} defaultRole={authRole} onNavigate={navigate} />}
      {view === "victim" && <VictimPortal onNavigate={navigate} />}
      {view === "volunteer" && <VolunteerPortal onNavigate={navigate} />}
      {view === "ngo" && <NGOPortal onNavigate={navigate} />}
      {view === "admin" && <AdminPortal onNavigate={navigate} />}
    </div>
  );
}

export default function App() {
  return (
    <DataProvider>
      <SessionProvider>
        <AppContent />
      </SessionProvider>
    </DataProvider>
  );
}
