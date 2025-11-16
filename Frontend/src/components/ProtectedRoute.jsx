import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ requiredRoles = [], children }) => {
    const { user, loading } = useAuth();

    if (loading) return <div className="text-center mt-5">Loading...</div>;

    // 1. Check if user is logged in
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // 2. Check for Role Access
    if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
        // Redirect unauthorized users based on their role
        let redirectPath;
        switch (user.role) {
            case 'resident': redirectPath = '/resident/dashboard'; break;
            case 'guard': redirectPath = '/guard/dashboard'; break;
            case 'admin': redirectPath = '/admin/dashboard'; break;
            default: redirectPath = '/';
        }
        return <Navigate to={redirectPath} replace />;
    }

    // 3. RENDER CHILDREN (The Fix)
    // If we passed a NavBar inside this route (via App.js), render it.
    // Otherwise, render the Outlet (the page content).
    return children ? children : <Outlet />;
};

export default ProtectedRoute;