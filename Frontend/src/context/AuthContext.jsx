import React, { createContext, useContext, useState, useCallback } from "react";
import api from "../services/api";
import { parseApiError } from "../utils/errorHandler";

export const ROLES = {
  CUSTOMER: "customer",
  SALES_EXECUTIVE: "sales_executive",
  ADMIN: "admin",
};

export const ROLE_REDIRECTS = {
  [ROLES.CUSTOMER]: "/portal",
  [ROLES.SALES_EXECUTIVE]: "/sales",
  [ROLES.ADMIN]: "/admin",
};

export const ROLE_LABELS = {
  [ROLES.CUSTOMER]: "Customer",
  [ROLES.SALES_EXECUTIVE]: "Sales Executive",
  [ROLES.ADMIN]: "Admin",
};

// Mock credential store for Sales Executive and Admin roles
// const MOCK_USERS = [
//   {
//     id: "usr_001",
//     email: "rohan@acme-corp.com",
//     password: "Customer@123",
//     role: ROLES.CUSTOMER,
//     name: "Rohan Kapoor",
//     company: "Acme Corporation",
//     initials: "RK",
//   },
//   {
//     id: "usr_002",
//     email: "aarav@dealflow360.com",
//     password: "Sales@123",
//     role: ROLES.SALES_EXECUTIVE,
//     name: "Aarav Mehta",
//     company: "DealFlow360",
//     initials: "AM",
//   },
//   {
//     id: "usr_003",
//     email: "admin@dealflow360.com",
//     password: "Admin@123",
//     role: ROLES.ADMIN,
//     name: "Priya Sharma",
//     company: "DealFlow360",
//     initials: "PS",
//   },
// ];

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


  const login = useCallback(async ({ email, password, selectedRole }) => {
    if (selectedRole === ROLES.CUSTOMER) {
      try {
        const response = await api.post("/auth/login", { email, password });

        const { access_token, user: backendUser } = response.data;

        localStorage.setItem("token", access_token);

        const sessionUser = {
          id: String(backendUser.id),
          email: backendUser.email,
          name: backendUser.name,
          role: backendUser.role,
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
    }

    // Mock login for Sales Executive & Admin
    await new Promise((res) => setTimeout(res, 700));

    const found = MOCK_USERS.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() &&
        u.password === password &&
        u.role === selectedRole
    );

    if (!found) {
      throw new Error(
        "Invalid credentials or incorrect role selected. Please check your email, password, and role."
      );
    }

    const sessionUser = {
      id: found.id,
      email: found.email,
      name: found.name,
      company: found.company,
      initials: found.initials,
      role: found.role,
      token: `mock_jwt_${found.id}_${Date.now()}`,
    };

    localStorage.setItem("df360_user", JSON.stringify(sessionUser));
    localStorage.setItem("token", sessionUser.token);
    setUser(sessionUser);
    return sessionUser;
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
