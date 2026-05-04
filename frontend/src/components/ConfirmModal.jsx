import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Info, AlertCircle, HelpCircle, Check, FileWarning, ClipboardList, MessageSquare, Loader2 } from 'lucide-react';
import { fetchMotifsRejet } from '../services/api';

const CATEGORIE_COLORS = {
    document: 'text-orange-500',
    montant: 'text-blue-500',
    beneficiaire: 'text-emerald-500',
    doublon: 'text-red-500',
    autre: 'text-slate-500'
};

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

    useEffect(() => {
        if (isOpen) {
            setSelectedMotif(null);
            setCommentaire('');
            setSelectedRole(currentRole);
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

    // Group motifs by category
    const motifsByCategorie = motifs.reduce((acc, m) => {
        if (!acc[m.categorie]) acc[m.categorie] = [];
        acc[m.categorie].push(m);
        return acc;
    }, {});

    const categorieLabels = {
        document: '📄 Documents',
        montant: '💰 Montants',
        beneficiaire: '👤 Bénéficiaire',
        doublon: '🔁 Doublons',
        autre: '📋 Autres'
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
                                                    <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
                                                        {Object.entries(motifsByCategorie).map(([cat, items]) => (
                                                            <div key={cat}>
                                                                <p className={`text-[9px] font-black uppercase tracking-widest mb-2 ml-1 ${CATEGORIE_COLORS[cat] || 'text-slate-400'}`}>
                                                                    {categorieLabels[cat] || cat}
                                                                </p>
                                                                <div className="grid grid-cols-1 gap-2">
                                                                    {items.map(motif => (
                                                                        <button
                                                                            key={motif.id}
                                                                            type="button"
                                                                            onClick={() => setSelectedMotif(motif)}
                                                                            className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all duration-200 text-left ${
                                                                                selectedMotif?.id === motif.id
                                                                                    ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-500/20'
                                                                                    : 'bg-white dark:bg-slate-800/40 border-slate-100 dark:border-slate-700/50 hover:border-red-200 dark:hover:border-red-800 text-slate-700 dark:text-slate-300'
                                                                            }`}
                                                                        >
                                                                            <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${selectedMotif?.id === motif.id ? 'border-white bg-white' : 'border-slate-300 dark:border-slate-600'}`}>
                                                                                {selectedMotif?.id === motif.id && <div className="w-2 h-2 rounded-full bg-red-600" />}
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-[11px] font-black uppercase tracking-tight leading-tight">{motif.libelle}</p>
                                                                                {motif.description && (
                                                                                    <p className={`text-[10px] mt-1 leading-snug ${selectedMotif?.id === motif.id ? 'text-red-100' : 'text-slate-400 dark:text-slate-500'}`}>
                                                                                        {motif.description}
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
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
