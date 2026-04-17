import React, { useState, useEffect, useMemo } from 'react';
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
import BulletinDetailsModal from '../../components/BulletinDetailsModal';
import ConfirmModal from '../../components/ConfirmModal';

const AdminBulletins = () => {
    const { user: currentUser } = useAuth();
    const { showToast } = useToast();
    const [bulletins, setBulletins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [selectedBulletin, setSelectedBulletin] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

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
            if (newStatus === 3) {
                updateData.motif_rejet = result;
            }

            await updateBulletinStatus(id, newStatus, updateData);
            showToast("Statut mis à jour avec succès !", "success");
            fetchBulletins();
            if (selectedBulletin && selectedBulletin.id === id) {
                setSelectedBulletin(null);
            }
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
                title = "Approuver le bulletin";
                message = `Êtes-vous sûr de vouloir APPROUVER le bulletin #${bulletin.numero_bulletin} ? Cette action est irréversible.`;
                type = "info";
                break;
            case 3:
                title = "Refuser le bulletin";
                message = `Êtes-vous sûr de vouloir REFUSER le bulletin #${bulletin.numero_bulletin} ? Cette action est irréversible.`;
                type = "danger";
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
            requireReason: targetStatus === 3,
        });
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 2: // Approuvée
                return {
                    bg: 'bg-emerald-50 dark:bg-emerald-900/10',
                    text: 'text-emerald-600 dark:text-emerald-400',
                    border: 'border-emerald-100 dark:border-emerald-800/30',
                    icon: <CheckCircle2 size={12} className="mr-1.5" />,
                    label: 'Approuvée'
                };
            case 1: // En cours
                return {
                    bg: 'bg-amber-50 dark:bg-amber-900/10',
                    text: 'text-amber-600 dark:text-amber-400',
                    border: 'border-amber-100 dark:border-amber-800/30',
                    icon: <Clock size={12} className="mr-1.5" />,
                    label: 'En cours'
                };
            case 3: // Refusée
                return {
                    bg: 'bg-red-50 dark:bg-red-900/10',
                    text: 'text-red-600 dark:text-red-400',
                    border: 'border-red-100 dark:border-red-800/30',
                    icon: <X size={12} className="mr-1.5" />,
                    label: 'Refusée'
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
            const matchesSearch = (b.numero_bulletin || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (b.nom_prenom_malade || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (b.adherent?.nom || '').toLowerCase().includes(searchTerm.toLowerCase());
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
                    { label: 'Acceptés', count: bulletins.filter(b => b.statut === 2).length, color: 'emerald' },
                    { label: 'Refusés', count: bulletins.filter(b => b.statut === 3).length, color: 'red' },
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
                        <option value="2">Approuvés</option>
                        <option value="3">Refusés</option>
                    </select>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-white/5 relative"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Dossier</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Adhérent</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Patient</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Administrateur</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Montant</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Reboursement</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Statut</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] text-center">Gestion</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {filteredData.map((b, idx) => {
                                const status = getStatusStyles(b.statut);
                                return (
                                    <motion.tr
                                        key={b.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.6 + (idx * 0.05) }}
                                        className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-all duration-300 group"
                                    >
                                        <td className="px-10 py-7 font-black text-purple-600 dark:text-purple-400 tracking-tighter text-lg">
                                            <div className="flex items-center gap-2">
                                                <span>#{b.numero_bulletin}</span>
                                                {/*{b.est_suspect && (
                                                    <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-600 rounded-lg text-[10px] uppercase tracking-wider" title="Modification suspectée (Analyse ELA)">
                                                        <AlertCircle size={12} />
                                                        Suspect
                                                    </span>
                                                )}*/}
                                            </div>
                                        </td>
                                        <td className="px-8 py-7">
                                            <div className="flex flex-col">
                                                <span className="font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none mb-1">
                                                    {b.adherent ? `${b.adherent.nom} ${b.adherent.prenom}` : 'Inconnu'}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{b.adherent?.matricule || 'Sans matricule'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-7">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-700 dark:text-slate-300">{b.nom_prenom_malade}</span>
                                                <span className="text-[9px] text-slate-400 font-black tracking-widest uppercase">{b.qualite_malade}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-7">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    {b.admin ? "Assigné à " : 'Non assigné'}
                                                </span>
                                                <span className={`font-black tracking-tight leading-none mb-1 ${b.admin ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 opacity-50'}`}>
                                                    {b.admin ? `${b.admin.prenom} ${b.admin.nom}` : 'Prêt pour traitement'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-7 font-black text-slate-900 dark:text-white">
                                            <div className="flex items-center gap-1">
                                                <span className="text-lg">{b.montant_total?.toFixed(3)}</span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">TND</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-7 font-black text-slate-900 dark:text-white">
                                            <div className="flex items-center gap-1">
                                                <span className="text-lg">{b.montant_remboursement?.toFixed(3)}</span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">TND</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-7">
                                            <div className="flex flex-col gap-1">
                                                <div className={`inline-flex items-center px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-inner ${status.bg} ${status.text} ${status.border}`}>
                                                    {status.icon}
                                                    {status.label}
                                                </div>
                                                {b.statut === 3 && b.motif_rejet && (
                                                    <span className="text-[9px] text-red-500 font-bold truncate max-w-[150px]" title={b.motif_rejet}>
                                                        Motif: {b.motif_rejet}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-10 py-7">
                                            <div className="flex items-center justify-center gap-3">
                                                {/* Logic for assignment conflict avoidance */}
                                                {(() => {
                                                    const isAssignedToOther = b.adminId && b.adminId !== currentUser?.id && b.statut === 1;

                                                    return (
                                                        <>
                                                            <button
                                                                onClick={() => initiateStatusUpdate(b, 1)}
                                                                disabled={b.statut === 1 || b.statut === 2 || b.statut === 3 || isAssignedToOther}
                                                                className="p-3 bg-white dark:bg-slate-800 text-amber-500 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                                                title={isAssignedToOther ? `Assigné à ${b.admin?.nom}` : "Mettre en traitement"}
                                                            >
                                                                <Clock size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => initiateStatusUpdate(b, 2)}
                                                                disabled={b.statut === 2 || b.statut === 3 || isAssignedToOther}
                                                                className="p-3 bg-white dark:bg-slate-800 text-emerald-500 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                                                title={isAssignedToOther ? `Assigné à ${b.admin?.nom}` : "Accepter"}
                                                            >
                                                                <Check size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => initiateStatusUpdate(b, 3)}
                                                                disabled={b.statut === 2 || b.statut === 3 || isAssignedToOther}
                                                                className="p-3 bg-white dark:bg-slate-800 text-red-500 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm hover:bg-red-500 hover:text-white hover:border-red-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                                                title={isAssignedToOther ? `Assigné à ${b.admin?.nom}` : "Refuser"}
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </>
                                                    );
                                                })()}
                                                <div className="w-px h-6 bg-slate-100 dark:bg-white/5" />
                                                <button
                                                    onClick={() => { setSelectedBulletin(b); setShowDetailsModal(true); }}
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

            {/* Details Modal */}
            <BulletinDetailsModal
                isOpen={showDetailsModal}
                onClose={() => setShowDetailsModal(false)}
                bulletin={selectedBulletin}
            />

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
