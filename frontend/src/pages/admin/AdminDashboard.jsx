import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    getAllUsers,
    updateUserStatus,
    updateUserRole,
    createUser
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

const AdminDashboard = ({ mode = 'all' }) => {
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

    const handleAddUser = async (userData) => {
        try {
            await createUser(userData);
            showToast("Utilisateur créé avec succès", "success");
            fetchUsers();
        } catch (err) {
            showToast(err.message || "Erreur lors de la création de l'utilisateur", "error");
            throw err; // Re-throw to let modal know it failed
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
        if (!users || !Array.isArray(users)) return [];

        return users.filter(user => {
            // On ne cache plus l'utilisateur pour le moment pour être sûr de voir au moins soi-même
            // if (user.id == currentUser?.id) return false;

            // Filtrer par rôle selon le mode
            let matchesMode = true;
            const userRole = (user.role || "").toUpperCase();

            if (mode === 'adherents') {
                matchesMode = (userRole === 'ADHERENT');
            } else if (mode === 'admins') {
                matchesMode = (userRole === 'ADMIN' || userRole === 'RESPONSABLE_RH');
            }

            if (!matchesMode) return false;

            // Protection contre les champs null/undefined
            const nom = (user.nom || "").toLowerCase();
            const prenom = (user.prenom || "").toLowerCase();
            const email = (user.email || "").toLowerCase();
            const matricule = (user.matricule || "").toLowerCase();
            const search = (searchTerm || "").toLowerCase();

            const matchesSearch = 
                nom.includes(search) || 
                prenom.includes(search) || 
                email.includes(search) || 
                matricule.includes(search);

            const matchesStatus =
                activeFilter === 'Tous' ||
                (activeFilter === 'Actifs' && user.statut === 1) ||
                (activeFilter === 'En attente' && user.statut === 0) ||
                (activeFilter === 'Refusés' && user.statut === 2) ||
                (activeFilter === 'Bloqués' && user.statut === 3);

            return matchesSearch && matchesStatus;
        });
    }, [users, searchTerm, activeFilter, mode]);

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
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="p-4 md:p-8 bg-slate-50 dark:bg-slate-950 min-h-screen font-sans transition-colors duration-300"
        >
            <div className="max-w-7xl mx-auto space-y-8">
                {/* HEADER */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-600 rounded-2xl shadow-lg shadow-purple-500/20 text-white">
                            <UsersIcon size={28} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                                {mode === 'adherents' ? 'Gestion des Adhérents' : mode === 'admins' ? 'Gestion des Administrateurs' : 'Vue d\'ensemble — Tous les Utilisateurs'}
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight">
                                {mode === 'adherents'
                                    ? 'Consultez et gérez les dossiers des adhérents de la plateforme.'
                                    : mode === 'admins'
                                    ? 'Gérez les accès et les permissions du personnel administratif.'
                                    : 'Aperçu global de tous les comptes enregistrés sur la plateforme.'}
                            </p>
                        </div>
                    </div>

                    {/* Button Ajouter Utilisateur - Visible seulement pour RH */}
                    {currentUser?.role === 'RESPONSABLE_RH' && (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setIsAddUserModalOpen(true)}
                            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3.5 rounded-2xl font-black shadow-lg shadow-purple-500/30 transition-all text-xs uppercase tracking-widest"
                        >
                            <UserPlus size={18} />
                            <span>Ajouter un utilisateur</span>
                        </motion.button>
                    )}
                </div>

                {/* STATS CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {(mode === 'all' || mode === 'adherents') && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between group hover:shadow-xl transition-all duration-500"
                        >
                            <div>
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1">Total Utilisateurs</p>
                                <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{stats.total}</h3>
                            </div>
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-5 rounded-2xl text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                                <UsersIcon size={28} />
                            </div>
                        </motion.div>
                    )}

                    {(mode === 'all' || mode === 'adherents') && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between group hover:shadow-xl transition-all duration-500"
                        >
                            <div>
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1">Adhérents</p>
                                <h3 className="text-4xl font-black text-emerald-500 tracking-tighter">{stats.adherents}</h3>
                            </div>
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-5 rounded-2xl text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                                <Shield size={28} />
                            </div>
                        </motion.div>
                    )}

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between group hover:shadow-xl transition-all duration-500"
                    >
                        <div>
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1">Administrateurs</p>
                            <h3 className="text-4xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">{stats.admins}</h3>
                        </div>
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-2xl text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                            <Shield size={28} />
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between group hover:shadow-xl transition-all duration-500"
                    >
                        <div>
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1">Responsable RH</p>
                            <h3 className="text-4xl font-black text-amber-500 tracking-tighter">{stats.responsableRH}</h3>
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-900/20 p-5 rounded-2xl text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                            <Shield size={28} />
                        </div>
                    </motion.div>
                </div>

                {/* SEARCH & FILTERS */}
                <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-white/5 flex flex-col lg:flex-row gap-6 items-center"
                >
                    <div className="relative flex-1 group w-full">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-purple-600 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Rechercher par nom, email ou matricule..."
                            className="w-full pl-16 pr-6 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all font-bold tracking-tight text-slate-700 dark:text-slate-200"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <div className="flex-1 lg:flex-none flex flex-wrap gap-2">
                            {['Tous', 'Actifs', 'En attente', 'Bloqués'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveFilter(tab)}
                                    className={`px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === tab
                                        ? 'bg-purple-600 text-white shadow-xl shadow-purple-500/25'
                                        : 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* TABLE CONTAINER - Fixed size to avoid inner scrolling if requested, but usually "no scrollbar" means letting the page handle it */}
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-visible transition-colors duration-300">
                    {loading ? (
                        <div className="p-8"><TableSkeleton /></div>
                    ) : (
                        <div className="w-full overflow-x-auto lg:overflow-visible">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                    <tr className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                        <th className="px-6 py-5">Matricule</th>
                                        <th className="px-6 py-5">Utilisateur</th>
                                        <th className="px-6 py-5 hidden md:table-cell">Email</th>
                                        <th className="px-6 py-5">Rôle</th>
                                        <th className="px-6 py-5">Statut</th>
                                        <th className="px-6 py-5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredUsers.length > 0 ? (
                                        filteredUsers.map((user, idx) => (
                                            <motion.tr 
                                                key={user.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.1 + (idx * 0.05) }}
                                                className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-all duration-300 group"
                                            >
                                                <td className="px-6 py-6 font-black text-slate-400 dark:text-slate-600 tracking-tighter text-xs">
                                                    #{user.matricule || 'N/A'}
                                                </td>
                                                <td className="px-6 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 p-0.5 shadow-lg shadow-purple-100 dark:shadow-none">
                                                            <div className="w-full h-full rounded-[0.9rem] bg-white dark:bg-slate-900 flex items-center justify-center text-purple-600 font-black text-[10px]">
                                                                {getInitials(user)}
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="font-black text-slate-900 dark:text-white tracking-tight text-sm truncate">
                                                                {user.nom} {user.prenom}
                                                            </span>
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate max-w-[150px]">
                                                                Inscrit le: {user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'Date inconnue'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 text-xs font-bold text-slate-500 dark:text-slate-400 hidden md:table-cell">
                                                    {user.email}
                                                </td>
                                                <td className="px-6 py-6">
                                                    <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${user.role === 'RESPONSABLE_RH'
                                                            ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/30 text-amber-600 dark:text-amber-400'
                                                            : user.role === 'ADMIN'
                                                                ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800/30 text-purple-600 dark:text-purple-400'
                                                                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800/30 text-slate-500 dark:text-slate-400'
                                                            }`}
                                                    >
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                                                        user.statut === 1 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/30' :
                                                        user.statut === 2 ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800/30' :
                                                        user.statut === 3 ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-800/30' :
                                                        'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800/30'
                                                    }`}>
                                                        <span className={`h-1 w-1 rounded-full ${user.statut === 1 ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_emerald]' : 'bg-current'}`} />
                                                        {user.statut === 1 ? 'Actif' : user.statut === 2 ? 'Refusé' : user.statut === 3 ? 'Bloqué' : 'En attente'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 text-right">
                                                    {/* BOUTONS TOUJOURS VISIBLES DIRECTEMENT SANS SURVOL */}
                                                    <div className="flex items-center justify-end gap-2">
                                                        {currentUser?.role === 'RESPONSABLE_RH' && user.id !== currentUser.id && (
                                                            <>
                                                                {user.statut === 0 && (
                                                                    <>
                                                                        <button
                                                                            onClick={() => handleStatusChange(user.id, 1)}
                                                                            className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                                                            title="Approuver"
                                                                        >
                                                                            <UserCheck size={14} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleStatusChange(user.id, 2)}
                                                                            className="p-2.5 bg-red-50 dark:bg-red-900/30 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                                                            title="Refuser"
                                                                        >
                                                                            <UserX size={14} />
                                                                        </button>
                                                                    </>
                                                                )}
                                                                {user.statut === 1 && (
                                                                    <button
                                                                        onClick={() => handleStatusChange(user.id, 3)}
                                                                        className="p-2.5 bg-orange-50 dark:bg-orange-900/30 text-orange-600 rounded-xl hover:bg-orange-600 hover:text-white transition-all shadow-sm"
                                                                        title="Bloquer"
                                                                    >
                                                                        <UserX size={14} />
                                                                    </button>
                                                                )}
                                                                <div className="w-px h-6 bg-slate-100 dark:bg-slate-800" />
                                                                <button
                                                                    className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-purple-600 hover:text-white transition-all shadow-sm"
                                                                    onClick={() => handleRoleChange(user.id, user.role)}
                                                                    title="Changer rôle"
                                                                >
                                                                    <Edit size={14} />
                                                                </button>
                                                            </>
                                                        )}
                                                        {/* Simple visual indicator for self */}
                                                        {user.id === currentUser?.id && (
                                                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest px-3 py-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg italic">Vous</span>
                                                        )}
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="py-24 text-center">
                                                <div className="flex flex-col items-center gap-3 opacity-20">
                                                    <UsersIcon size={40} />
                                                    <p className="font-black text-[10px] uppercase tracking-[0.3em]">Aucun utilisateur trouvé</p>
                                                </div>
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

            {/* Modal d'Ajout d'Utilisateur */}
            <AddUserModal
                isOpen={isAddUserModalOpen}
                onClose={() => setIsAddUserModalOpen(false)}
                onSubmit={handleAddUser}
            />

        </motion.div>
    );
};

export default AdminDashboard;
