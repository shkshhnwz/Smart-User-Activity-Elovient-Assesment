import { createContext, useContext, useState } from "react";
import {
  getAuthToken,
  setAuthToken,
  getStoredUser,
  setStoredUser,
  loginApi,
  registerApi,
} from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getAuthToken());
  const [user, setUser] = useState(() => getStoredUser());

  const login = async (email, password) => {
    const res = await loginApi(email, password);
    const receivedToken = res.data?.token || res.token;
    const receivedUser = res.data?.user || res.user;

    setToken(receivedToken);
    setUser(receivedUser);
    setAuthToken(receivedToken);
    setStoredUser(receivedUser);

    return receivedUser;
  };

  const register = async (name, email, password) => {
    const res = await registerApi(name, email, password);
    // After registration, auto-login or return user
    return res;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setAuthToken(null);
    setStoredUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, register, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
