import Login from './pages/Login';
import Register from './pages/Register';
import AdminLogin from './pages/admin/AdminLogin';
import UserProfile from './pages/user/UserProfile';
import AuthLayout from './layouts/AuthLayout';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';
import AdminLayout from './layouts/AdminLayout';
import UserLayout from './layouts/UserLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserDashboard from './pages/user/UserDashboard';
import ForgotPassword from './pages/Résinstaller mot de passe/ForgotPassword';
import VerifyResetCode from './pages/Résinstaller mot de passe/VerifyResetCode';
import ResetPassword from './pages/Résinstaller mot de passe/ResetPassword';
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

  if (!isAuthenticated) {
    return <Navigate to={requireAdmin ? "/admin/login" : "/login"} replace />;
  }

  if (requireAdmin && !['ADMIN', 'RESPONSABLE_RH'].includes(user?.role)) {
    return <Navigate to="/dashboard" replace />; // Redirige les adhérents
  }

  return children;
};

// Composant pour rediriger l'utilisateur vers son espace approprié
const HomeRedirect = () => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return user?.role === 'ADMIN' ? <Navigate to="/admin" replace /> : <Navigate to="/dashboard" replace />;
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
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/verify-reset-code" element={<VerifyResetCode />} />
                <Route path="/reset-password" element={<ResetPassword />} />
              </Route>


              {/* Espace Adhérent (User) */}
              <Route element={<ProtectedRoute><UserLayout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<UserDashboard />} />
                <Route path="/profile" element={<UserProfile />} />
                <Route path="/reclamations" element={<div className="p-8 text-2xl font-semibold text-slate-800 dark:text-white">Mes Réclamations (En construction)</div>} />
              </Route>

              {/* Espace Administration (Admin) */}
              <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><AdminLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<AdminDashboard mode="adherents" />} />
                <Route path="bulletins" element={<UserDashboard />} />
                <Route path="reclamations" element={<div className="p-8 text-2xl font-semibold text-slate-800 dark:text-white">Réclamations (En construction)</div>} />
                <Route path="statistiques" element={<div className="p-8 text-2xl font-semibold text-slate-800 dark:text-white">Statistiques (En construction)</div>} />
                <Route path="securite" element={<AdminDashboard mode="admins" />} />
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
