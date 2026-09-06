import React, { createContext, useContext, useState, useCallback } from "react";
import api from "../services/api";
import { parseApiError } from "../utils/errorHandler";

export const ROLES = {
  ADMIN: "admin",
  SALES_MANAGER: "sales_manager",
  SALES_REP: "sales_rep",
  FINANCE: "finance",
  CUSTOMER: "customer",
  SALES_EXECUTIVE: "sales_rep",
};

export const ROLE_REDIRECTS = {
  admin: "/admin",
  sales_manager: "/sales",
  sales_rep: "/sales",
  sales_executive: "/sales",
  finance: "/sales",
  financial_officer: "/sales",
  customer: "/portal",
};

export const ROLE_LABELS = {
  admin: "Admin",
  sales_manager: "Sales Manager",
  sales_rep: "Sales Representative",
  sales_executive: "Sales Representative",
  finance: "Financial Officer",
  financial_officer: "Financial Officer",
  customer: "Customer",
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("df360_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const isAuthenticated = !!user;
  const role = user?.role || null;

  const login = useCallback(async ({ email, password }) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      const { access_token, user: backendUser } = response.data;

      localStorage.setItem("token", access_token);

      const sessionUser = {
        id: String(backendUser.id),
        email: backendUser.email,
        name: backendUser.name || email.split("@")[0],
        role: (backendUser.role || "customer").toLowerCase(),
        phone: backendUser.phone,
        token: access_token,
      };

      localStorage.setItem("df360_user", JSON.stringify(sessionUser));
      setUser(sessionUser);
      return sessionUser;
    } catch (err) {
      throw new Error(
        parseApiError(err) || "Invalid email or password. Please try again."
      );
    }
  }, []);
  const signup = useCallback(async ({ email, password, name, phone }) => {
    try {
      const response = await api.post("/auth/signup", {
        email,
        password,
        name,
        phone,
      });

      const backendUser = Array.isArray(response.data)
        ? response.data[0]
        : response.data;

      return {
        success: true,
        email: backendUser.email,
        name: backendUser.name,
        role: backendUser.role || ROLES.CUSTOMER,
      };
    } catch (err) {
      throw new Error(
        parseApiError(err) || "Signup failed. Please try again."
      );
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("df360_user");
    localStorage.removeItem("token");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, role, login, logout, signup }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
};

export default AuthContext;
