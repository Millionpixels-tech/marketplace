import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import React from "react";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) return null; // or a loading spinner
    if (!user) return <Navigate to="/auth" replace />;
    return <>{children}</>;
};

export default ProtectedRoute;
