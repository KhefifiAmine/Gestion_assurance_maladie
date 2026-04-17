import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import ttLogo from '../../assets/Tunisie_Telecom.jpg';

const Login = () => {
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [emailError, setEmailError] = useState('');
    const isAdmin = window.location.pathname.includes('/admin');

    const { login: authLogin } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const validateEmail = (email) => {
        if (!email) return "L'email est requis";
        if (!/^[a-zA-Z0-9._%+-]+@(tunisietelecom\.tn|gmail\.com|test\.com)$/.test(email)) return "Email @tunisietelecom.tn, @gmail.com ou @test.com requis";
        return "";
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCredentials(prev => ({ ...prev, [name]: value }));
        if (name === 'email' && emailError) setEmailError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const error = validateEmail(credentials.email);
        if (error) {
            setEmailError(error);
            return;
        }

        try {
            setIsLoading(true);
            const data = await loginUser(credentials.email, credentials.password);
            authLogin(data.token, data.user);
            showToast(`Bienvenue, ${data.user.nom}!`, "success");
            navigate("/dashboard");
        } catch (err) {
            showToast(err.message || "Échec de la connexion", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`bg-white dark:bg-slate-800 ${isAdmin ? 'p-3 md:p-5 max-w-[340px]' : 'p-4 md:p-8 max-w-[400px]'} mx-auto rounded-[1.2rem] shadow-2xl border border-slate-50 dark:border-slate-700 transition-all`}>
            {/* Logo */}
            <div className={`flex justify-center ${isAdmin ? 'mb-3' : 'mb-4'}`}>
                <img src={ttLogo} alt="Tunisie Telecom" className={`${isAdmin ? 'h-8' : 'h-10'} w-auto object-contain`} />
            </div>

            {/* Badge Sécurisé (Style BTK) - Plus compact pour admin */}
            <div className={`flex justify-center ${isAdmin ? 'mb-3' : 'mb-4'}`}>
                <div className={`flex items-center gap-2 bg-[#e8f2ff] dark:bg-blue-900/30 ${isAdmin ? 'px-3 py-1' : 'px-4 py-1.5'} rounded-full border border-blue-50 dark:border-blue-800`}>
                    <ShieldCheck className={`${isAdmin ? 'w-3' : 'w-3.5'} h-${isAdmin ? '3' : '3.5'} text-[#005aab]`} />
                    <span className={`${isAdmin ? 'text-[9px]' : 'text-[10px]'} font-bold text-[#004a8d] dark:text-blue-300 uppercase tracking-widest`}>
                        {isAdmin ? 'Admin Secure' : 'Secure Access'}
                    </span>
                </div>
            </div>

            {/* Titres */}
            <div className={`text-center ${isAdmin ? 'mb-5' : 'mb-6'}`}>
                <h2 className={`${isAdmin ? 'text-lg' : 'text-xl'} font-black text-slate-900 dark:text-white mb-0.5 tracking-tight`}>
                    {isAdmin ? 'Portail Admin' : 'Connexion'}
                </h2>
                <p className="text-slate-400 dark:text-slate-500 text-[11px] md:text-sm font-medium">
                    {isAdmin ? 'Accès réservé au personnel' : 'Espace de gestion Assurance Maladie'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-wider">Email</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300 group-focus-within:text-purple-600">
                            <Mail size={16} />
                        </div>
                        <input
                            type="email"
                            name="email"
                            placeholder="email@tunisietelecom.tn"
                            value={credentials.email}
                            onChange={handleChange}
                            className={`w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-2 rounded-xl transition-all outline-none text-sm text-slate-900 dark:text-white placeholder:text-slate-200 ${emailError ? "border-red-400" : "border-slate-100 dark:border-slate-800 focus:border-purple-600"
                                }`}
                            required
                        />
                    </div>
                    {emailError && (
                        <p className="text-red-500 text-xs mt-1 font-semibold">{emailError}</p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <div className="flex justify-between items-center ml-1">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mot de passe</label>
                        <Link to="/forgot-password" size="sm" className="text-[10px] font-bold text-purple-600 hover:text-purple-700 uppercase">
                            Oublié ?
                        </Link>
                    </div>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300 group-focus-within:text-purple-600">
                            <Lock size={16} />
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            placeholder="••••••••"
                            value={credentials.password}
                            onChange={handleChange}
                            className="w-full pl-11 pr-11 py-3 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-800 rounded-xl transition-all outline-none text-sm text-slate-900 dark:text-white placeholder:text-slate-200 focus:border-purple-600"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-300 hover:text-slate-500"
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full ${isAdmin ? 'py-3' : 'py-3.5'} bg-purple-600 hover:bg-purple-700 active:scale-[0.98] disabled:opacity-70 text-white rounded-xl font-bold text-sm shadow-xl shadow-purple-500/10 transition-all flex items-center justify-center gap-2 group mt-1`}
                >
                    {isLoading ? (
                        <Loader2 className="animate-spin" size={18} />
                    ) : (
                        <>
                            <span>{isAdmin ? 'S\'identifier' : 'Se connecter'} </span>
                            <ArrowRight size={isAdmin ? 16 : 18} className="group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </form>

            {/* Footer compact */}
            <div className="mt-6 pt-4 border-t border-slate-50 dark:border-slate-800/50 text-center">
                <div className="flex flex-col items-center gap-2 opacity-50">
                    <div className="flex items-center gap-2 text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        <ShieldCheck size={12} className="text-[#005aab]" />
                        Authorized Personnel Only
                    </div>
                    <p className="text-[9px] text-slate-400 max-w-[200px] leading-tight mx-auto font-medium">
                        Système d'accès sécurisé et crypté.
                    </p>
                </div>
            </div>

            <div className="mt-4 text-center">
                <Link to="/register" className="text-[10px] font-bold text-slate-400 hover:text-[#005aab] uppercase tracking-wider transition-colors">
                    Nouveau ? Créer un compte
                </Link>
            </div>
        </div>
    );
};

export default Login;
