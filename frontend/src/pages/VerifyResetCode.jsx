import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { verifyResetCode } from '../services/api';
import { useToast } from '../context/ToastContext';
import { ShieldCheck, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

const VerifyResetCode = () => {
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [codeError, setCodeError] = useState('');
    const { showToast } = useToast();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!code || code.length !== 6) {
            setCodeError('Le code doit contenir 6 chiffres');
            return;
        }

        try {
            setIsLoading(true);
            const res = await verifyResetCode(code);
            showToast(res.message || 'Code vérifié avec succès.', "success");
            setTimeout(() => {
                navigate('/reset-password', { state: { code } });
            }, 1000);
        } catch (err) {
            showToast(err.message || "Code invalide ou expiré.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCodeChange = (e) => {
        const val = e.target.value.replace(/[^0-9]/g, '');
        if (val.length <= 6) {
            setCode(val);
            if (codeError) setCodeError('');
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-8 sm:p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700">
            <div className="text-center mb-10">
                <div className="inline-flex p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl mb-6 border border-emerald-100 dark:border-emerald-800">
                    <ShieldCheck size={32} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">Vérification</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium max-w-[280px] mx-auto leading-relaxed text-sm">
                    Entrez le code de sécurité à 6 chiffres envoyé à votre adresse email.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-4">
                    <div className="flex justify-center">
                        <input
                            type="text"
                            inputMode="numeric"
                            placeholder="000000"
                            value={code}
                            onChange={handleCodeChange}
                            className={`w-full max-w-[240px] text-center text-4xl font-black tracking-[0.5em] py-5 bg-slate-50 dark:bg-slate-900/50 border-2 rounded-2xl transition-all outline-none text-blue-600 dark:text-blue-400 placeholder:text-slate-200 dark:placeholder:text-slate-800 ${
                                codeError 
                                    ? "border-red-400 focus:border-red-500 bg-red-50/30" 
                                    : "border-slate-100 dark:border-slate-800 focus:border-blue-500"
                            }`}
                            autoFocus
                        />
                    </div>
                    {codeError && (
                        <div className="flex justify-center items-center gap-1 text-red-500 text-xs font-bold animate-slide-up">
                            <AlertCircle size={12} />
                            <span>{codeError}</span>
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isLoading || code.length !== 6}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:active:scale-100 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-500/25 transition-all flex items-center justify-center gap-2 group"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="animate-spin" size={22} />
                            <span>Vérification...</span>
                        </>
                    ) : (
                        <>
                            <span>Vérifier le code</span>
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </form>

            <div className="mt-10 pt-6 border-t border-slate-50 dark:border-slate-800/50 text-center space-y-4">
                <button type="button" className="text-sm font-bold text-blue-600 hover:underline">
                    Renvoyer le code
                </button>
                <br />
                <Link to="/login" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors uppercase tracking-widest">
                    Annuler et retourner
                </Link>
            </div>
        </div>
    );
};

export default VerifyResetCode;

