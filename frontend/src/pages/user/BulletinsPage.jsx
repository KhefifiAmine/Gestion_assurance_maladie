import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
    FileText,
    Plus,
    Search,
    Eye,
    Clock,
    Calendar,
    ChevronDown,
    Filter,
    CheckCircle2,
    X,
    AlertTriangle,
    Edit2,
    Trash2
} from 'lucide-react';
import { getMyBulletins, deleteBulletin } from '../../services/bulletinService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import AddBulletinModal from '../../components/AddBulletinModal';
import BulletinDetailsModal from '../../components/BulletinDetailsModal';
import ConfirmModal from '../../components/ConfirmModal';
import { motion, AnimatePresence } from 'framer-motion';

const BulletinsPage = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const location = useLocation();
    const [bulletins, setBulletins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Tous les statuts');
    const [dateFilter, setDateFilter] = useState('');
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [selectedBulletin, setSelectedBulletin] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [bulletinToEdit, setBulletinToEdit] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });

    const fetchBulletins = async () => {
        try {
            setLoading(true);
            const data = await getMyBulletins();
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

    useEffect(() => {
        if (location.state?.filter) {
            setStatusFilter(location.state.filter);
        }
    }, [location.state]);

    const filteredBulletins = useMemo(() => {
        return bulletins.filter(b => {
            const matchesSearch = (b.numero_bulletin || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (b.nom_prenom_malade || '').toLowerCase().includes(searchTerm.toLowerCase());

            const mapStatus = (s) => {
                const status = Number(s);
                if (status === 0) return 'En attente';
                if (status === 1) return 'En cours';
                if (status === 2) return 'Approuvée';
                if (status === 3) return 'Refusée';
                return 'Tous les statuts';
            };

            const matchesStatus = statusFilter === 'Tous les statuts' || mapStatus(b.statut) === statusFilter;
            const matchesDate = !dateFilter || (b.date_depot && b.date_depot.includes(dateFilter));
            return matchesSearch && matchesStatus && matchesDate;
        });
    }, [bulletins, searchTerm, statusFilter, dateFilter]);

    const handleAddBulletin = () => {
        showToast(bulletinToEdit ? "Bulletin mis à jour avec succès" : "Bulletin ajouté avec succès", "success");
        fetchBulletins();
        setIsModalOpen(false);
        setBulletinToEdit(null);
    };

    const handleEdit = (b) => {
        setBulletinToEdit(b);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        try {
            await deleteBulletin(id);
            showToast("Bulletin supprimé avec succès", "success");
            fetchBulletins();
        } catch (error) {
            showToast(error.message || "Erreur lors de la suppression", "error");
        } finally {
            setConfirmModal({ isOpen: false, id: null });
        }
    };

    const getStatusConfig = (statut) => {
        const s = Number(statut);
        if (s === 2) return { label: 'Approuvée', icon: <CheckCircle2 size={12} />, classes: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/30' };
        if (s === 3) return { label: 'Refusée', icon: <X size={12} />, classes: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800/30' };
        if (s === 1) return { label: 'En cours', icon: <Clock size={12} />, classes: 'bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800/30' };
        return { label: 'En attente', icon: <Clock size={12} />, classes: 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-700/30' };
    };

    return (
        <div className="p-6 lg:p-10 space-y-8 min-h-full bg-slate-50 dark:bg-slate-950 transition-colors duration-300">

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
            >
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">Bulletins de Soin</h1>
                    <div className="flex items-center gap-2">
                        <span className="w-8 h-1 rounded-full bg-purple-600"></span>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Gestion de vos demandes de remboursement</p>
                    </div>
                </div>

                <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-black transition-all duration-300 shadow-2xl shadow-purple-500/20 bg-purple-600 hover:bg-purple-700 active:scale-95"
                >
                    <Plus size={20} strokeWidth={3} />
                    NOUVEAU BULLETIN
                </motion.button>
            </motion.div>

            {/* Filter Bar */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900 flex flex-col lg:flex-row gap-4"
            >
                <div className="relative flex-1 group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 group-focus-within:text-purple-600 dark:group-focus-within:text-purple-400 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Rechercher par numéro de BS, patient..."
                        className="w-full pl-14 pr-6 py-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all text-sm font-bold bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex flex-wrap gap-4">
                    <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 pointer-events-none" size={18} />
                        <input
                            type="date"
                            className="pl-12 pr-4 py-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all font-bold text-xs bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                            className="flex items-center justify-between gap-4 px-6 py-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner focus:outline-none focus:ring-4 focus:ring-purple-500/10 transition-all font-black text-xs bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 cursor-pointer min-w-[180px]"
                        >
                            <span>{statusFilter}</span>
                            <ChevronDown className={`text-slate-400 dark:text-slate-500 transition-transform duration-300 ${isStatusDropdownOpen ? 'rotate-180' : ''}`} size={16} />
                        </motion.button>

                        <AnimatePresence>
                            {isStatusDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsStatusDropdownOpen(false)} />
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 5, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute top-full left-0 right-0 z-20 mt-2 p-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl"
                                    >
                                        {['Tous les statuts', 'En attente', 'En cours', 'Approuvée', 'Refusée'].map((option) => (
                                            <button
                                                key={option}
                                                className={`w-full text-left px-5 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${statusFilter === option
                                                        ? 'bg-purple-600 text-white'
                                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                    }`}
                                                onClick={() => {
                                                    setStatusFilter(option);
                                                    setIsStatusDropdownOpen(false);
                                                }}
                                            >
                                                {option}
                                            </button>
                                        ))}
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                    <button
                        className="flex items-center gap-2 px-6 py-4 rounded-2xl font-black text-[10px] tracking-widest transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-slate-100 dark:border-slate-800 uppercase text-slate-600 dark:text-slate-300"
                        onClick={() => { setSearchTerm(''); setDateFilter(''); setStatusFilter('Tous les statuts'); }}
                    >
                        <Filter size={14} />
                        Réinitialiser
                    </button>
                </div>
            </motion.div>

            {/* Data Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-white/5 overflow-hidden bg-white dark:bg-slate-900"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gradient-to-r from-[#4B0082] to-[#9B4DCA] text-white">
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">N° Bulletin</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Patient</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Date Maladie</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-center">Date Dépôt</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-right">Dépensé</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-right">Remboursé</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-center">Statut</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 text-slate-400 dark:text-slate-600">
                                            <div className="w-10 h-10 border-4 border-purple-600/20 border-t-purple-600 rounded-full animate-spin" />
                                            <span className="font-black text-[10px] uppercase tracking-widest">Chargement...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredBulletins.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5">
                                                <AlertTriangle size={40} className="text-slate-200 dark:text-slate-700" />
                                            </div>
                                            <p className="font-black text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-600">Aucun bulletin trouvé</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredBulletins.map((b, idx) => {
                                const statusConfig = getStatusConfig(b.statut);
                                return (
                                    <motion.tr
                                        key={b.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.04 }}
                                        className={`transition-all duration-300 group border-l-[6px] ${
                                            b.statut === 2 ? 'bg-emerald-50/50 dark:bg-emerald-900/5 border-emerald-500 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/10' :
                                            b.statut === 3 ? 'bg-red-50/50 dark:bg-red-900/5 border-red-500 hover:bg-red-100/50 dark:hover:bg-red-900/10' :
                                            b.statut === 1 ? 'bg-amber-50/50 dark:bg-amber-900/5 border-amber-500 hover:bg-amber-100/50 dark:hover:bg-amber-900/10' :
                                            'bg-slate-50/50 dark:bg-slate-800/20 border-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/30'
                                        }`}
                                    >
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <span className="font-black text-sm text-purple-600 dark:text-purple-400 hover:underline cursor-pointer">
                                                {b.numero_bulletin}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm text-slate-800 dark:text-slate-100">{b.nom_prenom_malade}</span>
                                                <span className="text-[10px] font-black uppercase tracking-wide text-slate-400 dark:text-slate-500">{b.qualite_malade}</span>
                                            </div>
                                        </td>
                                        <td className="text-[14px] px-8 py-6 whitespace-nowrap font-black text-xs text-slate-900 dark:text-white text-center">
                                            {/* Date Maladie (on mettra une date par défaut ou un champ s'il existe) */}
                                            {b.date_soin ? new Date(b.date_soin).toLocaleDateString('fr-FR') : '-'}
                                        </td>
                                        <td className="text-[14px] px-8 py-6 whitespace-nowrap font-black text-xs text-slate-900 dark:text-white text-center">
                                            {b.date_depot ? new Date(b.date_depot).toLocaleDateString('fr-FR') : '-'}
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap text-right font-black text-sm text-slate-800 dark:text-slate-100">
                                            {b.montant_total?.toFixed(3)} <span className="text-[10px] text-black-400 dark:text-black-500">TND</span>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap text-right font-black text-sm">
                                            <span className="text-black-500 dark:text-black-400">
                                                {b.montant_remboursement?.toFixed(3)}
                                            </span>
                                            <span className="text-[10px] text-black-400 dark:text-black-500"> TND</span>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <div className="flex flex-col gap-1">
                                                <span className={`inline-flex justify-center items-center gap-2 px-1 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusConfig.classes}`}>
                                                    {statusConfig.icon}
                                                    {statusConfig.label}
                                                </span>
                                                {b.statut === 3 && b.motif_refus && (
                                                    <span className="text-[10px] text-red-500 font-bold mt-1 text-center max-w-[120px] truncate block mx-auto opacity-80 group-hover:opacity-100 transition-opacity" title={b.motif_refus}>
                                                        {b.motif_refus}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => { setSelectedBulletin(b); setIsDetailsModalOpen(true); }}
                                                    className="p-1 rounded-xl text-purple-600 hover:bg-purple-50 transition-colors"
                                                    title="Détails"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                {(b.statut === 0 || b.statut === 3) && (
                                                    <>
                                                        <button
                                                            onClick={() => handleEdit(b)}
                                                            className="p-1 rounded-xl text-blue-600 hover:bg-blue-50 transition-colors"
                                                            title="Modifier"
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => setConfirmModal({ isOpen: true, id: b.id })}
                                                            className="p-1 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
                                                            title="Supprimer"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            <AddBulletinModal
                isOpen={isModalOpen}
                initialData={bulletinToEdit}
                onClose={() => { setIsModalOpen(false); setBulletinToEdit(null); }}
                onSubmit={handleAddBulletin}
            />

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, id: null })}
                onConfirm={() => handleDelete(confirmModal.id)}
                title="Supprimer le bulletin"
                message="Êtes-vous sûr de vouloir supprimer ce bulletin ? Cette action est irréversible."
                type="danger"
            />

            <BulletinDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                bulletin={selectedBulletin}
            />
        </div>
    );
};

export default BulletinsPage;
