import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  User, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  Clock,
  ArrowUpRight
} from 'lucide-react';
import AddBulletinModal from '../../components/AddBulletinModal';
import { useToast } from '../../context/ToastContext';

const UserDashboard = () => {
    const { showToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    // Données mockées (Tunisie)
    const [bulletins] = useState([
        { id: 'BS-2024-001', patient: 'Ahmed Mansour', date: '2024-02-15', expertise: 'Approuvée', depense: 125.500, rembourse: 100.400, type: 'Consultation' },
        { id: 'BS-2024-002', patient: 'Sami Ben Salem', date: '2024-02-28', expertise: 'En cours', depense: 450.000, rembourse: 0.000, type: 'Optique' },
        { id: 'BS-2024-003', patient: 'Fatma Trabelsi', date: '2024-03-01', expertise: 'Approuvée', depense: 75.000, rembourse: 60.000, type: 'Pharmacie' },
        { id: 'BS-2024-004', patient: 'Yassine Gharbi', date: '2024-03-05', expertise: 'En cours', depense: 210.000, rembourse: 0.000, type: 'Dentaire' },
    ]);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [dateFilter, setDateFilter] = useState('');

    const getStatusStyles = (status) => {
        switch (status) {
            case 'Approuvée':
                return { 
                    bg: 'bg-emerald-100 dark:bg-emerald-900/20', 
                    text: 'text-emerald-700 dark:text-emerald-400', 
                    border: 'border-emerald-200 dark:border-emerald-800',
                    icon: <CheckCircle2 size={14} className="mr-1" />
                };
            case 'En cours':
                return { 
                    bg: 'bg-amber-100 dark:bg-amber-900/20', 
                    text: 'text-amber-700 dark:text-amber-400', 
                    border: 'border-amber-200 dark:border-amber-800',
                    icon: <Clock size={14} className="mr-1" />
                };
            default:
                return { 
                    bg: 'bg-slate-100 dark:bg-slate-800', 
                    text: 'text-slate-700 dark:text-slate-300', 
                    border: 'border-slate-200 dark:border-slate-700', 
                    icon: null 
                };
        }
    };

    const stats = useMemo(() => {
        const total = bulletins.length;
        const totalRembourse = bulletins.reduce((acc, curr) => acc + curr.rembourse, 0);
        const enAttente = bulletins.filter(b => b.expertise === 'En cours').length;
        return { total, totalRembourse, enAttente };
    }, [bulletins]);

    const filteredData = useMemo(() => {
        return bulletins.filter(b => {
            const matchesSearch = b.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                 b.patient.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'All' || b.expertise === statusFilter;
            const matchesDate = !dateFilter || b.date === dateFilter;
            return matchesSearch && matchesStatus && matchesDate;
        });
    }, [searchTerm, statusFilter, dateFilter, bulletins]);

    const handleAddBulletin = (data) => {
        console.log('New Bulletin Data:', data);
        showToast("Demande de remboursement envoyée avec succès !", "success");
        // Ici on pourrait ajouter l'appel API
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6 md:p-10 font-sans transition-colors duration-300">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* --- HEADER --- */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                            <FileText className="text-blue-600 dark:text-blue-500" size={32} />
                            Bulletins de Soin
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Gérez vos demandes de remboursement en toute simplicité</p>
                    </div>
                    
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3.5 rounded-xl font-bold shadow-lg shadow-blue-200 dark:shadow-none transition-all transform hover:scale-105 active:scale-95 group"
                    >
                        <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                        <span>Nouveau Bulletin</span>
                    </button>
                </div>

                {/* --- STATS SECTION --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-5 transition-all hover:shadow-md">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-blue-600 dark:text-blue-400">
                            <FileText size={28} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Bulletins</p>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{stats.total}</h3>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-5 transition-all hover:shadow-md">
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl text-emerald-600 dark:text-emerald-400">
                            <DollarSign size={28} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Remboursé</p>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{stats.totalRembourse.toFixed(3)} <span className="text-sm font-bold text-slate-400 dark:text-slate-500">TND</span></h3>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-5 transition-all hover:shadow-md">
                        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl text-amber-600 dark:text-amber-400">
                            <Calendar size={28} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">En attente</p>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{stats.enAttente}</h3>
                        </div>
                    </div>
                </div>

                {/* --- FILTERS & SEARCH --- */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                        <input 
                            type="text" 
                            placeholder="Rechercher par numéro de BS, patient..."
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-slate-700 transition-all text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                        <div className="relative">
                            <input 
                                type="date" 
                                className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                            />
                        </div>

                        <select 
                            className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="All">Tous les statuts</option>
                            <option value="Approuvée">Approuvée</option>
                            <option value="En cours">En cours</option>
                        </select>

                        <button 
                            onClick={() => { setSearchTerm(''); setDateFilter(''); setStatusFilter('All'); }}
                            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-bold text-slate-600 dark:text-slate-300"
                        >
                            <Filter size={18} />
                            <span>Réinitialiser</span>
                        </button>
                    </div>
                </div>

                {/* --- DATA TABLE --- */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 overflow-hidden overflow-x-auto transition-colors duration-300">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                    <div className="flex items-center gap-2"><FileText size={14} /> N° BS</div>
                                </th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                    <div className="flex items-center gap-2"><User size={14} /> Patient</div>
                                </th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                    <div className="flex items-center gap-2"><Calendar size={14} /> Date maladie</div>
                                </th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Expertise</th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Total dépensé</th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Total remboursé</th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredData.map((b) => {
                                const status = getStatusStyles(b.expertise);
                                return (
                                    <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group">
                                        <td className="px-6 py-5 font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                                            {b.id}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 dark:text-slate-100">{b.patient}</span>
                                                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Tunis, Tunisie</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-slate-600 dark:text-slate-400 font-medium">{new Date(b.date).toLocaleDateString('fr-TN')}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border ${status.bg} ${status.text} ${status.border}`}>
                                                {status.icon}
                                                {b.expertise}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right font-black text-slate-900 dark:text-white">
                                            {b.depense.toFixed(3)} <span className="text-xs text-slate-400">TND</span>
                                        </td>
                                        <td className="px-6 py-5 text-right font-black text-emerald-600 dark:text-emerald-400">
                                            {b.rembourse > 0 ? (
                                                <>+ {b.rembourse.toFixed(3)} <span className="text-xs text-emerald-400/70">TND</span></>
                                            ) : (
                                                <span className="text-slate-300 dark:text-slate-700">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <button className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 rounded-xl transition-all shadow-sm active:scale-95 group">
                                               <div className="flex items-center gap-2 px-2">
                                                   <Eye size={18} />
                                                   <span className="text-sm font-bold">Détails</span>
                                               </div>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal d'ajout */}
            <AddBulletinModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSubmit={handleAddBulletin}
            />
        </div>
    );
};

export default UserDashboard;
