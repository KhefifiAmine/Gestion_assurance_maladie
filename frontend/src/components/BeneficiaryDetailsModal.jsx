import React from 'react';
import { motion } from 'framer-motion';
import { X, User, FileText, Eye } from 'lucide-react';

const BeneficiaryDetailsModal = ({ beneficiary, onClose, onPreviewDocument, calculateAge }) => {
    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-[110]"
            />
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 30 }}
                className={`relative w-full ${beneficiary.document ? 'max-w-5xl' : 'max-w-lg'} bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl z-[120] overflow-hidden border border-slate-100 dark:border-slate-800`}
            >
                <div className="flex flex-col lg:flex-row h-full">
                    {/* Left Column: Details */}
                    <div className="flex-1 flex flex-col max-h-[85vh] overflow-y-auto custom-scrollbar">
                        {/* Modal Header */}
                        <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 p-8 overflow-hidden shrink-0">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
                            <div className="relative flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-[20px] bg-white flex items-center justify-center text-xl font-black text-indigo-600 shadow-inner" style={{ color: beneficiary.bg }}>
                                        {beneficiary.initials}
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-black text-white tracking-tight leading-none uppercase">
                                            Détails du bénéficiaire
                                        </h3>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 space-y-1">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nom & Prénom</div>
                                    <div className="font-bold text-slate-800 dark:text-slate-100">{beneficiary.nom} {beneficiary.prenom}</div>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 space-y-1">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Relation</div>
                                    <div className="font-bold text-slate-800 dark:text-slate-100">{beneficiary.relation}</div>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 space-y-1">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date de naissance</div>
                                    <div className="font-bold text-slate-800 dark:text-slate-100">
                                        {beneficiary.ddn ? new Date(beneficiary.ddn).toLocaleDateString() : 'N/A'} 
                                        <span className="text-xs text-slate-500 ml-1">({calculateAge(beneficiary.ddn)} ans)</span>
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 space-y-1">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sexe</div>
                                    <div className="font-bold text-slate-800 dark:text-slate-100">
                                        {beneficiary.sexe === 'M' ? 'Masculin' : 'Féminin'}
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 space-y-1">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Statut d'inscription</div>
                                    <div className="font-bold">
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border inline-flex items-center gap-1.5 ${beneficiary.statut === 'Validé' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : beneficiary.statut === 'Rejeté' ? 'text-rose-600 bg-rose-50 border-rose-200' : 'text-amber-600 bg-amber-50 border-amber-200'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${beneficiary.statut === 'Validé' ? 'bg-emerald-500' : beneficiary.statut === 'Rejeté' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                                            {beneficiary.statut || 'En attente'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {beneficiary.relation === 'Enfant' && (
                                <div className="space-y-3">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Conditions Particulières</div>
                                    <div className="flex flex-wrap gap-2">
                                        {beneficiary.handicape ? (
                                            <div className="px-3 py-2 rounded-xl bg-purple-50 text-purple-600 text-xs font-bold border border-purple-100 flex items-center gap-2">
                                                <span>♿</span> Handicapé
                                            </div>
                                        ) : null}
                                        {beneficiary.etudiant ? (
                                            <div className="px-3 py-2 rounded-xl bg-blue-50 text-blue-600 text-xs font-bold border border-blue-100 flex items-center gap-2">
                                                <span>🎓</span> Étudiant
                                            </div>
                                        ) : null}
                                        {beneficiary.chomage ? (
                                            <div className="px-3 py-2 rounded-xl bg-amber-50 text-amber-600 text-xs font-bold border border-amber-100 flex items-center gap-2">
                                                <span>💼</span> Au chômage
                                            </div>
                                        ) : null}
                                        {beneficiary.celibataire ? (
                                            <div className="px-3 py-2 rounded-xl bg-pink-50 text-pink-600 text-xs font-bold border border-pink-100 flex items-center gap-2">
                                                <span>👤</span> Célibataire
                                            </div>
                                        ) : null}
                                        {!beneficiary.handicape && !beneficiary.etudiant && !beneficiary.chomage && !beneficiary.celibataire && (
                                            <div className="text-xs font-medium text-slate-500">Aucune condition particulière.</div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {beneficiary.statut === 'Rejeté' && beneficiary.motifRefus && (
                                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 space-y-1">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-rose-500">Motif de rejet</div>
                                    <div className="font-bold text-rose-700 text-sm">{beneficiary.motifRefus}</div>
                                </div>
                            )}

                            {beneficiary.document && (
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 flex justify-between items-center lg:hidden">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                            <FileText size={18} />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Justificatif fourni</div>
                                            <div className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Document rattaché</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onPreviewDocument(beneficiary.document)}
                                        className="px-4 py-2 rounded-xl bg-white dark:bg-slate-700 text-indigo-600 hover:bg-indigo-600 hover:text-white border border-slate-200 dark:border-slate-600 hover:border-indigo-600 transition-all text-xs font-bold uppercase tracking-widest"
                                    >
                                        Voir
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Document Preview */}
                    {beneficiary.document && (
                        <div className="hidden lg:flex w-[450px] bg-slate-50 dark:bg-slate-950/50 p-10 flex-col gap-8 border-l border-slate-100 dark:border-white/5 relative shrink-0">
                            <div className="absolute top-0 right-0 p-10 opacity-5">
                                <FileText size={120} />
                            </div>

                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-indigo-600 shadow-sm border border-slate-100 dark:border-slate-700">
                                        <Eye size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Document Justificatif</h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Vue détaillée</p>
                                    </div>
                                </div>

                                <div className="w-full aspect-[3/4] rounded-[40px] overflow-hidden border-8 border-white dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl relative group">
                                    {beneficiary.document.toLowerCase().endsWith('.pdf') ? (
                                        <iframe src={`http://localhost:5000/uploads/${beneficiary.document}`} className="w-full h-full border-none" title="Preview" />
                                    ) : (
                                        <img src={`http://localhost:5000/uploads/${beneficiary.document}`} alt="Preview" className="w-full h-full object-contain" />
                                    )}
                                </div>
                                
                                <div className="mt-6 flex justify-center">
                                    <button 
                                        onClick={() => onPreviewDocument(beneficiary.document)}
                                        className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 flex items-center gap-2 transition-colors"
                                    >
                                        <Eye size={14} />
                                        Ouvrir en plein écran
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default BeneficiaryDetailsModal;
