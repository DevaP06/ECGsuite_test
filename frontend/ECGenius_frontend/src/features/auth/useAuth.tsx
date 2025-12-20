import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Role = "doctor" | "admin";
type Session = { token: string; role: Role; doctorId: string; name: string } | null;

const AuthCtx = createContext<{
  session: Session;
  signin: (email: string, password: string) => Promise<void>;
  signout: () => void;
} | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session>(null);

  useEffect(() => {
    const raw = localStorage.getItem("ecg:session");
    if (raw) setSession(JSON.parse(raw));
  }, []);

  const value = useMemo(() => ({
    session,
    signin: async (_email: string, _password: string) => {
      // TODO: replace with real API
      const next: Session = { token: "jwt-demo", role: "doctor", doctorId: "doc_1", name: "Dr. Jane Doe" };
      localStorage.setItem("ecg:session", JSON.stringify(next));
      setSession(next);
    },
    signout: () => {
      localStorage.removeItem("ecg:session");
      setSession(null);
    },
  }), [session]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
