import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext(null);

const TOKEN_KEYS = ["w3i_token", "token", "access_token", "auth_token"];
const USER_KEYS = ["user", "auth_user", "currentUser"];

const getStoredToken = () => {
  for (const key of TOKEN_KEYS) {
    const value = localStorage.getItem(key);
    if (value) return value;
  }
  return null;
};

const setStoredToken = (token) => {
  TOKEN_KEYS.forEach((key) => localStorage.removeItem(key));
  if (token) {
    localStorage.setItem("w3i_token", token);
  }
};

const clearStoredTokens = () => {
  TOKEN_KEYS.forEach((key) => localStorage.removeItem(key));
};

const getStoredUser = () => {
  for (const key of USER_KEYS) {
    const value = localStorage.getItem(key);
    if (!value) continue;

    try {
      return JSON.parse(value);
    } catch {
      localStorage.removeItem(key);
    }
  }
  return null;
};

const setStoredUser = (user) => {
  USER_KEYS.forEach((key) => localStorage.removeItem(key));
  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
  }
};

const clearStoredUsers = () => {
  USER_KEYS.forEach((key) => localStorage.removeItem(key));
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(getStoredToken());
  const [user, setUser] = useState(getStoredUser());
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    clearStoredTokens();
    clearStoredUsers();
    sessionStorage.clear();
    setToken(null);
    setUser(null);
  }, []);

  const loadUser = useCallback(async () => {
    const savedToken = getStoredToken();

    if (!savedToken) {
      clearStoredUsers();
      setToken(null);
      setUser(null);
      setLoading(false);
      return null;
    }

    try {
      setToken(savedToken);
      const me = await authAPI.me();
      setUser(me);
      setStoredUser(me);
      return me;
    } catch (error) {
      console.warn("[AuthContext] Failed to load user, clearing session.", error);
      clearSession();
      return null;
    } finally {
      setLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(
    async (email, password) => {
      setLoading(true);
      try {
        const result = await authAPI.login({ email, password });
        const accessToken = result?.access_token;

        if (!accessToken) {
          throw new Error("Login succeeded but no access token was returned.");
        }

        setStoredToken(accessToken);
        setToken(accessToken);

        const me = await authAPI.me();
        setUser(me);
        setStoredUser(me);

        return { token: accessToken, user: me };
      } catch (error) {
        clearSession();
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [clearSession]
  );

  const register = useCallback(
    async (payload) => {
      setLoading(true);
      try {
        await authAPI.register(payload);
        return await login(payload.email, payload.password);
      } finally {
        setLoading(false);
      }
    },
    [login]
  );

  const logout = useCallback(async () => {
    try {
      if (typeof authAPI.logout === "function") {
        await authAPI.logout();
      }
    } catch (error) {
      console.warn("[AuthContext] Logout API/helper failed, clearing local session anyway.", error);
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const updateUser = useCallback((nextUser) => {
    setUser(nextUser);
    setStoredUser(nextUser);
  }, []);

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
      setUser: updateUser,
      clearSession,
    }),
    [token, user, loading, login, register, logout, loadUser, updateUser, clearSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);