import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    FileText,
    Calendar,
    DollarSign,
    User,
    Activity,
    AlertCircle,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Eye,
    Send,
    ExternalLink,
    Hash,
    ShieldCheck,
    ShieldAlert,
    Stethoscope,
    Pill,
    ChevronRight,
    TrendingUp,
    XCircle,
    ArrowLeft,
    Download,
    Printer,
    Share2,
    Heart,
    Thermometer,
    Syringe,
    Scissors,
    Microscope,
    Star,
    Award,
    Zap,
    Sparkles,
    Layers,
    CreditCard,
    Receipt,
    FileCheck,
    Building2,
    Phone,
    Mail,
    MapPin,
    BadgeCheck,
    CircleDollarSign,
    PiggyBank,
    Wallet,
    History,
    Save,
    RotateCcw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getBulletinById, updateBulletinStatus, updateStatutActeMedical } from '../services/bulletinService';
import { useToast } from '../context/ToastContext';
import {
    getPatientDisplayName,
    getDerivedCareDate,
    formatDateFr,
    formatMontantTnd,
} from '../utils/bulletinDisplay';
import { UPLOADS_BASE } from '../services/api';
import ConfirmModal from '../components/ConfirmModal';

// Composant pour la timeline de statut
const StatusTimeline = ({ status }) => {
    const steps = [
        { label: 'Dépôt', status: 0, icon: Clock },
        { label: 'Analyse', status: 1, icon: Activity },
        { label: 'Validation', status: 2, icon: CheckCircle2 },
    ];

    const currentStep = Math.min(status, 2);

    return (
        <div className="relative py-6">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-700 -translate-y-1/2" />
            <div className="relative flex justify-between">
                {steps.map((step, idx) => {
                    const Icon = step.icon;
                    const isCompleted = idx <= currentStep;
                    const isCurrent = idx === currentStep;
                    return (
                        <div key={idx} className="flex flex-col items-center">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all ${isCompleted
                                    ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/30'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                    } ${isCurrent ? 'ring-4 ring-purple-500/30' : ''}`}
                            >
                                <Icon size={18} />
                            </motion.div>
                            <p className={`text-[9px] font-black uppercase tracking-wider mt-2 ${isCompleted ? 'text-purple-600' : 'text-slate-400'}`}>
                                {step.label}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Composant pour les cartes de montant
const AmountCard = ({ title, amount, icon: Icon, color, subtext }) => (
    <motion.div
        whileHover={{ y: -4 }}
        className={`relative overflow-hidden rounded-2xl p-6 ${color} shadow-lg transition-all`}
    >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16" />
        <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">{title}</p>
                <Icon size={20} className="text-white/60" />
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black tracking-tight text-white">{formatMontantTnd(amount)}</span>
                <span className="text-xs font-black text-white/50">TND</span>
            </div>
            {subtext && <p className="text-xs text-white/70 mt-2 font-medium">{subtext}</p>}
        </div>
    </motion.div>
);

const MEDICAL_ACT_ICONS = [Stethoscope, Thermometer, Syringe, Scissors, Microscope, Heart];

// Composant pour les détails d'acte médical amélioré
const MedicalActCard = ({ acte, index, isAdmin, onProcess, onSave }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    // savedStatut = statut persisté en base (ne change qu'après un vrai Save)
    const [savedStatut, setSavedStatut] = useState(acte.statut);
    const IconComponent = MEDICAL_ACT_ICONS[index % MEDICAL_ACT_ICONS.length];
    const isAlreadyProcessed = savedStatut !== 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group bg-gradient-to-r from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden hover:shadow-xl transition-all duration-300"
        >
            <div
                className="p-5 cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                            <IconComponent size={20} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-slate-800 dark:text-white">{acte.acte}</h4>
                                {acte.code_acte && (
                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-[9px] font-mono font-bold text-slate-500">
                                        {acte.code_acte}
                                    </span>
                                )}
                                {acte.nb_jour && (
                                    <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-[9px] font-bold text-blue-600">
                                        {acte.nb_jour} jours
                                    </span>
                                )}
                                {acte.cote && (
                                    <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/30 text-[9px] font-bold text-purple-600">
                                        Cote: {acte.cote}
                                    </span>
                                )}
                                {acte.num_dent && (
                                    <span className="px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-900/30 text-[9px] font-bold text-teal-600">
                                        Dent N°{acte.num_dent}
                                    </span>
                                )}
                                {acte.type_intervention && (
                                    <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/30 text-[9px] font-bold text-amber-600">
                                        Int: {acte.type_intervention}
                                    </span>
                                )}
                                {acte.app_appareillage && (
                                    <span className="px-2 py-0.5 rounded-md bg-pink-100 dark:bg-pink-900/30 text-[9px] font-bold text-pink-600">
                                        {acte.app_appareillage}
                                    </span>
                                )}
                                {acte.nb_seance && (
                                    <span className="px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-900/30 text-[9px] font-bold text-orange-600">
                                        {acte.nb_seance} séance(s)
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-3 text-[10px] font-bold text-slate-400 uppercase">
                                <span className="flex items-center gap-1">
                                    <Calendar size={10} />
                                    {formatDateFr(acte.date_acte)}
                                </span>
                                {acte.type_prestataire_soin && (
                                    <span className="flex items-center gap-1">
                                        <Building2 size={10} />
                                        {acte.type_prestataire_soin}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-black text-red-500 dark:text-red-400">
                                    {formatMontantTnd(acte.honoraires)}
                                </span>
                                <span className="text-[9px] font-bold text-slate-400">TND</span>
                            </div>
                            {acte.statut === 1 ? (
                                <div className="flex items-center gap-1 mt-1">
                                    <BadgeCheck size={12} className="text-emerald-500" />
                                    <span className="text-[10px] font-bold text-emerald-500 uppercase">Accepté</span>
                                </div>
                            ) : acte.statut === 2 ? (
                                <div className="flex items-center gap-1 mt-1">
                                    <XCircle size={12} className="text-red-500" />
                                    <span className="text-[10px] font-bold text-red-500 uppercase">Rejeté</span>
                                </div>
                            ) : null}
                            <div className="flex flex-col items-end gap-1 mt-1">
                                <span className="text-sm font-bold text-emerald-500">
                                    remb. {formatMontantTnd(acte.montant_remboursement)}
                                </span>
                                {acte.message_remboursement && (
                                    <span className="text-[7px] font-black text-amber-600 uppercase tracking-tighter text-right leading-none max-w-[120px]">
                                        {acte.message_remboursement}
                                    </span>
                                )}
                            </div>
                        </div>
                        <ChevronRight
                            size={18}
                            className={`text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}
                        />
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30"
                    >
                        <div className="p-5 space-y-3">
                            {acte.prestataire && (
                                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700/50 shadow-sm mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                            <Building2 size={12} />
                                            Prestataire de santé
                                        </p>
                                        {acte.prestataire.identifiant_unique_mf && (
                                            <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[9px] font-mono font-bold text-slate-500">
                                                MF: {acte.prestataire.identifiant_unique_mf}
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Nom / Établissement</p>
                                            <p className="text-xs font-black text-slate-800 dark:text-slate-200">{acte.prestataire.nom || 'Non spécifié'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Spécialité</p>
                                            <p className="text-xs font-black text-slate-800 dark:text-slate-200">{acte.prestataire.specialite || 'Non spécifiée'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Téléphone</p>
                                            <div className="flex items-center gap-3 text-xs font-bold text-slate-600 dark:text-slate-400">
                                                {acte.prestataire.telephone ? (
                                                    <span className="flex items-center gap-1">
                                                        <Phone size={10} className="text-slate-400" />
                                                        {acte.prestataire.telephone}
                                                    </span>
                                                ) : (
                                                    <span>Pas de téléphone</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">GSM</p>
                                            <div className="flex items-center gap-3 text-xs font-bold text-slate-600 dark:text-slate-400">
                                                {acte.prestataire.gsm ? (
                                                    <span className="flex items-center gap-1">
                                                        <Phone size={10} className="text-slate-400" />
                                                        {acte.prestataire.gsm}
                                                    </span>
                                                ) : (
                                                    <span>Pas de GSM</span>
                                                )}
                                            </div>
                                        </div>
                                        {acte.prestataire.adresse && (
                                            <div className="md:col-span-2 space-y-1 pt-1 border-t border-slate-50 dark:border-slate-800/50">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Adresse</p>
                                                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                                    <MapPin size={10} className="text-slate-400" />
                                                    {acte.prestataire.adresse}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            {(acte.objet_rejet || acte.motif_rejet) && (
                                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/20">
                                    <p className="text-[9px] font-black text-red-600 uppercase mb-1">{acte.objet_rejet || 'Motif de rejet'}</p>
                                    <p className="text-xs text-red-800 dark:text-red-200">{acte.motif_rejet}</p>
                                </div>
                            )}
                            {acte.description && (
                                <div className="p-3 rounded-xl bg-white dark:bg-slate-800">
                                    <p className="text-xs text-slate-600 dark:text-slate-300">{acte.description}</p>
                                </div>
                            )}

                            {isAdmin && (
                                <div className="mt-4 p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-4">
                                    <div className="flex flex-col gap-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Décision Administrative</p>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => onProcess(acte.id, 'statut', 1)}
                                                disabled={isAlreadyProcessed}
                                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${acte.statut === 1
                                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                                                    : isAlreadyProcessed
                                                        ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                                        : 'bg-white dark:bg-slate-900 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 border border-transparent'
                                                    }`}
                                            >
                                                <CheckCircle2 size={14} />
                                                Rembourser
                                            </button>
                                            <button
                                                onClick={() => onProcess(acte.id, 'statut', 2)}
                                                disabled={isAlreadyProcessed}
                                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${acte.statut === 2
                                                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/30'
                                                    : isAlreadyProcessed
                                                        ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                                        : 'bg-white dark:bg-slate-900 text-slate-400 hover:text-rose-600 hover:border-rose-200 border border-transparent'
                                                    }`}
                                            >
                                                <XCircle size={14} />
                                                Rejeter
                                            </button>
                                        </div>
                                    </div>

                                    {acte.statut === 2 && (
                                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <input
                                                type="text"
                                                placeholder="Objet du rejet (ex: Document incomplet)"
                                                value={acte.objet_rejet || ''}
                                                onChange={(e) => onProcess(acte.id, 'objet_rejet', e.target.value)}
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-bold focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                            />
                                            <textarea
                                                placeholder="Motif détaillé du rejet..."
                                                value={acte.motif_rejet || ''}
                                                onChange={(e) => onProcess(acte.id, 'motif_rejet', e.target.value)}
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-bold focus:ring-2 focus:ring-purple-500 outline-none transition-all min-h-[60px] resize-none"
                                            />
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[9px] font-black uppercase text-slate-400 mb-1 block ml-1">Montant à rembourser (TND)</label>
                                            <input
                                                type="number"
                                                disabled={isAlreadyProcessed}
                                                value={acte.montant_remboursement || 0}
                                                max={acte.honoraires}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value) || 0;
                                                    if (val > acte.honoraires) return;
                                                    onProcess(acte.id, 'montant_remboursement', val);
                                                }}
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-black text-emerald-600 focus:ring-2 focus:ring-emerald-500 outline-none transition-all disabled:opacity-50"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => onSave(acte, setSavedStatut)}
                                        disabled={isAlreadyProcessed || acte.statut === 0}
                                        className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Save size={14} />
                                        Mettre à jour cet acte
                                    </button>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-3">
                                {acte.frais && (
                                    <div className="p-2 rounded-lg bg-white dark:bg-slate-800">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase">Frais supplémentaires</p>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{formatMontantTnd(acte.frais)} TND</p>
                                    </div>
                                )}
                                {acte.taux_remboursement && (
                                    <div className="p-2 rounded-lg bg-white dark:bg-slate-800">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase">Taux de remboursement</p>
                                        <p className="text-sm font-bold text-emerald-600">{acte.taux_remboursement}%</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// Composant pour les documents amélioré
const DocumentCard = ({ doc, index, onPreview, isActive, isAdmin, expandedAiDocs, toggleAiDoc, uploadBase }) => {
    const fileUrl = `${uploadBase}/uploads/${doc.fichier}`;
    const isPdf = doc.fichier?.toLowerCase().endsWith('.pdf');
    const isImage = !isPdf && (doc.fichier?.toLowerCase().endsWith('.jpg') || doc.fichier?.toLowerCase().endsWith('.jpeg') || doc.fichier?.toLowerCase().endsWith('.png'));

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -4 }}
            className={`group relative overflow-hidden rounded-2xl border transition-all duration-500 ${isActive
                ? 'border-purple-500 bg-white dark:bg-slate-800 shadow-2xl shadow-purple-500/10 ring-2 ring-purple-500/20'
                : 'border-slate-100 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm hover:border-purple-200 dark:hover:border-purple-900/50'
                }`}
        >
            <div className="p-4">
                <div className="flex gap-4">
                    {/* Visual Preview / Icon */}
                    <div
                        onClick={() => onPreview(isActive ? null : doc)}
                        className={`relative cursor-pointer w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center transition-all duration-300 ${isActive ? 'ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-slate-900' : 'group-hover:scale-105'
                            }`}>
                        {isImage ? (
                            <img
                                src={fileUrl}
                                alt="Miniature"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className={`w-full h-full flex flex-col items-center justify-center ${isPdf ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                }`}>
                                <FileText size={24} />
                                <span className="text-[8px] font-black mt-1 uppercase">PDF</span>
                            </div>
                        )}
                        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'opacity-100' : ''}`}>
                            <Eye size={20} className="text-white" />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h4 className={`font-bold text-sm truncate transition-colors ${isActive ? 'text-purple-600 dark:text-purple-400' : 'text-slate-800 dark:text-white'}`}>
                            {doc.type_document || 'Justificatif médical'}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-medium truncate mt-1">
                            {doc.fichier}
                        </p>

                        <div className="flex items-center gap-3 mt-3">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onPreview(isActive ? null : doc);
                                }}
                                className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest transition-colors ${isActive ? 'text-purple-600' : 'text-slate-400 hover:text-purple-500'
                                    }`}
                            >
                                <Eye size={12} />
                                {isActive ? 'Fermer' : 'Aperçu'}
                            </button>
                            <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                            <a
                                href={fileUrl}
                                download
                                className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-500 transition-colors"
                            >
                                <Download size={12} />
                                Télécharger
                            </a>
                        </div>
                    </div>
                </div>

                {/* IA Analysis Badge Section */}
                {isAdmin && (doc.score !== undefined || doc.niveauRisque) && (
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                        <button
                            onClick={() => toggleAiDoc(index)}
                            className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg transition-colors ${expandedAiDocs[index] ? 'bg-purple-50 dark:bg-purple-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Zap size={12} className={doc.score > 80 ? 'text-emerald-500' : 'text-purple-500'} />
                                <span className="text-[9px] font-black uppercase tracking-tight text-slate-500">Analyse IA</span>
                                {doc.score && (
                                    <span className={`ml-1 text-[9px] font-black ${doc.score > 80 ? 'text-emerald-600' : 'text-purple-600'}`}>
                                        {doc.score}%
                                    </span>
                                )}
                            </div>
                            <ChevronRight size={12} className={`text-slate-400 transition-transform ${expandedAiDocs[index] ? 'rotate-90' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {expandedAiDocs[index] && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="pt-3 pb-1 space-y-2">
                                        {doc.niveauRisque && (
                                            <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/20">
                                                <span className="text-[8px] font-black text-amber-600 uppercase">Risque</span>
                                                <span className="text-[10px] font-black text-amber-700">{doc.niveauRisque}</span>
                                            </div>
                                        )}
                                        {doc.resultat_analyse && (
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight italic px-1">
                                                "{doc.resultat_analyse.length > 100 ? doc.resultat_analyse.substring(0, 100) + '...' : doc.resultat_analyse}"
                                            </p>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

// Composant principal
const BulletinDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const { showToast } = useToast();
    const [bulletin, setBulletin] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('details');
    const [previewDoc, setPreviewDoc] = useState(null);
    const [expandedAiDocs, setExpandedAiDocs] = useState({});

    const toggleAiDoc = (index) => {
        setExpandedAiDocs(prev => ({ ...prev, [index]: !prev[index] }));
    };

    const isAdmin = currentUser?.role === 'ADMIN';

    const [confirmData, setConfirmData] = useState({
        isOpen: false,
        status: null,
        title: '',
        message: '',
        type: 'info'
    });

    useEffect(() => {
        const fetchBulletin = async () => {
            if (!id || id === 'undefined') {
                showToast("ID du bulletin invalide", "error");
                navigate('/bulletins', { replace: true });
                return;
            }
            try {
                setLoading(true);
                const data = await getBulletinById(id);
                setBulletin(data);
            } catch (error) {
                console.error(error);
                showToast("Erreur lors du chargement du bulletin", "error");
                navigate(-1);
            } finally {
                setLoading(false);
            }
        };
        fetchBulletin();
    }, [id, navigate, showToast]);



    const handleStatusChange = async (targetStatus) => {
        try {
            setLoading(true);
            await updateBulletinStatus(id, targetStatus);
            showToast(`Bulletin marqué comme ${targetStatus === 1 ? '"En cours"' : '"Traité"'} avec succès`, "success");
            // Refresh data
            const updatedData = await getBulletinById(id);
            setBulletin(updatedData);
        } catch (error) {
            console.error(error);
            const errorMessage = error.response?.data?.message || error.message || "Erreur lors de la mise à jour du statut";
            showToast(errorMessage, "error");
        } finally {
            setLoading(false);
            setConfirmData(prev => ({ ...prev, isOpen: false }));
        }
    };

    const initiateStatusChange = (status) => {
        if (status === 2) {
            // Vérifier si le bulletin est en cours
            if (bulletin.statut !== 1) {
                showToast("Le bulletin doit être en cours de traitement pour être validé.", "error");
                return;
            }
            // Vérifier si tous les items sont traités
            const actsPending = bulletin.actes?.some(a => a.statut === 0);
            const pharmaPending = bulletin.pharmacie && bulletin.pharmacie.statut === 0;

            if (actsPending || pharmaPending) {
                showToast("Veuillez traiter tous les actes médicaux et la pharmacie avant de valider le bulletin.", "warning");
                return;
            }
        }

        setConfirmData({
            isOpen: true,
            status,
            title: status === 1 ? "Mettre en traitement" : "Valider le bulletin",
            message: status === 1
                ? "Voulez-vous marquer ce bulletin comme étant en cours de traitement ?"
                : "Voulez-vous marquer ce bulletin comme traité (terminé) ?",
            type: status === 1 ? "info" : "success"
        });
    };

    const handleSingleActSave = async (acte, setSavedStatut) => {
        try {
            setLoading(true);
            await updateStatutActeMedical(acte.id, {
                statut: acte.statut,
                objet_rejet: acte.objet_rejet,
                motif_rejet: acte.motif_rejet,
                montant_remboursement: acte.montant_remboursement,
                nb_jour: acte.nb_jour
            });
            showToast("Acte mis à jour avec succès", "success");
            // Verrouille la carte localement (statut persisté = statut actuel)
            if (setSavedStatut) setSavedStatut(acte.statut);
            // Refresh data
            const data = await getBulletinById(id);
            setBulletin(data);
        } catch (error) {
            showToast(error.message || "Erreur lors de la mise à jour de l'acte", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleActProcessing = (actId, field, value) => {
        setBulletin(prev => ({
            ...prev,
            actes: prev.actes.map(a => a.id === actId ? { ...a, [field]: value } : a)
        }));
    };

    const handlePharmacieProcessing = (field, value) => {
        setBulletin(prev => ({
            ...prev,
            pharmacie: { ...prev.pharmacie, [field]: value }
        }));
    };

    const handleMedicamentProcessing = (medId, field, value) => {
        setBulletin(prev => ({
            ...prev,
            pharmacie: {
                ...prev.pharmacie,
                medicaments: prev.pharmacie.medicaments.map(m => m.id === medId ? { ...m, [field]: value } : m)
            }
        }));
    };

    const handleMedicamentStatusUpdate = async (medId, status) => {
        try {
            const med = bulletin.pharmacie.medicaments.find(m => m.id === medId);
            if (!med) return;

            const response = await bulletinService.updateStatutMedicament(medId, {
                statut: status,
                montant_remboursement: status === 1 ? med.montant_remboursement : 0
            });

            if (response) {
                toast.success('Médicament mis à jour');
                // Rafraîchir les données du bulletin
                const updatedBulletin = await bulletinService.getBulletinById(id);
                setBulletin(updatedBulletin);
            }
        } catch (error) {
            console.error(error);
            toast.error(error.message || 'Erreur lors de la mise à jour');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
                <div className="text-center">
                    <div className="relative w-20 h-20 mx-auto">
                        <div className="absolute inset-0 border-4 border-purple-200 rounded-full animate-ping" />
                        <div className="absolute inset-0 border-4 border-purple-600 rounded-full animate-spin border-t-transparent" />
                    </div>
                    <p className="mt-6 text-xs font-black uppercase tracking-[0.3em] text-purple-600">Chargement du dossier</p>
                </div>
            </div>
        );
    }

    if (!bulletin) return null;

    const adherent = bulletin.adherent;
    const patientNameContext = isAdmin
        ? (adherent || (bulletin.adherent ? { nom: bulletin.adherent.nom, prenom: bulletin.adherent.prenom } : null))
        : currentUser;
    const patientDisplayName = getPatientDisplayName(bulletin, patientNameContext);
    const careDate = getDerivedCareDate(bulletin);
    const uploadBase = UPLOADS_BASE || 'http://localhost:5000';

    const statusConfig = {
        0: { label: 'En attente', icon: Clock, color: 'slate', gradient: 'from-slate-500 to-slate-600' },
        1: { label: 'En cours', icon: Activity, color: 'amber', gradient: 'from-amber-500 to-orange-500' },
        2: { label: 'Traité', icon: CheckCircle2, color: 'emerald', gradient: 'from-emerald-500 to-teal-500' },
    };
    const status = statusConfig[bulletin.statut] || statusConfig[0];

    const StatIcon = status.icon;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            {/* Header avec effet glassmorphism */}
            <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="h-20 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate(-1)}
                                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-slate-900 transition-all"
                            >
                                <ArrowLeft size={20} />
                            </motion.button>

                            <div className="hidden sm:block h-8 w-px bg-slate-200 dark:bg-white/10" />

                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                                    <FileText size={18} />
                                </div>
                                <div>
                                    <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                                        Bulletin #{bulletin.numero_bulletin}
                                    </h1>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-purple-600 mt-0.5">
                                        Dossier médical
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {isAdmin && (
                                <div className="flex items-center gap-2">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => initiateStatusChange(1)}
                                        disabled={bulletin.statut === 1}
                                        className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${bulletin.statut === 1
                                            ? 'bg-amber-100 text-amber-600 border border-amber-200 cursor-not-allowed opacity-60'
                                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-white/5 hover:bg-slate-50'
                                            }`}
                                    >
                                        <Clock size={14} />
                                        En cours
                                    </motion.button>

                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => initiateStatusChange(2)}
                                        disabled={bulletin.statut !== 1}
                                        className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${bulletin.statut !== 1
                                            ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                                            : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-700'
                                            }`}
                                    >
                                        <BadgeCheck size={14} />
                                        Traiter
                                    </motion.button>
                                </div>
                            )}
                            <div className={`flex items-center gap-3 px-5 py-2 rounded-2xl bg-gradient-to-r ${status.gradient} text-white shadow-lg`}>
                                <StatIcon size={14} className="animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{status.label}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Main Content */}
                    <div className={`flex-1 space-y-8 transition-all duration-300 ${previewDoc ? 'lg:w-1/2' : 'lg:w-full'}`}>

                        {/* Timeline Status */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700"
                        >
                            <StatusTimeline status={bulletin.statut} />
                        </motion.div>

                        {/* Amount Cards */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                        >
                            <AmountCard
                                title="Total engagé"
                                amount={bulletin.montant_total}
                                icon={CreditCard}
                                color="bg-gradient-to-br from-slate-800 to-slate-900"
                            />
                            <AmountCard
                                title="Remboursement"
                                amount={bulletin.montant_total_remboursé}
                                icon={PiggyBank}
                                color="bg-gradient-to-br from-emerald-500 to-teal-600"
                                subtext={`Taux: ${bulletin.montant_total > 0 ? ((bulletin.montant_total_remboursé / bulletin.montant_total) * 100).toFixed(0) : 0}%`}
                            />
                            <AmountCard
                                title="À charge"
                                amount={bulletin.montant_total - bulletin.montant_total_remboursé}
                                icon={Wallet}
                                color="bg-gradient-to-br from-amber-500 to-orange-600"
                            />
                            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Dates clés</p>
                                    <History size={18} className="text-slate-400" />
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-[9px] font-bold text-slate-400">Date de soin</p>
                                        <p className="text-sm font-black text-slate-800 dark:text-white">{formatDateFr(careDate)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-slate-400">Date de dépôt</p>
                                        <p className="text-sm font-black text-slate-800 dark:text-white">{formatDateFr(bulletin.date_depot)}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Tabs Navigation */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden">
                            <div className="flex border-b border-slate-100 dark:border-slate-700">
                                {[
                                    { id: 'details', label: 'Patient & Documents', icon: User },
                                    { id: 'medical', label: 'Actes Médicaux', icon: Stethoscope },
                                    ...(bulletin.pharmacie ? [{ id: 'pharmacie', label: 'Pharmacie', icon: Pill }] : []),
                                    { id: 'analysis', label: 'Score Risque', icon: ShieldAlert },
                                ].map(tab => {
                                    const TabIcon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex-1 flex items-center justify-center gap-2 py-4 text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === tab.id
                                                ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/50 dark:bg-purple-900/10'
                                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                                }`}
                                        >
                                            <TabIcon size={14} />
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="p-6">
                                <AnimatePresence mode="wait">
                                    {/* Patient Details & Documents Tab */}
                                    {activeTab === 'details' && (
                                        <motion.div
                                            key="details"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            className="space-y-6"
                                        >
                                            <div className="flex items-center gap-6 pb-6 border-b border-slate-100 dark:border-slate-700">
                                                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center text-4xl font-black text-purple-600">
                                                    {patientDisplayName?.charAt(0) || 'P'}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <BadgeCheck size={16} className="text-purple-500" />
                                                        <span className="text-[10px] font-black text-purple-600 uppercase tracking-wider">
                                                            {bulletin.qualite_malade || 'Titulaire'}
                                                        </span>
                                                    </div>
                                                    <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">
                                                        {patientDisplayName}
                                                    </h2>
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600">
                                                            CNAM: {bulletin.code_cnam || 'N/A'}
                                                        </span>
                                                        {(bulletin.date_naissance_malade || (bulletin.beneficiaire && bulletin.beneficiaire.date_naissance)) && (
                                                            <span className="px-3 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-[10px] font-bold text-emerald-600">
                                                                Né(e) le: {formatDateFr(bulletin.date_naissance_malade || bulletin.beneficiaire.date_naissance)}
                                                            </span>
                                                        )}
                                                        {bulletin.est_apci && (
                                                            <span className="px-3 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-[10px] font-bold text-indigo-600">
                                                                APCI
                                                            </span>
                                                        )}
                                                        {bulletin.soins_cadre && (
                                                            <span className="px-3 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-[10px] font-bold text-blue-600">
                                                                Cadre: {bulletin.soins_cadre}
                                                            </span>
                                                        )}
                                                        {bulletin.suivi_grossesse && (
                                                            <span className="px-3 py-1 rounded-lg bg-pink-100 dark:bg-pink-900/30 text-[10px] font-bold text-pink-600">
                                                                Grossesse
                                                            </span>
                                                        )}
                                                        {bulletin.date_prevue_accouchement && (
                                                            <span className="px-3 py-1 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-[10px] font-bold text-purple-600">
                                                                DPA: {formatDateFr(bulletin.date_prevue_accouchement)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {bulletin.beneficiaire && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Patient</p>
                                                        <p className="font-bold text-slate-800 dark:text-white">
                                                            {bulletin.beneficiaire.prenom} {bulletin.beneficiaire.nom}
                                                        </p>
                                                    </div>
                                                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Relation</p>
                                                        <p className="font-bold text-slate-800 dark:text-white uppercase">
                                                            {bulletin.beneficiaire.relation}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {isAdmin && bulletin.adherent && (
                                                <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                                                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-4">Adhérent titulaire</h3>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                                            <p className="text-[9px] font-bold text-slate-400">Nom complet</p>
                                                            <p className="font-semibold text-slate-700 dark:text-slate-200">
                                                                {bulletin.adherent.prenom} {bulletin.adherent.nom}
                                                            </p>
                                                        </div>
                                                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                                            <p className="text-[9px] font-bold text-slate-400">Matricule</p>
                                                            <p className="font-mono font-bold text-slate-700">{bulletin.adherent.matricule}</p>
                                                        </div>
                                                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                                            <p className="text-[9px] font-bold text-slate-400">Email</p>
                                                            <p className="text-sm text-slate-700">{bulletin.adherent.email}</p>
                                                        </div>
                                                        {bulletin.adherent.telephone && (
                                                            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                                                <p className="text-[9px] font-bold text-slate-400">Téléphone</p>
                                                                <p className="text-sm text-slate-700">{bulletin.adherent.telephone}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Documents Section */}
                                            {bulletin.documents && bulletin.documents.length > 0 && (
                                                <div className="pt-4">
                                                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-4">Documents Justificatifs</h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {bulletin.documents.map((doc, idx) => (
                                                            <DocumentCard
                                                                key={idx}
                                                                doc={doc}
                                                                index={idx}
                                                                onPreview={setPreviewDoc}
                                                                isActive={previewDoc?.fichier === doc.fichier}
                                                                isAdmin={isAdmin}
                                                                expandedAiDocs={expandedAiDocs}
                                                                toggleAiDoc={toggleAiDoc}
                                                                uploadBase={uploadBase}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}

                                    {/* Medical Acts Tab */}
                                    {activeTab === 'medical' && (
                                        <motion.div
                                            key="medical"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            className="space-y-4"
                                        >
                                            {bulletin.actes && bulletin.actes.length > 0 ? (
                                                <>
                                                    <div className="flex items-center justify-between mb-4">
                                                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                                            {bulletin.actes.length} acte(s) médical(aux)
                                                        </p>
                                                    </div>
                                                    {(bulletin.actes).map((acte, idx) => (
                                                        <MedicalActCard
                                                            key={acte.id || idx}
                                                            acte={acte}
                                                            index={idx}
                                                            isAdmin={isAdmin}
                                                            onProcess={handleActProcessing}
                                                            onSave={handleSingleActSave}
                                                        />
                                                    ))}
                                                </>
                                            ) : (
                                                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-700">
                                                    <Stethoscope size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                                                    <p className="text-sm font-bold text-slate-500">Aucun acte médical renseigné pour ce bulletin.</p>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}

                                    {/* Pharmacie Tab */}
                                    {activeTab === 'pharmacie' && bulletin.pharmacie && (
                                        <motion.div
                                            key="pharmacie"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            className="space-y-4"
                                        >
                                            <div>
                                                <div className="flex items-center justify-between mb-6">
                                                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                                        <Pill size={14} />
                                                        Traitement Pharmacie
                                                    </h3>
                                                    <span className="px-3 py-1 rounded-full bg-slate-100 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                                        Achat: {formatDateFr(bulletin.pharmacie.date_achat)}
                                                    </span>
                                                </div>

                                                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-6">
                                                    {bulletin.pharmacie && (bulletin.pharmacie.prestataire || bulletin.pharmacie.identifiant_unique_mf) && (
                                                        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 shadow-sm">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                                                    <Building2 size={12} />
                                                                    Prestataire Pharmacie
                                                                </p>
                                                                {(bulletin.pharmacie.prestataire?.identifiant_unique_mf || bulletin.pharmacie.identifiant_unique_mf) && (
                                                                    <span className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[9px] font-mono font-bold text-slate-500">
                                                                        MF: {bulletin.pharmacie.prestataire?.identifiant_unique_mf || bulletin.pharmacie.identifiant_unique_mf}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div className="space-y-1">
                                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Nom / Pharmacie</p>
                                                                    <p className="text-xs font-black text-slate-800 dark:text-slate-200">{bulletin.pharmacie.prestataire?.nom || 'Non spécifié'}</p>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Spécialité</p>
                                                                    <p className="text-xs font-black text-slate-800 dark:text-slate-200">{bulletin.pharmacie.prestataire?.specialite || 'Non spécifiée'}</p>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Téléphone</p>
                                                                    <div className="flex items-center gap-3 text-xs font-bold text-slate-600 dark:text-slate-400">
                                                                        {bulletin.pharmacie.prestataire?.telephone ? (
                                                                            <span className="flex items-center gap-1">
                                                                                <Phone size={10} className="text-slate-400" />
                                                                                {bulletin.pharmacie.prestataire.telephone}
                                                                            </span>
                                                                        ) : (
                                                                            <span>Pas de téléphone</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">GSM</p>
                                                                    <div className="flex items-center gap-3 text-xs font-bold text-slate-600 dark:text-slate-400">
                                                                        {bulletin.pharmacie.prestataire?.gsm ? (
                                                                            <span className="flex items-center gap-1">
                                                                                <Phone size={10} className="text-slate-400" />
                                                                                {bulletin.pharmacie.prestataire.gsm}
                                                                            </span>
                                                                        ) : (
                                                                            <span>Pas de GSM</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                {bulletin.pharmacie.prestataire?.adresse && (
                                                                    <div className="md:col-span-2 space-y-1 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Adresse</p>
                                                                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                                                            <MapPin size={10} className="text-slate-400" />
                                                                            {bulletin.pharmacie.prestataire.adresse}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                                                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Montant Total</p>
                                                            <p className="text-lg font-black text-slate-800 dark:text-white">{formatMontantTnd(bulletin.pharmacie.montant_pharmacie || bulletin.pharmacie.montant || 0)} TND</p>
                                                        </div>
                                                        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30">
                                                            <p className="text-[9px] font-black text-emerald-600 uppercase mb-1">Remboursement</p>
                                                            <input
                                                                type="number"
                                                                disabled={bulletin.pharmacie.statut !== 0}
                                                                value={bulletin.pharmacie.montant_remboursement || 0}
                                                                max={bulletin.pharmacie.montant_pharmacie || bulletin.pharmacie.montant || 0}
                                                                onChange={(e) => {
                                                                    const val = parseFloat(e.target.value) || 0;
                                                                    if (val > (bulletin.pharmacie.montant_pharmacie || bulletin.pharmacie.montant || 0)) return;
                                                                    handlePharmacieProcessing('montant_remboursement', val);
                                                                }}
                                                                placeholder="Montant remboursement"
                                                                className="
                                                                        w-full
                                                                        rounded-2xl
                                                                        border border-emerald-300
                                                                        bg-emerald-50
                                                                        px-4 py-3
                                                                        text-lg font-bold text-emerald-700
                                                                        shadow-sm
                                                                        transition-all duration-200
                                                                        outline-none
                                                                        focus:border-emerald-500
                                                                        focus:ring-4 focus:ring-emerald-200
                                                                        hover:border-emerald-400
                                                                        disabled:opacity-50
                                                                    "
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Liste des Médicaments */}
                                                    {bulletin.pharmacie.medicaments && bulletin.pharmacie.medicaments.length > 0 && (
                                                        <div className="space-y-3">
                                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Liste des médicaments ({bulletin.pharmacie.medicaments.length})</p>
                                                            <div className="grid grid-cols-1 gap-3">
                                                                {bulletin.pharmacie.medicaments.map((med, mIdx) => (
                                                                    <div key={med.id || mIdx} className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col gap-4">
                                                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                                                                                    <Pill size={18} />
                                                                                </div>
                                                                                <div>
                                                                                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">{med.nom_medicament}</h4>
                                                                                    <p className="text-[10px] text-slate-500 font-medium">{med.dosage || 'Dosage non spécifié'} • Qté: {med.quantite}</p>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex items-center gap-6">
                                                                                <div className="text-right">
                                                                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-0.5">Montant</p>
                                                                                    <p className="text-sm font-black text-slate-800 dark:text-white">{formatMontantTnd(med.montant_total)} TND</p>
                                                                                </div>
                                                                                {med.statut === 1 && med.montant_remboursement > 0 && (
                                                                                    <div className="text-right flex flex-col items-end">
                                                                                        <p className="text-[10px] font-black text-emerald-500 uppercase mb-0.5">Remb.</p>
                                                                                        <p className="text-sm font-black text-emerald-600">{formatMontantTnd(med.montant_remboursement)} TND</p>
                                                                                        {med.message_remboursement && (
                                                                                            <p className="text-[7px] font-black text-amber-600 uppercase tracking-tighter mt-1 max-w-[100px] leading-none">
                                                                                                {med.message_remboursement}
                                                                                            </p>
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                                {med.statut === 2 && (
                                                                                    <div className="px-2 py-1 rounded-md bg-rose-100 text-rose-600 text-[9px] font-black uppercase">Rejeté</div>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        {isAdmin && med.statut === 0 && (
                                                                            <div className="pt-4 border-t border-slate-200/50 dark:border-slate-700/50 flex flex-col md:flex-row items-center gap-4">
                                                                                <div className="flex-1 w-full">
                                                                                    <input
                                                                                        type="number"
                                                                                        step="0.001"
                                                                                        placeholder="Montant remboursable"
                                                                                        className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                                                                                        value={med.montant_remboursement || ''}
                                                                                        onChange={(e) => handleMedicamentProcessing(med.id, 'montant_remboursement', parseFloat(e.target.value) || 0)}
                                                                                    />
                                                                                </div>
                                                                                <div className="flex gap-2 w-full md:w-auto">
                                                                                    <button
                                                                                        onClick={() => handleMedicamentStatusUpdate(med.id, 1)}
                                                                                        className="flex-1 md:px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase transition-all"
                                                                                    >
                                                                                        Accepter
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => handleMedicamentStatusUpdate(med.id, 2)}
                                                                                        className="flex-1 md:px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase transition-all"
                                                                                    >
                                                                                        Rejeter
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Risk Analysis Tab */}
                                    {(activeTab === 'analysis' && (isAdmin || bulletin.fraud_score > 0 || bulletin.niveauRisque)) && (
                                        <motion.div
                                            key="analysis"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            className="space-y-6"
                                        >
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                {isAdmin && (
                                                    <div className="p-5 rounded-xl bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border border-red-200">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <TrendingUp size={18} className="text-red-500" />
                                                            <span className="text-[10px] font-black text-red-500 uppercase">Score</span>
                                                        </div>
                                                        <p className="text-3xl font-black text-red-600">{bulletin.fraud_score ?? 0}%</p>
                                                        <p className="text-[10px] text-red-500 mt-2">Indice de fraude</p>
                                                    </div>
                                                )}
                                                <div className="p-5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <ShieldAlert size={18} className="text-amber-500" />
                                                        <span className="text-[10px] font-black text-amber-500 uppercase">Risque</span>
                                                    </div>
                                                    <p className="text-xl font-black text-amber-700">{bulletin.niveauRisque || 'Faible'}</p>
                                                    <p className="text-[10px] text-amber-600 mt-2">Niveau détecté</p>
                                                </div>
                                                <div className="p-5 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border border-purple-200">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <ShieldCheck size={18} className="text-purple-500" />
                                                        <span className="text-[10px] font-black text-purple-500 uppercase">Confiance</span>
                                                    </div>
                                                    <p className="text-3xl font-black text-purple-600">{bulletin.confiance_score ?? '—'}%</p>
                                                    <p className="text-[10px] text-purple-500 mt-2">Score IA</p>
                                                </div>
                                            </div>

                                            {/* Section des Alertes Actives de Fraude */}
                                            {bulletin.fraudAlerts && bulletin.fraudAlerts.length > 0 && (
                                                <div className="p-6 rounded-2xl bg-gradient-to-br from-red-50 to-rose-100/50 dark:from-red-950/10 dark:to-rose-900/10 border border-red-200/60 shadow-md space-y-4">
                                                    <div className="flex items-center gap-3">
                                                        <AlertCircle className="text-red-600 dark:text-red-500 animate-pulse" size={20} />
                                                        <h3 className="text-sm font-black uppercase tracking-wider text-red-700 dark:text-red-400">
                                                            Alertes de Fraude et Anomalies Actives ({bulletin.fraudAlerts.length})
                                                        </h3>
                                                    </div>
                                                    <div className="space-y-3">
                                                        {bulletin.fraudAlerts.map((alert, idx) => (
                                                            <div key={alert.id || idx} className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-red-100 dark:border-red-950/40 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                                <div className="space-y-2 flex-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="px-2 py-0.5 rounded-lg bg-red-100 dark:bg-red-950/60 text-[9px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest">
                                                                            {alert.entity_type === 'adherent' ? 'Adhérent Suspect' : alert.entity_type}
                                                                        </span>
                                                                        <span className="text-[10px] text-slate-400 font-bold">
                                                                            Détecté le {formatDateFr(alert.createdAt)}
                                                                        </span>
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        {alert.reason.split(' | ').map((subReason, subIdx) => (
                                                                            <p key={subIdx} className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-start gap-2">
                                                                                <span className="text-red-500 mt-0.5">•</span>
                                                                                {subReason}
                                                                            </p>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-3 self-end md:self-center">
                                                                    <div className="text-center bg-red-50 dark:bg-red-950/30 px-3 py-1.5 rounded-xl border border-red-100 dark:border-red-950">
                                                                        <p className="text-[8px] font-black text-red-500 uppercase tracking-widest">Gravité</p>
                                                                        <p className="text-sm font-black text-red-600">{alert.score}%</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="p-5 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-800/30 border border-slate-200">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <AlertTriangle size={16} className="text-orange-500" />
                                                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-600">Suspicion locale</p>
                                                </div>
                                                <p className="text-sm font-semibold text-slate-700">
                                                    {bulletin.suspicion_locale ? '⚠️ Suspicion détectée - Une vérification supplémentaire est recommandée' : '✅ Aucune anomalie détectée'}
                                                </p>
                                            </div>

                                            {bulletin.resultat_analyse && isAdmin && (
                                                <div className="p-5 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <FileCheck size={16} className="text-blue-500" />
                                                        <p className="text-[10px] font-black uppercase tracking-wider text-blue-600">Rapport d'analyse détaillé</p>
                                                    </div>
                                                    <p className="whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                                        {bulletin.resultat_analyse}
                                                    </p>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                    {/* Document Preview Panel */}
                    <AnimatePresence>
                        {previewDoc && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, x: 20 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95, x: 20 }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="lg:w-1/2 lg:sticky lg:top-28 h-[calc(100vh-140px)] flex flex-col rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-white/5 z-10"
                            >
                                {/* Glass Header */}
                                <div className="px-6 py-4 flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                                            <Eye size={18} />
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-black uppercase tracking-[0.1em] text-slate-800 dark:text-white">Visionneuse</h3>
                                            <p className="text-[10px] text-purple-600 font-black uppercase mt-0.5 truncate max-w-[200px]">
                                                {previewDoc.type_document || 'Document justificatif'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <a
                                            href={`${uploadBase}/uploads/${previewDoc.fichier}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-purple-600 hover:text-white transition-all duration-300"
                                            title="Ouvrir dans un nouvel onglet"
                                        >
                                            <ExternalLink size={16} />
                                        </a>
                                        <button
                                            onClick={() => setPreviewDoc(null)}
                                            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-rose-500 hover:text-white transition-all duration-300 shadow-sm"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* Main Preview Area */}
                                <div className="flex-1 bg-slate-50 dark:bg-slate-950 p-6 overflow-hidden relative group/preview">
                                    <div className="w-full h-full rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-inner border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                                        {previewDoc.fichier?.toLowerCase().endsWith('.pdf') ? (
                                            <iframe
                                                src={`${uploadBase}/uploads/${previewDoc.fichier}#toolbar=0&navpanes=0`}
                                                className="w-full h-full border-0"
                                                title="Aperçu PDF"
                                            />
                                        ) : (
                                            <div className="relative w-full h-full p-4 flex items-center justify-center">
                                                <motion.img
                                                    initial={{ scale: 0.9, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    src={`${uploadBase}/uploads/${previewDoc.fichier}`}
                                                    alt="Aperçu"
                                                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Floating Buttons (appear on hover) */}
                                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 opacity-0 group-hover/preview:opacity-100 transition-all duration-500 translate-y-4 group-hover/preview:translate-y-0">
                                        <div className="flex items-center gap-1 p-1.5 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white dark:border-slate-700">
                                            <button
                                                onClick={() => window.print()}
                                                className="p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all"
                                                title="Imprimer"
                                            >
                                                <Printer size={18} />
                                            </button>
                                            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
                                            <a
                                                href={`${uploadBase}/uploads/${previewDoc.fichier}`}
                                                download
                                                className="flex items-center gap-2 px-5 py-3 bg-purple-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/20"
                                            >
                                                <Download size={14} />
                                                Télécharger
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Info */}
                                <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        Format: {previewDoc.fichier?.split('.').pop().toUpperCase()}
                                    </p>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            <span className="text-[9px] font-black text-slate-500 uppercase">Document Vérifié</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>


            <ConfirmModal
                isOpen={confirmData.isOpen}
                onClose={() => setConfirmData(prev => ({ ...prev, isOpen: false }))}
                onConfirm={() => handleStatusChange(confirmData.status)}
                title={confirmData.title}
                message={confirmData.message}
                type={confirmData.type}
                confirmText="Confirmer"
                cancelText="Annuler"
            />
        </div>
    );
};

export default BulletinDetailsPage;