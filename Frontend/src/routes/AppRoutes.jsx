import React from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import PortalApp from "../App";
import { DealFlowShell } from "../components/common/dealflow-shell";
import Landing from "../pages/Landing";
import Login from "../pages/auth/Login";
import Signup from "../pages/auth/Signup";
import { useAuth, ROLES, ROLE_REDIRECTS } from "../context/AuthContext";
import ToastProvider from "../components/ui/Toast";

// Role-based access control guard
const RequireRole = ({ allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const userRole = (user?.role || "").toLowerCase();

  const isAllowed = (allowedRoles || []).some((role) => {
    const targetRole = role.toLowerCase();
    if (targetRole === userRole) return true;
    if (targetRole === "sales_rep" && (userRole === "sales_rep" || userRole === "sales_executive")) return true;
    if (targetRole === "sales_executive" && (userRole === "sales_rep" || userRole === "sales_executive")) return true;
    if (targetRole === "finance" && (userRole === "finance" || userRole === "financial_officer")) return true;
    return false;
  });

  if (!isAllowed) {
    const target = ROLE_REDIRECTS[userRole] || (userRole === "customer" ? "/portal" : "/sales");
    return <Navigate to={target} replace />;
  }
  return <Outlet />;
};

export const AppRoutes = () => {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Customer Portal Route - Customer & Admin */}
        <Route element={<RequireRole allowedRoles={[ROLES.CUSTOMER, ROLES.ADMIN]} />}>
          <Route path="/portal" element={<PortalApp />} />
        </Route>

        {/* Sales Workspace Route - Sales Rep, Sales Manager, Finance, Admin */}
        <Route
          element={
            <RequireRole
              allowedRoles={[
                ROLES.SALES_REP,
                ROLES.SALES_MANAGER,
                ROLES.FINANCE,
                ROLES.ADMIN,
                ROLES.SALES_EXECUTIVE,
              ]}
            />
          }
        >
          <Route path="/sales" element={<DealFlowShell initialSection="sales" />} />
        </Route>

        {/* Admin Configuration Route - Restricted strictly to Admin */}
        <Route element={<RequireRole allowedRoles={[ROLES.ADMIN]} />}>
          <Route path="/admin" element={<DealFlowShell initialSection="admin" />} />
          <Route path="/admin/*" element={<DealFlowShell initialSection="admin" />} />
        </Route>

        {/* 404 Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  );
};

export default AppRoutes;
