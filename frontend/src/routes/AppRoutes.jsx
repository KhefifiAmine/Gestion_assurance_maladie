import React from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import Login from '../pages/Authentification/Login';
import Register from '../pages/Authentification/Register';
import AdminLogin from '../pages/Authentification/AdminLogin';
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
import AdminStats from '../pages/admin/AdminStats';
import AdminBeneficiarie from '../pages/admin/AdminBeneficiarie';
import UserBeneficiarie from '../pages/user/UserBeneficiarie';
import UserReclamation from '../pages/user/UserReclamation';
import AdminReclamation from '../pages/admin/AdminReclamation';
import GATAboutServices from '../pages/GATAboutServices';
import GATAboutUs from '../pages/GATAboutUs';
import GATVitrine from '../pages/GATVitrine';
import HowItWorks from '../pages/HowItWorks';
import PublicLayout from '../layouts/PublicLayout';
import LandingPage from '../pages/LandingPage';

const AppRoutes = () => {
    return (
        <Routes>
            {/* Pages publiques — Header partagé via PublicLayout */}
            <Route element={<PublicLayout />}>
                <Route path="/" element={<HomeRedirect />} />
                <Route path="/comment-ca-marche" element={<HowItWorks />} />
            </Route>

            {/* Autres pages publiques sans PublicLayout */}
            <Route path="/vitrine" element={<GATVitrine />} />
            <Route path="/a-propos" element={<GATAboutServices />} />

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
                <Route path="/reclamations" element={<UserReclamation />} />
                {/* On peut aussi ajouter /bulletins si le user veut un lien direct */}
                <Route path="/bulletins" element={<BulletinsPage />} />
                <Route path="/beneficiaires" element={<UserBeneficiarie />} />
                <Route path="/a-propos-nous" element={<GATVitrine />} />
            </Route>

            {/* Espace Administration (Admin) */}
            <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['ADMIN', 'RESPONSABLE_RH']}>
                    <AdminLayout />
                </ProtectedRoute>
            }>
                <Route index element={<AdminHomeRedirect />} />
                <Route path="dashboard" element={<AdminDashboard mode="all" />} />
                <Route path="users" element={<ProtectedRoute allowedRoles={['RESPONSABLE_RH']}><AdminDashboard mode="all" /></ProtectedRoute>} />
                <Route path="bulletins" element={<ProtectedRoute allowedRoles={['ADMIN', 'RESPONSABLE_RH']}><AdminBulletins /></ProtectedRoute>} />
                <Route path="reclamations" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminReclamation /></ProtectedRoute>} />
                <Route path="statistiques" element={<ProtectedRoute allowedRoles={['ADMIN', 'RESPONSABLE_RH']}><AdminStats /></ProtectedRoute>} />
                <Route path="beneficiaires" element={<ProtectedRoute allowedRoles={['RESPONSABLE_RH']}><AdminBeneficiarie /></ProtectedRoute>} />
            </Route>

            {/* Catch-all redirection */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default AppRoutes;
