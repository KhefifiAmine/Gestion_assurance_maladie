import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Info, AlertCircle, HelpCircle, Check } from 'lucide-react';

const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirmer l'action",
    message = "Êtes-vous sûr de vouloir effectuer cette action ?",
    confirmText = "Confirmer",
    cancelText = "Annuler",
    type = "danger", // 'danger' | 'info' | 'warning'
    requireReason = false,
    reasonLabel = "Motif :",
    requireRoleSelect = false,
    currentRole = "ADHERENT",
    loading = false
}) => {

    const [reason, setReason] = useState('');
    const [selectedRole, setSelectedRole] = useState(currentRole);

    useEffect(() => {
        if (isOpen) {
            setReason('');
            setSelectedRole(currentRole);
        }
    }, [isOpen, currentRole]);

    const backdropVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 }
    };

    const modalVariants = {
        hidden: { opacity: 0, scale: 0.9, y: 20 },
        visible: { opacity: 1, scale: 1, y: 0 }
    };

    const getConfig = () => {
        switch (type) {
            case 'danger': 
                return { 
                    icon: <AlertTriangle size={40} className="text-red-500" />, 
                    iconBg: 'bg-red-50 dark:bg-red-900/20',
                    iconColor: 'text-red-500',
                    btnBg: 'bg-red-600 hover:bg-red-700 shadow-red-500/20' 
                };
            case 'warning': 
                return { 
                    icon: <AlertCircle size={40} className="text-amber-500" />, 
                    iconBg: 'bg-amber-50 dark:bg-amber-900/20',
                    iconColor: 'text-amber-500',
                    btnBg: 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20' 
                };
            case 'info': 
                return { 
                    icon: <Info size={40} className="text-purple-600" />, 
                    iconBg: 'bg-purple-50 dark:bg-purple-900/20',
                    iconColor: 'text-purple-600',
                    btnBg: 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20' 
                };
            default: 
                return { 
                    icon: <HelpCircle size={40} className="text-purple-600" />, 
                    iconBg: 'bg-slate-50 dark:bg-slate-800',
                    iconColor: 'text-purple-600',
                    btnBg: 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20' 
                };
        }
    };

    const config = getConfig();

    const handleConfirm = () => {
        if (requireRoleSelect) onConfirm(selectedRole);
        else if (requireReason) onConfirm(reason);
        else onConfirm();
    };

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            variants={backdropVariants}
                            onClick={onClose}
                            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm"
                        />

                        <motion.div
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            variants={modalVariants}
                            transition={{ type: "spring", duration: 0.6, bounce: 0.3 }}
                            className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-white/5 p-8 md:p-10"
                        >
                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-2xl transition-all"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex flex-col items-center text-center">
                                <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mb-6 shadow-xl ${config.iconBg}`}>
                                    {config.icon}
                                </div>

                                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tighter">
                                    {title}
                                </h3>
                                
                                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-8">
                                    {message}
                                </p>

                                {requireReason && (
                                    <div className="w-full mb-6 text-left animate-in fade-in slide-in-from-top-2 duration-300">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                                            {reasonLabel}
                                        </label>
                                        <textarea
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm font-bold focus:ring-4 focus:ring-purple-500/10 outline-none transition-all min-h-[100px] resize-none dark:text-white"
                                            placeholder="Saisissez le motif ici..."
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                        />
                                    </div>
                                )}

                                {requireRoleSelect && (
                                    <div className="w-full mb-8 text-left animate-in fade-in slide-in-from-top-2 duration-300">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                                            Sélectionner le nouveau rôle
                                        </label>
                                        <div className="grid grid-cols-1 gap-2">
                                            {['ADHÉRENT', 'ADMIN', 'RESPONSABLE_RH'].map((role) => (
                                                <button
                                                    key={role}
                                                    type="button"
                                                    onClick={() => setSelectedRole(role)}
                                                    className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all group ${
                                                        selectedRole === role 
                                                        ? 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-500/30' 
                                                        : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-purple-200'
                                                    }`}
                                                >
                                                    <span className="font-black text-xs uppercase tracking-widest">{role}</span>
                                                    {selectedRole === role && <Check size={16} />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row gap-3 w-full">
                                    <button
                                        onClick={onClose}
                                        className="flex-1 px-8 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-black text-xs uppercase tracking-widest rounded-2xl transition-all active:scale-95"
                                    >
                                        {cancelText}
                                    </button>
                                    <button
                                        onClick={handleConfirm}
                                        disabled={loading || (requireReason && !reason.trim())}
                                        className={`flex-1 px-8 py-4 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all active:scale-95 shadow-xl disabled:opacity-50 disabled:scale-100 ${config.btnBg}`}
                                    >
                                        {loading ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                <span>Action...</span>
                                            </div>
                                        ) : confirmText}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
};

export default ConfirmModal;
