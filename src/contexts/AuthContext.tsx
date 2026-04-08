import React, { createContext, useContext, useState, useCallback } from "react";

export type UserRole = "admin" | "fellow" | "mne_officer";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Demo users for testing
const DEMO_USERS: Record<string, User & { password: string }> = {
  "admin@manzil.org": { id: "1", name: "Rahul Sharma", email: "admin@manzil.org", role: "admin", password: "admin123" },
  "fellow@manzil.org": { id: "2", name: "Priya Gupta", email: "fellow@manzil.org", role: "fellow", password: "fellow123" },
  "mne@manzil.org": { id: "3", name: "Arjun Patel", email: "mne@manzil.org", role: "mne_officer", password: "mne123" },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("manzil_user");
    return saved ? JSON.parse(saved) : null;
  });

  const login = useCallback(async (email: string, password: string) => {
    const demoUser = DEMO_USERS[email];
    if (!demoUser || demoUser.password !== password) {
      throw new Error("Invalid email or password");
    }
    const { password: _, ...userData } = demoUser;
    setUser(userData);
    localStorage.setItem("manzil_user", JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("manzil_user");
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
