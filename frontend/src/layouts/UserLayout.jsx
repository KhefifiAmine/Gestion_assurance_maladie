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
  X,
  ChevronRight,
  PlusCircle,
  Users,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Info,
  Zap
} from 'lucide-react';
import logoApp1 from '../assets/logo_app_1.png';
import AddBulletinModal from '../components/AddBulletinModal';
import ConfirmModal from '../components/ConfirmModal';

const UserLayout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // 60-30-10 Color Tokens
  const colors = {
    base60: theme === 'dark' ? '#0F172A' : '#F3F4F6',
    secondary30Gradient: theme === 'dark' 
      ? 'linear-gradient(135deg, #1E1B4B 0%, #0F172A 100%)' 
      : 'linear-gradient(135deg, #4B0082 0%, #9B4DCA 100%)',
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
    { name: 'Vitrine GAT', path: '/a-propos-nous', icon: Zap },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans transition-colors duration-500" style={{ backgroundColor: colors.base60 }}>
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
        className={`fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-500 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 shadow-2xl`}
        style={{ width: isCollapsed ? '90px' : '260px', background: colors.secondary30Gradient }}
      >
        {/* Floating Toggle Button (Desktop Only) */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-4 top-10 z-[60] w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl items-center justify-center text-purple-700 dark:text-purple-400 hover:scale-110 active:scale-90 transition-all group"
        >
          {isCollapsed ? <ChevronsRight size={14} className="group-hover:translate-x-0.5 transition-transform" /> : <ChevronsLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />}
        </button>

        {/* Close Button (Mobile Only) */}
        <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden absolute top-6 right-6 text-white/60 hover:text-white"
        >
            <X size={24} />
        </button>

        <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center' : 'justify-start gap-3'} border-b border-white/10 mb-4`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="min-w-[80px] w-20 h-20 rounded-[2rem] overflow-hidden flex items-center justify-center bg-white shadow-2xl group hover:scale-105 transition-transform cursor-pointer p-2 border-4 border-white/30">
              <img src={logoApp1} alt="CareCover" className="w-full h-full object-contain" />
            </div>
            {!isCollapsed && (
              <motion.span 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }}
                className="text-white font-black text-xl tracking-tighter whitespace-nowrap"
              >
                CareCover
              </motion.span>
            )}
          </div>
        </div>

        <div className="px-4 mb-6">
          <button 
            onClick={() => { setIsModalOpen(true); if (window.innerWidth < 1024) setIsSidebarOpen(false); }}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-center gap-3'} py-4 rounded-2xl text-white font-black text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:brightness-110 active:scale-95 shadow-xl`}
            style={{ backgroundColor: colors.accent10 }}
            title="NOUVEAU BULLETIN"
          >
            <PlusCircle size={20} className="shrink-0" />
            {!isCollapsed && <span className="whitespace-nowrap">NOUVEAU BULLETIN</span>}
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-3 overflow-y-auto">
          {menuItems.map((item) => (
            <motion.div key={item.name} whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 300 }}>
              <NavLink
                to={item.path}
                onClick={() => { if (window.innerWidth < 1024) setIsSidebarOpen(false); }}
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
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-4'}`}>
                  <item.icon size={20} className="group-hover:scale-110 transition-transform shrink-0" />
                  {!isCollapsed && (
                    <motion.span 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }}
                      className="font-bold text-sm tracking-wide whitespace-nowrap"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </div>
                {location.pathname === item.path && !isCollapsed && (
                  <motion.div layoutId="activeNav" className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_white]" />
                )}
              </NavLink>
            </motion.div>
          ))}
        </nav>

        <div className="p-4">
          <button 
            onClick={() => setShowLogoutConfirm(true)}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-center gap-3'} py-4 rounded-2xl text-white font-black text-sm transition-all duration-200 hover:brightness-110 active:scale-95 shadow-lg backdrop-blur-md bg-white/10 border border-white/20`}
            title="DÉCONNEXION"
          >
            <LogOut size={18} className="shrink-0" />
            {!isCollapsed && <span className="text-xs uppercase tracking-widest whitespace-nowrap">Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Backdrop for Mobile Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Navbar logic... */}
        <header 
          className="h-20 flex items-center justify-between px-8 z-10 shadow-lg border-b dark:border-white/5 transition-all duration-500"
          style={{ background: theme === 'dark' ? '#1E1B4B' : colors.white, color: theme === 'dark' ? colors.white : '#1F2937' }}
        >
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all border border-white/20" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <Menu size={24} />
            </button>
            <div className="flex flex-col">
              <h2 className={`text-[9px] font-black tracking-[0.2em] uppercase ${theme === 'dark' ? 'text-purple-400' : 'opacity-60 text-slate-900'}`}>Espace Adhérent</h2>
              <p className={`text-base sm:text-lg font-black tracking-tight uppercase leading-none truncate max-w-[150px] sm:max-w-none ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Salut, {user?.prenom || 'Utilisateur'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {['ADMIN', 'RESPONSABLE_RH'].includes(user?.role) && (
              <button 
                onClick={() => navigate('/admin/dashboard')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all border group active:scale-95 ${
                  theme === 'dark' 
                  ? 'bg-white/10 hover:bg-white text-white hover:text-purple-600 border-white/20' 
                  : 'bg-purple-50 hover:bg-purple-600 text-purple-600 hover:text-white border-purple-100 shadow-md'
                }`}
                title="Retour au Panel Admin"
              >
                <Activity size={18} className="group-hover:rotate-12 transition-transform" />
                <span className="hidden sm:inline text-[10px] font-black uppercase tracking-[0.1em]">Vers Panel Admin</span>
              </button>
            )}

            <button onClick={toggleTheme} className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all border border-white/10">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            <div className="flex items-center gap-3 sm:gap-4 pl-4 sm:pl-6 border-l border-slate-200 dark:border-white/10 transition-colors">
              <div className={`text-right hidden sm:block ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                <p className="text-[9px] font-black tracking-widest opacity-60 uppercase leading-none">{user?.role || 'ADHÉRENT'}</p>
                <p className="text-xs font-bold">{user?.prenom}</p>
              </div>
              <div 
                onClick={() => navigate('/profile')}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/20 p-0.5 border border-white/30 backdrop-blur-sm shadow-xl overflow-hidden cursor-pointer hover:scale-110 active:scale-95 transition-all group"
              >
                <div className="w-full h-full rounded-[10px] sm:rounded-[14px] bg-white flex items-center justify-center overflow-hidden">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User size={24} className="transition-transform group-hover:rotate-12" style={{ color: '#4B0082' }} />
                  )}
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
        message="Voulez-vous vraiment vous déconnecter de votre espace CareCover ?"
        confirmText="Se déconnecter"
        cancelText="Rester"
        type="warning"
      />
    </div>
  );
};

export default UserLayout;
