import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

/* ─────────────────────────────────────────────────────────────────────────────
   COMPOSANT : AnimatedNavLink
   Anime un lien de navigation avec :
   1. Underline Slide   – trait glissant depuis la gauche
   2. Glow Pulse        – ombre lumineuse violette qui pulse au survol
   3. Bg Slide Diagonal – fond dégradé en diagonale au survol
   4. Dot Jump          – point indicateur élastique sous le lien actif
   5. Text Color Fade   – lettres qui passent de gris à violet une par une
──────────────────────────────────────────────────────────────────────────────── */

const AnimatedNavLink = ({ label, href, isActive, onClick, type = 'anchor' }) => {
    const [isHovered, setIsHovered] = useState(false);

    /* ── Variantes Framer Motion pour les animations ── */

    // 5. Text Color Fade – stagger sur chaque lettre (30ms entre chaque)
    const letterContainerVariants = {
        rest: {},
        hover: { transition: { staggerChildren: 0.03 } },
    };

    const letterVariants = {
        rest:  { color: '#6b7280' }, // text-gray-500
        hover: { color: '#7c3aed', transition: { duration: 0.2 } }, // text-purple-700
    };

    // 4. Dot Indicator Jump – rebond élastique
    const dotVariants = {
        hidden: { opacity: 0, y: 0, scale: 0 },
        visible: {
            opacity: 1, scale: 1,
            y: [0, -6, 2, -3, 0], // micro-rebond élastique
            transition: { duration: 0.5, ease: [0.68, -0.55, 0.265, 1.55] },
        },
    };

    // 1. Underline Slide – depuis la gauche
    const underlineVariants = {
        rest:  { scaleX: 0, originX: 0 },
        hover: { scaleX: 1, originX: 0, transition: { duration: 0.3, delay: 0.05, ease: [0.4, 0, 0.2, 1] } },
        exit:  { scaleX: 0, originX: 1, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } },
    };

    // 3. Glow Pulse – impulsion lumineuse violette en boucle au survol
    const glowVariants = {
        rest: { filter: 'drop-shadow(0 0 0px rgba(147,51,234,0))', scale: 1 },
        hover: {
            filter: 'drop-shadow(0 0 8px rgba(147,51,234,0.5))',
            scale: [1, 1.04, 1],
            transition: { scale: { repeat: Infinity, duration: 1.5, ease: 'easeInOut' }, filter: { duration: 0.3 } },
        },
    };

    const letters = label.split('');

    const commonProps = {
        className: "relative inline-flex flex-col items-center cursor-pointer select-none",
        onMouseEnter: () => setIsHovered(true),
        onMouseLeave: () => setIsHovered(false),
        onClick,
    };

    const inner = (
        /* 3. Fond glissant diagonal + Glow Pulse */
        <motion.span
            variants={glowVariants}
            animate={isHovered ? 'hover' : 'rest'}
            initial="rest"
            className="relative px-4 py-2 rounded-lg overflow-hidden inline-flex flex-col items-center"
        >
            {/* 3. Background diagonal slide */}
            <motion.span
                className="absolute inset-0 rounded-lg"
                style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(99,102,241,0.15))' }}
                initial={{ opacity: 0, x: -10, y: 10 }}
                animate={isHovered ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, x: -10, y: 10 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
            />

            {/* 5. Text Reveal – stagger sur les lettres */}
            <motion.span
                className="relative z-10 flex font-medium text-sm lg:text-base"
                variants={letterContainerVariants}
                animate={isHovered ? 'hover' : 'rest'}
                initial="rest"
            >
                {letters.map((char, i) => (
                    /* Lettre par lettre avec délai progressif */
                    <motion.span key={i} variants={letterVariants}>
                        {char === ' ' ? '\u00A0' : char}
                    </motion.span>
                ))}
            </motion.span>

            {/* 1. Underline Slide – trait violet depuis la gauche */}
            <motion.span
                className="absolute bottom-1.5 left-4 right-4 h-0.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500"
                variants={underlineVariants}
                animate={isHovered ? 'hover' : 'exit'}
                initial="rest"
            />
        </motion.span>
    );

    return (
        <span {...commonProps}>
            {type === 'route' ? (
                <Link to={href} className="block">{inner}</Link>
            ) : (
                <a href={href} className="block">{inner}</a>
            )}

            {/* 4. Dot Indicator Jump – affiché si lien actif */}
            <AnimatePresence>
                {isActive && (
                    <motion.span
                        key="dot"
                        className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-0.5"
                        variants={dotVariants}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, scale: 0, transition: { duration: 0.2 } }}
                    />
                )}
            </AnimatePresence>
        </span>
    );
};

export default AnimatedNavLink;
