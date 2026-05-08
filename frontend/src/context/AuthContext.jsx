import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchProfile, logoutUser } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    // Effet pour initialiser l'authentification
    useEffect(() => {
        const initAuth = async () => {
            if (token) {
                try {
                    const profile = await fetchProfile();
                    setUser(profile);
                } catch {
                    logout();
                }
            }
            setLoading(false);
        };
        initAuth();
    }, [token]);

    // Effet pour écouter les erreurs d'authentification globales (ex: compte bloqué)
    useEffect(() => {
        const handleAuthError = (event) => {
            const { message, isBlocked } = event.detail;
            if (isBlocked) {
                // On peut forcer la déconnexion immédiate
                logout();
                // Le toast sera affiché par le composant qui a fait l'appel ou on peut en ajouter un ici si on a accès au contexte
            } else {
                // Token expiré ou autre 401 standard
                logout();
            }
        };

        window.addEventListener('auth-error', handleAuthError);
        return () => window.removeEventListener('auth-error', handleAuthError);
    }, []);

    const login = (tokenValue, userData) => {
        localStorage.setItem('token', tokenValue);
        setToken(tokenValue);
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
        localStorage.removeItem('token');
        setToken(null);
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

    const isAuthenticated = !!token && !!user;

    return (
        <AuthContext.Provider value={{ user, token, loading, isAuthenticated, login, logout, refreshUser }}>
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
