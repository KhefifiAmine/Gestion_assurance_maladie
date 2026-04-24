import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HeartPulse } from 'lucide-react';
import AnimatedNavLink from './AnimatedNavLink';

/* ─────────────────────────────────────────────────────────────────────────────
   COMPOSANT : Header
   Barre de navigation publique de CareCover avec :
   - Scroll Effect (glassmorphism)
   - AnimatedNavLink (underline, glow, bg-slide, dot-jump)
   - Hamburger → Croix animé (Framer Motion)
   - Bouton "S'inscrire" avec bordure lumineuse via @keyframes
──────────────────────────────────────────────────────────────────────────────── */

const Header = () => {
    const [activeLink, setActiveLink] = useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const location = useLocation();

    /* ── Glassmorphism au scroll : header toujours visible ── */
    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    /* ── Lien actif selon la route ou l'ancre ── */
    useEffect(() => {
        if (location.pathname === '/comment-ca-marche') setActiveLink('comment-ca-marche');
        else if (location.hash === '#features')         setActiveLink('features');
        else if (location.hash === '#contact')          setActiveLink('contact');
        else                                            setActiveLink('');
    }, [location]);

    const navLinks = [
        { id: 'features',           label: 'Fonctionnalités',    href: '/#features',          type: 'anchor' },
        { id: 'comment-ca-marche',  label: 'Comment ça marche',  href: '/comment-ca-marche',  type: 'route'  },
        { id: 'contact',            label: 'Contact',             href: '/#contact',           type: 'anchor' },
    ];

    const handleLinkClick = (id) => {
        setActiveLink(id);
        setIsMobileMenuOpen(false);
    };

    /* ── Variantes Framer Motion : Menu mobile slide-down + fade ── */
    const mobileMenuVariants = {
        hidden:  { opacity: 0, y: -20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
        exit:    { opacity: 0, y: -15, transition: { duration: 0.25, ease: 'easeIn' } },
    };

    /* ── Variantes hamburger – barres animées en croix ── */
    const bar1 = { open: { rotate: 45,  y: 8  }, closed: { rotate: 0,  y: 0 } };
    const bar2 = { open: { opacity: 0,  x: 20 }, closed: { opacity: 1, x: 0 } };
    const bar3 = { open: { rotate: -45, y: -8 }, closed: { rotate: 0,  y: 0 } };

    return (
        <>
            {/* ── Injection des @keyframes pour la bordure magique tournante ── */}
            <style>{`
                @keyframes border-spin {
                    0%   { --angle: 0deg;   }
                    100% { --angle: 360deg; }
                }
                @property --angle {
                    syntax: '<angle>';
                    inherits: false;
                    initial-value: 0deg;
                }
                .magic-border {
                    position: relative;
                    isolation: isolate;
                }
                .magic-border::before {
                    content: '';
                    position: absolute;
                    inset: -2px;
                    border-radius: 0.75rem;
                    background: conic-gradient(from var(--angle), #a855f7, #6366f1, #a855f7);
                    animation: border-spin 3s linear infinite;
                    z-index: -1;
                }
            `}</style>

            <header
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
                    isScrolled
                        ? 'bg-white/90 backdrop-blur-md shadow-sm py-3'
                        : 'bg-white/80 backdrop-blur-sm border-b border-purple-100 py-5'
                }`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center">

                        {/* ── Logo ── */}
                        <Link to="/" className="flex items-center gap-2" onClick={() => handleLinkClick('')}>
                            <HeartPulse className="text-purple-700" size={32} />
                            <span className="text-2xl font-black text-purple-900 tracking-tight">CareCover</span>
                        </Link>

                        {/* ── Navigation Desktop avec séparateurs ── */}
                        <nav className="hidden md:flex items-center gap-1">
                            {navLinks.map((link, index) => (
                                <React.Fragment key={link.id}>
                                    <AnimatedNavLink
                                        label={link.label}
                                        href={link.href}
                                        type={link.type}
                                        isActive={activeLink === link.id}
                                        onClick={() => handleLinkClick(link.id)}
                                    />
                                    {/* Séparateur subtil entre les liens */}
                                    {index < navLinks.length - 1 && (
                                        <div className="w-px h-5 bg-gray-200 mx-1" />
                                    )}
                                </React.Fragment>
                            ))}
                        </nav>

                        {/* ── Boutons Action Desktop ── */}
                        <div className="hidden md:flex items-center gap-4">
                            {/* Bouton Se connecter */}
                            <Link
                                to="/login"
                                className="inline-flex items-center justify-center px-5 py-2.5 border-2 border-purple-300 text-purple-700 font-bold rounded-xl hover:bg-purple-50 transition-all duration-300"
                            >
                                Se connecter
                            </Link>

                            {/* 6. Bouton S'inscrire – Bordure magique tournante */}
                            <div className="magic-border rounded-xl">
                                <Link
                                    to="/register"
                                    className="relative inline-flex items-center justify-center px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-700 text-white font-bold rounded-xl hover:-translate-y-0.5 transition-transform duration-300 shadow-lg shadow-purple-600/30"
                                >
                                    S'inscrire
                                </Link>
                            </div>
                        </div>

                        {/* ── Hamburger animé (Mobile) ── */}
                        <button
                            className="md:hidden flex flex-col justify-center items-center w-10 h-10 rounded-lg hover:bg-purple-50 transition-colors gap-1.5"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            aria-label="Menu"
                        >
                            {/* Barre 1 – se tourne à 45° */}
                            <motion.span
                                className="w-6 h-0.5 bg-gray-600 rounded-full block origin-center"
                                variants={bar1}
                                animate={isMobileMenuOpen ? 'open' : 'closed'}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                            />
                            {/* Barre 2 – disparaît */}
                            <motion.span
                                className="w-6 h-0.5 bg-gray-600 rounded-full block"
                                variants={bar2}
                                animate={isMobileMenuOpen ? 'open' : 'closed'}
                                transition={{ duration: 0.25, ease: 'easeInOut' }}
                            />
                            {/* Barre 3 – se tourne à -45° */}
                            <motion.span
                                className="w-6 h-0.5 bg-gray-600 rounded-full block origin-center"
                                variants={bar3}
                                animate={isMobileMenuOpen ? 'open' : 'closed'}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                            />
                        </button>
                    </div>
                </div>

                {/* ── Menu Mobile – slide-down + fade (AnimatePresence) ── */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-lg border-b border-purple-100 shadow-xl overflow-hidden"
                            variants={mobileMenuVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            <div className="flex flex-col px-4 py-6 gap-2">
                                {/* Liens mobiles larges */}
                                {navLinks.map((link) => {
                                    const isActive = activeLink === link.id;
                                    return link.type === 'route' ? (
                                        <Link
                                            key={link.id}
                                            to={link.href}
                                            onClick={() => handleLinkClick(link.id)}
                                            className={`w-full px-4 py-4 rounded-xl text-lg font-medium transition-all border-l-4 ${
                                                isActive
                                                    ? 'bg-purple-50 text-purple-700 font-semibold border-purple-600'
                                                    : 'text-gray-600 hover:bg-purple-50 hover:text-purple-700 border-transparent'
                                            }`}
                                        >
                                            {link.label}
                                        </Link>
                                    ) : (
                                        <a
                                            key={link.id}
                                            href={link.href}
                                            onClick={() => handleLinkClick(link.id)}
                                            className={`w-full px-4 py-4 rounded-xl text-lg font-medium transition-all border-l-4 ${
                                                isActive
                                                    ? 'bg-purple-50 text-purple-700 font-semibold border-purple-600'
                                                    : 'text-gray-600 hover:bg-purple-50 hover:text-purple-700 border-transparent'
                                            }`}
                                        >
                                            {link.label}
                                        </a>
                                    );
                                })}

                                <div className="w-full h-px bg-gray-200 my-2" />

                                <Link
                                    to="/login"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="w-full py-4 text-center border-2 border-purple-300 text-purple-700 font-bold rounded-xl hover:bg-purple-50 transition-all"
                                >
                                    Se connecter
                                </Link>
                                <Link
                                    to="/register"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="w-full py-4 text-center mt-2 bg-gradient-to-r from-purple-600 to-indigo-700 text-white font-bold rounded-xl shadow-lg"
                                >
                                    S'inscrire
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {/* Spacer pour compenser le header fixed */}
            <div className="h-20" />
        </>
    );
};

export default Header;
