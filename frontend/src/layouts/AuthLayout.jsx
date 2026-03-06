import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import loginBg from '../assets/login_bg.png';
import registerBg from '../assets/register_bg.png';

export default function AuthLayout() {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  
  const isAdmin = location.pathname.includes('/admin');
  const adminBg = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop";
  const bgImage = isAdmin ? adminBg : loginBg;

  return (
    <div className={`min-h-screen flex w-full transition-colors duration-500 ${theme === 'dark' ? 'dark bg-slate-900' : 'bg-white'}`}>
      
      {/* 🟦 SECTION GAUCHE : Image & Branding */}
      <div className={`relative ${isAdmin ? 'lg:w-[60%]' : 'w-[40%] lg:w-[55%]'} w-full h-[40vh] lg:h-screen overflow-hidden bg-[#005aab]`}>
        {/* Background Image Container */}
        <div 
          key={location.pathname}
          className={`absolute inset-0 bg-cover bg-center transition-all duration-700 ${isAdmin ? 'brightness-[0.8] contrast-[1.1]' : 'opacity-100'}`}
          style={{ 
            backgroundImage: `url(${bgImage})`,
          }}
        />
        
        {/* Filtre bleu semi-transparent */}
        <div className={`absolute inset-0 ${isAdmin ? 'bg-slate-900/40' : 'bg-blue-900/40'} z-10`} />
        
        {/* Texte style institutionnel */}
        <div className="absolute bottom-24 left-12 right-12 z-20">
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-start text-left"
          >
            <h2 className="text-white text-4xl lg:text-7xl font-black mb-6 italic tracking-tighter drop-shadow-2xl">
              {isAdmin ? 'Admin Portal' : 'TT Assurance'}
            </h2>
            <p className="text-white text-base lg:text-lg font-medium max-w-[550px] leading-relaxed drop-shadow-lg text-left">
              {isAdmin 
                ? "Interface de gestion sécurisée pour les administrateurs de Tunisie Telecom. Accédez aux outils de contrôle, gérez les adhérents et supervisez les flux de données en temps réel."
                : "La plateforme centrale dédiée à la gestion simplifiée de l'assurance maladie. Centralisez vos remboursements, suivez vos dossiers en temps réel et accédez à vos services de santé."
              }
            </p>
          </motion.div>
        </div>

        {/* Footer info discret */}
        <div className="absolute bottom-6 left-8 z-20 text-white/40 text-[8px] lg:text-[10px] font-bold tracking-[0.2em] uppercase">
          {isAdmin ? 'SYSTEM ADMINISTRATION' : 'TT SECURITY'}
        </div>
      </div>

      {/* ⬜ SECTION DROITE : Le Formulaire (Toujours visible 60%) */}
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