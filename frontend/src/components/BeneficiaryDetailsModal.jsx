import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, FileText, Eye, ChevronRight, Hash, Users, CheckCircle2, Shield, Calendar, Info } from 'lucide-react';
import { UPLOADS_BASE } from '../services/api';

const DocumentPreview = ({ fileUrl }) => {
    if (!fileUrl) return null;
    const isPdf = fileUrl.toLowerCase().endsWith('.pdf');

    return (
        <div className="h-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 flex items-center justify-center relative group min-h-[400px] lg:min-h-0">
            {isPdf ? (
                <iframe
                    src={`${fileUrl}#toolbar=0`}
                    className="w-full h-full"
                    title="Aperçu du document"
                />
            ) : (
                <img
                    src={fileUrl}
                    alt="Aperçu"
                    className="max-w-full h-full object-contain"
                />
            )}
        </div>
    );
};

const BeneficiaryDetailsModal = ({ isOpen, beneficiary, onClose, onViewAdherent, calculateAge }) => {
    if (!isOpen || !beneficiary) return null;

    const backdropVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 }
    };

    const modalVariants = {
        hidden: { opacity: 0, scale: 0.9, y: 20 },
        visible: { opacity: 1, scale: 1, y: 0 }
    };

    let files = [];
    if (beneficiary.document) {
        try {
            files = JSON.parse(beneficiary.document);
            if (!Array.isArray(files)) files = [beneficiary.document];
        } catch (e) {
            files = [beneficiary.document];
        }
    }

    const showSidePreview = files.length > 0;
    const [previewIndex, setPreviewIndex] = React.useState(0);

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
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />

                        <motion.div
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            variants={modalVariants}
                            className={`relative bg-white dark:bg-slate-900 w-full rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[95vh] flex flex-col transition-all duration-500 ${showSidePreview ? 'max-w-7xl' : 'max-w-2xl'}`}
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-r from-indigo-700 to-purple-800 p-8 text-white relative sticky top-0 z-10 shrink-0">
                                <button
                                    onClick={onClose}
                                    className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all"
                                >
                                    <X size={20} />
                                </button>
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                        <Users size={32} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black tracking-tight uppercase">Détails du Bénéficiaire</h2>
                                        <p className="text-indigo-100 text-sm font-medium">
                                            Consultation des informations et documents rattachés
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className={`flex flex-col lg:flex-row overflow-hidden h-full ${showSidePreview ? 'lg:divide-x lg:divide-x-reverse divide-slate-100 dark:divide-slate-800' : ''}`}>
                                {/* Preview Column (Left) */}
                                {showSidePreview && (
                                    <div className="flex-1 bg-slate-50 dark:bg-slate-950 p-6 overflow-hidden flex flex-col min-h-[400px] lg:min-h-0 border-b lg:border-b-0 border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center justify-between mb-4 shrink-0">
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                <Eye size={14} className="text-indigo-500" /> APERÇU DU JUSTIFICATIF {files.length > 1 ? `(${previewIndex + 1}/${files.length})` : ''}
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                {files.length > 1 && (
                                                    <div className="flex gap-1 mr-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setPreviewIndex(prev => Math.max(0, prev - 1))}
                                                            disabled={previewIndex === 0}
                                                            className="p-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-30"
                                                        >
                                                            <ChevronRight className="rotate-180" size={14} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setPreviewIndex(prev => Math.min(files.length - 1, prev + 1))}
                                                            disabled={previewIndex === files.length - 1}
                                                            className="p-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-30"
                                                        >
                                                            <ChevronRight size={14} />
                                                        </button>
                                                    </div>
                                                )}
                                                <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-[9px] font-black uppercase">
                                                    {(files[previewIndex] || '').split('.').pop().toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <DocumentPreview fileUrl={`${UPLOADS_BASE}/uploads/${files[previewIndex]}`} />
                                        </div>
                                    </div>
                                )}

                                {/* Details Column (Right) */}
                                <div className={`flex-1 overflow-y-auto custom-scrollbar ${showSidePreview ? 'lg:max-w-2xl' : ''}`}>
                                    <div className="p-8 space-y-8">
                                        {/* Main Info Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-2">
                                                    <User size={12} className="text-indigo-500" /> Nom & Prénom
                                                </label>
                                                <div className="w-full p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm dark:text-white uppercase">
                                                    {beneficiary.nom} {beneficiary.prenom}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-2">
                                                    <Users size={12} className="text-purple-500" /> Relation
                                                </label>
                                                <div className="w-full p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm dark:text-white">
                                                    {beneficiary.relation}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-2">
                                                    <Calendar size={12} className="text-blue-500" /> Date de Naissance
                                                </label>
                                                <div className="w-full p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm dark:text-white">
                                                    {beneficiary.ddn ? new Date(beneficiary.ddn).toLocaleDateString() : 'N/A'}
                                                    <span className="text-xs text-slate-500 ml-2">({calculateAge ? calculateAge(beneficiary.ddn) : '?'} ans)</span>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-2">
                                                    <Info size={12} className="text-rose-500" /> Sexe
                                                </label>
                                                <div className="w-full p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm dark:text-white">
                                                    {beneficiary.sexe === 'M' ? 'Masculin' : 'Féminin'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status Badge Section */}
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Statut du dossier</label>
                                            <div className="flex">
                                                <span className={`px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest border flex items-center gap-2 ${beneficiary.statut === 'Validé' ? 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' : beneficiary.statut === 'Rejeté' ? 'text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800' : 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800'}`}>
                                                    <CheckCircle2 size={16} />
                                                    {beneficiary.statut || 'En attente'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Particular Conditions */}
                                        {beneficiary.relation === 'Enfant' && (
                                            <div className="space-y-3 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                    <Shield size={14} className="text-purple-500" /> Conditions Particulières
                                                </h4>
                                                <div className="flex flex-wrap gap-2 pt-2">
                                                    {beneficiary.handicape && (
                                                        <div className="px-3 py-2 rounded-xl bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 text-xs font-bold border border-purple-100 dark:border-purple-900/50 flex items-center gap-2 shadow-sm">
                                                            <span>♿</span> Handicapé
                                                        </div>
                                                    )}
                                                    {beneficiary.etudiant && (
                                                        <div className="px-3 py-2 rounded-xl bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-100 dark:border-blue-900/50 flex items-center gap-2 shadow-sm">
                                                            <span>🎓</span> Étudiant
                                                        </div>
                                                    )}
                                                    {beneficiary.chomage && (
                                                        <div className="px-3 py-2 rounded-xl bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-100 dark:border-amber-900/50 flex items-center gap-2 shadow-sm">
                                                            <span>💼</span> Au chômage
                                                        </div>
                                                    )}
                                                    {beneficiary.celibataire && (
                                                        <div className="px-3 py-2 rounded-xl bg-white dark:bg-slate-700 text-pink-600 dark:text-pink-400 text-xs font-bold border border-pink-100 dark:border-pink-900/50 flex items-center gap-2 shadow-sm">
                                                            <span>👤</span> Célibataire
                                                        </div>
                                                    )}
                                                    {!beneficiary.handicape && !beneficiary.etudiant && !beneficiary.chomage && !beneficiary.celibataire && (
                                                        <p className="text-xs font-medium text-slate-400">Aucune condition spécifique.</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Rejection Reason */}
                                        {beneficiary.statut === 'Rejeté' && beneficiary.motifRefus && (
                                            <div className="p-6 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-3xl space-y-2">
                                                <div className="text-[10px] font-black uppercase tracking-widest text-rose-500 flex items-center gap-2">
                                                    <Info size={14} /> Motif de rejet
                                                </div>


                                                {/* Objet du refus — badge rouge */}
                                                <p className="inline-flex items-center gap-1.5 px-2.5 py-1 text-red-700 text-[12px] font-black uppercase tracking-wide leading-tight">
                                                    {beneficiary.objetRefus}
                                                </p>
                                                {beneficiary.motifRefus && (
                                                    <p className="text-[14px] text-slate-900 font-medium leading-snug pl-1">
                                                        {beneficiary.motifRefus}
                                                    </p>
                                                )}
                                           </div>
                                        )}

                                        {/* Associated Adherent Section */}
                                        {beneficiary.user && (
                                            <div className="pt-4 space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 shrink-0">Adhérent Associé</h3>
                                                    <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                                                    <button
                                                        onClick={() => onViewAdherent && onViewAdherent(beneficiary.user)}
                                                        className="group flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors"
                                                    >
                                                        Voir Profil <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100/30 dark:border-indigo-800/30">
                                                        <div className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-1">Nom Complet</div>
                                                        <div className="font-bold text-slate-800 dark:text-slate-100 text-xs uppercase">{beneficiary.user.prenom} {beneficiary.user.nom}</div>
                                                    </div>
                                                    <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100/30 dark:border-indigo-800/30">
                                                        <div className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-1">Matricule</div>
                                                        <div className="font-bold text-slate-800 dark:text-slate-100 text-xs">{beneficiary.user.matricule || 'N/A'}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
                                <button
                                    onClick={onClose}
                                    className="px-8 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-600 dark:text-slate-300 font-black text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
                                >
                                    Fermer
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
};

export default BeneficiaryDetailsModal;
