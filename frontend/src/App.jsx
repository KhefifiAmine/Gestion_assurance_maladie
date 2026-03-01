import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import AuthLayout from './layouts/AuthLayout';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';
import AdminLayout from './layouts/AdminLayout';
import UsersDashboard from './pages/UsersDashboard';

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

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Redirection vers login par défaut */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* LOGIN : formulaire gauche */}
          <Route element={<AuthLayout reverse={false} />}>
            <Route path="/login" element={<Login />} />
          </Route>

          {/* REGISTER : formulaire droite */}
          <Route element={<AuthLayout reverse={true} />}>
            <Route path="/register" element={<Register />} />
          </Route>

          {/* GESTION DE PROFIL - Protégé */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />

          {/* ADMIN DASHBOARD - Protégé (Role ADMIN) */}
          <Route path="/admin" element={
            <ProtectedRoute requireAdmin={true}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="users" replace />} />
            <Route path="users" element={<UsersDashboard />} />
            {/* Autres routes: bulletins, reclamations... pour l'instant un fallback */}
            <Route path="bulletins" element={<div className="p-8 text-2xl font-semibold">Bulletins (En construction)</div>} />
            <Route path="reclamations" element={<div className="p-8 text-2xl font-semibold">Réclamations (En construction)</div>} />
            <Route path="statistiques" element={<div className="p-8 text-2xl font-semibold">Statistiques (En construction)</div>} />
            <Route path="securite" element={<div className="p-8 text-2xl font-semibold">Sécurité (En construction)</div>} />
          </Route>

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
