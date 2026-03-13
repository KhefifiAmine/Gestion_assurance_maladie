import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import loginImage from '../assets/login.png';
import adminLoginImage from '../assets/admin_login.png';

export default function AuthLayout() {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const isAdmin = location.pathname.includes('/admin');
  
  // Utilisation des images locales (Assets)
  const purpleBg = loginImage; 
  const adminBg = adminLoginImage; 
  const bgImage = isAdmin ? adminBg : purpleBg;

  return (
    <div className={`min-h-screen flex w-full transition-colors duration-500 ${theme === 'dark' ? 'dark bg-slate-900' : 'bg-white'}`}>

      {/* 🟦 SECTION GAUCHE : Image & Branding */}
      <div className={`relative ${isAdmin ? 'lg:w-[60%]' : 'w-[40%] lg:w-[55%]'} w-full h-[40vh] lg:h-screen overflow-hidden bg-gradient-to-br from-indigo-950 to-purple-900`}>
        {/* Background Image Container */}
        <div
          key={location.pathname}
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(76, 29, 149, 0.2), rgba(30, 27, 75, 0.5)), url(${bgImage})`,
          }}
        />

        {/* Filtre ultra-léger pour lisibilité */}
        <div className={`absolute inset-0 ${isAdmin ? 'bg-slate-950/60' : 'bg-purple-900/10'} z-10 backdrop-blur-[1px]`} />

        {/* Texte style institutionnel */}
        <div className="absolute bottom-24 left-12 right-12 z-20">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-start text-left"
          >
            <div className="mb-4 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-black uppercase tracking-[0.3em]">
                {isAdmin ? 'System Core' : 'Digital Health Experience'}
            </div>
            <h2 className="text-white text-4xl lg:text-7xl font-black mb-6 italic tracking-tighter drop-shadow-2xl">
              {isAdmin ? 'Admin Portal' : 'TT Assurance'}
            </h2>
            <p className="text-white/90 text-base lg:text-lg font-medium max-w-[550px] leading-relaxed drop-shadow-lg text-left">
              {isAdmin
                ? "Interface de gestion sécurisée pour les administrateurs de Tunisie Telecom. Accédez aux outils de contrôle et supervisez les flux en temps réel."
                : "Votre nouvel espace de santé intelligent. Centralisez vos remboursements, suivez vos dossiers et gérez vos bénéficiaires en quelques clics."
              }
            </p>
          </motion.div>
        </div>

        {/* Footer info discret */}
        <div className="absolute bottom-6 left-8 z-20 text-white/40 text-[8px] lg:text-[10px] font-bold tracking-[0.2em] uppercase">
          {isAdmin ? 'SYSTEM ADMINISTRATION' : 'TT SECURITY'}
        </div>
      </div>

      {/* ⬜ SECTION DROITE : Le Formulaire */}
      <div className="flex-1 flex flex-col justify-center items-center p-4 lg:p-16 relative bg-[#f8f9fa] dark:bg-slate-900 h-screen overflow-y-auto">

        {/* Bouton Theme */}
        <div className="absolute top-6 right-6 z-30">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md transition-all text-slate-400"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* Portée des formulaires */}
        <div className="w-full max-w-[420px] mx-auto z-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
}