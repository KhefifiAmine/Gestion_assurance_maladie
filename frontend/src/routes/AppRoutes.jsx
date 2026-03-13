import React from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import Login from '../pages/Login';
import Register from '../pages/Register';
import AdminLogin from '../pages/admin/AdminLogin';
import UserProfile from '../pages/user/UserProfile';
import AuthLayout from '../layouts/AuthLayout';
import AdminLayout from '../layouts/AdminLayout';
import UserLayout from '../layouts/UserLayout';
import AdminDashboard from '../pages/admin/AdminDashboard';
import UserDashboard from '../pages/user/UserDashboard';
import BulletinsPage from '../pages/user/BulletinsPage';
import AdminBulletins from '../pages/admin/AdminBulletins';
import ForgotPassword from '../pages/Résinstaller mot de passe/ForgotPassword';
import VerifyResetCode from '../pages/Résinstaller mot de passe/VerifyResetCode';
import ResetPassword from '../pages/Résinstaller mot de passe/ResetPassword';
import ProtectedRoute from '../middleware/ProtectedRoute';
import { HomeRedirect, AdminHomeRedirect } from '../utils/navigation';
import ReclamationsManager from '../pages/ReclamationsManager';
import AdminStats from '../pages/admin/AdminStats';

const AppRoutes = () => {
    return (
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
            <Route element={
                <ProtectedRoute allowedRoles={['ADHERENT', 'ADMIN', 'RESPONSABLE_RH']}>
                    <UserLayout />
                </ProtectedRoute>
            }>
                <Route path="/dashboard" element={<UserDashboard />} />
                <Route path="/profile" element={<UserProfile />} />
                <Route path="/reclamations" element={<ReclamationsManager defaultRole="Adhérent" />} />
                {/* On peut aussi ajouter /bulletins si le user veut un lien direct */}
                <Route path="/bulletins" element={<BulletinsPage />} />
            </Route>

            {/* Espace Administration (Admin) */}
            <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['ADMIN', 'RESPONSABLE_RH']}>
                    <AdminLayout />
                </ProtectedRoute>
            }>
                <Route index element={<AdminHomeRedirect />} />
                <Route path="dashboard" element={<AdminDashboard mode="all" />} />
                <Route path="users" element={<ProtectedRoute allowedRoles={['RESPONSABLE_RH']}><AdminDashboard mode="adherents" /></ProtectedRoute>} />
                <Route path="bulletins" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminBulletins /></ProtectedRoute>} />
                <Route path="reclamations" element={<ProtectedRoute allowedRoles={['ADMIN']}><ReclamationsManager defaultRole="Administrateur" /></ProtectedRoute>} />
                <Route path="statistiques" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminStats /></ProtectedRoute>} />
                <Route path="securite" element={<ProtectedRoute allowedRoles={['RESPONSABLE_RH']}><AdminDashboard mode="admins" /></ProtectedRoute>} />
            </Route>

            {/* Catch-all redirection */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default AppRoutes;
