import { createContext, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";

type User = { id: string; username: string; email: string };
type Session = { user: User } | null;

const AuthCtx = createContext<{
  session: Session;
  signin: (emailOrUsername: string, password: string) => Promise<void>;
  signout: () => void;
} | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session>(null);

  useEffect(() => {
    const raw = localStorage.getItem("ecg:session");
    if (raw) setSession(JSON.parse(raw));
  }, []);

  const value = useMemo(
    () => ({
      session,
      signin: async (emailOrUsername: string, password: string) => {
        const payload = { emailOrUsername, password };
        const res = await axios.post("/api/auth/login", payload);
        const user: User = res.data?.user;
        if (!user) throw new Error("Login failed: no user returned");
        const next: Session = { user };
        localStorage.setItem("ecg:session", JSON.stringify(next));
        setSession(next);
      },
      signout: () => {
        localStorage.removeItem("ecg:session");
        setSession(null);
      },
    }),
    [session]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
