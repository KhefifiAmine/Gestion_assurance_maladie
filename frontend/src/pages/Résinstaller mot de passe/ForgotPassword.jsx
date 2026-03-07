import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Mail, ArrowRight, Loader2, KeyRound, AlertCircle } from 'lucide-react';


const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [emailError, setEmailError] = useState('');
    const { showToast } = useToast();
    const navigate = useNavigate();

    const validateEmail = (val) => {
        if (!val) return "L'email est requis";
        if (!/\S+@\S+\.\S+/.test(val)) return "Format d'email invalide";
        return "";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const err = validateEmail(email);
        if (err) {
            setEmailError(err);
            return;
        }

        try {
            setIsLoading(true);
            const res = await forgotPassword(email);
            showToast(res.message || 'Si un compte existe, un email a été envoyé.', "success");
            setTimeout(() => {
                navigate('/verify-reset-code');
            }, 2000);
        } catch (err) {
            showToast(err.message || "Erreur lors de la demande.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-8 sm:p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700">
            <div className="text-center mb-10">
                <div className="inline-flex p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl mb-6 border border-blue-100 dark:border-blue-800">
                    <KeyRound size={32} className="text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">Mot de passe oublié</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium max-w-[280px] mx-auto leading-relaxed">
                    Entrez votre email pour recevoir votre code de sécurité.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Adresse Email</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-500 text-slate-400">
                            <Mail size={18} />
                        </div>
                        <input
                            type="email"
                            placeholder="votre.email@tunisietelecom.tn"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (emailError) setEmailError('');
                            }}
                            className={`w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-slate-900/50 border-2 rounded-2xl transition-all outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 ${
                                emailError 
                                    ? "border-red-400 focus:border-red-500 bg-red-50/30" 
                                    : "border-slate-100 dark:border-slate-800 focus:border-blue-500"
                            }`}
                        />
                    </div>
                    {emailError && (
                        <div className="flex items-center gap-1 mt-1 text-red-500 text-xs font-bold animate-slide-up">
                            <AlertCircle size={12} />
                            <span>{emailError}</span>
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
                            <span>Envoi en cours...</span>
                        </>
                    ) : (
                        <>
                            <span>Recevoir le code</span>
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </form>

            <div className="mt-10 pt-6 border-t border-slate-50 dark:border-slate-800/50 text-center">
                <Link to="/login" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    <ArrowRight size={16} className="rotate-180" />
                    Retour à la connexion
                </Link>
            </div>
        </div>
    );
};

export default ForgotPassword;

