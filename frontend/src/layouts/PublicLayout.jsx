import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/Header';

/*
 * PublicLayout - Layout pour les pages publiques (LandingPage, HowItWorks, etc.)
 * Le Header est placé EN DEHORS de la zone de transition pour éviter
 * que les transforms de l'animation ne cassent le `position: fixed` du Header.
 */
const PublicLayout = () => {
    const location = useLocation();

    return (
        <div className="min-h-screen bg-white font-sans text-slate-800">
            {/* Header fixe — EN DEHORS de PageTransition pour préserver position:fixed */}
            <Header />

            {/* Contenu des pages avec transition fluide */}
            <AnimatePresence mode="wait">
                <motion.main
                    key={location.pathname}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    style={{ willChange: 'opacity, transform' }}
                >
                    <Outlet />
                </motion.main>
            </AnimatePresence>
        </div>
    );
};

export default PublicLayout;
