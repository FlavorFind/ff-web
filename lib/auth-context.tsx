"use client";

/**
 * AuthContext — persistent session, never logs out unless:
 *   1. User clicks the logout button
 *   2. 24h have passed since login
 *   3. Site has not been visited for 3h (idle)
 *   4. Backend rejects the refresh token (revoked/expired server-side)
 *
 * Session restore runs ONCE on mount. Navigation never re-runs it.
 * Expiry is checked on navigation and every 60s — but only clears if
 * truly expired. A valid session survives back button, reload, everything.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { tokens, getMe, api, type User } from "./api";

// ── Session policy ─────────────────────────────────────────────────────────────
const SESSION_MAX_MS = 24 * 60 * 60 * 1000;  // 24h from login
const IDLE_MAX_MS    =  3 * 60 * 60 * 1000;  // 3h since last visit

const LOGIN_AT_KEY  = "ff_login_at";
const ACTIVE_AT_KEY = "ff_active_at";

function nowMs() { return Date.now(); }

function stampLogin() {
  localStorage.setItem(LOGIN_AT_KEY,  String(nowMs()));
  localStorage.setItem(ACTIVE_AT_KEY, String(nowMs()));
}

function touchActive() {
  localStorage.setItem(ACTIVE_AT_KEY, String(nowMs()));
}

function clearTimestamps() {
  localStorage.removeItem(LOGIN_AT_KEY);
  localStorage.removeItem(ACTIVE_AT_KEY);
}

function isExpired(): boolean {
  const loginAt  = Number(localStorage.getItem(LOGIN_AT_KEY)  ?? 0);
  const activeAt = Number(localStorage.getItem(ACTIVE_AT_KEY) ?? 0);
  if (!loginAt) return false; // no session — not "expired", just absent
  if (nowMs() - loginAt  > SESSION_MAX_MS) return true;
  if (nowMs() - activeAt > IDLE_MAX_MS)    return true;
  return false;
}

// ── Types ──────────────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, access: string, refresh: string) => void;
  logout: () => Promise<void>;
  setUser: (u: User) => void;
}

const AuthContext = createContext<AuthState | null>(null);

// ── Provider ───────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,      setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router   = useRouter();
  const pathname = usePathname();

  // Refs so expiry checks can read latest values without re-subscribing
  const userRef    = useRef<User | null>(null);
  const pathnameRef = useRef(pathname);
  useEffect(() => { pathnameRef.current = pathname; }, [pathname]);

  const doExpire = useCallback(() => {
    tokens.clear();
    clearTimestamps();
    setUserState(null);
    userRef.current = null;
    if (!pathnameRef.current.startsWith("/auth/")) {
      router.replace("/auth/sign-in");
    }
  }, [router]);

  // ── ONE-TIME session restore on mount ──────────────────────────────────────
  useEffect(() => {
    const refresh = tokens.getRefresh();

    if (!refresh) {
      // No token at all — guest
      setIsLoading(false);
      return;
    }

    if (isExpired()) {
      // Token exists but our policy says it's expired
      doExpire();
      setIsLoading(false);
      return;
    }

    // Token is valid — restore silently
    touchActive();

    const restore = tokens.isAuthenticated()
      ? getMe()
      : api.post<{ access: string; refresh: string }>(
            "/v1/auth/refresh/",
            { refresh },
            { skipAuth: true },
          ).then((res) => {
            tokens.set(res.access, res.refresh);
            return getMe();
          });

    restore
      .then((me) => {
        userRef.current = me;
        setUserState(me);
      })
      .catch(() => {
        // Backend rejected the token — clear silently, keep as guest
        tokens.clear();
        clearTimestamps();
      })
      .finally(() => setIsLoading(false));

  // Empty deps — runs ONCE on mount only. Never on navigation.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Touch active on every navigation (keeps idle timer alive) ─────────────
  useEffect(() => {
    if (!tokens.getRefresh()) return; // guest — nothing to touch
    if (isExpired()) {
      doExpire();
    } else {
      touchActive();
    }
  }, [pathname, doExpire]);

  // ── Periodic expiry check every 60s (catches idle tabs) ───────────────────
  useEffect(() => {
    const id = setInterval(() => {
      if (!tokens.getRefresh()) return;
      if (isExpired()) doExpire();
      else touchActive();
    }, 60_000);
    return () => clearInterval(id);
  }, [doExpire]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const login = useCallback((u: User, access: string, refresh: string) => {
    tokens.set(access, refresh);
    stampLogin();
    userRef.current = u;
    setUserState(u);
  }, []);

  const logout = useCallback(async () => {
    const refresh = tokens.getRefresh();
    try {
      if (refresh) await api.post("/v1/auth/logout/", { refresh });
    } catch { /* ignore — clear locally regardless */ }
    tokens.clear();
    clearTimestamps();
    userRef.current = null;
    setUserState(null);
    router.replace("/auth/sign-in");
  }, [router]);

  const setUser = useCallback((u: User) => {
    userRef.current = u;
    setUserState(u);
  }, []);

  return (
    <AuthContext
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        login,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
