import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertTriangle, List, Search, Filter,
    Eye, RefreshCw, ChevronDown, Activity,
    LayoutDashboard, Trash2, CheckCircle
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
    getReclamations,
    deleteReclamation
} from '../../services/reclamationService';
import { getMyBulletins } from '../../services/bulletinService';

import ReclamationDetail from '../../components/ReclamationDetail';
import ConfirmModal from '../../components/ConfirmModal';

/* =========================================================================
   ADMIN UI COMPONENTS
   ========================================================================= */

const StatusBadge = ({ statut }) => {
    const styles = {
        'Ouverte': 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/10 dark:text-purple-400 dark:border-purple-800/30',
        'En cours': 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/10 dark:text-amber-400 dark:border-amber-800/30',
        'Traitée': 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/10 dark:text-emerald-400 dark:border-emerald-800/30',
        'Clôturée': 'bg-slate-50 text-slate-500 border-slate-100 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700/30'
    };

    return (
        <span className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-full border shadow-inner whitespace-nowrap ${styles[statut] || 'bg-gray-100 text-gray-700'}`}>
            {statut}
        </span>
    );
};

const PriorityBadge = ({ priorite }) => {
    const styles = {
        1: 'bg-black-50 text-black-500 border-black-100 dark:bg-black-800/40 dark:text-black-400 dark:border-black-700/30',
        2: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/10 dark:text-blue-400 dark:border-blue-800/30',
        3: 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/10 dark:text-orange-400 dark:border-orange-800/30',
        4: 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/10 dark:text-red-400 dark:border-red-800/30'
    };

    const labels = { 1: 'Basse', 2: 'Moyenne', 3: 'Haute', 4: 'Urgente' };

    return (
        <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border ${styles[priorite] || styles[1]}`}>
            {labels[priorite] || 'Basse'}
        </span>
    );
};

const KPI = ({ title, value, icon, onClick, type = 'purple' }) => {
    const colors = {
        purple: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 border-purple-100 shadow-purple-500/5',
        amber: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20 border-amber-100 shadow-amber-500/5',
        emerald: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 shadow-emerald-500/5',
        indigo: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 shadow-indigo-500/5'
    };

    return (
        <div
            onClick={onClick}
            className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between group hover:shadow-xl transition-all duration-500 cursor-pointer"
        >
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{title}</p>
                <h3 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">{value}</h3>
            </div>
            <div className={`p-4 rounded-2xl ${colors[type] || colors.purple}`}>{icon}</div>
        </div>
    );
};

const AdminDashboard = ({ reclamations, onViewAll }) => {
    const total = reclamations.length;
    const ouvertes = reclamations.filter(r => r.statut === 'Ouverte').length;
    const enCours = reclamations.filter(r => r.statut === 'En cours').length;
    const traitees = reclamations.filter(r => r.statut === 'Traitée').length;

    return (
        <div className="space-y-12 w-full">
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-purple-600/10 rounded-xl"><LayoutDashboard size={20} className="text-purple-600" /></div>
                    <h2 className="text-[10px] font-black tracking-[0.3em] uppercase opacity-40">Statistiques</h2>
                </div>
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Tableau de Bord</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPI onClick={onViewAll} title="Total" value={total} type="purple" icon={<List size={28} />} />
                <KPI onClick={onViewAll} title="Ouvertes" value={ouvertes} type="indigo" icon={<AlertTriangle size={28} />} />
                <KPI onClick={onViewAll} title="En Cours" value={enCours} type="amber" icon={<RefreshCw size={28} />} />
                <KPI onClick={onViewAll} title="Traitées" value={traitees} type="emerald" icon={<CheckCircle size={28} />} />
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl p-8 md:p-12 flex flex-col lg:flex-row items-center justify-between gap-10 border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl -mr-20 -mt-20" />
                <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                    <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-2xl">
                        <Activity size={36} />
                    </div>
                    <div className="text-center md:text-left">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Pilotage des incidents</h3>
                        <p className="text-slate-500 mt-2 max-w-xl font-medium leading-relaxed">Suivez et traitez les réclamations des adhérents en temps réel.</p>
                    </div>
                </div>
                <button onClick={onViewAll} className="w-full lg:w-auto bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-10 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all shadow-2xl hover:bg-purple-600 dark:hover:bg-purple-400 dark:hover:text-white active:scale-95 z-10">
                    Accéder à la liste
                </button>
            </div>
        </div>
    );
};

const AdminTable = ({ reclamations, onView, showConfirm, showToast, onActionSuccess, currentUser }) => {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

    const filtered = reclamations.filter(r => {
        const s = search.toLowerCase();
        const matchSearch = (r.adherentNom || '').toLowerCase().includes(s) || (r.objet || '').toLowerCase().includes(s) || (r.reference || r.id || '').toLowerCase().includes(s);
        const matchStatus = statusFilter ? r.statut === statusFilter : true;
        return matchSearch && matchStatus;
    });

    return (
        <div className="space-y-10 w-full">
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-purple-600/10 rounded-xl"><AlertTriangle size={20} className="text-purple-600" /></div>
                    <h2 className="text-[10px] font-black tracking-[0.3em] uppercase opacity-40">Back-Office</h2>
                </div>
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Toutes les Réclamations</h1>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col lg:flex-row gap-6">
                <div className="relative flex-1 group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-purple-600 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Rechercher par ID, Nom adhérent ou Objet..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-16 pr-6 py-5 bg-slate-50 dark:bg-slate-800 border border-slate-100 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-purple-500/10 transition-all font-bold text-slate-700 dark:text-slate-200"
                    />
                </div>

                <div className="relative min-w-[220px]">
                    <button
                        onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                        className="w-full flex items-center justify-between px-8 py-5 bg-slate-50 dark:bg-slate-800 border border-slate-100 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest text-slate-600 active:scale-95 transition-all"
                    >
                        <span>{statusFilter || 'Tous les statuts'}</span>
                        <ChevronDown className={`transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} size={16} />
                    </button>

                    <AnimatePresence>
                        {isStatusDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsStatusDropdownOpen(false)} />
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 5 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full left-0 right-0 z-50 mt-2 p-2 bg-white dark:bg-slate-900 border border-slate-100 rounded-[1.5rem] shadow-2xl">
                                    {['', 'Ouverte', 'En cours', 'Traitée', 'Clôturée'].map((opt) => (
                                        <button key={opt} className={`w-full text-left px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === opt ? 'bg-purple-600 text-white' : 'hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800'}`} onClick={() => { setStatusFilter(opt); setIsStatusDropdownOpen(false); }}>{opt || 'Tous les statuts'}</button>
                                    ))}
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-100">
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Référence</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date de dépôt</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Adhérent</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Administrateur</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Objet</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Priorité</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Statut</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {filtered.map((r) => {
                                const isAssignedToOther = r.adminId && r.adminId !== currentUser?.id && (r.statut === 'En cours');
                                return (
                                    <tr key={r.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-10 py-7 font-black text-purple-600">#{r.reference || r.id}</td>
                                        <td className="px-8 py-7 font-bold text-slate-500 whitespace-nowrap">
                                            {new Date(r.createdAt).toLocaleDateString('fr-FR')}
                                        </td>
                                        <td className="px-8 py-7 font-bold dark:text-white">{r.adherentNom || (r.adherent ? `${r.adherent.prenom} ${r.adherent.nom}` : 'N/A')}</td>
                                        <td className="px-8 py-7">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    {r.admin ? "Assigné à" : 'Non assigné'}
                                                </span>
                                                <span className={`font-black tracking-tight text-sm leading-none mb-1 ${r.admin ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 opacity-50'}`}>
                                                    {r.admin ? `${r.admin.prenom} ${r.admin.nom}` : 'Disponible'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-7 dark:text-slate-300">{r.objet}</td>
                                        <td className="px-8 py-7"><PriorityBadge priorite={r.priorite} /></td>
                                        <td className="px-8 py-7"><StatusBadge statut={r.statut} /></td>
                                        <td className="px-10 py-7">
                                            <div className="flex justify-center gap-3">
                                                <button
                                                    onClick={() => onView(r.id)}
                                                    className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-purple-600 transition-all"
                                                    title="Voir les détails"
                                                ><Eye size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {filtered.length === 0 && <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest">Aucun résultat</div>}
                </div>
            </div>
        </div>
    );
};

/* =========================================================================
   ADMIN RECLAMATION (MAIN PAGE)
   ========================================================================= */

const AdminReclamation = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [activeView, setActiveView] = useState('dashboard');
    const [selectedId, setSelectedId] = useState(null);
    const [editData, setEditData] = useState(null);
    const [reclamations, setReclamations] = useState([]);
    const [bulletins, setBulletins] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', type: 'warning', onConfirm: () => { } });

    const triggerConfirm = (title, message, onConfirm, type = 'warning') => {
        setConfirmModal({ isOpen: true, title, message, onConfirm, type });
    };

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [recs, bulls] = await Promise.all([getReclamations(), getMyBulletins().catch(() => [])]);
                setReclamations(recs);
                setBulletins(bulls);
            } catch (err) {
                showToast("Erreur de chargement", 'error');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [showToast]);

    const handleActionSuccess = (data, type) => {
        if (type === 'add') setReclamations(prev => [data, ...prev]);
        else if (type === 'update') setReclamations(prev => prev.map(r => r.id === data.id ? { ...r, ...data } : r));
        else if (type === 'delete') setReclamations(prev => prev.filter(r => r.id !== data));
    };

    const handleReclamationUpdate = (updated) => {
        setReclamations(prev => prev.map(r => r.id === updated.id ? { ...r, ...updated } : r));
    };

    const views = ['dashboard', 'list'];

    return (
        <div className="w-full h-full relative font-sans animate-scale-in">
            <div className="p-2 sm:p-6 pb-24 w-full">
                <div className="flex gap-10 mb-12 border-b border-slate-100 dark:border-white/5 pb-1 overflow-x-auto">
                    {views.map((view) => (
                        <button
                            key={view}
                            onClick={() => setActiveView(view)}
                            className={`px-4 py-5 font-black text-[11px] uppercase tracking-widest transition-all relative ${activeView === view ? 'text-purple-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            {view === 'dashboard' ? 'Dashboard' : 'Liste Globale'}
                            {activeView === view && <motion.div layoutId="admTab" className="absolute bottom-0 left-0 w-full h-1.5 bg-purple-600 rounded-full" />}
                        </button>
                    ))}
                </div>

                {activeView === 'dashboard' && <AdminDashboard reclamations={reclamations} onViewAll={() => setActiveView('list')} />}

                {activeView === 'list' && (
                    <AdminTable
                        reclamations={reclamations}
                        onView={(id) => { setSelectedId(id); setActiveView('detail'); }}
                        showConfirm={triggerConfirm}
                        showToast={showToast}
                        onActionSuccess={handleActionSuccess}
                        currentUser={user}
                    />
                )}

                {activeView === 'detail' && (
                    <ReclamationDetail
                        id={selectedId} userRole={user?.role} allBulletins={bulletins}
                        onBack={() => setActiveView('list')}
                        onEdit={(data) => { setEditData(data); setActiveView('form'); }}
                        onReclamationUpdate={handleReclamationUpdate}
                        onReclamationDelete={(id) => handleActionSuccess(id, 'delete')}
                    />
                )}
            </div>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
            />

            <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(147, 51, 234, 0.2); border-radius: 10px; }
      `}</style>
        </div>
    );
}

export default AdminReclamation;
