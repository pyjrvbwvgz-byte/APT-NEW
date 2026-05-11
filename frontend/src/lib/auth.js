import { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("abpt_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((r) => setClient(r.data))
      .catch(() => {
        localStorage.removeItem("abpt_token");
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, code) => {
    const r = await api.post("/auth/login", { email, code });
    localStorage.setItem("abpt_token", r.data.token);
    setClient(r.data.client);
    return r.data.client;
  };

  const register = async (name, email) => {
    const r = await api.post("/auth/register", { name, email });
    localStorage.setItem("abpt_token", r.data.token);
    setClient(r.data.client);
    return r.data.client;
  };

  const logout = () => {
    localStorage.removeItem("abpt_token");
    setClient(null);
  };

  const refreshCode = async () => {
    const r = await api.post("/auth/refresh-code");
    localStorage.setItem("abpt_token", r.data.token);
    setClient((c) => ({ ...c, code: r.data.code, code_expires_at: r.data.code_expires_at }));
    return r.data;
  };

  return (
    <AuthCtx.Provider value={{ client, loading, login, register, logout, refreshCode }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
