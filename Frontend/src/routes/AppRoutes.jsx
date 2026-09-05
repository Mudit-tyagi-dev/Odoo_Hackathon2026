import { Routes, Route } from "react-router-dom";

import Login from "../pages/Login";
import Signup from "../pages/Signup";
import Dashboard from "../pages/Dashboard";
import NotFound from "../pages/NotFound";

const AppRoutes = () => (
    <Routes>

        {/* Public Routes */}
        {/* <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} /> */}

        {/* Protected / Main Routes */}
        {/* <Route path="/dashboard" element={<Dashboard />} /> */}

        {/* 404 */}
        {/* <Route path="*" element={<NotFound />} /> */}

    </Routes>
);

export default AppRoutes;