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
    MessageCircle,
    ExternalLink,
    Hash,
    ShieldCheck,
    ShieldAlert,
    Stethoscope,
    Pill,
    MapPin,
    Phone,
    ChevronRight,
    TrendingUp,
    Hourglass,
    XCircle,
} from 'lucide-react';
import { getBulletinComments, addBulletinComment } from '../services/bulletinService';
import { useAuth } from '../context/AuthContext';

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
const BulletinDetailsModal = ({ isOpen, onClose, bulletin }) => {
    const { user: currentUser } = useAuth();
    const isAdmin = currentUser?.role === 'ADMIN';
    const [comments, setComments] = React.useState([]);
    const [expandedAiDocs, setExpandedAiDocs] = React.useState({});
    const toggleAiDoc = (idx) => setExpandedAiDocs(prev => ({...prev, [idx]: !prev[idx]}));
    const [isRestricted, setIsRestricted] = React.useState(false);
    const [newComment, setNewComment] = React.useState('');
    const [loadingComments, setLoadingComments] = React.useState(false);
    const [previewDoc, setPreviewDoc] = React.useState(null);

    const scrollRef = React.useRef(null);

    React.useEffect(() => {
        if (isOpen && bulletin?.id) {
            setPreviewDoc(null);
            fetchComments();
        }
    }, [isOpen, bulletin]);

    React.useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [comments]);

    const fetchComments = async () => {
        try {
            setLoadingComments(true);
            setIsRestricted(false);
            const data = await getBulletinComments(bulletin.id);
            if (data.isRestricted) {
                setIsRestricted(true);
                setComments([]);
            } else {
                setComments(data);
            }
        } catch (error) {
            console.error('Erreur comments:', error);
        } finally {
            setLoadingComments(false);
        }
    };

    const handleSendComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        try {
            const added = await addBulletinComment(bulletin.id, newComment);
            setComments([...comments, added]);
            setNewComment('');
        } catch (error) {
            console.error('Erreur send comment:', error);
        }
    };

    if (!bulletin) return null;

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
                        className="relative w-full sm:w-[95vw] lg:max-w-5xl h-full flex flex-col bg-slate-50 dark:bg-slate-950 sm:rounded-l-3xl shadow-[-30px_0_80px_-20px_rgba(0,0,0,0.35)] border-l border-slate-100 dark:border-white/5 overflow-hidden"
                    >
                        {/* ── HEADER ── */}
                        <div className="flex-shrink-0 px-6 py-5 md:px-8 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <h2 className="text-base font-black text-slate-900 dark:text-white leading-tight">Dossier Médical</h2>
                                    <p className="text-[10px] font-bold text-purple-500 tracking-[0.15em] uppercase">#{bulletin.numero_bulletin}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {/* Status badge */}
                                <div className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl border font-black text-xs uppercase tracking-wider ${status.bg} ${status.text} ${status.border}`}>
                                    <div className={`w-2 h-2 rounded-full ${status.dot} animate-pulse`} />
                                    {status.label}
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all active:scale-95"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* ── BODY ── */}
                        <div className="flex-1 flex overflow-hidden min-h-0">

                            {/* ══ LEFT COLUMN : Details ══ */}
                            <div className="flex-1 lg:flex-[3] overflow-y-auto custom-scrollbar p-5 md:p-7 space-y-6">

                                {/* ── MOTIF DE REJET (Si applicable) ── */}
                                {bulletin.statut === 3 && bulletin.motif_refus && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-5 rounded-3xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 flex items-start gap-4 shadow-sm"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/20 text-red-600 flex items-center justify-center flex-shrink-0">
                                            <XCircle size={22} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600 mb-1">Motif du refus</p>
                                            <p className="text-sm font-bold text-red-800 dark:text-red-200 leading-relaxed">
                                                {bulletin.motif_refus}
                                            </p>
                                        </div>
                                    </motion.div>
                                )}

                                {/* ── BLOC 1 : Résumé financier ── */}
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {/* Montant total */}
                                    <div className="col-span-2 sm:col-span-1 p-5 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white shadow-lg shadow-purple-500/25">
                                        <p className="text-[9px] font-black uppercase tracking-[0.15em] text-purple-200 mb-2">Montant Total</p>
                                        <p className="text-2xl font-black leading-none">{bulletin.montant_total?.toFixed(3)}</p>
                                        <p className="text-[10px] font-bold text-purple-200 mt-1">TND</p>
                                    </div>

                                    {/* Montant Remboursé */}
                                    <div className="col-span-2 sm:col-span-1 p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30">
                                        <p className="text-[9px] font-black uppercase tracking-[0.15em] text-emerald-600 mb-2">Montant Remboursé</p>
                                        <p className="text-2xl font-black leading-none text-emerald-700 dark:text-emerald-300">{bulletin.montant_remboursement?.toFixed(3) || '0.000'}</p>
                                        <p className="text-[10px] font-bold text-emerald-500 mt-1">TND</p>
                                    </div>

                                    {/* Date soin */}
                                    <div className="col-span-1 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5">
                                        <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 mb-2">Date de Soin</p>
                                        <p className="text-sm font-black text-slate-800 dark:text-white">
                                            {new Date(bulletin.date_soin).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>
                                    {/* Date dépôt */}
                                    <div className="col-span-1 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5">
                                        <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 mb-2">Date de Dépôt</p>
                                        <p className="text-sm font-black text-slate-800 dark:text-white">
                                            {bulletin.date_depot ? new Date(bulletin.date_depot).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                        </p>
                                    </div>
                                </div>

                                {/* ── BLOC 2 : Informations Patient ── */}
                                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5">
                                    <SectionTitle icon={User} label="Informations Patient" color="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                                        <DetailRow icon={User} label="Nom complet" value={bulletin.nom_prenom_malade} />
                                        <DetailRow icon={Hash} label="Qualité" value={bulletin.qualite_malade} />
                                    </div>
                                </div>

                                {/* ── BLOC 3 : Actes Médicaux ── */}
                                {bulletin.actes && bulletin.actes.length > 0 && (
                                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5">
                                        <SectionTitle icon={Stethoscope} label={`Actes Médicaux (${bulletin.actes.length})`} color="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" />
                                        <div className="space-y-2">
                                            {bulletin.actes.map((acte, idx) => (
                                                <div key={idx} className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors group">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 flex items-center justify-center flex-shrink-0 text-[10px] font-black">
                                                            {idx + 1}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{acte.acte}</p>
                                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                                                <Calendar size={8} className="inline mr-1" />
                                                                {new Date(acte.date_acte).toLocaleDateString('fr-FR')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex-shrink-0 ml-4 text-right">
                                                        <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">{acte.honoraires?.toFixed(3)}</p>
                                                        <p className="text-[8px] font-bold text-slate-400">TND</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* ── BLOC 4 : Pharmacie ── */}
                                {bulletin.pharmacie && (bulletin.pharmacie.nom || bulletin.pharmacie.montant_pharmacie > 0) && (
                                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5">
                                        <SectionTitle icon={Pill} label="Pharmacie" color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" />
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 flex-1">
                                                {bulletin.pharmacie.nom && <DetailRow icon={Pill} label="Nom de la Pharmacie" value={bulletin.pharmacie.nom} />}
                                                {bulletin.pharmacie.adresse && <DetailRow icon={MapPin} label="Adresse" value={bulletin.pharmacie.adresse} />}
                                                {bulletin.pharmacie.telephone && <DetailRow icon={Phone} label="Téléphone" value={bulletin.pharmacie.telephone} />}
                                                {bulletin.pharmacie.date_achat && <DetailRow icon={Calendar} label="Date d'achat" value={new Date(bulletin.pharmacie.date_achat).toLocaleDateString('fr-FR')} />}
                                            </div>
                                            <div className="flex-shrink-0 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-center min-w-[90px]">
                                                <p className="text-[9px] font-black uppercase tracking-wider text-emerald-500 mb-1">Montant</p>
                                                <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">{bulletin.pharmacie.montant_pharmacie?.toFixed(3)}</p>
                                                <p className="text-[9px] font-bold text-emerald-500">TND</p>
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
                                                const fileUrl = `http://localhost:5000/uploads/${doc.fichier}`;
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
                                                                    <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">{doc.type_document || 'Document'}</p>
                                                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                                                                        <span className={`w-1.5 h-1.5 rounded-full inline-block ${doc.est_suspect ? 'bg-red-500' : 'bg-emerald-400'}`} />
                                                                        {isPdf ? 'PDF' : 'Image'} · {doc.est_suspect ? <span className="text-red-500">Suspect</span> : 'Officiel'}
                                                                    </p>
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
                                                        <AnimatePresence>
                                                            {isActive && (
                                                                <motion.div
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: 'auto', opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                                    className="overflow-hidden"
                                                                >
                                                                    <div className="p-2 bg-slate-100 dark:bg-slate-900/60" style={{ height: '400px' }}>
                                                                        {isPdf ? (
                                                                            <iframe src={fileUrl} className="w-full h-full rounded-lg border-0" title={doc.type_document} />
                                                                        ) : (
                                                                            <div className="w-full h-full flex items-center justify-center">
                                                                                <img src={fileUrl} alt={doc.type_document} className="max-w-full max-h-full object-contain rounded-lg shadow-md" />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                            </div>

                            {/* ══ RIGHT COLUMN : Discussion ══ */}
                            <div className="hidden lg:flex lg:flex-[2] flex-col border-l border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900">
                                {/* Chat Header */}
                                <div className="flex-shrink-0 px-5 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center">
                                            <MessageCircle size={15} />
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-black uppercase tracking-[0.15em] text-slate-700 dark:text-white">Discussion</h3>
                                            <p className="text-[9px] text-slate-400 font-bold">{comments.length} message{comments.length > 1 ? 's' : ''}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${comments.length > 0 ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                        {comments.length > 0 ? `${comments.length} ACTIF${comments.length > 1 ? 'S' : ''}` : 'VIDE'}
                                    </span>
                                </div>

                                {/* Messages */}
                                <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                                    {loadingComments && comments.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-400">
                                            <div className="w-6 h-6 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">Chargement...</p>
                                        </div>
                                    ) : isRestricted ? (
                                        <div className="h-full flex flex-col items-center justify-center gap-4 text-center px-6">
                                            <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/10 flex items-center justify-center text-red-500">
                                                <ShieldAlert size={28} strokeWidth={1.5} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-widest text-red-600 mb-1">Accès restreint</p>
                                                <p className="text-[10px] text-slate-500 font-bold leading-relaxed px-4">
                                                    Cette discussion est associée à un autre administrateur. 
                                                    Vous ne pouvez ni lire ni participer à cet échange.
                                                </p>
                                            </div>
                                        </div>
                                    ) : comments.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center gap-4 text-center px-6">
                                            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600">
                                                <MessageCircle size={28} strokeWidth={1.5} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Aucun message</p>
                                                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Posez vos questions ou apportez des précisions sur ce bulletin.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        comments.map((comment, idx) => {
                                            const isMe = comment.senderId === currentUser?.id;
                                            const isAdminMsg = comment.sender?.role !== 'ADHERENT';
                                            return (
                                                <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                    {!isMe && (
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 px-1">
                                                            {comment.sender?.prenom} {comment.sender?.nom}
                                                            {isAdminMsg && <span className="ml-1.5 text-purple-500 dark:text-purple-400">(Admin)</span>}
                                                        </p>
                                                    )}
                                                    <div className={`max-w-[88%] px-4 py-3 rounded-2xl text-sm ${isMe ? 'bg-gradient-to-br from-purple-600 to-indigo-700 text-white rounded-tr-sm shadow-md shadow-purple-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-sm'}`}>
                                                        <p className="font-semibold leading-relaxed">{comment.message}</p>
                                                    </div>
                                                    <p className="text-[8px] text-slate-400 font-bold mt-1.5 px-1">
                                                        {isMe ? 'Vous · ' : ''}{new Date(comment.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Input */}
                                <div className="flex-shrink-0 p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-950">
                                    {isRestricted ? (
                                        <div className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl text-center shadow-inner">
                                            <ShieldAlert size={16} className="text-red-500 flex-shrink-0" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Discussion verrouillée</p>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleSendComment} className="relative">
                                            <textarea
                                                rows={2}
                                                value={newComment}
                                                onChange={e => setNewComment(e.target.value)}
                                                placeholder="Écrire un message..."
                                                className="w-full pl-4 pr-14 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500/50 transition-all text-sm font-semibold dark:text-white resize-none"
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        handleSendComment(e);
                                                    }
                                                }}
                                            />
                                            <button
                                                type="submit"
                                                disabled={!newComment.trim()}
                                                className="absolute right-2.5 bottom-2.5 p-2.5 bg-purple-600 text-white rounded-xl shadow-md shadow-purple-500/30 hover:bg-purple-700 active:scale-95 transition-all disabled:opacity-40 disabled:hover:bg-purple-600 disabled:active:scale-100"
                                            >
                                                <Send size={15} />
                                            </button>
                                        </form>
                                    )}
                                    {!isRestricted && <p className="text-[8px] text-center text-slate-400 font-bold uppercase tracking-widest mt-2">Entrée pour envoyer · Maj+Entrée pour sauter une ligne</p>}
                                </div>
                            </div>
                        </div>

                        {/* ── FOOTER ── */}
                        <div className="flex-shrink-0 px-6 py-4 md:px-8 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 hidden sm:block">
                                Bulletin #{bulletin.numero_bulletin} · {new Date(bulletin.createdAt).toLocaleDateString('fr-FR')}
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
