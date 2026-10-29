import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authApi, clearStoredToken, getStoredToken, storeToken, type User } from "../lib/api";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  updateName: (name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => Boolean(getStoredToken()));

  useEffect(() => {
    if (!getStoredToken()) return;
    let active = true;
    void authApi
      .me()
      .then(({ user: currentUser }) => {
        if (active) setUser(currentUser);
      })
      .catch(() => {
        clearStoredToken();
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function login(email: string, password: string) {
    const result = await authApi.login({ email, password });
    storeToken(result.token);
    setUser(result.user);
  }

  async function register(email: string, password: string, name: string) {
    await authApi.register({ email, password, name });
  }

  async function updateName(name: string) {
    const result = await authApi.updateProfile({ name });
    setUser(result.user);
  }

  async function logout() {
    try {
      await authApi.logout();
    } catch {
      // The bearer token is stateless; local deletion still completes logout if it has expired.
    } finally {
      clearStoredToken();
      setUser(null);
    }
  }

  return <AuthContext.Provider value={{ user, loading, login, register, updateName, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
