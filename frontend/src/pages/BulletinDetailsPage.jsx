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
import { getBulletinById, updateBulletinStatus, updateStatutActeMedical, updateStatutPharmacie } from '../services/bulletinService';
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

// Composant pour les détails d'acte médical amélioré
const MedicalActCard = ({ acte, index, isAdmin, onProcess, onSave }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const getActeIcon = () => {
        const icons = [Stethoscope, Thermometer, Syringe, Scissors, Microscope, Heart];
        const Icon = icons[index % icons.length];
        return Icon;
    };

    const IconComponent = getActeIcon();

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
                            {acte.montant_remboursement > 0 && (
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-sm font-bold text-emerald-500">
                                        remb. {formatMontantTnd(acte.montant_remboursement)}
                                    </span>
                                </div>
                            )}
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
                                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${acte.statut === 1
                                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                                                    : 'bg-white dark:bg-slate-900 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 border border-transparent'
                                                    }`}
                                            >
                                                <CheckCircle2 size={14} />
                                                Rembourser
                                            </button>
                                            <button
                                                onClick={() => onProcess(acte.id, 'statut', 2)}
                                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${acte.statut === 2
                                                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/30'
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

                                    <div>
                                        <label className="text-[9px] font-black uppercase text-slate-400 mb-1 block ml-1">Montant à rembourser (TND)</label>
                                        <input
                                            type="number"
                                            value={acte.montant_remboursement || 0}
                                            onChange={(e) => onProcess(acte.id, 'montant_remboursement', parseFloat(e.target.value) || 0)}
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-black text-emerald-600 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                        />
                                    </div>

                                    <button
                                        onClick={() => onSave(acte)}
                                        className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2"
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

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -2 }}
            className={`group rounded-2xl border transition-all duration-300 ${isActive
                ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 shadow-lg shadow-purple-500/20'
                : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-xl'
                }`}
        >
            <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4 flex-1">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all ${isActive
                            ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg'
                            : 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 text-slate-500'
                            }`}>
                            {isPdf ? <FileText size={24} /> : <Eye size={24} />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-800 dark:text-white truncate">
                                {doc.type_document || doc.fichier || 'Document'}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] font-bold text-slate-400 uppercase">
                                    {isPdf ? 'PDF Document' : 'Image'}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-slate-300" />
                                <span className="text-[9px] font-bold text-slate-400">
                                    {new Date().toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => onPreview(isActive ? null : doc)}
                            className={`p-2 rounded-xl transition-all ${isActive
                                ? 'bg-purple-600 text-white shadow-lg'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-purple-100 hover:text-purple-600'
                                }`}
                        >
                            {isActive ? <X size={16} /> : <Eye size={16} />}
                        </button>
                        <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-purple-100 hover:text-purple-600 transition-all"
                        >
                            <ExternalLink size={16} />
                        </a>
                        <a
                            href={fileUrl}
                            download
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-emerald-100 hover:text-emerald-600 transition-all"
                        >
                            <Download size={16} />
                        </a>
                    </div>
                </div>

                {/* IA Analysis Section */}
                {isAdmin && (doc.score !== undefined || doc.niveauRisque || doc.resultat_analyse) && (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                        <button
                            onClick={() => toggleAiDoc(index)}
                            className="w-full flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-purple-600 transition-colors"
                        >
                            <span className="flex items-center gap-2">
                                <ShieldCheck size={14} />
                                Analyse IA
                                {doc.score && (
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${doc.score > 80 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                                        }`}>
                                        Score: {doc.score}%
                                    </span>
                                )}
                            </span>
                            <ChevronRight size={14} className={`transform transition-transform ${expandedAiDocs[index] ? 'rotate-90' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {expandedAiDocs[index] && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="mt-4 space-y-3">
                                        {doc.niveauRisque && (
                                            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                                                <span className="text-[10px] font-bold text-amber-600">Niveau de risque</span>
                                                <span className="text-xs font-black text-amber-700">{doc.niveauRisque}</span>
                                            </div>
                                        )}
                                        {doc.resultat_analyse && (
                                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                                                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                                    {doc.resultat_analyse}
                                                </p>
                                            </div>
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
            showToast("Erreur lors de la mise à jour du statut", "error");
        } finally {
            setLoading(false);
            setConfirmData(prev => ({ ...prev, isOpen: false }));
        }
    };

    const initiateStatusChange = (status) => {
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

    const handleSingleActSave = async (acte) => {
        try {
            setLoading(true);
            await updateStatutActeMedical(acte.id, {
                statut: acte.statut,
                objet_rejet: acte.objet_rejet,
                motif_rejet: acte.motif_rejet,
                montant_remboursement: acte.montant_remboursement
            });
            showToast("Acte mis à jour avec succès", "success");
            // Refresh data
            const data = await getBulletinById(id);
            setBulletin(data);
        } catch (error) {
            showToast(error.message || "Erreur lors de la mise à jour de l'acte", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSinglePharmacieSave = async () => {
        try {
            setLoading(true);
            await updateStatutPharmacie(bulletin.pharmacie.id, {
                statut: bulletin.pharmacie.statut,
                objet_rejet: bulletin.pharmacie.objet_rejet,
                motif_rejet: bulletin.pharmacie.motif_rejet,
                montant_remboursement: bulletin.pharmacie.montant_remboursement
            });
            showToast("Pharmacie mise à jour avec succès", "success");
            // Refresh data
            const data = await getBulletinById(id);
            setBulletin(data);
        } catch (error) {
            showToast(error.message || "Erreur lors de la mise à jour de la pharmacie", "error");
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
                                        disabled={bulletin.statut === 2}
                                        className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${bulletin.statut === 2
                                            ? 'bg-emerald-100 text-emerald-600 border border-emerald-200 cursor-not-allowed opacity-60'
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
                                                    <div className="flex flex-wrap gap-2">
                                                        <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600">
                                                            CNAM: {bulletin.code_cnam || 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {bulletin.beneficiaire && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Bénéficiaire</p>
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
                                    {activeTab === 'medical' && bulletin.actes && bulletin.actes.length > 0 && (
                                        <motion.div
                                            key="medical"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            className="space-y-4"
                                        >
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

                                            {bulletin.pharmacie && (
                                                <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-700">
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
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                                                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Montant Total</p>
                                                                <p className="text-lg font-black text-slate-800 dark:text-white">{formatMontantTnd(bulletin.pharmacie.montant || 0)} TND</p>
                                                            </div>
                                                            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30">
                                                                <p className="text-[9px] font-black text-emerald-600 uppercase mb-1">Remboursement</p>
                                                                <input
                                                                    type="number"
                                                                    value={bulletin.pharmacie.montant_remboursement || 0}
                                                                    onChange={(e) =>
                                                                        handlePharmacieProcessing(
                                                                            'montant_remboursement',
                                                                            parseFloat(e.target.value) || 0
                                                                        )
                                                                    }
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
                                                                    "
                                                                />
                                                            </div>
                                                        </div>

                                                        {isAdmin && (
                                                            <div className="space-y-4">
                                                                <div className="flex gap-3">
                                                                    <button
                                                                        onClick={() => handlePharmacieProcessing('statut', 1)}
                                                                        className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${bulletin.pharmacie.statut === 1
                                                                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                                                                            : 'bg-slate-100 text-slate-400 hover:bg-emerald-50'
                                                                            }`}
                                                                    >
                                                                        Accepter
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handlePharmacieProcessing('statut', 2)}
                                                                        className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${bulletin.pharmacie.statut === 2
                                                                            ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/30'
                                                                            : 'bg-slate-100 text-slate-400 hover:bg-rose-50'
                                                                            }`}
                                                                    >
                                                                        Rejeter
                                                                    </button>
                                                                </div>

                                                                <button
                                                                    onClick={handleSinglePharmacieSave}
                                                                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg"
                                                                >
                                                                    <Save size={16} />
                                                                    Enregistrer Pharmacie
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
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
                                                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
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
                    {previewDoc && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="lg:w-1/2 lg:sticky lg:top-28 h-[calc(100vh-120px)] flex flex-col rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-slate-700"
                        >
                            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                                        <Eye size={18} />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-white">Aperçu</h3>
                                        <p className="text-[10px] text-slate-400 font-bold">{previewDoc.type_document}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setPreviewDoc(null)}
                                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-red-100 hover:text-red-600 transition-all"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-4 overflow-auto">
                                {previewDoc.fichier?.toLowerCase().endsWith('.pdf') ? (
                                    <iframe
                                        src={`${uploadBase}/uploads/${previewDoc.fichier}#toolbar=0&navpanes=0`}
                                        className="w-full h-full border-0 rounded-xl shadow-inner"
                                        title="Aperçu PDF"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <img
                                            src={`${uploadBase}/uploads/${previewDoc.fichier}`}
                                            alt="Aperçu document"
                                            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                                        />
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
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