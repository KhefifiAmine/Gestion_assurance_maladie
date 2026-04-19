import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { loginUser } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldAlert, Loader2, Key, Star, Smartphone } from 'lucide-react';

import logoGat from '../../assets/logo_gat.png';
import ttLogo from '../../assets/Tunisie_Telecom.jpg';
import adminBg from '../../assets/admin_login.png';

const AdminLogin = () => {
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { login: authLogin } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCredentials(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!/^[a-zA-Z0-9._%+-]+@(tunisietelecom\.tn|gmail\.com|test\.com)$/.test(credentials.email)) {
            showToast("Identifiant invalide. Utilisez @tunisietelecom.tn, @gmail.com ou @test.com", "error");
            return;
        }

        try {
            setIsLoading(true);
            const data = await loginUser(credentials.email, credentials.password, true);
            if (!['ADMIN', 'RESPONSABLE_RH'].includes(data.user.role)) {
                showToast("Accès refusé. Portail restreint.", "error");
                return;
            }
            authLogin(data.token, data.user);
            showToast(`Bienvenue, ${data.user.nom}`, "success");
            navigate("/admin/dashboard");
        } catch (err) {
            showToast(err.message || "Identifiants administratifs incorrects", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 p-8 md:p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full mx-auto overflow-hidden relative"
        >
            {/* Background Accents */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-600/10 rounded-full blur-[80px]" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-600/10 rounded-full blur-[80px]" />

            {/* Branding Section */}
            <div className="flex items-center justify-center gap-10 mb-10 relative z-10">
                {/* Logo 1: GAT Assurances */}
                <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="bg-white p-3 rounded-2xl shadow-xl border border-slate-50"
                >
                    <img src={logoGat} alt="GAT" className="h-14 lg:h-16 w-auto object-contain" />
                </motion.div>

                {/* Separator */}
                <div className="w-px h-10 bg-slate-200 dark:bg-slate-700"></div>

                {/* Logo 2: Tunisie Telecom */}
                <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="bg-white p-3 rounded-2xl shadow-xl border border-slate-50"
                >
                    <img src={ttLogo} alt="Tunisie Telecom" className="h-14 lg:h-16 w-auto object-contain" />
                </motion.div>
            </div>

            {/* Title Section */}
            <div className="text-center mb-8 relative z-10">
                <div className="flex justify-center mb-4">
                    <div className="bg-purple-600/10 text-purple-600 dark:text-purple-400 p-3 rounded-2xl border border-purple-500/20 shadow-inner">
                        <Key size={24} className="animate-pulse" />
                    </div>
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter uppercase">
                    Portail Admin
                </h2>
                <div className="flex items-center justify-center gap-2 mb-4">
                    <div className="h-1 w-8 bg-purple-600 rounded-full" />
                    <Star size={12} className="text-purple-600 fill-purple-600" />
                    <div className="h-1 w-8 bg-purple-600 rounded-full" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.25em]">
                    Contrôle d'accès sécurisé
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 ml-1 uppercase tracking-[0.2em]">Identifiant</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300 dark:text-slate-500 group-focus-within:text-purple-600 transition-colors">
                            <Mail size={18} />
                        </div>
                        <input
                            type="email"
                            name="email"
                            placeholder="nom.admin@tunisietelecom.tn"
                            value={credentials.email}
                            onChange={handleChange}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl transition-all outline-none text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500"
                            required
                        />
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 ml-1 uppercase tracking-[0.2em]">Mot de passe</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300 dark:text-slate-500 group-focus-within:text-purple-600 transition-colors">
                            <Lock size={18} />
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            placeholder="••••••••••••"
                            value={credentials.password}
                            onChange={handleChange}
                            className="w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl transition-all outline-none text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-300 hover:text-purple-600 transition-colors"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </motion.div>

                <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-purple-500/25 flex items-center justify-center gap-3 mt-4 disabled:opacity-50 h-[58px]"
                >
                    {isLoading ? (
                        <Loader2 className="animate-spin" size={20} />
                    ) : (
                        <>
                            <span>Accéder au Panel</span>
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </motion.button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-4 p-4 bg-red-500/5 dark:bg-red-500/10 rounded-2xl border border-red-500/10">
                    <ShieldAlert className="text-red-500 shrink-0" size={18} />
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-bold uppercase tracking-wide">
                        Espace surveillé. Toute tentative d'intrusion sera signalée.
                    </p>
                </div>
            </div>

            <div className="mt-6 text-center">
                <button
                    onClick={() => navigate('/')}
                    className="text-[10px] font-black text-slate-400 dark:text-slate-500 hover:text-purple-600 uppercase tracking-[0.3em] transition-all"
                >
                    ← Retour à l'accueil
                </button>
            </div>
        </motion.div>
    );
};

export default AdminLogin;
