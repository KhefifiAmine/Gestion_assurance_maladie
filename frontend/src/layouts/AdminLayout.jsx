import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
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
    Sun
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import ttLogo from '../assets/Tunisie_Telecom.jpg';
import ConfirmModal from '../components/ConfirmModal';
import { useState } from 'react';

const AdminLayout = () => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleThemeToggle = () => {
        const nextTheme = theme === 'dark' ? 'clair' : 'sombre';
        toggleTheme();
        showToast(`Passage au mode ${nextTheme}`, "info");
    };

    const handleLogoutClick = () => {
        setShowLogoutConfirm(true);
    };

    const confirmLogout = () => {
        logout();
        navigate('/admin/login');
    };

    const menuItems = [
        { name: 'Adhérents', path: '/admin/users', icon: <Users size={20} />, roles: ['ADMIN', 'RESPONSABLE_RH'] },
        { name: 'Bulletins de Soin', path: '/admin/bulletins', icon: <FileText size={20} />, roles: ['ADMIN'] },
        { name: 'Réclamations', path: '/admin/reclamations', icon: <AlertTriangle size={20} />, roles: ['ADMIN', 'RESPONSABLE_RH'] },
        { name: 'Finances & Stats', path: '/admin/statistiques', icon: <BarChart2 size={20} />, roles: ['RESPONSABLE_RH'] },
        { name: 'Gestion Admins', path: '/admin/securite', icon: <ShieldCheck size={20} />, roles: ['RESPONSABLE_RH'] },
    ];

    const filteredMenuItems = menuItems.filter(item => item.roles.includes(user?.role));

    return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950 overflow-hidden font-sans transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-900 text-slate-800 dark:text-white flex flex-col justify-between h-full shadow-2xl z-20 border-r border-slate-200 dark:border-white/5 transition-colors duration-300">
        <div>
          <div className="p-6 flex items-center gap-3 border-b border-slate-100 dark:border-white/10">
            <div className="w-12 h-12 bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100 flex items-center justify-center p-1">
                <img src={ttLogo} alt="Tunisie Telecom Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
                <h1 className="text-xl font-black tracking-tighter uppercase italic text-slate-900 dark:text-white leading-none">TT Assurance</h1>
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 tracking-widest uppercase mt-1">Admin Panel</span>
            </div>
          </div>
          
          <nav className="mt-6 flex flex-col w-full px-4 gap-1">
            {filteredMenuItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-6 py-4 rounded-xl text-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 font-bold scale-[1.02]'
                      : 'text-slate-500 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-blue-600 dark:hover:text-white'
                  }`
                }
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="p-6 mb-4">
          <button
            onClick={handleLogoutClick}
            className="flex items-center justify-center gap-3 bg-red-600/90 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-2xl w-full shadow-lg transition-all transform hover:scale-105 active:scale-95"
          >
            <LogOut size={20} />
            Déconnexion
          </button>
        </div>
      </aside >

    {/* Main Content */}
    <main className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-slate-950 transition-colors duration-300">
        {/* Header */}
        <header className="h-20 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-end px-8 shadow-sm gap-4 transition-colors duration-300">
            
            {/* Theme Toggle Button */}
            <button 
                onClick={handleThemeToggle}
                className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-300 shadow-sm border border-slate-200 dark:border-slate-700 z-50"
                title={theme === 'dark' ? 'Passer au mode clair' : 'Passer au mode sombre'}
            >
                {theme === 'dark' ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} />}
            </button>

            <div className="flex items-center gap-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 p-2 rounded-2xl transition-all">
                <div className="w-12 h-12 rounded-full border-2 border-black dark:border-blue-500 flex items-center justify-center bg-white dark:bg-slate-800 overflow-hidden shadow-md">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-black dark:text-blue-500"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </div>
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-black dark:text-white leading-none">
                            {user?.prenom || 'Admin'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${
                            user?.role === 'RESPONSABLE_RH' 
                                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800' 
                                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                        }`}>
                            {user?.role === 'RESPONSABLE_RH' ? 'Responsable RH' : 'Admin'}
                        </span>
                    </div>
                    <span className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-widest mt-1">Status: En ligne</span>
                </div>
            </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-slate-950 transition-colors duration-300 font-sans">
            <Outlet />
        </div>
    </main>

    {/* Modal de Confirmation de Déconnexion */}
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
