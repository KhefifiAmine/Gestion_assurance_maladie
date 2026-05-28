import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchProfile, logoutUser } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Effet pour initialiser l'authentification
    useEffect(() => {
        const initAuth = async () => {
            try {
                const profile = await fetchProfile();
                setUser(profile);
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        initAuth();
    }, []);

    // Effet pour écouter les erreurs d'authentification globales (ex: compte bloqué)
    useEffect(() => {
        const handleAuthError = (event) => {
            const { message, isBlocked } = event.detail;
            if (isBlocked) {
                // On peut forcer la déconnexion immédiate
                logout();
            } else {
                // Token expiré ou autre 401 standard
                logout();
            }
        };

        window.addEventListener('auth-error', handleAuthError);
        return () => window.removeEventListener('auth-error', handleAuthError);
    }, []);

    const login = (userData) => {
        setUser(userData);
    };

    const logout = async () => {
        if (user && user.id) {
            try {
                await logoutUser(user.id);
            } catch (err) {
                console.error("Erreur appel API deconnexion:", err);
            }
        }
        setUser(null);
    };

    const refreshUser = async () => {
        try {
            const profile = await fetchProfile();
            setUser(profile);
        } catch (err) {
            console.error('Erreur refresh profil:', err);
        }
    };

    const isAuthenticated = !!user;

    return (
        <AuthContext.Provider value={{ user, loading, isAuthenticated, login, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook custom pour utiliser le contexte facilement
export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider');
    return ctx;
};
