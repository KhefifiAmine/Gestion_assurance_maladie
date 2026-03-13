import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import {
  LayoutDashboard,
  FileText,
  User,
  Bell,
  LogOut,
  Menu,
  Moon,
  Sun,
  Activity,
  ChevronRight,
  PlusCircle
} from 'lucide-react';
import ttLogo from '../assets/Tunisie_Telecom.jpg';
import AddBulletinModal from '../components/AddBulletinModal';
import ConfirmModal from '../components/ConfirmModal';

const UserLayout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // 60-30-10 Color Tokens
  const colors = {
    base60: '#F3F4F6',
    secondary30Gradient: 'linear-gradient(135deg, #4B0082 0%, #9B4DCA 100%)',
    accent10: '#7C3AED',
    white: '#FFFFFF'
  };

  const confirmLogout = () => {
    logout();
    navigate('/login');
    showToast("Déconnexion réussie", "info");
    setShowLogoutConfirm(false);
  };

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Mes Bulletins', path: '/bulletins', icon: FileText },
    { name: 'Réclamations', path: '/reclamations', icon: Bell },
    { name: 'Mon profil', path: '/profile', icon: User },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans" style={{ backgroundColor: colors.base60 }}>
      {/* --- TOP PROGRESS BAR (FOR FLUID NAVIGATION) --- */}
      <motion.div
        key={location.pathname + "_progress"}
        initial={{ width: "0%", opacity: 1 }}
        animate={{ width: "100%", opacity: 0 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        className="fixed top-0 left-0 h-1 z-[100] bg-gradient-to-r from-purple-400 to-indigo-600"
      />

      {/* Sidebar logic... */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-500 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 overflow-hidden shadow-2xl`}
        style={{ width: '260px', background: colors.secondary30Gradient }}
      >
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-lg group hover:rotate-12 transition-transform cursor-pointer">
            <Activity style={{ color: '#4B0082' }} size={24} />
          </div>
          <span className="text-white font-black text-xl tracking-tighter">TT ASSURANCE</span>
        </div>

        <div className="px-4 mb-6">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-white font-black text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:brightness-110 active:scale-95 shadow-xl"
            style={{ backgroundColor: colors.accent10 }}
          >
            <PlusCircle size={20} />
            NOUVEAU BULLETIN
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-3 overflow-y-auto">
          {menuItems.map((item) => (
            <motion.div key={item.name} whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 300 }}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-300 group ${
                    isActive ? 'shadow-2xl' : 'opacity-60 hover:opacity-100 hover:bg-white/10'
                  }`
                }
                style={({ isActive }) => ({
                  backgroundColor: isActive ? colors.accent10 : 'transparent',
                  color: colors.white
                })}
              >
                <div className="flex items-center gap-4">
                  <item.icon size={20} className="group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-sm tracking-wide">{item.name}</span>
                </div>
                {location.pathname === item.path && (
                  <motion.div layoutId="activeNav" className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_white]" />
                )}
              </NavLink>
            </motion.div>
          ))}
        </nav>

        <div className="p-6">
          <button 
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-white font-black text-sm transition-all duration-200 hover:brightness-110 active:scale-95 shadow-lg backdrop-blur-md bg-white/10 border border-white/20"
          >
            <LogOut size={18} />
            DÉCONNEXION
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Navbar logic... */}
        <header 
          className="h-20 flex items-center justify-between px-8 z-10 shadow-lg"
          style={{ background: colors.secondary30Gradient, color: colors.white }}
        >
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 rounded-xl hover:bg-white/10" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <Menu size={24} />
            </button>
            <div className="hidden sm:block">
              <h2 className="text-[10px] font-black tracking-[0.2em] opacity-60 uppercase">Espace Adhérent</h2>
              <p className="text-lg font-black tracking-tight uppercase">Bienvenue, {user?.prenom || 'Utilisateur'}</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {['ADMIN', 'RESPONSABLE_RH'].includes(user?.role) && (
              <button 
                onClick={() => navigate('/admin/dashboard')}
                className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white text-white hover:text-purple-600 rounded-xl transition-all border border-white/20 group active:scale-95"
                title="Retour au Panel Admin"
              >
                <Activity size={18} className="group-hover:rotate-12 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-[0.1em]">Vers Panel Admin</span>
              </button>
            )}

            <button onClick={toggleTheme} className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all border border-white/10">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            <div className="flex items-center gap-4 pl-6 border-l border-white/20">
              <div className="text-right hidden md:block">
                <p className="text-[10px] font-black tracking-widest opacity-60 uppercase">{user?.role || 'ADHÉRENT'}</p>
                <p className="text-sm font-bold">{user?.prenom} {user?.nom}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 p-0.5 border border-white/30 backdrop-blur-sm shadow-xl overflow-hidden">
                <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center">
                  <User size={24} style={{ color: '#4B0082' }} />
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <AddBulletinModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={() => showToast("Bulletin créé avec succès", "success")}
      />

      <ConfirmModal 
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
        title="Confirmer la déconnexion"
        message="Voulez-vous vraiment vous déconnecter de votre espace TT Assurance ?"
        confirmText="Se déconnecter"
        cancelText="Rester"
        type="warning"
      />
    </div>
  );
};

export default UserLayout;
