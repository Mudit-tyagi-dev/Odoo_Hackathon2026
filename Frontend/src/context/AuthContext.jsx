import React, { createContext, useContext, useState, useCallback } from "react";

/**
 * DealFlow360 Auth Context
 * Manages authentication state for Customer, Sales Executive, and Admin roles.
 * Replace mock implementations with real API calls per docs/AUTH_SPECIFICATION.md
 */

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

// Mock credential store — replace with real API calls
const MOCK_USERS = [
  {
    id: "usr_001",
    email: "rohan@acme-corp.com",
    password: "Customer@123",
    role: ROLES.CUSTOMER,
    name: "Rohan Kapoor",
    company: "Acme Corporation",
    initials: "RK",
  },
  {
    id: "usr_002",
    email: "aarav@dealflow360.com",
    password: "Sales@123",
    role: ROLES.SALES_EXECUTIVE,
    name: "Aarav Mehta",
    company: "DealFlow360",
    initials: "AM",
  },
  {
    id: "usr_003",
    email: "admin@dealflow360.com",
    password: "Admin@123",
    role: ROLES.ADMIN,
    name: "Priya Sharma",
    company: "DealFlow360",
    initials: "PS",
  },
];

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

  /**
   * Login — mock implementation.
   * Replace with: POST /api/customer/auth/login (or /api/auth/login for multi-role)
   */
  const login = useCallback(async ({ email, password, selectedRole }) => {
    // Simulate network latency
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

  /**
   * Signup — mock implementation.
   * Replace with: POST /api/customer/auth/signup
   */
  const signup = useCallback(async (signupData) => {
    await new Promise((res) => setTimeout(res, 900));

    // Check for duplicate email in mock
    const exists = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === signupData.email.toLowerCase()
    );
    if (exists) {
      throw new Error(
        "An account with this email address already exists. Please sign in instead."
      );
    }

    // Return success (not auto-logging in — redirect to login)
    return { success: true, email: signupData.email };
  }, []);

  /**
   * Logout — clears session.
   * Replace with: POST /api/auth/logout
   */
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
