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
    Menu
} from 'lucide-react';

const AdminLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const menuItems = [
        { name: 'Utilisateurs', path: '/admin/users', icon: <Users size={20} /> },
        { name: 'Bulletins', path: '/admin/bulletins', icon: <FileText size={20} /> },
        { name: 'Réclamation', path: '/admin/reclamations', icon: <AlertTriangle size={20} /> },
        { name: 'Statistiques', path: '/admin/statistiques', icon: <BarChart2 size={20} /> },
        { name: 'Sécurité', path: '/admin/securite', icon: <ShieldCheck size={20} /> },
    ];

    return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-black text-white flex flex-col justify-between hidden md:flex h-full">
        <div>
          <div className="p-6 flex items-center gap-3">
            <Menu className="text-white h-8 w-8" />
            <h1 className="text-2xl font-bold tracking-wide">TT Assurance</h1>
          </div>
          
          <nav className="mt-6 flex flex-col w-full">
            {menuItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-8 py-5 text-xl transition-colors ${
                    isActive
                      ? 'bg-white text-black font-semibold shadow-inner'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                {/* L'icône peut être ajoutée ici si désirée, mais selon la maquette c'est juste du texte centré ou aligné. */}
                <span className="text-center w-full">{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="p-6 mb-4 flex justify-center w-full">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-4 px-6 rounded-full w-full mx-2 text-xl shadow-lg transition-transform transform hover:scale-105"
          >
            Déconnexion
          </button>
        </div>
      </aside >

    {/* Main Content */ }
    < main className = "flex-1 flex flex-col h-full overflow-hidden bg-white" >
        {/* Header */ }
        < header className = "h-20 bg-[#f0f2f5] border-b border-gray-200 flex items-center justify-end px-8 shadow-sm" >
            <div className="flex items-center gap-4 cursor-pointer hover:bg-gray-200 p-2 rounded-lg transition-colors">
                {/* User Icon SVG / Avatar placeholder */}
                <div className="w-12 h-12 rounded-full border-2 border-black flex items-center justify-center bg-white overflow-hidden">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-black"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </div>
                <span className="text-2xl font-medium text-black">
                    {user?.prenom || 'Admin'}
                </span>
            </div>
        </header >

    {/* Page Content */ }
    < div className = "flex-1 overflow-auto bg-gray-50" >
        <Outlet />
        </div >
      </main >
    </div >
  );
};

export default AdminLayout;
