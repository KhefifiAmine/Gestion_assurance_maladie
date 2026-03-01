import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchProfile } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    // Au chargement de l'application, on recharge le profil complet depuis l'API avec le token
    useEffect(() => {
        const initAuth = async () => {
            if (token) {
                try {
                    const profile = await fetchProfile();
                    setUser(profile);
                } catch {
                    // Token invalide ou expiré, on nettoie
                    logout();
                }
            }
            setLoading(false);
        };
        initAuth();
    }, [token]);

    const login = (tokenValue, userData) => {
        localStorage.setItem('token', tokenValue);
        setToken(tokenValue);
        setUser(userData);
    };

    const logout = () => {
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
