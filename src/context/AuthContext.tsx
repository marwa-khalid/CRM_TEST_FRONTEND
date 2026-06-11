import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import axiosInstance from "../services/axiosConfig";

export interface CurrentUser {
  id: number;
  email: string;
  name: string; // email-before-@ (derived server-side)
  first_name?: string | null;
  last_name?: string | null;
  tenant_id?: number | null;
}

interface AuthState {
  user: CurrentUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  refresh: async () => {},
  logout: async () => {},
});

// Legacy identity keys we no longer rely on (kept only for clean-up on logout).
const LEGACY_KEYS = [
  "user", "user_name", "activeUser", "access_token", "refresh_token",
  "authToken", "tenant_id", "pendingLoginUser", "pendingLoginEmail", "pendingOTP",
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get("/auth/me");
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await axiosInstance.post("/auth/logout");
    } catch {
      /* ignore */
    }
    setUser(null);
    LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Identity for the logged-in user. `name` is the part of their email before "@".
export const useCurrentUser = () => useContext(AuthContext);
