import { createContext, useContext, useEffect, useMemo, useState } from "react";
import AxiosInstance from "../../AxiosInstance";

export interface User {
  id: string;
  username: string;
  email: string;
  role?: string;
}

export interface Session {
  token: string;
  user: User;
}

const AuthCtx = createContext<{
  session: Session | null;
  signin: (emailOrUsername: string, password: string) => Promise<void>;
  signout: () => void;
} | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => {
    const raw = localStorage.getItem("ecg:session");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.token && parsed.user) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse ecg:session from localStorage during initialization:", e);
      }
    }
    return null;
  });

  useEffect(() => {
    if (session?.token) {
      AxiosInstance.defaults.headers.common['Authorization'] = `Bearer ${session.token}`;
    } else {
      delete AxiosInstance.defaults.headers.common['Authorization'];
    }
  }, [session]);

  const value = useMemo(
    () => ({
      session,
      signin: async (emailOrUsername: string, password: string) => {
        const payload = { emailOrUsername, password };
        const res = await AxiosInstance.post("/api/auth/login", payload);
        const responseData = res.data?.data || res.data;
        const user: User = responseData?.user;
        const token: string = responseData?.token;
        if (!user || !token) throw new Error("Login failed: no user or token returned");
        const next: Session = { token, user };
        localStorage.setItem("ecg:session", JSON.stringify(next));
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        setSession(next);
      },
      signout: () => {
        localStorage.removeItem("ecg:session");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
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

