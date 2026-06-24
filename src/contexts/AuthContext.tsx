import React, { createContext, useContext, useState, useCallback } from "react";
import api from "@/lib/api";

export type UserRole = "admin" | "fellow" | "mne_officer" | "program_director" | "program_lead" | "program_manager";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  assignedFellowIds?: string[];
  assignedCentreIds?: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("manzil_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      const userData = response.data;
      setUser(userData);
      localStorage.setItem("manzil_user", JSON.stringify(userData));
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Invalid email or password");
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("manzil_user");
  }, []);

  const updateProfile = useCallback((data: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      localStorage.setItem("manzil_user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isAdmin = user ? ["admin", "program_director", "program_lead", "program_manager"].includes(user.role) : false;
  const isSuperAdmin = user ? ["admin", "program_director", "program_lead"].includes(user.role) : false;

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isAdmin, isSuperAdmin, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
