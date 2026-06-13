import { createContext, useContext, useEffect, useMemo, useState } from "react";
import AxiosInstance, { refreshAccessToken } from "../../AxiosInstance";
import { profileService } from "../../services/profileService";
import { setSessionUserSnapshot } from "./roleUtils";

export type OnboardingStep = "role" | "profile" | "complete";

// 'initializing'   — verifying any persisted token against the backend; render a
//                    branded loading screen, never a guard redirect or error page.
// 'authenticated'   — a verified session backed by a freshly-fetched DB user record.
// 'unauthenticated' — no valid session; safe to redirect to /login.
export type AuthStatus = "initializing" | "authenticated" | "unauthenticated";

export interface User {
  id: string;
  username: string;
  email: string;
  role?: string;
  onboardingStep?: OnboardingStep;
  profile?: Record<string, unknown>;
  // Additional fields the backend already returns from /api/auth/me
  fullName?: string;
  phone?: string;
  profilePicture?: string;
  authProvider?: 'local' | 'google';
  isVerified?: boolean;
  status?: 'active' | 'inactive' | 'suspended';
  lastLogin?: string | null;
  createdAt?: string;
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

// Only the bearer token is persisted — it's an opaque credential, not user data.
// Role/profile/onboarding/user details always come fresh from the database
// (via /api/auth/me on bootstrap and via backend responses thereafter).
const TOKEN_KEY = "ecg:token";

const AuthCtx = createContext<{
  session: Session | null;
  status: AuthStatus;
  signin: (emailOrUsername: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  establishSession: (token: string, user: User) => void;
  updateUser: (user: User) => void;
  signout: () => void;
} | null>(null);

function setAuthHeader(token: string | null) {
  if (token) {
    AxiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete AxiosInstance.defaults.headers.common['Authorization'];
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>("initializing");

  // Central auth bootstrap (runs once on mount): verify any persisted token
  // against the backend and hydrate the full user/role/onboarding record from
  // the database — the only source of truth. Guards key off `status` and stay
  // on a loading screen until this resolves, so nothing ever renders from a
  // half-known session.
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      let token = localStorage.getItem(TOKEN_KEY);

      if (!token) {
        // No cached access token — if a refresh-token cookie is still valid,
        // this silently restores the session without a full re-login.
        token = await refreshAccessToken();
        if (!token) {
          if (!cancelled) setStatus("unauthenticated");
          return;
        }
      }

      // Set the header synchronously so the very first /api/auth/me request
      // (and anything fired alongside it) carries the token — no deferred
      // useEffect, no per-request localStorage re-reads.
      setAuthHeader(token);
      try {
        const user = await profileService.getMe();
        if (cancelled) return;
        setSessionUserSnapshot(user);
        setSession({ token, user });
        setStatus("authenticated");
      } catch {
        if (cancelled) return;
        localStorage.removeItem(TOKEN_KEY);
        setAuthHeader(null);
        setSessionUserSnapshot(null);
        setSession(null);
        setStatus("unauthenticated");
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  // The AxiosInstance response interceptor dispatches this when a 401's
  // silent-refresh attempt also fails (refresh-token cookie missing/expired/
  // revoked) — drop back to the login screen instead of looping on 401s.
  useEffect(() => {
    const handleSessionExpired = () => {
      setAuthHeader(null);
      setSessionUserSnapshot(null);
      setSession(null);
      setStatus("unauthenticated");
    };

    window.addEventListener("auth:session-expired", handleSessionExpired);
    return () => window.removeEventListener("auth:session-expired", handleSessionExpired);
  }, []);

  const value = useMemo(() => {
    // Establishes a verified session from a backend auth response (login,
    // register, Google sign-in). Persists only the token, sets the request
    // header and the roleUtils snapshot synchronously (before any navigation
    // can fire follow-up requests), and flips status in one go.
    const establishSession = (token: string, user: User) => {
      localStorage.setItem(TOKEN_KEY, token);
      setAuthHeader(token);
      setSessionUserSnapshot(user);
      setSession({ token, user });
      setStatus("authenticated");
    };

    return {
      session,
      status,
      signin: async (emailOrUsername: string, password: string) => {
        const res = await AxiosInstance.post("/api/auth/login", { emailOrUsername, password });
        const responseData = res.data?.data || res.data;
        const user: User = responseData?.user;
        const token: string = responseData?.token;
        if (!user || !token) throw new Error("Login failed: no user or token returned");
        establishSession(token, user);
      },
      register: async (payload: RegisterPayload) => {
        const res = await AxiosInstance.post("/api/auth/register", payload);
        const responseData = res.data?.data || res.data;
        const user: User = responseData?.user;
        const token: string = responseData?.token;
        if (!user || !token) throw new Error("Registration failed: no user or token returned");
        // Backend already returns a session on register — establish it immediately (auto-login).
        establishSession(token, user);
      },
      establishSession,
      updateUser: (user: User) => {
        setSession((current) => {
          if (!current) return current;
          setSessionUserSnapshot(user);
          return { ...current, user };
        });
      },
      signout: () => {
        // Best-effort: revoke the refresh-token cookie server-side. The local
        // session is cleared immediately regardless of whether this succeeds.
        AxiosInstance.post("/api/auth/logout").catch(() => {});
        localStorage.removeItem(TOKEN_KEY);
        setAuthHeader(null);
        setSessionUserSnapshot(null);
        setSession(null);
        setStatus("unauthenticated");
      },
    };
  }, [session, status]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
