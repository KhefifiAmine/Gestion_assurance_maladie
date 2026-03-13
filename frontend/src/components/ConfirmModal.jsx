import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Info, AlertCircle, HelpCircle } from 'lucide-react';

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
    reasonLabel = "Motif :"
}) => {

    const [reason, setReason] = useState('');

    useEffect(() => {
        if (isOpen) {
            setReason('');
        }
    }, [isOpen]);


    // Animation variants for the backdrop
    const backdropVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 }
    };

    // Animation variants for the modal container
    const modalVariants = {
        hidden: { opacity: 0, scale: 0.9, y: 20 },
        visible: { opacity: 1, scale: 1, y: 0 }
    };

    const getIcon = () => {
        switch (type) {
            case 'danger': return <AlertTriangle size={36} className="text-red-500" />;
            case 'warning': return <AlertCircle size={36} className="text-amber-500" />;
            case 'info': return <Info size={36} className="text-purple-600" />;
            default: return <HelpCircle size={36} className="text-purple-600" />;
        }
    };

    const getIconBg = () => {
        switch (type) {
            case 'danger': return 'bg-red-50 dark:bg-red-900/20 shadow-inner';
            case 'warning': return 'bg-amber-50 dark:bg-amber-900/20 shadow-inner';
            case 'info': return 'bg-purple-50 dark:bg-purple-900/20 shadow-inner';
            default: return 'bg-slate-50 dark:bg-slate-800 shadow-inner';
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    {/* Overlay sombre avec légère transparence */}
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={backdropVariants}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm"
                    />

                    {/* Modal Popup centré */}
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={modalVariants}
                        transition={{ type: "spring", duration: 0.6, bounce: 0.3 }}
                        className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-white/5 p-8 md:p-10"
                    >
                        {/* Bouton de fermeture manuelle */}
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-2xl transition-all"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex flex-col items-center text-center">
                            {/* Icône d’avertissement */}
                            <div className={`p-6 rounded-[2rem] mb-8 ${getIconBg()}`}>
                                {getIcon()}
                            </div>

                            <div className="space-y-4 w-full">
                                {/* Titre clair */}
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                    {title}
                                </h3>
                                {/* Message explicatif */}
                                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed px-2">
                                    {message}
                                </p>

                                {requireReason && (
                                    <div className="mt-6 w-full text-left">
                                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-widest ml-1">
                                            {reasonLabel} <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            className="w-full text-sm font-bold p-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all resize-none"
                                            rows="3"
                                            placeholder="Veuillez indiquer la raison..."
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                            required
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Boutons d'action */}
                            <div className="flex flex-col sm:flex-row w-full gap-3 mt-10">
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-8 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all active:scale-95 order-2 sm:order-1"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={() => onConfirm(reason)}
                                    disabled={requireReason && !reason.trim()}
                                    className={`flex-1 px-8 py-4 font-black text-[10px] uppercase tracking-widest rounded-2xl text-white shadow-xl transition-all active:scale-95 order-1 sm:order-2 disabled:opacity-50 disabled:cursor-not-allowed ${type === 'danger'
                                            ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                                            : 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20'
                                        }`}
                                >
                                    {confirmText}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmModal;
