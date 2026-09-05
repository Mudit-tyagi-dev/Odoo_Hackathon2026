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
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect to the user's authorized role home
    const target = ROLE_REDIRECTS[user?.role] || "/portal";
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

        {/* Customer Portal Route - Restricted to Customer (and Admin) */}
        <Route element={<RequireRole allowedRoles={[ROLES.CUSTOMER, ROLES.ADMIN]} />}>
          <Route path="/portal" element={<PortalApp />} />
        </Route>

        {/* Sales Workspace Route - Restricted to Sales Executive and Admin */}
        <Route element={<RequireRole allowedRoles={[ROLES.SALES_EXECUTIVE, ROLES.ADMIN]} />}>
          <Route path="/sales" element={<DealFlowShell initialSection="sales" />} />
        </Route>

        {/* Admin Configuration Route - Restricted to Admin */}
        <Route element={<RequireRole allowedRoles={[ROLES.ADMIN]} />}>
          <Route path="/admin" element={<DealFlowShell initialSection="admin" />} />
        </Route>

        {/* 404 Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  );
};

export default AppRoutes;
