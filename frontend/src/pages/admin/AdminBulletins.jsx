import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText,
    Search,
    Filter,
    Eye,
    CheckCircle2,
    Clock,
    X,
    User,
    Calendar,
    DollarSign,
    Loader2,
    Check,
    AlertCircle,
    TrendingUp,
    ChevronRight,
    Activity
} from 'lucide-react';
import { getAllBulletins, updateBulletinStatus } from '../../services/bulletinService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import ConfirmModal from '../../components/ConfirmModal';
import {
    getPatientDisplayName,
    formatMontantTnd,
    bulletinMatchesSearch,
} from '../../utils/bulletinDisplay';

const AdminBulletins = () => {
    const { user: currentUser } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [bulletins, setBulletins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    // Confirmation Modal State
    const [confirmData, setConfirmData] = useState({
        isOpen: false,
        id: null,
        newStatus: null,
        title: '',
        message: '',
        type: 'info',
        requireReason: false,

    });

    const fetchBulletins = async () => {
        try {
            setLoading(true);
            const data = await getAllBulletins();
            setBulletins(data);
        } catch (error) {
            console.error(error);
            showToast("Erreur lors du chargement des bulletins", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBulletins();
    }, []);

    const handleStatusUpdate = async (result) => {
        const { id, newStatus } = confirmData;
        try {
            setConfirmData(prev => ({ ...prev, isOpen: false }));

            const updateData = {};
            await updateBulletinStatus(id, newStatus, updateData);

            await updateBulletinStatus(id, newStatus, updateData);
            showToast("Statut mis à jour avec succès !", "success");
            fetchBulletins();
        } catch (error) {
            showToast("Erreur lors de la mise à jour du statut", "error");
        }
    };

    const initiateStatusUpdate = (bulletin, targetStatus) => {
        let title = "";
        let message = "";
        let type = "info";

        switch (targetStatus) {
            case 1:
                title = "Mettre en traitement";
                message = `Voulez-vous marquer le bulletin #${bulletin.numero_bulletin} comme étant "En cours de traitement" ?`;
                type = "info";
                break;
            case 2:
                title = "Marquer comme traité";
                message = `Êtes-vous sûr de vouloir marquer le bulletin #${bulletin.numero_bulletin} comme TRAITÉ ?`;
                type = "info";
                break;
            default: break;
        }

        setConfirmData({
            isOpen: true,
            id: bulletin.id,
            newStatus: targetStatus,
            title,
            message,
            type,
            requireReason: false,
        });
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 2: // Traité
                return {
                    bg: 'bg-emerald-50 dark:bg-emerald-900/10',
                    text: 'text-emerald-600 dark:text-emerald-400',
                    border: 'border-emerald-100 dark:border-emerald-800/30',
                    icon: <CheckCircle2 size={12} className="mr-1.5" />,
                    label: 'Traité'
                };
            case 1: // En cours
                return {
                    bg: 'bg-amber-50 dark:bg-amber-900/10',
                    text: 'text-amber-600 dark:text-amber-400',
                    border: 'border-amber-100 dark:border-amber-800/30',
                    icon: <Clock size={12} className="mr-1.5" />,
                    label: 'En cours'
                };
            default: // 0: En attente
                return {
                    bg: 'bg-slate-50 dark:bg-slate-800/40',
                    text: 'text-slate-500 dark:text-slate-400',
                    border: 'border-slate-100 dark:border-slate-700/30',
                    icon: <Clock size={12} className="mr-1.5" />,
                    label: 'En attente'
                };
        }
    };

    const filteredData = useMemo(() => {
        return bulletins.filter(b => {
            const matchesSearch = bulletinMatchesSearch(b, searchTerm, null);
            const matchesStatus = statusFilter === 'All' || b.statut?.toString() === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [searchTerm, statusFilter, bulletins]);

    return (
        <div className="p-8 md:p-12 space-y-10">
            <AnimatePresence>
                {loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-white/60 dark:bg-slate-950/60 backdrop-blur-md"
                    >
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-600">Chargement des données...</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-2"
                >
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2.5 bg-purple-600/10 rounded-xl">
                            <FileText size={20} className="text-purple-600" />
                        </div>
                        <h2 className="text-[10px] font-black tracking-[0.3em] uppercase opacity-40 text-slate-900 dark:text-white">Administration</h2>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                        Bulletins de Soin
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight">Vérification et validation des demandes de remboursement</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-4 bg-white dark:bg-slate-900 p-2 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-white/5"
                >
                    <div className="px-6 py-3 bg-purple-600 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-lg shadow-purple-500/25">
                        Toutes les archives
                    </div>
                    <div className="pr-4 py-3 text-slate-400 dark:text-slate-500 font-black text-[10px] uppercase tracking-widest cursor-pointer hover:text-slate-600 transition-colors">
                        Exporter (CSV)
                    </div>
                </motion.div>
            </div>

            {/* Fiches de Stats Rapides */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                    { label: 'Attente', count: bulletins.filter(b => b.statut === 0).length, color: 'slate' },
                    { label: 'Traitement', count: bulletins.filter(b => b.statut === 1).length, color: 'amber' },
                    { label: 'Traités', count: bulletins.filter(b => b.statut === 2).length, color: 'emerald' },
                ].map((stat, idx) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-white/5 group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500"
                    >
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2">{stat.label}</p>
                        <div className="flex items-baseline gap-2">
                            <h3 className={`text-4xl font-black tracking-tighter ${stat.color === 'emerald' ? 'text-emerald-500' :
                                stat.color === 'amber' ? 'text-amber-500' :
                                    stat.color === 'red' ? 'text-red-500' : 'text-slate-900 dark:text-white'
                                }`}>
                                {stat.count}
                            </h3>
                            <TrendingUp size={16} className={`opacity-20 ${stat.color === 'emerald' ? 'text-emerald-500' : 'text-slate-400'
                                }`} />
                        </div>
                    </motion.div>
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-white/5 flex flex-col lg:flex-row gap-6"
            >
                <div className="relative flex-1 group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-purple-600 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Rechercher par BS, Malade, Adhérent..."
                        className="w-full pl-16 pr-6 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all font-bold tracking-tight text-slate-700 dark:text-slate-200"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3">
                    <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 text-slate-400">
                        <Filter size={20} />
                    </div>
                    <select
                        className="px-8 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 font-black text-[11px] uppercase tracking-widest text-slate-600 dark:text-slate-300 cursor-pointer shadow-sm transition-all"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="All">Tous les statuts</option>
                        <option value="0">En attente</option>
                        <option value="1">En traitement</option>
                        <option value="2">Traités</option>
                    </select>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-white/5 relative"
            >
                <div className="overflow-x-auto pb-4">
                    <table className="w-full border-separate border-spacing-y-3 px-8">
                        <thead>
                            <tr className="text-slate-400 dark:text-slate-500">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-left">Dossier & Référence</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-left">Bénéficiaire</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-left">Analyse Risque</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-left">Montants</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-left">Statut</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((b, idx) => {
                                const status = getStatusStyles(b.statut);
                                const riskColor = b.fraud_score > 70 ? 'text-red-500' : 
                                                 b.fraud_score > 40 ? 'text-amber-500' : 
                                                 'text-emerald-500';
                                
                                return (
                                    <motion.tr
                                        key={b.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 + (idx * 0.05) }}
                                        className="group"
                                    >
                                        {/* Colonne Dossier */}
                                        <td className="bg-white dark:bg-slate-900 first:rounded-l-[2rem] border-y border-l border-slate-100 dark:border-white/5 px-6 py-5 group-hover:bg-slate-50/50 dark:group-hover:bg-white/[0.02] transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 flex-shrink-0">
                                                    <FileText size={20} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1">
                                                        #{b.numero_bulletin}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                        {b.code_cnam ? `CNAM: ${b.code_cnam}` : 'SANS CODE CNAM'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Colonne Bénéficiaire */}
                                        <td className="bg-white dark:bg-slate-900 border-y border-slate-100 dark:border-white/5 px-6 py-5 group-hover:bg-slate-50/50 dark:group-hover:bg-white/[0.02] transition-colors">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-0.5">
                                                    {getPatientDisplayName(b, b.adherent)}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{b.qualite_malade || 'Adhérent'}</span>
                                                    <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                                                    <span className="text-[9px] font-bold text-indigo-500/70 uppercase">{b.adherent?.matricule}</span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Colonne Risque */}
                                        <td className="bg-white dark:bg-slate-900 border-y border-slate-100 dark:border-white/5 px-6 py-5 group-hover:bg-slate-50/50 dark:group-hover:bg-white/[0.02] transition-colors">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center justify-between w-32">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${riskColor}`}>
                                                        {b.fraud_score > 70 ? 'CRITIQUE' : b.fraud_score > 40 ? 'SUSPECT' : 'SAIN'}
                                                    </span>
                                                    <span className="text-[10px] font-black text-slate-400">{b.fraud_score || 0}%</span>
                                                </div>
                                                <div className="w-32 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${b.fraud_score || 0}%` }}
                                                        className={`h-full ${b.fraud_score > 70 ? 'bg-red-500' : b.fraud_score > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                    />
                                                </div>
                                            </div>
                                        </td>

                                        {/* Colonne Montants */}
                                        <td className="bg-white dark:bg-slate-900 border-y border-slate-100 dark:border-white/5 px-6 py-5 group-hover:bg-slate-50/50 dark:group-hover:bg-white/[0.02] transition-colors">
                                            <div className="flex flex-col leading-none">
                                                <div className="flex items-baseline gap-1 mb-1">
                                                    <span className="text-lg font-black text-slate-900 dark:text-white tracking-tighter">
                                                        {formatMontantTnd(b.montant_total)}
                                                    </span>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase">TND</span>
                                                </div>
                                                <span className="text-[9px] font-bold text-emerald-500/80 uppercase tracking-widest">
                                                    Rembs: {formatMontantTnd(b.montant_total_remboursé)}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Colonne Statut */}
                                        <td className="bg-white dark:bg-slate-900 border-y border-slate-100 dark:border-white/5 px-6 py-5 group-hover:bg-slate-50/50 dark:group-hover:bg-white/[0.02] transition-colors">
                                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border text-[9px] font-black uppercase tracking-[0.1em] shadow-sm ${status.bg} ${status.text} ${status.border}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${status.text.replace('text-', 'bg-')}`} />
                                                {status.label}
                                            </div>
                                        </td>

                                        {/* Colonne Actions */}
                                        <td className="px-10 py-7">
                                            <div className="flex items-center justify-center gap-3">
                                                {/* Logic for assignment conflict avoidance */}
                                                {currentUser?.role === 'ADMIN' && (() => {
                                                    const isAssignedToOther = b.adminId && b.adminId !== currentUser?.id && b.statut === 1;
 
                                                    return (
                                                        <>
                                                            <button
                                                                onClick={() => initiateStatusUpdate(b, 1)}
                                                                disabled={b.statut === 1 || b.statut === 2 || isAssignedToOther}
                                                                className="p-3 bg-white dark:bg-slate-800 text-amber-500 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                                                title={isAssignedToOther ? `Assigné à ${b.admin?.nom}` : "Mettre en traitement"}
                                                                >
                                                                <Clock size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => initiateStatusUpdate(b, 2)}
                                                                disabled={b.statut === 2 || isAssignedToOther}
                                                                className="p-3 bg-white dark:bg-slate-800 text-emerald-500 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                                                title={isAssignedToOther ? `Assigné à ${b.admin?.nom}` : "Marquer comme traité"}
                                                            >
                                                                <Check size={16} />
                                                            </button>
                                                        </>
                                                    );
                                                })()}
                                                <div className="w-px h-6 bg-slate-100 dark:bg-white/5" />
                                                <button
                                                    onClick={() => navigate(`/admin/bulletins/${b.id}`)}
                                                    className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg shadow-slate-900/10 hover:bg-purple-600 hover:shadow-purple-500/20 transition-all active:scale-95"
                                                    title="Voir Détails"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {filteredData.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="py-32 flex flex-col items-center justify-center text-slate-400 gap-4"
                    >
                        <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-[2rem] border border-slate-100 dark:border-white/5">
                            <AlertCircle size={48} className="opacity-20" />
                        </div>
                        <p className="font-black text-[10px] uppercase tracking-[0.3em] opacity-40">Aucun bulletin trouvé</p>
                    </motion.div>
                )}
            </motion.div>

            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={confirmData.isOpen}
                onClose={() => setConfirmData(prev => ({ ...prev, isOpen: false }))}
                onConfirm={handleStatusUpdate}
                title={confirmData.title}
                message={confirmData.message}
                type={confirmData.type}
                requireReason={confirmData.requireReason}
                confirmText="Confirmer"
                cancelText="Annuler"
            />
        </div>
    );
};

export default AdminBulletins;
