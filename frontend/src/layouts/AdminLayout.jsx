import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  FileText,
  AlertTriangle,
  BarChart2,
  ShieldCheck,
  LogOut,
  Menu,
  Moon,
  Sun,
  LayoutDashboard,
  Activity,
  User as UserIcon,
  ChevronRight
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ConfirmModal';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // --- COLOR SYSTEM (60-30-10 Rule) ---
  const colors = {
    base60: theme === 'dark' ? '#0F172A' : '#F3F4F6',
    secondary30Gradient: theme === 'dark' 
      ? 'linear-gradient(135deg, #1E1B4B 0%, #0F172A 100%)' 
      : 'linear-gradient(135deg, #4B0082 0%, #2D004F 100%)',
    accent10: '#7C3AED',
    white: '#FFFFFF',
    textDark: theme === 'dark' ? '#F8FAFC' : '#1F2937'
  };

  const confirmLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const menuItems = [
    { name: 'Vue d\'ensemble', path: '/admin/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'RESPONSABLE_RH'] },
    // RH Features
    { name: 'Utilisateurs', path: '/admin/users', icon: Users, roles: ['RESPONSABLE_RH'] },
    { name: 'Gestion Admins', path: '/admin/securite', icon: ShieldCheck, roles: ['RESPONSABLE_RH'] },

    // Admin Features
    { name: 'Bulletins de Soin', path: '/admin/bulletins', icon: FileText, roles: ['ADMIN'] },
    { name: 'Réclamations', path: '/admin/reclamations', icon: AlertTriangle, roles: ['ADMIN'] },
    { name: 'Finances & Stats', path: '/admin/statistiques', icon: BarChart2, roles: ['ADMIN'] },

    // Shortcut back
    { name: 'Espace Adhérent', path: '/dashboard', icon: UserIcon, roles: ['ADMIN', 'RESPONSABLE_RH'] },
  ];

  const filteredMenuItems = menuItems.filter(item => item.roles.includes(user?.role));

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans" style={{ backgroundColor: colors.base60 }}>
      {/* --- TOP PROGRESS BAR --- */}
      <motion.div
        key={location.pathname + "_progress"}
        initial={{ width: "0%", opacity: 1 }}
        animate={{ width: "100%", opacity: 0 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        className="fixed top-0 left-0 h-1 z-[100] bg-gradient-to-r from-purple-400 to-indigo-600"
      />

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-500 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 overflow-hidden shadow-2xl`}
        style={{ width: '280px', background: colors.secondary30Gradient }}
      >
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-lg group hover:rotate-12 transition-transform cursor-pointer">
            <Activity style={{ color: '#4B0082' }} size={24} />
          </div>
          <div>
            <h1 className="text-white font-black text-xl tracking-tighter leading-none">TT ADMIN</h1>
            <span className="text-[9px] font-black text-purple-300 tracking-[0.2em] uppercase">Control Center</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-3 overflow-y-auto custom-scrollbar">
          <div className="pb-4 px-4 text-[10px] font-black text-white/30 tracking-[0.3em] uppercase">Navigation</div>
          {filteredMenuItems.map((item) => (
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
                  <motion.div layoutId="activeNavAdmin" className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_white]" />
                )}
              </NavLink>
            </motion.div>
          ))}
        </nav>

        <div className="p-6 border-t border-white/10">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center justify-center gap-3 bg-white/10 hover:bg-red-500 text-white font-black py-4 px-6 rounded-2xl w-full transition-all group active:scale-95"
          >
            <LogOut size={20} className="group-hover:rotate-12 transition-transform" />
            <span className="text-sm uppercase tracking-widest">Quitter</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header 
          className="h-20 flex items-center justify-between px-8 z-10 shadow-lg border-b dark:border-white/5"
          style={{ background: theme === 'dark' ? '#1E1B4B' : colors.white }}
        >
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <Menu size={24} className="text-slate-600 dark:text-white" />
            </button>
            <div>
              <h2 className="text-[10px] font-black tracking-[0.2em] opacity-40 uppercase text-slate-900 dark:text-white">Back-Office</h2>
              <p className="text-lg font-black tracking-tight uppercase text-slate-900 dark:text-white">Tableau de Bord Admin</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate('/dashboard')}
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-purple-600/10 hover:bg-purple-600 text-purple-600 hover:text-white rounded-xl transition-all border border-purple-500/20 group active:scale-95"
              title="Passer à l'Espace Adhérent"
            >
              <UserIcon size={18} className="group-hover:rotate-12 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-[0.1em]">Vers Espace Adhérent</span>
            </button>

            <button onClick={toggleTheme} className="p-2.5 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-all border border-gray-200 dark:border-white/10 text-slate-600 dark:text-white">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            <div className="flex items-center gap-4 pl-6 border-l dark:border-white/10">
              <div className="text-right hidden md:block">
                <p className="text-[10px] font-black tracking-widest opacity-40 uppercase text-slate-900 dark:text-white">{user?.role === 'RESPONSABLE_RH' ? 'RH Manager' : 'Administrateur'}</p>
                <p className="text-sm font-black text-slate-900 dark:text-white">{user?.prenom} {user?.nom}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 p-0.5 shadow-xl overflow-hidden">
                <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center">
                  <UserIcon size={24} style={{ color: '#4B0082' }} />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content with Transitions */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Logout Confirmation */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
        title="Confirmer la déconnexion"
        message="Voulez-vous vraiment fermer votre session administrateur ?"
        confirmText="Déconnexion"
        cancelText="Annuler"
        type="warning"
      />
    </div>
  );
};

export default AdminLayout;
