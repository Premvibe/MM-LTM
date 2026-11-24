import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import api, { clearApiCache, AUTH_EXPIRED_EVENT } from "@/lib/api";

export type UserRole = "admin" | "fellow" | "mne_officer" | "program_director" | "program_lead" | "program_manager" | "m_e_manager";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  token?: string;
  assignedFellowIds?: string[];
  assignedCentreIds?: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isMEManager: boolean;
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
    clearApiCache();
    setUser(null);
    localStorage.removeItem("manzil_user");
  }, []);

  // A protected route rejected the token (missing after this update, or expired): ask the user to sign in again
  useEffect(() => {
    const onExpired = () => {
      if (!localStorage.getItem("manzil_user")) return;
      logout();
      toast.info("Please log in again to continue");
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, [logout]);

  const updateProfile = useCallback((data: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      localStorage.setItem("manzil_user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isAdmin = user ? ["admin", "program_director", "program_lead", "program_manager", "m_e_manager"].includes(user.role) : false;
  const isSuperAdmin = user ? ["admin", "program_director", "program_lead", "m_e_manager"].includes(user.role) : false;
  const isMEManager = user?.role === "m_e_manager" || user?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isAdmin, isSuperAdmin, isMEManager, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
