import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { isAuthenticated, loading, user } = useAuth();

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Loader2 size={48} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
        );
    }

    if (!isAuthenticated) {
        const isTryingAdmin = window.location.pathname.startsWith('/admin');
        return <Navigate to={isTryingAdmin ? "/admin/login" : "/login"} replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
        return <Navigate to={user?.role === 'ADHERENT' ? "/dashboard" : "/admin"} replace />;
    }

    return children;
};

export default ProtectedRoute;
