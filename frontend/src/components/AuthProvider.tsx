"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { API_URL } from "@/lib/config";
import { clearStoredToken, getStoredToken, setStoredToken } from "@/lib/authToken";

export type AuthUser = {
  id: string;
  email: string | null;
  phone: string | null;
  name: string;
  role: string;
  photoUrl: string | null;
  preferredLanguage: string;
  createdAt: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  login: (body: { email?: string; phone?: string; password: string }) => Promise<void>;
  register: (body: {
    email?: string;
    phone?: string;
    password: string;
    name: string;
    role: "TRAVELER" | "PROVIDER";
  }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        clearStoredToken();
        setUser(null);
        setLoading(false);
        return;
      }
      setUser((await res.json()) as AuthUser);
    } catch {
      clearStoredToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(
    async (body: { email?: string; phone?: string; password: string }) => {
      const res = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = (await res.json()) as { token: string };
      setStoredToken(data.token);
      await refresh();
    },
    [refresh],
  );

  const register = useCallback(
    async (body: {
      email?: string;
      phone?: string;
      password: string;
      name: string;
      role: "TRAVELER" | "PROVIDER";
    }) => {
      const res = await fetch(`${API_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = (await res.json()) as { token: string };
      setStoredToken(data.token);
      await refresh();
    },
    [refresh],
  );

  const logout = useCallback(() => {
    clearStoredToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, refresh, login, register, logout }),
    [user, loading, refresh, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
