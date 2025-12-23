import React, { createContext, useContext, useMemo, useState, useEffect } from "react";
import { api } from "../api/client";

type Role = "admin" | "prime_admin" | "sub_admin" | "rider";
type User = { id: string; name: string; role: Role; store?: string | null; manager_id?: number | null };

type AuthState = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem("user");
    return raw ? (JSON.parse(raw) as User) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(false);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      // POST /auth/login -> { token, user: {id,name,role,store?} }
      const res = await api.post("/auth/login", { username, password });
      const { token: t, user: u } = res.data as { token: string; user: User };

      localStorage.setItem("token", t);
      localStorage.setItem("user", JSON.stringify(u));
      setToken(t);
      setUser(u);
      return u;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  const value = useMemo(() => ({ 
    user, 
    token, 
    loading, 
    login, 
    logout, 
    isAuthenticated: !!user && !!token 
  }), [user, token, loading]);
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
