import React, { useEffect, useState, useMemo } from 'react';
import {
    getAllUsers,
    updateUserStatus,
    updateUserRole
} from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import {
    Search,
    Filter,
    Plus,
    Edit,
    Trash2,
    ChevronLeft,
    ChevronRight,
    UserCheck,
    UserX,
    Clock,
    Users as UsersIcon,
    Shield,
    User,
    MoreVertical,
    Loader2,
    Mail,
    Smartphone,
    UserPlus
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/ConfirmModal';
import AddUserModal from '../../components/AddUserModal';

const AdminDashboard = ({ mode = 'adherents' }) => {
    const { user: currentUser } = useAuth();
    const { showToast } = useToast();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('Tous');
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

    const [modalConfig, setModalConfig] = useState({ isOpen: false, userId: null, type: 'role', requireReason: false, reasonLabel: '' });

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await getAllUsers();
            setUsers(data);
            setError('');
        } catch (err) {
            console.error("Erreur lors de la récupération des utilisateurs:", err);
            setError(err.message || 'Erreur lors du chargement des utilisateurs');
            showToast(err.message || "Erreur lors du chargement des utilisateurs", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleStatusChange = async (id, newStatus) => {
        // Direct changes without reason
        if (newStatus === 1) {
            try {
                await updateUserStatus(id, newStatus);
                showToast("Statut mis à jour avec succès", "success");
                fetchUsers();
            } catch (err) {
                showToast("Échec de la mise à jour du statut", "error");
            }
        }
        // Changes that require a reason
        else if (newStatus === 2) {
            setModalConfig({
                isOpen: true,
                userId: id,
                type: 'status',
                title: "Refuser l'utilisateur",
                message: "Veuillez indiquer la raison du refus qui sera envoyée par email.",
                newStatus: 2,
                requireReason: true,
                reasonLabel: "Motif du refus"
            });
        }
        else if (newStatus === 3) {
            setModalConfig({
                isOpen: true,
                userId: id,
                type: 'status',
                title: "Bloquer l'utilisateur",
                message: "Veuillez indiquer la raison du blocage (l'utilisateur recevra un e-mail et ne pourra plus se connecter).",
                newStatus: 3,
                requireReason: true,
                reasonLabel: "Motif du blocage"
            });
        }
    };

    const handleRoleChange = async (id, currentRole) => {
        let newRole;
        if (currentRole === 'ADHERENT') newRole = 'ADMIN';
        else if (currentRole === 'ADMIN') newRole = 'RESPONSABLE_RH';
        else newRole = 'ADHERENT';

        setModalConfig({
            isOpen: true,
            userId: id,
            type: 'role',
            title: "Modifier le rôle",
            message: `Voulez-vous vraiment changer le rôle de cet utilisateur en ${newRole} ?`,
            newRole: newRole
        });
    };


    const handleConfirmAction = async (reason) => {
        const { userId, type, newRole, newStatus } = modalConfig;
        setModalConfig(prev => ({ ...prev, isOpen: false }));

        try {
            if (type === 'role') {
                await updateUserRole(userId, newRole);
                showToast(`Rôle mis à jour : ${newRole}`, "info");
            } else if (type === 'status') {
                await updateUserStatus(userId, newStatus, reason);
                showToast("Statut mis à jour", "success");
            }
            fetchUsers();
        } catch (err) {
            showToast("L'action a échoué", "error");
        }
    };

    const stats = useMemo(() => {
        return {
            total: users.length,
            adherents: users.filter(u => u.role === 'ADHERENT').length,
            admins: users.filter(u => u.role === 'ADMIN').length,
            responsableRH: users.filter(u => u.role === 'RESPONSABLE_RH').length
        };
    }, [users]);

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            // Ne pas afficher l'utilisateur connecté
            if (user.id === currentUser?.id) return false;

            // Filtrer par rôle selon le mode

            const matchesSearch =
                user.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (user.matricule && user.matricule.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesStatus =
                activeFilter === 'Tous' ||
                (activeFilter === 'Actifs' && user.statut === 1) ||
                (activeFilter === 'En attente' && user.statut === 0) ||
                (activeFilter === 'Refusés' && user.statut === 2) ||
                (activeFilter === 'Bloqués' && user.statut === 3);

            return matchesSearch && matchesStatus;
        });
    }, [users, searchTerm, activeFilter, mode, currentUser]);

    const getInitials = (user) => {
        return `${user.nom.charAt(0)}${user.prenom.charAt(0)}`.toUpperCase();
    };

    const TableSkeleton = () => (
        <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
                        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="p-4 md:p-8 bg-slate-50 dark:bg-slate-950 min-h-screen font-sans transition-colors duration-300">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* HEADER */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20 text-white">
                            <UsersIcon size={28} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                                {mode === 'adherents' ? 'Gestion des Adhérents' : 'Gestion des Administrateurs'}
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight">
                                {mode === 'adherents'
                                    ? 'Consultez et gérez les dossiers des adhérents de la plateforme.'
                                    : 'Gérez les accès et les permissions du personnel administratif.'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* STATS CARDS */}
                <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${mode === 'adherents' ? '4' : '3'} gap-6`}>
                    {mode === 'adherents' && (
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between group hover:shadow-md transition-all">
                            <div>
                                <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Total Utilisateurs</p>
                                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{stats.total}</h3>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl text-blue-600 dark:text-blue-400">
                                <UsersIcon size={24} />
                            </div>
                        </div>
                    )}

                    {mode === 'adherents' && (
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between group hover:shadow-md transition-all">
                            <div>
                                <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Adhérents</p>
                                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{stats.adherents}</h3>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl text-green-600 dark:text-green-400">
                                <Shield size={24} />
                            </div>
                        </div>
                    )}

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between group hover:shadow-md transition-all">
                        <div>
                            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Administrateurs</p>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{stats.admins}</h3>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-2xl text-purple-600 dark:text-purple-400">
                            <Shield size={24} />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between group hover:shadow-md transition-all">
                        <div>
                            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Responsable RH</p>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{stats.responsableRH}</h3>
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl text-amber-600 dark:text-amber-400">
                            <Shield size={24} />
                        </div>
                    </div>
                </div>

                {/* SEARCH & FILTERS */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
                    <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
                        <div className="relative w-full lg:flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Rechercher par nom, email ou matricule..."
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-slate-700 transition-all text-slate-700 dark:text-slate-200 font-bold tracking-tight"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <button className="flex items-center gap-2 px-6 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all font-bold text-slate-600 dark:text-slate-300 text-sm">
                            <Filter size={18} />
                            <span>Filtres avancés</span>
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {['Tous', 'Actifs', 'En attente', 'Refusés', 'Bloqués'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveFilter(tab)}
                                className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${activeFilter === tab
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* TABLE */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors duration-300">
                    {loading ? (
                        <div className="p-8"><TableSkeleton /></div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left whitespace-nowrap">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                    <tr className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                        <th className="px-6 py-5">Matricule</th>
                                        <th className="px-6 py-5">Utilisateur</th>
                                        <th className="px-6 py-5">Email</th>
                                        <th className="px-6 py-5">Rôle</th>
                                        <th className="px-6 py-5">Statut</th>
                                        <th className="px-6 py-5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredUsers.length > 0 ? (
                                        filteredUsers.map((user) => (
                                            <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all group">
                                                <td className="px-6 py-5 font-mono text-xs font-bold text-slate-400 dark:text-slate-500 tracking-tighter">
                                                    #{user.matricule || 'N/A'}
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-blue-100 dark:shadow-none">
                                                            {getInitials(user)}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                                                                {user.nom} {user.prenom}
                                                            </span>
                                                            <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">
                                                                Admin Access: Granted
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-sm font-bold text-slate-500 dark:text-slate-400">
                                                    {user.email}
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span
                                                        
                                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all hover:scale-105 active:scale-95 ${user.role === 'RESPONSABLE_RH'
                                                                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-200 dark:shadow-none'
                                                                : user.role === 'ADMIN'
                                                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 dark:shadow-none'
                                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                                            }`}
                                                    >
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center">
                                                        {user.statut === 1 ? (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-100 dark:border-emerald-900/30">
                                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                                                                Actif
                                                            </span>
                                                        ) : user.statut === 2 ? (
                                                            <span title={user.motif_blocage || ''} className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-full text-[10px] font-black uppercase tracking-wider border border-red-100 dark:border-red-900/30 cursor-help">
                                                                <span className="h-1.5 w-1.5 rounded-full bg-red-600"></span>
                                                                Refusé
                                                            </span>
                                                        ) : user.statut === 3 ? (
                                                            <span title={user.motif_blocage || ''} className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-full text-[10px] font-black uppercase tracking-wider border border-orange-100 dark:border-orange-900/30 cursor-help">
                                                                <span className="h-1.5 w-1.5 rounded-full bg-orange-600"></span>
                                                                Bloqué
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-full text-[10px] font-black uppercase tracking-wider border border-amber-100 dark:border-amber-900/30">
                                                                <span className="h-1.5 w-1.5 rounded-full bg-amber-600"></span>
                                                                En attente
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                        {user.statut === 0 && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleStatusChange(user.id, 1)}
                                                                    title="Accepter"
                                                                    className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all"
                                                                >
                                                                    <UserCheck size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleStatusChange(user.id, 2)}
                                                                    title="Refuser"
                                                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                                                >
                                                                    <UserX size={16} />
                                                                </button>
                                                            </>
                                                        )}
                                                        {user.statut === 1 && (
                                                            <button
                                                                onClick={() => handleStatusChange(user.id, 3)}
                                                                title="Bloquer / Désactiver"
                                                                className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-xl transition-all"
                                                            >
                                                                <UserX size={16} />
                                                            </button>
                                                        )}
                                                        {(user.statut === 2 || user.statut === 3) && (
                                                            <button
                                                                onClick={() => handleStatusChange(user.id, 1)}
                                                                title="Activer / Réapprouver"
                                                                className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all"
                                                            >
                                                                <UserCheck size={16} />
                                                            </button>
                                                        )}
                                                        <button
                                                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-white dark:hover:bg-slate-700 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 transition-all font-bold text-xs"
                                                            onClick={() => handleRoleChange(user.id, user.role)}
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                    </div>
                                                </td>

                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="p-20 text-center text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest text-xs">
                                                Aucun utilisateur trouvé.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Confirmation pour les actions Admin */}
            <ConfirmModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={handleConfirmAction}
                title={modalConfig.title}
                message={modalConfig.message}
                type='warning'
                confirmText="Changer"
                cancelText="Annuler"
                requireReason={modalConfig.requireReason}
                reasonLabel={modalConfig.reasonLabel}
            />

        </div>
    );
};

export default AdminDashboard;
