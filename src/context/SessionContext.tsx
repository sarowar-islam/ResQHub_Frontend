import { createContext, useContext, useState, ReactNode } from "react";
import { type UserRole } from "../pages/Auth";

interface SessionContextType {
  email: string;
  setEmail: (v: string) => void;
  name: string;
  setName: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  role: UserRole;
  setRole: (v: UserRole) => void;
  emailVerified: boolean;
  setEmailVerified: (v: boolean) => void;
  logout: () => void;
}

const SessionContext = createContext<SessionContextType | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<UserRole>("victim");
  const [emailVerified, setEmailVerified] = useState(false);

  const logout = () => {
    setEmail("");
    setName("");
    setPhone("");
    setRole("victim");
    setEmailVerified(false);
  };

  return (
    <SessionContext.Provider value={{ email, setEmail, name, setName, phone, setPhone, role, setRole, emailVerified, setEmailVerified, logout }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
