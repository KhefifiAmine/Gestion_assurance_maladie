import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Info, AlertCircle, HelpCircle, Check, FileWarning, ClipboardList, MessageSquare, Loader2, ChevronRight } from 'lucide-react';
import { fetchMotifsRejet } from '../services/api';


const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirmer l'action",
    message = "Êtes-vous sûr de vouloir effectuer cette action ?",
    confirmText = "Confirmer",
    cancelText = "Annuler",
    type = "danger",
    requireReason = false,
    requireRoleSelect = false,
    currentRole = "ADHERENT",
    loading = false
}) => {

    const [selectedMotif, setSelectedMotif] = useState(null);
    const [commentaire, setCommentaire] = useState('');
    const [selectedRole, setSelectedRole] = useState(currentRole);
    const [motifs, setMotifs] = useState([]);
    const [loadingMotifs, setLoadingMotifs] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSelectedMotif(null);
            setCommentaire('');
            setSelectedRole(currentRole);
            setIsDropdownOpen(false);
        }
    }, [isOpen, currentRole]);

    // Load motifs from API when modal opens with requireReason
    useEffect(() => {
        if (isOpen && requireReason && motifs.length === 0) {
            setLoadingMotifs(true);
            fetchMotifsRejet()
                .then(data => setMotifs(data))
                .catch(err => console.error('Erreur chargement motifs:', err))
                .finally(() => setLoadingMotifs(false));
        }
    }, [isOpen, requireReason]);

    const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
    const modalVariants = { hidden: { opacity: 0, scale: 0.9, y: 20 }, visible: { opacity: 1, scale: 1, y: 0 } };

    const getConfig = () => {
        switch (type) {
            case 'danger': return { icon: <AlertTriangle size={40} className="text-red-500" />, iconBg: 'bg-red-50 dark:bg-red-900/20', btnBg: 'bg-red-600 hover:bg-red-700 shadow-red-500/20' };
            case 'warning': return { icon: <AlertCircle size={40} className="text-amber-500" />, iconBg: 'bg-amber-50 dark:bg-amber-900/20', btnBg: 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20' };
            case 'info': return { icon: <Info size={40} className="text-purple-600" />, iconBg: 'bg-purple-50 dark:bg-purple-900/20', btnBg: 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20' };
            default: return { icon: <HelpCircle size={40} className="text-purple-600" />, iconBg: 'bg-slate-50 dark:bg-slate-800', btnBg: 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20' };
        }
    };

    const config = getConfig();

    const handleConfirm = () => {
        if (requireRoleSelect) onConfirm(selectedRole);
        else if (requireReason) onConfirm({ motifId: selectedMotif?.id, motifLibelle: selectedMotif?.libelle, commentaire });
        else onConfirm();
    };


    const canConfirm = requireReason ? !!selectedMotif : true;

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <motion.div
                            initial="hidden" animate="visible" exit="hidden"
                            variants={backdropVariants}
                            onClick={onClose}
                            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm"
                        />

                        <motion.div
                            initial="hidden" animate="visible" exit="hidden"
                            variants={modalVariants}
                            transition={{ type: "spring", duration: 0.6, bounce: 0.3 }}
                            className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-white/5 p-8 md:p-10"
                        >
                            <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-2xl transition-all">
                                <X size={20} />
                            </button>

                            <div className="flex flex-col items-center text-center">
                                <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mb-6 shadow-xl ${config.iconBg}`}>
                                    {config.icon}
                                </div>

                                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tighter">{title}</h3>
                                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-6">{message}</p>

                                {/* Motif selection section */}
                                {requireReason && (
                                    <div className="w-full space-y-5 text-left">
                                        {loadingMotifs ? (
                                            <div className="flex items-center justify-center gap-3 py-8">
                                                <Loader2 size={20} className="animate-spin text-purple-500" />
                                                <span className="text-sm font-bold text-slate-400">Chargement des motifs...</span>
                                            </div>
                                        ) : (
                                            <>
                                                {/* Motif grid by category */}
                                                <div>
                                                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 ml-1">
                                                        <ClipboardList size={12} className="text-red-500" />
                                                        Motif de rejet *
                                                    </label>
                                                    <div className="space-y-4">
                                                        <div className="relative">
                                                            <button
                                                                type="button"
                                                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                                                className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-[1.5rem] px-6 py-4 text-sm font-bold flex items-center justify-between outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500/50 transition-all dark:text-white shadow-sm"
                                                            >
                                                                <span className={selectedMotif ? "text-slate-900 dark:text-white" : "text-slate-400"}>
                                                                    {selectedMotif ? selectedMotif.libelle : "Sélectionner la raison du rejet..."}
                                                                </span>
                                                                <motion.div
                                                                    animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                                                                    transition={{ duration: 0.3 }}
                                                                >
                                                                    <ChevronRight size={18} className="rotate-90 text-slate-400" />
                                                                </motion.div>
                                                            </button>

                                                            <AnimatePresence>
                                                                {isDropdownOpen && (
                                                                    <>
                                                                        <div
                                                                            className="fixed inset-0 z-10"
                                                                            onClick={() => setIsDropdownOpen(false)}
                                                                        />
                                                                        <motion.div
                                                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                                            className="absolute left-0 right-0 mt-2 p-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-[1.5rem] shadow-2xl z-20 max-h-64 overflow-y-auto"
                                                                        >
                                                                            {motifs.map(motif => (
                                                                                <button
                                                                                    key={motif.id}
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        setSelectedMotif(motif);
                                                                                        setIsDropdownOpen(false);
                                                                                    }}
                                                                                    className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between group ${selectedMotif?.id === motif.id
                                                                                            ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                                                                                            : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300'
                                                                                        }`}
                                                                                >
                                                                                    <div className="flex flex-col">
                                                                                        <span className="font-bold text-[13px] tracking-tight">{motif.libelle}</span>
                                                                                    </div>
                                                                                    {selectedMotif?.id === motif.id && (
                                                                                        <Check size={16} className="text-red-500" />
                                                                                    )}
                                                                                </button>
                                                                            ))}
                                                                        </motion.div>
                                                                    </>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>

                                                        {/* Affichage de la description du motif sélectionné */}
                                                        {selectedMotif && selectedMotif.description && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: -10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                className="p-5 bg-red-50/50 dark:bg-red-900/5 border border-red-100/50 dark:border-red-900/20 rounded-[1.5rem] flex gap-3"
                                                            >
                                                                <Info size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                                                                <p className="text-[12px] text-red-600 dark:text-red-400 font-bold leading-relaxed">
                                                                    {selectedMotif.description}
                                                                </p>
                                                            </motion.div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Optional comment */}
                                                <div>
                                                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 ml-1">
                                                        <MessageSquare size={12} className="text-purple-500" />
                                                        Commentaire supplémentaire (optionnel)
                                                    </label>
                                                    <textarea
                                                        className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-[1.5rem] p-4 text-sm font-bold focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500/50 outline-none transition-all min-h-[90px] resize-none dark:text-white shadow-sm"
                                                        placeholder="Informations complémentaires pour l'adhérent..."
                                                        value={commentaire}
                                                        onChange={(e) => setCommentaire(e.target.value)}
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* Role select */}
                                {requireRoleSelect && (
                                    <div className="w-full mb-6 text-left">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Sélectionner le nouveau rôle</label>
                                        <div className="grid grid-cols-1 gap-2">
                                            {['ADHERENT', 'ADMIN', 'RESPONSABLE_RH'].map((role) => (
                                                <button key={role} type="button" onClick={() => setSelectedRole(role)}
                                                    className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${selectedRole === role ? 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-500/30' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-purple-200'}`}>
                                                    <span className="font-black text-xs uppercase tracking-widest">{role}</span>
                                                    {selectedRole === role && <Check size={16} />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row gap-3 w-full mt-6">
                                    <button onClick={onClose} className="flex-1 px-8 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-black text-xs uppercase tracking-widest rounded-2xl transition-all active:scale-95">
                                        {cancelText}
                                    </button>
                                    <button
                                        onClick={handleConfirm}
                                        disabled={loading || !canConfirm}
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
