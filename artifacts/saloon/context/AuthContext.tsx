import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import api from "@/lib/api";

export interface AuthUser {
  id: number;
  name: string;
  phone: string;
  role: "customer" | "owner";
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<AuthUser>;
  register: (name: string, phone: string, password: string, role: "customer" | "owner") => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (storedToken) {
        const userData = await api.get<AuthUser>("/auth/me", storedToken);
        setToken(storedToken);
        setUser(userData);
      }
    } catch {
      await AsyncStorage.removeItem("authToken");
    } finally {
      setLoading(false);
    }
  };

  const login = async (phone: string, password: string): Promise<AuthUser> => {
    const data = await api.post<{ token: string; user: AuthUser }>("/auth/login", { phone, password }, null);
    await AsyncStorage.setItem("authToken", data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (name: string, phone: string, password: string, role: "customer" | "owner"): Promise<AuthUser> => {
    const data = await api.post<{ token: string; user: AuthUser }>("/auth/register", { name, phone, password, role }, null);
    await AsyncStorage.setItem("authToken", data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await AsyncStorage.clear();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
