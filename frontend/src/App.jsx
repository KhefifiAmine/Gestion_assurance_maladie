import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import AuthLayout from './layouts/AuthLayout';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';
import AdminLayout from './layouts/AdminLayout';
import UserLayout from './layouts/UserLayout';
import UsersDashboard from './pages/UsersDashboard';
import BulletinsSoin from './pages/BulletinsSoin';
import ForgotPassword from './pages/ForgotPassword';
import VerifyResetCode from './pages/VerifyResetCode';
import ResetPassword from './pages/ResetPassword';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';

// Composant de protection des routes (redirige vers /login si non authentifié)
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Loader2 size={48} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (requireAdmin && user?.role !== 'ADMIN') {
    return <Navigate to="/profile" replace />; // Redirige les adhérents
  }

  return children;
};

// Composant pour rediriger l'utilisateur vers son espace approprié
const HomeRedirect = () => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return user?.role === 'ADMIN' ? <Navigate to="/admin" replace /> : <Navigate to="/profile" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <Routes>
              {/* Redirection intelligente à la racine */}
              <Route path="/" element={<HomeRedirect />} />

              {/* Authentification */}
              <Route element={<AuthLayout reverse={false} />}>
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/verify-reset-code" element={<VerifyResetCode />} />
                <Route path="/reset-password" element={<ResetPassword />} />
              </Route>

              <Route element={<AuthLayout reverse={true} />}>
                <Route path="/register" element={<Register />} />
              </Route>

              {/* Espace Adhérent (User) */}
              <Route element={<ProtectedRoute><UserLayout /></ProtectedRoute>}>
                <Route path="/profile" element={<Profile />} />
                <Route path="/bulletins" element={<BulletinsSoin />} />
                <Route path="/reclamations" element={<div className="p-8 text-2xl font-semibold text-slate-800 dark:text-white">Mes Réclamations (En construction)</div>} />
              </Route>

              {/* Espace Administration (Admin) */}
              <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><AdminLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="users" replace />} />
                <Route path="users" element={<UsersDashboard />} />
                <Route path="bulletins" element={<BulletinsSoin />} />
                <Route path="reclamations" element={<div className="p-8 text-2xl font-semibold text-slate-800 dark:text-white">Réclamations (En construction)</div>} />
                <Route path="statistiques" element={<div className="p-8 text-2xl font-semibold text-slate-800 dark:text-white">Statistiques (En construction)</div>} />
                <Route path="securite" element={<div className="p-8 text-2xl font-semibold text-slate-800 dark:text-white">Sécurité (En construction)</div>} />
              </Route>

              {/* Catch-all redirection */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
