import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Composant pour rediriger l'utilisateur vers son espace approprié
export const HomeRedirect = () => {
    const { isAuthenticated, user } = useAuth();
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return ['ADMIN', 'RESPONSABLE_RH'].includes(user?.role)
        ? <Navigate to="/admin" replace />
        : <Navigate to="/dashboard" replace />;
};

// Redirection intelligente pour le panel admin
export const AdminHomeRedirect = () => {
    const { user } = useAuth();
    if (user?.role === 'RESPONSABLE_RH') return <Navigate to="users" replace />;
    if (user?.role === 'ADMIN') return <Navigate to="bulletins" replace />;
    return <Navigate to="/dashboard" replace />;
};
