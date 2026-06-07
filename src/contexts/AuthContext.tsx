import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { authApi } from "@/lib/api";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (email: string, name: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  clearError: () => void;
}

const TOKEN_KEY = "toefl_token";
const USER_KEY = "toefl_user";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY)
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verify token on mount
  useEffect(() => {
    if (!token) return;
    authApi.me().catch(() => {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setToken(null);
      setUser(null);
    });
  }, []); // only on mount

  const login = useCallback(async (email: string, password: string): Promise<AuthUser> => {
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.login(email, password);
      localStorage.setItem(TOKEN_KEY, res.token);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      return res.user;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login gagal";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, name: string, password: string): Promise<AuthUser> => {
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.register(email, name, password);
      localStorage.setItem(TOKEN_KEY, res.token);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      return res.user;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Register gagal";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        isAuthenticated: !!user && !!token,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
