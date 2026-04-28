import React, { useState, useEffect, useRef } from 'react';
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
  Zap,
  CheckCheck
} from 'lucide-react';
import logoApp1 from '../assets/logo_app_1.png';
import AddBulletinModal from '../components/AddBulletinModal';
import ConfirmModal from '../components/ConfirmModal';
import { fetchMyNotifications, fetchUnreadCount, markNotificationAsRead, markAllNotificationsAsRead } from '../services/notificationService';

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

  // --- Notification State ---
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  // Fetch notifications on mount and every 30s
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const [notifData, countData] = await Promise.all([
          fetchMyNotifications(),
          fetchUnreadCount()
        ]);
        setNotifications(notifData.data || []);
        setUnreadCount(countData.count || 0);
      } catch (err) {
        // silently ignore
      }
    };
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
      setUnreadCount(0);
    } catch (err) { /* ignore */ }
  };

  const handleMarkOneRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) { /* ignore */ }
  };


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
    { name: 'À propos GAT Assurance', path: '/a-propos-nous', icon: Zap },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Mes Bulletins', path: '/bulletins', icon: FileText },
    { name: 'Réclamations', path: '/reclamations', icon: Bell },
    { name: 'Mon profil', path: '/profile', icon: User },
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
            <div className="flex items-center">
              <h2 className={`text-xl sm:text-2xl font-black tracking-tight uppercase ${theme === 'dark' ? 'text-purple-400' : 'text-slate-900'}`}>
                Espace Adhérent
              </h2>
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

            {/* --- Notification Bell --- */}
            <div className="relative" ref={notifRef}>
              <button
                id="notification-bell-btn"
                onClick={() => setShowNotifications(prev => !prev)}
                className={`relative p-2.5 rounded-xl transition-all border ${
                  theme === 'dark'
                    ? 'bg-white/10 hover:bg-white/20 border-white/10 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-slate-700'
                }`}
                title="Notifications"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center px-1 shadow-lg animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className={`absolute right-0 mt-2 w-80 rounded-2xl shadow-2xl border z-50 overflow-hidden ${
                      theme === 'dark' ? 'bg-slate-800 border-white/10' : 'bg-white border-gray-200'
                    }`}
                    style={{ top: '100%' }}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b dark:border-white/10">
                      <span className={`text-sm font-black ${ theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                        Notifications {unreadCount > 0 && <span className="ml-1 text-xs bg-red-500 text-white rounded-full px-2 py-0.5">{unreadCount}</span>}
                      </span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="flex items-center gap-1 text-xs font-bold text-purple-500 hover:text-purple-700 transition-colors"
                          title="Tout marquer comme lu"
                        >
                          <CheckCheck size={14} />
                          Tout lire
                        </button>
                      )}
                    </div>

                    {/* Notification list */}
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center">
                          <Bell size={28} className="mx-auto mb-2 opacity-30" />
                          <p className={`text-xs opacity-50 ${ theme === 'dark' ? 'text-white' : 'text-slate-700'}`}>Aucune notification</p>
                        </div>
                      ) : (
                        notifications.map(notif => (
                          <div
                            key={notif.id}
                            onClick={() => !notif.lu && handleMarkOneRead(notif.id)}
                            className={`px-4 py-3 border-b last:border-b-0 cursor-pointer transition-colors ${
                              notif.lu
                                ? theme === 'dark' ? 'border-white/5 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'
                                : theme === 'dark' ? 'bg-purple-900/30 border-purple-500/20 hover:bg-purple-900/50' : 'bg-purple-50 border-purple-100 hover:bg-purple-100'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              {!notif.lu && (
                                <span className="mt-1.5 w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                              )}
                              <div className={!notif.lu ? '' : 'pl-4'}>
                                <p className={`text-xs font-bold leading-tight ${ theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{notif.titre}</p>
                                <p className={`text-[11px] mt-0.5 leading-snug ${ theme === 'dark' ? 'text-white/60' : 'text-slate-500'}`}>{notif.description}</p>
                                <p className="text-[10px] mt-1 opacity-40">
                                  {new Date(notif.createdAt).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {/* --- End Notification Bell --- */}
            
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
              initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="h-full"
              style={{ willChange: 'opacity, transform, filter' }}
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
