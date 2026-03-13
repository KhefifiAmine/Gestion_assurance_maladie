import React, { useState, useEffect, useMemo } from 'react';
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
    AlertTriangle
} from 'lucide-react';
import { getMyBulletins } from '../../services/bulletinService';
import { useToast } from '../../context/ToastContext';
import AddBulletinModal from '../../components/AddBulletinModal';
import { motion, AnimatePresence } from 'framer-motion';

const BulletinsPage = () => {
    const { showToast } = useToast();
    const [bulletins, setBulletins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Tous les statuts');
    const [dateFilter, setDateFilter] = useState('');

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

    const filteredBulletins = useMemo(() => {
        return bulletins.filter(b => {
            const matchesSearch = (b.numero_bulletin || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (b.nom_prenom_malade || '').toLowerCase().includes(searchTerm.toLowerCase());
            
            const mapStatus = (s) => {
                if (s === 0 || s === 1) return 'En attente';
                if (s === 2) return 'Approuvée';
                if (s === 3) return 'Refusée';
                return 'Tous les statuts';
            };

            const matchesStatus = statusFilter === 'Tous les statuts' || mapStatus(b.statut) === statusFilter;
            const matchesDate = !dateFilter || b.date_depot.includes(dateFilter);
            return matchesSearch && matchesStatus && matchesDate;
        });
    }, [bulletins, searchTerm, statusFilter, dateFilter]);

    const handleAddBulletin = () => {
        showToast("Bulletin ajouté avec succès", "success");
        fetchBulletins();
        setIsModalOpen(false);
    };

    const getStatusConfig = (statut) => {
        if (statut === 2) return { label: 'Approuvée', icon: <CheckCircle2 size={12}/>, classes: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/30' };
        if (statut === 3) return { label: 'Refusée', icon: <X size={12}/>, classes: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800/30' };
        return { label: 'En attente', icon: <Clock size={12}/>, classes: 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-700/30' };
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
                        <select 
                            className="appearance-none pl-5 pr-10 py-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all font-black text-xs bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 cursor-pointer"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option>Tous les statuts</option>
                            <option>En attente</option>
                            <option>Approuvée</option>
                            <option>Refusée</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={16} />
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
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Statut</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-right">Dépensé</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-right">Remboursé</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 text-slate-400 dark:text-slate-600">
                                            <div className="w-10 h-10 border-4 border-purple-600/20 border-t-purple-600 rounded-full animate-spin" />
                                            <span className="font-black text-[10px] uppercase tracking-widest">Chargement...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredBulletins.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-8 py-20 text-center">
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
                                        className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-all duration-200 group"
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
                                        <td className="px-8 py-6 whitespace-nowrap font-bold text-xs text-slate-500 dark:text-slate-400">
                                            {new Date(b.date_depot).toLocaleDateString('fr-FR')}
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusConfig.classes}`}>
                                                {statusConfig.icon}
                                                {statusConfig.label}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap text-right font-black text-sm text-slate-800 dark:text-slate-100">
                                            {b.montant_total?.toFixed(3)} <span className="text-[10px] text-slate-400 dark:text-slate-500">TND</span>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap text-right font-black text-sm">
                                            <span className="text-slate-500 dark:text-slate-400">
                                                0.000
                                            </span>
                                            <span className="text-[10px] text-slate-400 dark:text-slate-500"> TND</span>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap text-center">
                                            <button className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-purple-500/30 font-black text-[10px] tracking-widest transition-all duration-200 hover:bg-purple-600 hover:text-white hover:border-purple-600 hover:shadow-lg hover:shadow-purple-500/20 active:scale-95 group text-purple-600 dark:text-purple-400 bg-white dark:bg-slate-900">
                                                <Eye size={16} className="transition-transform group-hover:scale-110" />
                                                DÉTAILS
                                            </button>
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
                onClose={() => setIsModalOpen(false)} 
                onSubmit={handleAddBulletin} 
            />
        </div>
    );
};

export default BulletinsPage;
