import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("w3i_token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    const savedToken = localStorage.getItem("w3i_token");
    if (!savedToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const me = await authAPI.me();
      setUser(me);
    } catch {
      localStorage.removeItem("w3i_token");
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = async (email, password) => {
    const result = await authAPI.login({ email, password });
    localStorage.setItem("w3i_token", result.access_token);
    setToken(result.access_token);
    await loadUser();
  };

  const register = async (payload) => {
    await authAPI.register(payload);
    await login(payload.email, payload.password);
  };

  const logout = () => {
    localStorage.removeItem("w3i_token");
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: !!token && !!user,
      login,
      register,
      logout,
      reloadUser: loadUser,
    }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);