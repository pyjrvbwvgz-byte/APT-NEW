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

  const logout = () => {
    localStorage.removeItem("abpt_token");
    setClient(null);
  };

  // External login (used by Stripe success page once subscription confirmed)
  const setClientFromExternal = (c) => setClient(c);

  return (
    <AuthCtx.Provider value={{ client, loading, login, logout, setClientFromExternal }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
