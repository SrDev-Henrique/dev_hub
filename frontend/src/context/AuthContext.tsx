import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { api } from "@/lib/api";
import { clearTokens, getAccessToken, setOnUnauthorized, setTokens } from "@/lib/tokenStore";
import type { Me } from "@/lib/types";

interface AuthContextValue {
  user: Me | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
  updateUser: (user: Me) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function refreshMe() {
    const { data } = await api.get<Me>("/auth/me/");
    setUser(data);
  }

  useEffect(() => {
    setOnUnauthorized(() => {
      setUser(null);
    });

    if (getAccessToken()) {
      refreshMe()
        .catch(() => clearTokens())
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  async function login(username: string, password: string) {
    const { data } = await api.post("/auth/login/", { username, password });
    setTokens(data.access, data.refresh);
    await refreshMe();
  }

  async function register(username: string, email: string, password: string, name?: string) {
    await api.post("/auth/register/", { username, email, password, name });
    await login(username, password);
  }

  function logout() {
    clearTokens();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshMe, updateUser: setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
