import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(authAPI.getToken());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const persistUser = (value) => {
    if (value) {
      localStorage.setItem("user", JSON.stringify(value));
      localStorage.setItem("auth_user", JSON.stringify(value));
      localStorage.setItem("currentUser", JSON.stringify(value));
    } else {
      localStorage.removeItem("user");
      localStorage.removeItem("auth_user");
      localStorage.removeItem("currentUser");
    }
  };

  const loadUser = async () => {
    const savedToken = authAPI.getToken();

    if (!savedToken) {
      setUser(null);
      persistUser(null);
      setLoading(false);
      return null;
    }

    try {
      const me = await authAPI.me();
      setUser(me);
      persistUser(me);
      return me;
    } catch {
      authAPI.logout();
      setToken(null);
      setUser(null);
      persistUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = async (email, password) => {
    const result = await authAPI.login({ email, password });
    if (result?.access_token) {
      setToken(result.access_token);
    }
    const me = await loadUser();
    return { access_token: result?.access_token, user: me };
  };

  const register = async (payload) => {
    await authAPI.register(payload);
    return await login(payload.email, payload.password);
  };

  const logout = async () => {
    authAPI.logout();
    setToken(null);
    setUser(null);
    persistUser(null);
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