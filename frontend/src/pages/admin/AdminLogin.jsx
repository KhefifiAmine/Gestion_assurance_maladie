import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldAlert, Loader2, Key } from 'lucide-react';
import ttLogo from '../../assets/Tunisie_Telecom.jpg';

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
        
        // Validation du domaine
        if (!/^[a-zA-Z0-9._%+-]+@(tunisietelecom\.tn|gmail\.com)$/.test(credentials.email)) {
            showToast("Identifiant invalide. Utilisez @tunisietelecom.tn ou @gmail.com", "error");
            return;
        }

        try {
            setIsLoading(true);
            const data = await loginUser(credentials.email, credentials.password);
            
            // Vérification stricte du rôle ADMIN ou SUPER_ADMIN
            if (!['ADMIN', 'SUPER_ADMIN'].includes(data.user.role)) {
                showToast("Accès refusé. Cette interface est réservée au personnel autorisé.", "error");
                return;
            }

            authLogin(data.token, data.user);
            showToast(`Session Administrative ouverte : ${data.user.nom}`, "success");
            navigate("/admin/dashboard");
            
        } catch (err) {
            showToast(err.message || "Identifiants administratifs incorrects", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-[#1e293b] border-2 border-slate-100 dark:border-slate-700 p-6 md:p-8 rounded-[2rem] shadow-2xl dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] max-w-md w-full mx-auto overflow-hidden relative transition-colors duration-300">
            {/* Décoration subtile en arrière-plan */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/5 dark:bg-blue-600/10 rounded-full blur-3xl"></div>
            
            {/* Logo */}
            <div className="flex justify-center mb-5 relative z-10">
                <div className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-50">
                    <img src={ttLogo} alt="Tunisie Telecom" className="h-9 w-auto object-contain" />
                </div>
            </div>

            {/* Titre Institutionnel */}
            <div className="text-center mb-6 relative z-10">
                <div className="flex justify-center mb-3">
                    <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 p-2 rounded-xl border border-amber-500/20">
                        <Key size={20} />
                    </div>
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1.5 tracking-tight uppercase">
                    Portail Admin
                </h2>
                <div className="h-1 w-10 bg-amber-500 rounded-full mx-auto mb-3"></div>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.15em]">
                    Authentification Critique
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 ml-1 uppercase tracking-[0.2em]">Identifiant Admin</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300 dark:text-slate-500 group-focus-within:text-amber-500 transition-colors">
                            <Mail size={16} />
                        </div>
                        <input
                            type="email"
                            name="email"
                            placeholder="nom.admin@tunisietelecom.tn"
                            value={credentials.email}
                            onChange={handleChange}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-700/50 rounded-xl transition-all outline-none text-sm text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:border-amber-500/50 focus:bg-white dark:focus:bg-slate-900"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 ml-1 uppercase tracking-[0.2em]">mot de passe</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300 dark:text-slate-500 group-focus-within:text-amber-500 transition-colors">
                            <Lock size={16} />
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            placeholder="••••••••••••"
                            value={credentials.password}
                            onChange={handleChange}
                            className="w-full pl-11 pr-11 py-3 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-700/50 rounded-xl transition-all outline-none text-sm text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:border-amber-500/50 focus:bg-white dark:focus:bg-slate-900"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 active:scale-[0.98] disabled:opacity-50 text-slate-950 rounded-xl font-black text-xs uppercase tracking-[0.15em] shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-3 mt-3"
                >
                    {isLoading ? (
                        <Loader2 className="animate-spin" size={18} />
                    ) : (
                        <>
                            <span>Ouvrir la session</span>
                            <ArrowRight size={18} />
                        </>
                    )}
                </button>
            </form>

            {/* Avis de sécurité strict - Version compacte */}
            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center gap-3 p-3 bg-red-500/5 rounded-xl border border-red-500/10">
                    <ShieldAlert className="text-red-500 shrink-0" size={16} />
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight font-bold uppercase tracking-tight">
                        Tentatives non autorisées enregistrées. Surveillance 24/7.
                    </p>
                </div>
            </div>
            
            <div className="mt-4 text-center">
                <button 
                    onClick={() => navigate('/')}
                    className="text-[10px] font-black text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white uppercase tracking-[0.2em] transition-colors"
                >
                    ← Portail public
                </button>
            </div>
        </div>
    );
};

export default AdminLogin;
