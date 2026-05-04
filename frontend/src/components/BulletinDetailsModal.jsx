import React from 'react';
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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
    getPatientDisplayName,
    getDerivedCareDate,
    formatDateFr,
    formatMontantTnd,
} from '../utils/bulletinDisplay';
import { UPLOADS_BASE } from '../services/api';

/* ─── Petit composant : ligne de détail ─── */
const DetailRow = ({ icon: Icon, label, value, accent }) => (
    <div className="flex items-start gap-3 py-3 border-b border-slate-50 dark:border-white/5 last:border-0">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${accent || 'bg-purple-50 dark:bg-purple-900/20 text-purple-500'}`}>
            <Icon size={14} />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 mb-0.5">{label}</p>
            <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{value || '—'}</p>
        </div>
    </div>
);

/* ─── Section title ─── */
const SectionTitle = ({ icon: Icon, label, color }) => (
    <div className="flex items-center gap-3 mb-4">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color}`}>
            <Icon size={15} />
        </div>
        <h3 className="text-xs font-black uppercase tracking-[0.15em] text-slate-700 dark:text-slate-200">{label}</h3>
    </div>
);

/* ─── Main Component ─── */
const BulletinDetailsModal = ({ isOpen, onClose, bulletin, adherent }) => {
    const { user: currentUser } = useAuth();
    const isAdmin = currentUser?.role === 'ADMIN';
    const [expandedAiDocs, setExpandedAiDocs] = React.useState({});
    const toggleAiDoc = (idx) => setExpandedAiDocs(prev => ({ ...prev, [idx]: !prev[idx] }));
    const [previewDoc, setPreviewDoc] = React.useState(null);

    React.useEffect(() => {
        if (isOpen && bulletin?.id) {
            setPreviewDoc(null);
        }
    }, [isOpen, bulletin]);

    // Bloquer le scroll du body quand le modal est ouvert
    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);


    if (!bulletin) return null;

    const patientNameContext = isAdmin
        ? (adherent || bulletin.adherent || (bulletin.adherent ? { nom: bulletin.adherent.nom, prenom: bulletin.adherent.prenom } : null))
        : currentUser;
    const patientDisplayName = getPatientDisplayName(bulletin, patientNameContext);
    const careDate = getDerivedCareDate(bulletin);
    const uploadBase = UPLOADS_BASE || 'http://localhost:5000';

    const statusMap = {
        0: {
            label: 'En attente',
            icon: Clock,
            bg: 'bg-slate-50 dark:bg-slate-800/50',
            text: 'text-slate-600 dark:text-slate-400',
            border: 'border-slate-200 dark:border-slate-700/40',
            dot: 'bg-slate-400'
        },
        1: {
            label: 'En cours',
            icon: Clock,
            bg: 'bg-amber-50 dark:bg-amber-900/20',
            text: 'text-amber-600 dark:text-amber-400',
            border: 'border-amber-200 dark:border-amber-800/40',
            dot: 'bg-amber-400'
        },
        2: {
            label: 'Approuvée',
            icon: CheckCircle2,
            bg: 'bg-emerald-50 dark:bg-emerald-900/20',
            text: 'text-emerald-600 dark:text-emerald-400',
            border: 'border-emerald-200 dark:border-emerald-800/40',
            dot: 'bg-emerald-400'
        },
        3: {
            label: 'Refusée',
            icon: XCircle,
            bg: 'bg-red-50 dark:bg-red-900/20',
            text: 'text-red-600 dark:text-red-400',
            border: 'border-red-200 dark:border-red-800/40',
            dot: 'bg-red-400'
        },
    };
    const status = statusMap[bulletin.statut] || statusMap[0];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex justify-end overflow-hidden">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/50 backdrop-blur-md"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 260 }}
                        className={`relative w-full sm:w-[95vw] h-full flex flex-col bg-slate-50 dark:bg-slate-950 sm:rounded-l-3xl shadow-[-30px_0_80px_-20px_rgba(0,0,0,0.35)] border-l border-slate-100 dark:border-white/5 overflow-hidden ${previewDoc ? 'lg:max-w-7xl' : 'lg:max-w-3xl'}`}
                    >
                        {/* ── HEADER ── */}
                        <div className="flex-shrink-0 relative overflow-hidden bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-white/5">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl -mr-32 -mt-32" />
                            
                            <div className="relative z-10 px-6 py-6 md:px-10 flex items-center justify-between">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center text-white shadow-2xl shadow-slate-900/20">
                                        <FileText size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1.5">Dossier Médical</h2>
                                        <div className="flex items-center gap-3">
                                            <span className="px-3 py-1 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[10px] font-black uppercase tracking-widest border border-purple-100 dark:border-purple-800/30">
                                                Bulletin #{bulletin.numero_bulletin}
                                            </span>
                                            {bulletin.code_cnam && (
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    CNAM: {bulletin.code_cnam}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-4">
                                    {/* Status badge */}
                                    {(currentUser?.role === 'ADMIN' || currentUser?.role === 'RESPONSABLE_RH') && (
                                        <div className={`hidden md:flex items-center gap-3 px-5 py-2.5 rounded-2xl border font-black text-[10px] uppercase tracking-widest shadow-sm ${status.bg} ${status.text} ${status.border}`}>
                                            <div className={`w-2 h-2 rounded-full ${status.dot} animate-pulse`} />
                                            {status.label}
                                        </div>
                                    )}
                                    <button
                                        onClick={onClose}
                                        className="group flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-900 dark:hover:bg-white text-slate-500 hover:text-white dark:hover:text-slate-900 rounded-xl transition-all active:scale-95 border border-transparent hover:shadow-xl"
                                    >
                                        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Fermer</span>
                                        <X size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ── BODY ── */}
                        <div className="flex-1 flex overflow-hidden min-h-0">

                            {/* ══ LEFT COLUMN : Details ══ */}
                            <div className={`flex-1 overflow-y-auto custom-scrollbar p-5 md:p-7 space-y-6 ${previewDoc ? 'lg:flex-[3]' : ''}`}>

                                {/* ── MOTIF DE REJET (Si applicable) ── */}
                                {bulletin.statut === 3 && (bulletin.motifRejet || bulletin.motif_refus) && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-5 rounded-3xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 flex items-start gap-4 shadow-sm"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/20 text-red-600 flex items-center justify-center flex-shrink-0">
                                            <XCircle size={22} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600 mb-2">Motif du refus</p>
                                            {bulletin.motifRejet ? (
                                                <>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="px-2 py-0.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 text-[10px] font-black uppercase tracking-widest">
                                                            {bulletin.motifRejet.categorie}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm font-black text-red-800 dark:text-red-200 leading-relaxed">
                                                        {bulletin.motifRejet.libelle}
                                                    </p>
                                                    {bulletin.motifRejet.description && (
                                                        <p className="text-xs text-red-700 dark:text-red-300 mt-1 leading-relaxed opacity-80">
                                                            {bulletin.motifRejet.description}
                                                        </p>
                                                    )}
                                                    {bulletin.commentaire_rejet && (
                                                        <p className="mt-2 pt-2 border-t border-red-200 dark:border-red-900/50 text-xs font-bold text-red-700 dark:text-red-300">
                                                            💬 {bulletin.commentaire_rejet}
                                                        </p>
                                                    )}
                                                </>
                                            ) : (
                                                <p className="text-sm font-bold text-red-800 dark:text-red-200 leading-relaxed">
                                                    {bulletin.motif_refus}
                                                </p>
                                            )}
                                        </div>
                                    </motion.div>
                                )}

                                {/* ── BLOC 1 : Résumé financier ── */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {/* Montant total */}
                                    <div className="col-span-2 p-6 rounded-[2rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl shadow-slate-900/10 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 dark:bg-slate-900/5 rounded-full blur-2xl -mr-16 -mt-16" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 relative z-10">Total Engagé</p>
                                        <div className="flex items-baseline gap-2 relative z-10">
                                            <span className="text-3xl font-black tracking-tight">{formatMontantTnd(bulletin.montant_total)}</span>
                                            <span className="text-xs font-black opacity-40">TND</span>
                                        </div>
                                    </div>

                                    {/* Montant Remboursé */}
                                    <div className="col-span-2 p-6 rounded-[2rem] bg-emerald-500 text-white shadow-2xl shadow-emerald-500/20 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -mr-16 -mt-16" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100 mb-3 relative z-10">Remboursement</p>
                                        <div className="flex items-baseline gap-2 relative z-10">
                                            <span className="text-3xl font-black tracking-tight">{formatMontantTnd(bulletin.montant_total_remboursé)}</span>
                                            <span className="text-xs font-black opacity-40 uppercase">Payé</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Date soin (premier acte / pharmacie) */}
                                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                            <Calendar size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 mb-0.5">Date de soin</p>
                                            <p className="text-sm font-black text-slate-800 dark:text-white">
                                                {careDate ? formatDateFr(careDate) : 'Non précisée'}
                                            </p>
                                        </div>
                                    </div>
                                    {/* Date dépôt */}
                                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                            <Clock size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 mb-0.5">Dépôt Dossier</p>
                                            <p className="text-sm font-black text-slate-800 dark:text-white">
                                                {formatDateFr(bulletin.date_depot)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* ── Risque & confiance (bulletin) ── */}
                                {(isAdmin || bulletin.fraud_score > 0 || bulletin.niveauRisque || bulletin.suspicion_locale) && (
                                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5">
                                        <SectionTitle icon={Activity} label="Analyse & risque" color="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" />
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                                            {isAdmin && (
                                                <DetailRow icon={TrendingUp} label="Score fraude" value={`${bulletin.fraud_score ?? 0} %`} />
                                            )}
                                            <DetailRow icon={ShieldAlert} label="Niveau risque (document)" value={bulletin.niveauRisque || '—'} />
                                            <DetailRow icon={ShieldCheck} label="Confiance IA" value={bulletin.confiance_score != null ? `${bulletin.confiance_score} %` : '—'} />
                                            <DetailRow icon={AlertTriangle} label="Suspicion locale" value={bulletin.suspicion_locale ? 'Oui' : 'Non'} />
                                        </div>
                                        {bulletin.resultat_analyse && isAdmin && (
                                            <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-white/5 pt-3">
                                                {bulletin.resultat_analyse}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* ── Adhérent (admin) ── */}
                                {isAdmin && bulletin.adherent && (
                                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5">
                                        <SectionTitle icon={User} label="Adhérent (titulaire)" color="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300" />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                                            <DetailRow icon={User} label="Nom" value={`${bulletin.adherent.prenom} ${bulletin.adherent.nom}`} />
                                            <DetailRow icon={Hash} label="Matricule" value={bulletin.adherent.matricule} />
                                            {bulletin.adherent.email && (
                                                <DetailRow icon={Send} label="Email" value={bulletin.adherent.email} />
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* ── BLOC 2 : Informations Patient ── */}
                                <div className="group bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-white/5 overflow-hidden transition-all hover:shadow-purple-500/5">
                                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-purple-400 backdrop-blur-sm">
                                                <User size={20} />
                                            </div>
                                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">Patient concerné</h3>
                                        </div>
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                    </div>
                                    
                                    <div className="p-8">
                                        <div className="flex items-center gap-5 mb-8 pb-8 border-b border-slate-50 dark:border-white/5">
                                            <div className="w-20 h-20 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-3xl font-black text-slate-400 border border-slate-100 dark:border-white/10 shadow-inner">
                                                {patientDisplayName?.charAt(0) || 'P'}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-purple-600 uppercase tracking-[0.3em] mb-1">Qualité: {bulletin.qualite_malade || 'Lui-même'}</p>
                                                <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2">
                                                    {patientDisplayName}
                                                </h4>
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 text-[9px] font-black uppercase tracking-widest">
                                                        Code CNAM: {bulletin.code_cnam || 'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {bulletin.beneficiaire && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5 transition-colors">
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">Bénéficiaire en base</p>
                                                    <p className="font-black text-slate-900 dark:text-white text-sm">{bulletin.beneficiaire.prenom} {bulletin.beneficiaire.nom}</p>
                                                </div>
                                                <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5 transition-colors">
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">Lien / Relation</p>
                                                    <p className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-wider">{bulletin.beneficiaire.relation}</p>
                                                </div>
                                                <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5 transition-colors">
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">Date Naissance</p>
                                                    <p className="font-black text-slate-900 dark:text-white text-sm">{formatDateFr(bulletin.beneficiaire.ddn)}</p>
                                                </div>
                                                <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5 transition-colors">
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">Statut Dossier</p>
                                                    <p className={`font-black text-sm ${bulletin.beneficiaire.statut === 'Validé' ? 'text-emerald-500' : 'text-amber-500'}`}>{bulletin.beneficiaire.statut}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* ── Cadre APCI / grossesse ── */}
                                {(bulletin.est_apci || bulletin.suivi_grossesse || bulletin.soins_cadre || bulletin.date_prevue_accouchement) && (
                                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5">
                                        <SectionTitle icon={FileText} label="Cadre des soins" color="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                                            <DetailRow icon={CheckCircle2} label="APCI" value={bulletin.est_apci ? 'Oui' : 'Non'} />
                                            <DetailRow icon={CheckCircle2} label="Suivi grossesse" value={bulletin.suivi_grossesse ? 'Oui' : 'Non'} />
                                            <DetailRow icon={Calendar} label="Date prévue accouchement" value={formatDateFr(bulletin.date_prevue_accouchement)} />
                                            <DetailRow icon={Hash} label="Soins dans le cadre" value={bulletin.soins_cadre} />
                                        </div>
                                    </div>
                                )}

                                {/* ── BLOC 3 : Actes Médicaux ── */}
                                {bulletin.actes && bulletin.actes.length > 0 && (
                                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5">
                                        <SectionTitle icon={Stethoscope} label={`Actes Médicaux (${bulletin.actes.length})`} color="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" />
                                        <div className="space-y-2">
                                            {bulletin.actes.map((acte, idx) => (
                                                <div key={acte.id || idx} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors group border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/30">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 flex items-center justify-center flex-shrink-0 text-[10px] font-black">
                                                            {idx + 1}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{acte.acte}</p>
                                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                                                <Calendar size={8} className="inline mr-1" />
                                                                {formatDateFr(acte.date_acte)}
                                                            </p>
                                                            <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-1 space-x-2">
                                                                {acte.code_acte && <span>Code {acte.code_acte}</span>}
                                                                {acte.numero_dent && <span>Dent {acte.numero_dent}</span>}
                                                                {acte.type_prestataire_soin && <span className="uppercase">{acte.type_prestataire_soin}</span>}
                                                                {acte.identifiant_unique_mf && <span>MF {acte.identifiant_unique_mf}</span>}
                                                            </p>
                                                            {acte.cachet_signature_present != null && (
                                                                <p className="text-[8px] font-bold text-slate-400 mt-0.5">
                                                                    Cachet / signature : {acte.cachet_signature_present ? 'Oui' : 'Non'}
                                                                    {acte.date_cachet_signature ? ` · ${formatDateFr(acte.date_cachet_signature)}` : ''}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex-shrink-0 sm:text-right">
                                                        <p className="text-sm font-black text-slate-800 dark:text-white">{formatMontantTnd(acte.honoraires)}</p>
                                                        {acte.montant_remboursement > 0 && (
                                                            <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">Remb: {formatMontantTnd(acte.montant_remboursement)}</p>
                                                        )}
                                                        <p className="text-[8px] font-bold text-slate-400 uppercase">TND</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* ── BLOC 4 : Pharmacie ── */}
                                {bulletin.pharmacie && (
                                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5">
                                        <SectionTitle icon={Pill} label="Pharmacie" color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" />
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 flex-1">
                                                <DetailRow icon={Hash} label="Identifiant MF" value={bulletin.pharmacie.identifiant_unique_mf} />
                                                <DetailRow icon={Calendar} label="Date d'achat" value={formatDateFr(bulletin.pharmacie.date_achat)} />
                                                <DetailRow icon={Calendar} label="Cachet / signature (date)" value={formatDateFr(bulletin.pharmacie.date_cachet_signature)} />
                                                <DetailRow icon={CheckCircle2} label="Cachet" value={bulletin.pharmacie.est_cachet != null ? (bulletin.pharmacie.est_cachet ? 'Oui' : 'Non') : '—'} />
                                                <DetailRow icon={CheckCircle2} label="Signature" value={bulletin.pharmacie.est_signature != null ? (bulletin.pharmacie.est_signature ? 'Oui' : 'Non') : '—'} />
                                            </div>
                                            <div className="flex-shrink-0 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-center min-w-[100px]">
                                                <p className="text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1">Dépense</p>
                                                <p className="text-lg font-black text-slate-700 dark:text-slate-300">{formatMontantTnd(bulletin.pharmacie.montant || bulletin.pharmacie.montant_pharmacie)}</p>
                                                {bulletin.pharmacie.montant_remboursement > 0 && (
                                                    <>
                                                        <div className="h-px bg-emerald-100 dark:bg-emerald-800/50 my-1" />
                                                        <p className="text-[9px] font-black uppercase tracking-wider text-emerald-600 mb-1">Remboursement</p>
                                                        <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{formatMontantTnd(bulletin.pharmacie.montant_remboursement)}</p>
                                                    </>
                                                )}
                                                <p className="text-[9px] font-bold text-slate-400">TND</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ── BLOC 5 : Documents Justificatifs ── */}

                                {bulletin.documents && bulletin.documents.length > 0 && (
                                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5">
                                        <SectionTitle icon={FileText} label={`Documents (${bulletin.documents.length})`} color="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" />
                                        <div className="space-y-2">
                                            {bulletin.documents.map((doc, idx) => {
                                                const fileUrl = `${uploadBase}/uploads/${doc.fichier}`;
                                                const isPdf = doc.fichier?.toLowerCase().endsWith('.pdf');
                                                const isActive = previewDoc?.fichier === doc.fichier;
                                                return (
                                                    <div key={idx} className="rounded-xl border border-slate-100 dark:border-white/5 overflow-hidden">
                                                        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center flex-shrink-0">
                                                                    <FileText size={15} />
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">{doc.type_document || doc.fichier || 'Document'}</p>
                                                                    {isAdmin && (<p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                                                                        <span className={`w-1.5 h-1.5 rounded-full inline-block ${doc.est_suspect ? 'bg-red-500' : 'bg-emerald-400'}`} />
                                                                        {isPdf ? 'PDF' : 'Image'} · {doc.est_suspect ? <span className="text-red-500">Suspect</span> : 'Officiel'}
                                                                    </p>)}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => setPreviewDoc(isActive ? null : doc)}
                                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 ${isActive ? 'bg-purple-600 text-white' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:bg-purple-50 hover:text-purple-600 border border-slate-200 dark:border-white/10'}`}
                                                                >
                                                                    {isActive ? <X size={11} /> : <Eye size={11} />}
                                                                    {isActive ? 'Masquer' : 'Aperçu'}
                                                                </button>
                                                                <a href={fileUrl} target="_blank" rel="noopener noreferrer"
                                                                    className="p-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all active:scale-95"
                                                                    title="Ouvrir dans un nouvel onglet">
                                                                    <ExternalLink size={11} />
                                                                </a>
                                                            </div>
                                                        </div>

                                                        {/* ── AI Analysis Card (Admin only) ── */}
                                                        {isAdmin && (doc.score !== undefined || doc.niveauRisque || doc.resultat_analyse) && (
                                                            <div className="px-4 py-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-white/5">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-black-400 flex items-center gap-1.5">
                                                                        <ShieldCheck size={9} />
                                                                        Analyse IA
                                                                    </p>
                                                                    <button
                                                                        onClick={() => toggleAiDoc(idx)}
                                                                        className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-black-400 hover:text-purple-600 transition-colors active:scale-95 px-2 py-1 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800"
                                                                    >
                                                                        {expandedAiDocs[idx] ? "Moins d'infos" : "Plus d'infos"}
                                                                        <ChevronRight size={11} className={`transform transition-transform ${expandedAiDocs[idx] ? '-rotate-90' : 'rotate-90'}`} />
                                                                    </button>
                                                                </div>

                                                                <AnimatePresence>
                                                                    {expandedAiDocs[idx] && (
                                                                        <motion.div
                                                                            initial={{ height: 0, opacity: 0 }}
                                                                            animate={{ height: 'auto', opacity: 1 }}
                                                                            exit={{ height: 0, opacity: 0 }}
                                                                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                                            className="overflow-hidden"
                                                                        >
                                                                            <div className="pt-2">
                                                                                <div className="grid grid-cols-2 gap-3">
                                                                                    {/* Score IA */}
                                                                                    {doc.score !== undefined && (
                                                                                        <div className={`col-span-2 sm:col-span-1 p-3 rounded-xl border ${doc.score > 80 ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30' : doc.score > 50 ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800/30' : 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-800/30'}`}>
                                                                                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">Score de confiance</p>
                                                                                            <div className="flex items-end justify-between mb-1.5">
                                                                                                <span className={`text-xl font-black leading-none ${doc.score > 80 ? 'text-emerald-600 dark:text-emerald-400' : doc.score > 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                                                                                                    {doc.score}%
                                                                                                </span>
                                                                                                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md ${doc.score > 80 ? 'bg-emerald-100 text-emerald-700' : doc.score > 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                                                                                    {doc.score > 80 ? 'Élevé' : doc.score > 50 ? 'Moyen' : 'Faible'}
                                                                                                </span>
                                                                                            </div>
                                                                                            <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                                                                                <div
                                                                                                    className={`h-full rounded-full transition-all ${doc.score > 80 ? 'bg-emerald-500' : doc.score > 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                                                                    style={{ width: `${doc.score}%` }}
                                                                                                />
                                                                                            </div>
                                                                                        </div>
                                                                                    )}

                                                                                    {/* Niveau de risque */}
                                                                                    {doc.niveauRisque && (
                                                                                        <div className={`col-span-2 sm:col-span-1 p-3 rounded-xl border flex flex-col justify-between ${doc.niveauRisque === 'aucun' || doc.niveauRisque === 'faible' ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30' : doc.niveauRisque === 'moyen' ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800/30' : 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-800/30'}`}>
                                                                                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">Niveau de risque</p>
                                                                                            <div className="flex items-center gap-2">
                                                                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${doc.niveauRisque === 'aucun' || doc.niveauRisque === 'faible' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : doc.niveauRisque === 'moyen' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'bg-red-100 dark:bg-red-900/30 text-red-600'}`}>
                                                                                                    {doc.niveauRisque === 'aucun' || doc.niveauRisque === 'faible'
                                                                                                        ? <ShieldCheck size={14} />
                                                                                                        : <ShieldAlert size={14} />}
                                                                                                </div>
                                                                                                <span className={`text-sm font-black capitalize ${doc.niveauRisque === 'aucun' || doc.niveauRisque === 'faible' ? 'text-emerald-700 dark:text-emerald-400' : doc.niveauRisque === 'moyen' ? 'text-amber-700 dark:text-amber-400' : 'text-red-700 dark:text-red-400'}`}>
                                                                                                    {doc.niveauRisque}
                                                                                                </span>
                                                                                            </div>
                                                                                        </div>
                                                                                    )}
                                                                                </div>

                                                                                {/* Résultat analyse */}
                                                                                {doc.resultat_analyse && (
                                                                                    <div className={`mt-3 flex items-start gap-2.5 p-3 rounded-xl border ${doc.est_suspect ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-white/5'}`}>
                                                                                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${doc.est_suspect ? 'bg-red-100 dark:bg-red-900/30 text-red-500' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                                                                                            {doc.est_suspect ? <AlertTriangle size={11} /> : <Activity size={11} />}
                                                                                        </div>
                                                                                        <div>
                                                                                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Résultat de l'analyse</p>
                                                                                            <p className={`text-xs font-semibold leading-relaxed ${doc.est_suspect ? 'text-red-700 dark:text-red-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                                                                                {doc.resultat_analyse}
                                                                                            </p>
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>
                                                            </div>
                                                        )}
                                                        {/* Preview will be shown in the right column */}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                            </div>

                            {/* ══ RIGHT COLUMN : Preview ══ */}
                            {previewDoc && (
                                <div className="flex flex-[2] flex-col border-l border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900 overflow-hidden">
                                    <div className="flex flex-col h-full overflow-hidden">
                                        <div className="flex-shrink-0 px-5 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center font-bold">
                                                    <Eye size={15} />
                                                </div>
                                                <div>
                                                    <h3 className="text-xs font-black uppercase tracking-[0.15em] text-slate-700 dark:text-white">Aperçu du Document</h3>
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase">{previewDoc.type_document}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setPreviewDoc(null)}
                                                className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 text-slate-400 transition-colors"
                                                title="Fermer l'aperçu"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                        <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-2 overflow-hidden">
                                            {previewDoc.fichier?.toLowerCase().endsWith('.pdf') ? (
                                                <iframe
                                                    src={`${uploadBase}/uploads/${previewDoc.fichier}#toolbar=0`}
                                                    className="w-full h-full border-0 rounded-lg"
                                                    title="Aperçu PDF"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
                                                    <img
                                                        src={`${uploadBase}/uploads/${previewDoc.fichier}`}
                                                        alt="Aperçu"
                                                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-white/5 flex justify-center">
                                            <a
                                                href={`${uploadBase}/uploads/${previewDoc.fichier}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-600 hover:text-white transition-all shadow-sm"
                                            >
                                                <ExternalLink size={14} />
                                                Ouvrir en plein écran
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── FOOTER ── */}
                        <div className="flex-shrink-0 px-6 py-4 md:px-8 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 hidden sm:block">
                                Bulletin #{bulletin.numero_bulletin} · {bulletin.createdAt ? formatDateFr(bulletin.createdAt) : formatDateFr(new Date())}
                            </p>
                            <button
                                onClick={onClose}
                                className="ml-auto flex items-center gap-2 px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-purple-600 dark:hover:bg-purple-600 dark:hover:text-white transition-all active:scale-95"
                            >
                                Fermer
                                <X size={13} />
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default BulletinDetailsModal;