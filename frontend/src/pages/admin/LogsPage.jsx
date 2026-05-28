import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  RefreshCw, 
  Calendar, 
  User as UserIcon, 
  FileText, 
  Trash2, 
  Edit, 
  LogIn, 
  LogOut, 
  Eye, 
  PlusCircle, 
  AlertCircle, 
  Bell, 
  Users, 
  BarChart2, 
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Info,
  Activity,
  Download,
  ChevronDown,
  ChevronUp,
  Globe,
  ArrowLeftRight,
  Clock
} from 'lucide-react';
import { API_BASE } from "../../services/api";
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';

const ACTION_MAP = {
    'POST sur /api/auth/login': { label: 'Connexion', icon: LogIn, color: 'text-green-500', bg: 'bg-green-50' },
    'POST sur /api/auth/logout': { label: 'Déconnexion', icon: LogOut, color: 'text-orange-500', bg: 'bg-orange-50' },
    'PUT sur /api/profile': { label: 'Modif. Profil', icon: UserIcon, color: 'text-blue-500', bg: 'bg-blue-50' },
    'POST sur /api/bulletins': { label: 'Création Bulletin', icon: PlusCircle, color: 'text-purple-500', bg: 'bg-purple-50' },
    'POST sur /api/ai/analyze-bulletin': { label: 'Analyse des Documents', icon: FileText, color: 'text-green-500', bg: 'bg-green-50' },
    'PUT sur /api/bulletins/:id': { label: 'Modif. Bulletin', icon: Edit, color: 'text-cyan-500', bg: 'bg-cyan-50' },
    'DELETE sur /api/bulletins/:id': { label: 'Suppr. Bulletin', icon: Trash2, color: 'text-red-500', bg: 'bg-red-50' },
    'PUT sur /api/bulletins/:id/status': { label: 'Statut Bulletin', icon: RefreshCw, color: 'text-amber-500', bg: 'bg-amber-50' },
    'POST sur /api/reclamations': { label: 'Création Réclamation', icon: AlertCircle, color: 'text-pink-500', bg: 'bg-pink-50' },
    'PUT sur /api/reclamations/:id': { label: 'Modif. Réclamation', icon: Edit, color: 'text-fuchsia-500', bg: 'bg-fuchsia-50' },
    'PUT sur /api/reclamations/:id/status': { label: 'Statut Réclamation', icon: RefreshCw, color: 'text-amber-500', bg: 'bg-amber-50' },
    'DELETE sur /api/reclamations/:id': { label: 'Suppr. Réclamation', icon: Trash2, color: 'text-red-500', bg: 'bg-red-50' },
    'POST sur /api/beneficiaries': { label: 'Ajout Bénéficiaire', icon: UserIcon, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    'PUT sur /api/beneficiaries/:id/status': { label: 'Modif. Bénéficiaire', icon: Edit, color: 'text-teal-500', bg: 'bg-teal-50' },
    'DELETE sur /api/beneficiaries/:id': { label: 'Suppr. Bénéficiaire', icon: Trash2, color: 'text-red-500', bg: 'bg-red-50' },
    'PUT sur /api/notifications/read-all': { label: 'Lecture Notifications', icon: Bell, color: 'text-slate-500', bg: 'bg-slate-50' },
    'PUT sur /api/users': { label: 'Modif. Utilisateur', icon: Users, color: 'text-sky-500', bg: 'bg-sky-50' },
    'DELETE sur /api/users': { label: 'Suppr. Utilisateur', icon: Trash2, color: 'text-red-600', bg: 'bg-red-50' },
    'PUT sur /api/users/:id/status': { label: 'Statut Utilisateur', icon: RefreshCw, color: 'text-orange-600', bg: 'bg-orange-50' },
    'PUT sur /api/users/:id/role': { label: 'Rôle Utilisateur', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    'PUT sur /api/profile/change-password': { label: 'Changement MDP', icon: RefreshCw, color: 'text-red-500', bg: 'bg-red-50' },
};

const getToken = () => localStorage.getItem('token');

const fetchLogs = async (filters) => {
    const params = new URLSearchParams();
    if (filters.action) params.append('action', filters.action);
    if (filters.userName) params.append('userName', filters.userName);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    params.append('page', filters.page);
    params.append('limit', filters.limit);

    const res = await fetch(`${API_BASE}/logs?${params.toString()}`, {
        headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json'
        }
    });
    if (!res.ok) throw new Error('Erreur lors du chargement des logs');
    return res.json();
};

const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    }).format(d);
};


const getActionInfo = (action) => {
    if (!action) return { label: 'Action inconnue', icon: Info, color: 'text-gray-400', bg: 'bg-gray-50' };

    // 1. Correspondance exacte
    if (ACTION_MAP[action]) return ACTION_MAP[action];

    // 2. Normaliser les IDs dans l'action ("PUT sur /api/reclamations/5/status" → "PUT sur /api/reclamations/:id/status")
    const normalized = action.replace(/\/\d+/g, '/:id');
    if (ACTION_MAP[normalized]) return ACTION_MAP[normalized];

    // 3. Correspondance partielle STRICTE : même méthode ET chemin compatible
    for (const [key, value] of Object.entries(ACTION_MAP)) {
        const [keyMethod, keyPath = ''] = key.split(' sur ');
        const [actMethod, actPath = ''] = normalized.split(' sur ');
        // Les deux doivent avoir la même méthode ET le keyPath doit être un vrai préfixe du actPath
        if (keyMethod === actMethod && keyPath && actPath && actPath.startsWith(keyPath.replace('/:id', ''))) {
            return value;
        }
    }

    return { label: normalized, icon: Info, color: 'text-gray-400', bg: 'bg-gray-50' };
};


/** Formate une chaîne JSON ou brute en paires clé-valeur lisibles */
const parseValue = (raw) => {
    if (!raw) return null;
    try {
        const obj = JSON.parse(raw);
        if (typeof obj === 'object' && obj !== null) return obj;
    } catch (_) {}
    return { valeur: raw };
};

/** Composant pour afficher ancienne/nouvelle valeur sous forme de liste */
function ValueDisplay({ raw, label, colorClass, theme }) {
    const parsed = parseValue(raw);
    if (!parsed) return <span className="opacity-30 text-xs">—</span>;

    return (
        <div className={`rounded-lg p-3 text-xs space-y-1 ${colorClass}`}>
            <p className="font-black uppercase tracking-widest text-[9px] opacity-60 mb-2">{label}</p>
            {Object.entries(parsed).map(([k, v]) => (
                <div key={k} className="flex gap-2">
                    <span className="font-bold opacity-60 min-w-[100px] shrink-0">{k}</span>
                    <span className="break-all">{String(v)}</span>
                </div>
            ))}
        </div>
    );
}

/** Ligne expandable du tableau */
function LogRow({ log, theme }) {
    const [expanded, setExpanded] = useState(false);
    const action = getActionInfo(log.action);
    const ActionIcon = action.icon;

    const hasDetails = log.ancienneValeur || log.nouvelleValeur || log.adresse_ip || log.dateAction;

    return (
        <>
            <tr
                onClick={() => hasDetails && setExpanded(e => !e)}
                className={`group transition-colors border-b last:border-0 ${
                    hasDetails ? 'cursor-pointer' : ''
                } ${theme === 'dark' ? 'hover:bg-white/5 border-white/5' : 'hover:bg-slate-50 border-slate-100'}`}
            >
                {/* Utilisateur */}
                <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-600/10 flex items-center justify-center text-purple-600 font-black text-sm shrink-0">
                            {log.user?.prenom?.[0]}{log.user?.nom?.[0]}
                        </div>
                        <div>
                            <p className="text-sm font-black truncate max-w-[130px]">
                                {log.user ? `${log.user.prenom} ${log.user.nom}` : 'Inconnu'}
                            </p>
                            <p className="text-[10px] opacity-40 lowercase font-bold tracking-wider truncate max-w-[130px]">
                                {log.user?.email || '—'}
                            </p>
                        </div>
                    </div>
                </td>

                {/* Rôle */}
                <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        ['ADMIN', 'SUPER_ADMIN'].includes(log.user?.role) ? 'bg-red-100 text-red-600' :
                        log.user?.role === 'RESPONSABLE_RH' ? 'bg-blue-100 text-blue-600' :
                        'bg-green-100 text-green-600'
                    }`}>
                        {log.user?.role || 'ADHERENT'}
                    </span>
                </td>

                {/* Action */}
                <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${theme === 'dark' ? 'bg-white/10' : action.bg}`}>
                            <ActionIcon size={13} className={action.color} />
                        </div>
                        <span className="text-xs font-bold">{action.label}</span>
                    </div>
                </td>

                {/* Adresse IP */}
                <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                        <Globe size={12} className="opacity-30 shrink-0" />
                        <span className="text-xs font-mono opacity-70">{log.adresse_ip || '—'}</span>
                    </div>
                </td>

                {/* Date action */}
                <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                        <Clock size={12} className="opacity-30 shrink-0" />
                        <span className="text-xs opacity-70">{formatDate(log.dateAction || log.createdAt)}</span>
                    </div>
                </td>

                {/* Horodatage créé */}
                <td className="px-5 py-4">
                    <p className="text-xs font-medium opacity-50">{formatDate(log.createdAt)}</p>
                </td>

                {/* Expand toggle */}
                <td className="px-4 py-4">
                    {hasDetails && (
                        <div className={`p-1.5 rounded-lg transition-colors ${
                            expanded
                                ? 'bg-purple-100 text-purple-600'
                                : theme === 'dark' ? 'text-white/30 hover:text-white/60' : 'text-slate-300 hover:text-slate-500'
                        }`}>
                            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </div>
                    )}
                </td>
            </tr>

            {/* Panneau détails dépliable */}
            {expanded && hasDetails && (
                <tr className={`border-b ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'}`}>
                    <td colSpan={7} className="px-5 pb-5 pt-2">
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-3"
                        >
                            {log.ancienneValeur && (
                                <ValueDisplay
                                    raw={log.ancienneValeur}
                                    label="Ancienne valeur"
                                    colorClass={theme === 'dark'
                                        ? 'bg-red-900/20 text-red-300'
                                        : 'bg-red-50 text-red-700'}
                                    theme={theme}
                                />
                            )}
                            {log.nouvelleValeur && (
                                <ValueDisplay
                                    raw={log.nouvelleValeur}
                                    label="Nouvelle valeur"
                                    colorClass={theme === 'dark'
                                        ? 'bg-green-900/20 text-green-300'
                                        : 'bg-green-50 text-green-700'}
                                    theme={theme}
                                />
                            )}
                            {!log.ancienneValeur && !log.nouvelleValeur && (
                                <div className={`col-span-2 text-xs opacity-40 italic p-3 rounded-lg ${
                                    theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'
                                }`}>
                                    Aucune donnée de modification capturée pour cette action.
                                </div>
                            )}
                        </motion.div>
                    </td>
                </tr>
            )}
        </>
    );
}

export default function LogsPage() {
    const { theme } = useTheme();
    const { showToast } = useToast();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const [filters, setFilters] = useState({
        action: '',
        userName: '',
        startDate: '',
        endDate: '',
        page: 1,
        limit: 15
    });

    const [showFilters, setShowFilters] = useState(true);

    const loadLogs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchLogs(filters);
            setLogs(data.logs);
            setTotal(data.total);
            setTotalPages(data.totalPages);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        loadLogs();
    }, [loadLogs]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value, page: 1 }));
    };

    const handleReset = () => {
        setFilters({ action: '', userName: '', startDate: '', endDate: '', page: 1, limit: 15 });
    };

    const handleExportLogs = async () => {
        if (total === 0) { showToast("Aucun log à exporter", "info"); return; }
        
        const EXPORT_LIMIT = 5000;
        const exportTotal = Math.min(total, EXPORT_LIMIT);

        try {
            if (total > EXPORT_LIMIT) {
                showToast(`Seuls les ${EXPORT_LIMIT} journaux les plus récents seront exportés pour assurer la stabilité. (Total: ${total})`, "warning");
            } else {
                showToast("Préparation de l'exportation complète...", "info");
            }

            const dataAll = await fetchLogs({ ...filters, page: 1, limit: exportTotal });
            const logsToExport = dataAll.logs;

            const headers = ["Utilisateur", "Email", "Rôle", "Action", "Adresse IP", "Ancienne valeur", "Nouvelle valeur", "Date action", "Horodatage"];
            const data = logsToExport.map(log => [
                log.user ? `${log.user.prenom} ${log.user.nom}` : 'Inconnu',
                log.user?.email || '—',
                log.user?.role || 'ADHERENT',
                getActionInfo(log.action).label,
                log.adresse_ip || '—',
                log.ancienneValeur || '—',
                log.nouvelleValeur || '—',
                formatDate(log.dateAction),
                formatDate(log.createdAt)
            ]);

            const csvContent = "\uFEFF" + [headers, ...data]
                .map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
                .join("\n");

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            link.setAttribute("href", URL.createObjectURL(blob));
            link.setAttribute("download", `Export_Logs_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast(`Export de ${total} lignes réussi`, "success");
        } catch (err) {
            showToast("Erreur lors de l'exportation", "error");
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setFilters(prev => ({ ...prev, page: newPage }));
        }
    };

    return (
        <div className={`min-h-screen p-4 lg:p-8 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight uppercase flex items-center gap-3">
                        <div className="p-2 bg-purple-600 rounded-xl shadow-lg shadow-purple-500/20">
                            <ClipboardList className="text-white" size={28} />
                        </div>
                        Journal d'activité
                    </h1>
                    <p className="mt-2 text-sm font-medium opacity-60">
                        Suivi en temps réel des interactions sur la plateforme — cliquez sur une ligne pour voir les détails
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all border ${
                            showFilters
                            ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/30'
                            : theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-200 hover:border-purple-300 hover:text-purple-600'
                        }`}
                    >
                        {showFilters ? <X size={18} /> : <Filter size={18} />}
                        {showFilters ? 'Fermer Filtres' : 'Filtrer'}
                    </button>
                    <button
                        onClick={handleExportLogs}
                        disabled={loading || logs.length === 0}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all border ${
                            theme === 'dark' ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-400 hover:bg-emerald-600/30' : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                        } ${loading || logs.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <Download size={18} />
                        Exporter
                    </button>
                    <button
                        onClick={loadLogs}
                        disabled={loading}
                        className={`p-2.5 rounded-xl border transition-all ${loading ? 'animate-spin opacity-50' : ''} ${
                            theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-200 hover:border-purple-300'
                        }`}
                    >
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>

            {/* Filters Panel */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mb-6"
                    >
                        <div className={`p-6 rounded-2xl border ${
                            theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200 shadow-sm'
                        }`}>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest opacity-50">Action</label>
                                    <select
                                        name="action"
                                        value={filters.action}
                                        onChange={handleFilterChange}
                                        className={`w-full px-4 py-2.5 rounded-xl border appearance-none outline-none focus:ring-2 focus:ring-purple-500/50 transition-all ${
                                            theme === 'dark' ? 'bg-slate-800 border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                                        }`}
                                    >
                                        <option value="">Toutes les actions</option>
                                        {Object.entries(ACTION_MAP).map(([key, val]) => (
                                            <option key={key} value={key}>{val.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest opacity-50">Nom Utilisateur</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="userName"
                                            placeholder="Ex: Ahmed"
                                            value={filters.userName}
                                            onChange={handleFilterChange}
                                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-purple-500/50 transition-all ${
                                                theme === 'dark' ? 'bg-slate-800 border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                                            }`}
                                        />
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={18} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest opacity-50">Depuis</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            name="startDate"
                                            value={filters.startDate}
                                            onChange={handleFilterChange}
                                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-purple-500/50 transition-all ${
                                                theme === 'dark' ? 'bg-slate-800 border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                                            }`}
                                        />
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={18} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest opacity-50">Jusqu'à</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            name="endDate"
                                            value={filters.endDate}
                                            onChange={handleFilterChange}
                                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-purple-500/50 transition-all ${
                                                theme === 'dark' ? 'bg-slate-800 border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                                            }`}
                                        />
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={18} />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={handleReset}
                                    className="px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                                >
                                    Réinitialiser
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Table */}
            <div className={`rounded-2xl border overflow-hidden ${
                theme === 'dark' ? 'bg-slate-900/50 border-white/5' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'
            }`}>
                {loading && logs.length === 0 ? (
                    <div className="py-24 flex flex-col items-center justify-center space-y-4">
                        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm font-black uppercase tracking-widest opacity-40">Récupération des données...</p>
                    </div>
                ) : error ? (
                    <div className="py-24 text-center">
                        <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
                        <h3 className="text-xl font-black uppercase">Erreur de connexion</h3>
                        <p className="opacity-60 mt-2">{error}</p>
                        <button onClick={loadLogs} className="mt-6 px-8 py-3 bg-red-500 text-white rounded-xl font-black uppercase text-xs tracking-widest">Réessayer</button>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="py-24 text-center">
                        <ClipboardList className="mx-auto text-slate-300 mb-4" size={64} />
                        <h3 className="text-xl font-black uppercase opacity-30">Aucun log trouvé</h3>
                        <p className="opacity-40 mt-2">Essayez d'ajuster vos filtres</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className={`border-b ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                                    <th className="px-5 py-5 text-[10px] font-black uppercase tracking-[0.2em] opacity-50">Utilisateur</th>
                                    <th className="px-5 py-5 text-[10px] font-black uppercase tracking-[0.2em] opacity-50">Rôle</th>
                                    <th className="px-5 py-5 text-[10px] font-black uppercase tracking-[0.2em] opacity-50">Action</th>
                                    <th className="px-5 py-5 text-[10px] font-black uppercase tracking-[0.2em] opacity-50">Adresse IP</th>
                                    <th className="px-5 py-5 text-[10px] font-black uppercase tracking-[0.2em] opacity-50">Date action</th>
                                    <th className="px-5 py-5 text-[10px] font-black uppercase tracking-[0.2em] opacity-50">Enregistré le</th>
                                    <th className="px-5 py-5 text-[10px] font-black uppercase tracking-[0.2em] opacity-50 w-8"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <LogRow key={log.id_log} log={log} theme={theme} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className={`p-6 flex items-center justify-between border-t ${
                        theme === 'dark' ? 'border-white/5' : 'border-slate-100'
                    }`}>
                        <p className="text-xs font-medium opacity-40">
                            Affichage de {logs.length} sur {total} entrées
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handlePageChange(filters.page - 1)}
                                disabled={filters.page === 1}
                                className={`p-2 rounded-xl border transition-all ${
                                    filters.page === 1 ? 'opacity-20 cursor-not-allowed' :
                                    theme === 'dark' ? 'hover:bg-white/10 border-white/10' : 'hover:bg-slate-50 border-slate-200'
                                }`}
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <div className="flex items-center gap-1">
                                {[...Array(totalPages)].map((_, i) => {
                                    const pageNum = i + 1;
                                    if (totalPages > 5) {
                                        if (pageNum !== 1 && pageNum !== totalPages && (pageNum < filters.page - 1 || pageNum > filters.page + 1)) {
                                            if (pageNum === filters.page - 2 || pageNum === filters.page + 2) return <span key={pageNum} className="px-1 opacity-20">...</span>;
                                            return null;
                                        }
                                    }
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => handlePageChange(pageNum)}
                                            className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${
                                                filters.page === pageNum
                                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                                                : theme === 'dark' ? 'hover:bg-white/10 text-white/40' : 'hover:bg-slate-100 text-slate-400'
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                onClick={() => handlePageChange(filters.page + 1)}
                                disabled={filters.page === totalPages}
                                className={`p-2 rounded-xl border transition-all ${
                                    filters.page === totalPages ? 'opacity-20 cursor-not-allowed' :
                                    theme === 'dark' ? 'hover:bg-white/10 border-white/10' : 'hover:bg-slate-50 border-slate-200'
                                }`}
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Summary Footer */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
                            <LogIn size={18} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Dernières Connexions</span>
                    </div>
                    <p className="text-2xl font-black">
                        {logs.filter(l => l.action.includes('login')).length}
                        <span className="text-sm font-bold opacity-30 ml-2">sessions</span>
                    </p>
                </div>

                <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <ArrowLeftRight size={18} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Avec modifications</span>
                    </div>
                    <p className="text-2xl font-black">
                        {logs.filter(l => l.ancienneValeur || l.nouvelleValeur).length}
                        <span className="text-sm font-bold opacity-30 ml-2">logs enrichis</span>
                    </p>
                </div>

                <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                            <Activity size={18} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Total activité</span>
                    </div>
                    <p className="text-2xl font-black">
                        {total}
                        <span className="text-sm font-bold opacity-30 ml-2">total logs</span>
                    </p>
                </div>
            </div>
        </div>
    );
}