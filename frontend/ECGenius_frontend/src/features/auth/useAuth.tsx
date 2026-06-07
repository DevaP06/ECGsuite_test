import { createContext, useContext, useEffect, useMemo, useState } from "react";
import AxiosInstance from "../../AxiosInstance";

export type OnboardingStep = "role" | "profile" | "complete";

export interface User {
  id: string;
  username: string;
  email: string;
  role?: string;
  onboardingStep?: OnboardingStep;
  profile?: Record<string, unknown>;
}

export interface Session {
  token: string;
  user: User;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

const AuthCtx = createContext<{
  session: Session | null;
  signin: (emailOrUsername: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  updateUser: (user: User) => void;
  signout: () => void;
} | null>(null);

function persistSession(next: Session) {
  localStorage.setItem("ecg:session", JSON.stringify(next));
  localStorage.setItem("token", next.token);
  localStorage.setItem("user", JSON.stringify(next.user));
}

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
        persistSession(next);
        setSession(next);
      },
      register: async (payload: RegisterPayload) => {
        const res = await AxiosInstance.post("/api/auth/register", payload);
        const responseData = res.data?.data || res.data;
        const user: User = responseData?.user;
        const token: string = responseData?.token;
        if (!user || !token) throw new Error("Registration failed: no user or token returned");
        // Backend already returns a session on register — establish it immediately (auto-login).
        const next: Session = { token, user };
        persistSession(next);
        setSession(next);
      },
      updateUser: (user: User) => {
        setSession((current) => {
          if (!current) return current;
          const next: Session = { ...current, user };
          persistSession(next);
          return next;
        });
      },
      signout: () => {
        localStorage.removeItem("ecg:session");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("ecg:role"); // clears any stale role cache from older sessions
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
