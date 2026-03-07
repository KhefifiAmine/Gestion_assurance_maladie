import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { resetPassword } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Lock, Eye, EyeOff, Loader2, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

const ResetPassword = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { showToast } = useToast();
    
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [passwordStrength, setPasswordStrength] = useState(0);

    useEffect(() => {
        if (location.state && location.state.code) {
            setCode(location.state.code);
        } else {
            navigate('/forgot-password');
        }
    }, [location.state, navigate]);

    useEffect(() => {
        let strength = 0;
        if (newPassword.length >= 8) strength += 25;
        if (/[A-Z]/.test(newPassword)) strength += 25;
        if (/[0-9]/.test(newPassword)) strength += 25;
        if (/[^A-Za-z0-9]/.test(newPassword)) strength += 25;
        setPasswordStrength(strength);
    }, [newPassword]);

    const validate = () => {
        const newErrors = {};
        if (newPassword.length < 8) newErrors.password = "Le mot de passe doit contenir au moins 8 caractères";
        if (newPassword !== confirmPassword) newErrors.confirm = "Les mots de passe ne correspondent pas";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            setIsLoading(true);
            const res = await resetPassword(code, newPassword);
            showToast(res.message || 'Mot de passe réinitialisé avec succès.', "success");
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            showToast(err.message || "Une erreur est survenue.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const getStrengthColor = () => {
        if (passwordStrength <= 25) return "bg-red-500";
        if (passwordStrength <= 50) return "bg-orange-500";
        if (passwordStrength <= 75) return "bg-yellow-500";
        return "bg-emerald-500";
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-8 sm:p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700">
            <div className="text-center mb-10">
                <div className="inline-flex p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl mb-6 border border-blue-100 dark:border-blue-800">
                    <ShieldCheck size={32} className="text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">Réinitialisation</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium max-w-[280px] mx-auto leading-relaxed text-sm">
                    Définissez votre nouveau mot de passe sécurisé.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Nouveau mot de passe</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500">
                            <Lock size={18} />
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={newPassword}
                            onChange={(e) => {
                                setNewPassword(e.target.value);
                                if (errors.password) setErrors({...errors, password: ''});
                            }}
                            className={`w-full pl-11 pr-12 py-4 bg-slate-50 dark:bg-slate-900/50 border-2 rounded-2xl transition-all outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 ${
                                errors.password ? "border-red-400 focus:border-red-500" : "border-slate-100 dark:border-slate-800 focus:border-blue-500"
                            }`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                {newPassword && (
                    <div className="px-1 space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                            <span className="text-slate-400">Force</span>
                            <span className={getStrengthColor().replace('bg-', 'text-')}>{passwordStrength}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                            <div 
                                className={`h-full transition-all duration-500 ${getStrengthColor()}`}
                                style={{ width: `${passwordStrength}%` }}
                            />
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Confirmer</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500">
                            <Lock size={18} />
                        </div>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                if (errors.confirm) setErrors({...errors, confirm: ''});
                            }}
                            className={`w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-slate-900/50 border-2 rounded-2xl transition-all outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 ${
                                errors.confirm ? "border-red-400 focus:border-red-500" : "border-slate-100 dark:border-slate-800 focus:border-blue-500"
                            }`}
                        />
                    </div>
                    {errors.confirm && (
                        <div className="flex items-center gap-1 mt-1 text-red-500 text-xs font-bold animate-slide-up">
                            <AlertCircle size={12} />
                            <span>{errors.confirm}</span>
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-70 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-500/25 transition-all flex items-center justify-center gap-2 group"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="animate-spin" size={22} />
                            <span>Mise à jour...</span>
                        </>
                    ) : (
                        <>
                            <span>Enregistrer</span>
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default ResetPassword;

