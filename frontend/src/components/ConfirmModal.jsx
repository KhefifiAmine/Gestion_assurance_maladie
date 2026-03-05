import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Info, AlertCircle } from 'lucide-react';

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
        hidden: { opacity: 0, scale: 0.95, y: -20 },
        visible: { opacity: 1, scale: 1, y: 0 }
    };

    const getIcon = () => {
        switch (type) {
            case 'danger': return <AlertTriangle size={32} className="text-red-500" />;
            case 'warning': return <AlertCircle size={32} className="text-amber-500" />;
            case 'info': return <Info size={32} className="text-blue-500" />;
            default: return <AlertTriangle size={32} className="text-red-500" />;
        }
    };

    const getIconBg = () => {
        switch (type) {
            case 'danger': return 'bg-red-50 dark:bg-red-900/20';
            case 'warning': return 'bg-amber-50 dark:bg-amber-900/20';
            case 'info': return 'bg-blue-50 dark:bg-blue-900/20';
            default: return 'bg-red-50 dark:bg-red-900/20';
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
                        className="fixed inset-0 bg-black/50 backdrop-blur-[2px]"
                    />

                    {/* Modal Popup centré */}
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={modalVariants}
                        transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                        className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 p-8"
                    >
                        {/* Bouton de fermeture manuelle */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex flex-col items-center text-center">
                            {/* Icône d’avertissement */}
                            <div className={`p-4 rounded-full mb-6 ${getIconBg()}`}>
                                {getIcon()}
                            </div>

                            <div className="space-y-3 w-full px-4">
                                {/* Titre clair */}
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                    {type === 'danger' ? '🔴 ' : ''}{title}
                                </h3>
                                {/* Message explicatif */}
                                <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base leading-relaxed">
                                    {message}
                                </p>

                                {requireReason && (
                                    <div className="mt-4 w-full text-left">
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-400 mb-2">
                                            {reasonLabel} <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            className="w-full text-sm p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
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
                            <div className="flex flex-col sm:flex-row w-full gap-3 mt-8">
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-xl transition-all active:scale-95 order-2 sm:order-1"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={() => onConfirm(reason)}
                                    disabled={requireReason && !reason.trim()}
                                    className={`flex-1 px-6 py-3 font-semibold rounded-xl text-white shadow-lg transition-all active:scale-95 order-1 sm:order-2 disabled:opacity-50 disabled:cursor-not-allowed ${type === 'danger'
                                            ? 'bg-red-600 hover:bg-red-700 shadow-red-200 dark:shadow-none'
                                            : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 dark:shadow-none'
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
