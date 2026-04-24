import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

/* ─────────────────────────────────────────────────────────────────────────────
   COMPOSANT : PageTransition
   Applique une transition fluide à chaque changement de route :
   - Fondu entrant  : opacity 0 → 1 sur 400ms
   - Décalage       : translateY(20px) → 0 sur 400ms
   - Courbe         : ease-out-expo cubic-bezier(0.16, 1, 0.3, 1)

   Usage : enveloppez le contenu de chaque layout ou page avec ce composant.
   <PageTransition><VotreContenu /></PageTransition>
──────────────────────────────────────────────────────────────────────────────── */

const pageVariants = {
    /* État initial : invisible + légèrement en bas */
    initial: {
        opacity: 0,
        y: 20,
        filter: 'blur(4px)',
    },
    /* État entrant : visible + en place */
    animate: {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: {
            duration: 0.45,
            ease: [0.16, 1, 0.3, 1], // ease-out-expo
        },
    },
    /* État sortant : invisible + légèrement en haut */
    exit: {
        opacity: 0,
        y: -12,
        filter: 'blur(4px)',
        transition: {
            duration: 0.25,
            ease: [0.4, 0, 1, 1], // ease-in
        },
    },
};

const PageTransition = ({ children }) => {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={location.pathname}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                style={{ willChange: 'opacity, transform, filter' }}
                className="h-full w-full"
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
};

export default PageTransition;
