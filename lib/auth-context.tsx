"use client";

/**
 * AuthContext — global auth state for the whole app.
 *
 * On mount: tries to restore a session from localStorage refresh token.
 * Exposes: user, isAuthenticated, isLoading, login, logout, setUser.
 *
 * The access token lives in memory only (api.ts token store).
 * The refresh token lives in localStorage under "ff_refresh".
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { tokens, getMe, api, type User } from "./api";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;          // true during the initial session restore
  login: (user: User, access: string, refresh: string) => void;
  logout: () => Promise<void>;
  setUser: (u: User) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Session restore on mount ───────────────────────────────────────────────
  useEffect(() => {
    const refresh = tokens.getRefresh();
    if (!refresh) { setIsLoading(false); return; }

    // Try to get a fresh access token, then fetch /v1/me/
    api.post<{ access: string; refresh: string }>(
      "/v1/auth/refresh/",
      { refresh },
      { skipAuth: true },
    )
      .then((res) => {
        tokens.set(res.access, res.refresh);
        return getMe();
      })
      .then((me) => setUserState(me))
      .catch(() => tokens.clear())          // expired / invalid — clear silently
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback((u: User, access: string, refresh: string) => {
    tokens.set(access, refresh);
    setUserState(u);
  }, []);

  const logout = useCallback(async () => {
    const refresh = tokens.getRefresh();
    try {
      if (refresh) await api.post("/v1/auth/logout/", { refresh });
    } catch { /* ignore — clear locally regardless */ }
    tokens.clear();
    setUserState(null);
  }, []);

  const setUser = useCallback((u: User) => setUserState(u), []);

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

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
