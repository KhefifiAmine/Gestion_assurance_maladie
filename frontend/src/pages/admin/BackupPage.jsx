import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DatabaseBackup,
    Download,
    Trash2,
    RefreshCw,
    Plus,
    ShieldAlert,
    HardDrive,
    Clock,
    CheckCircle2,
    AlertCircle,
    FileCode2,
    Loader2,
    Calendar,
    Server,
    Lock
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { triggerBackup, fetchBackups, downloadBackup, deleteBackup } from '../../services/backupService';
import ConfirmModal from '../../components/ConfirmModal';

const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(new Date(dateStr));
};

const formatSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / 1024 / 1024).toFixed(2)} Mo`;
};

const extractTimestampLabel = (filename) => {
    // backup-assurance_db-2026-05-25_14-25-26.sql
    const match = filename.match(/(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2}-\d{2})/);
    if (!match) return filename;
    const date = match[1];
    const time = match[2].replace(/-/g, ':');
    return `${date} à ${time}`;
};

export default function BackupPage() {
    const { theme } = useTheme();
    const { showToast } = useToast();
    const dark = theme === 'dark';

    const [backups, setBackups] = useState([]);
    const [scheduleTime, setScheduleTime] = useState('02:00'); // valeur par défaut
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [downloadingFile, setDownloadingFile] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const loadBackups = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetchBackups();
            setBackups(res.data || []);
            // Lire l'heure réelle depuis l'API (plus de valeur hardcodée)
            if (res.scheduleTime) setScheduleTime(res.scheduleTime);
        } catch (err) {
            showToast('Erreur lors du chargement des sauvegardes.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        loadBackups();
    }, [loadBackups]);

    const handleCreate = async () => {
        setCreating(true);
        try {
            const res = await triggerBackup();
            showToast(`Sauvegarde "${res.data?.filename}" créée avec succès !`, 'success');
            await loadBackups();
        } catch (err) {
            showToast(err.message || 'Échec de la création de la sauvegarde.', 'error');
        } finally {
            setCreating(false);
        }
    };

    const handleDownload = async (filename) => {
        setDownloadingFile(filename);
        try {
            await downloadBackup(filename);
            showToast(`Téléchargement de "${filename}" réussi.`, 'success');
        } catch (err) {
            showToast('Erreur lors du téléchargement.', 'error');
        } finally {
            setDownloadingFile(null);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await deleteBackup(deleteTarget);
            showToast('Sauvegarde supprimée avec succès.', 'success');
            setDeleteTarget(null);
            await loadBackups();
        } catch (err) {
            showToast(err.message || 'Erreur lors de la suppression.', 'error');
        } finally {
            setDeleting(false);
        }
    };

    const totalSize = backups.reduce((acc, b) => acc + (b.sizeBytes || 0), 0);
    const latestBackup = backups[0];

    return (
        <div className={`min-h-screen p-4 lg:p-8 ${dark ? 'text-white' : 'text-slate-800'}`}>

            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight uppercase flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/30">
                            <HardDrive className="text-white" size={28} />
                        </div>
                        Gestion des Sauvegardes
                    </h1>
                    <p className={`mt-2 text-sm font-medium ${dark ? 'opacity-50' : 'text-slate-500'}`}>
                        Sauvegarde et restauration de la base de données — Accès réservé Super Admin
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={loadBackups}
                        disabled={loading}
                        className={`p-2.5 rounded-xl border transition-all ${loading ? 'animate-spin opacity-50' : ''} ${dark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-200 hover:border-emerald-300 text-slate-600'}`}
                        title="Actualiser"
                    >
                        <RefreshCw size={18} />
                    </button>
                    <button
                        id="backup-create-btn"
                        onClick={handleCreate}
                        disabled={creating}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {creating ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                        {creating ? 'Création en cours...' : 'Nouvelle Sauvegarde'}
                    </button>
                </div>
            </div>

            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                    {
                        label: 'Sauvegardes Totales',
                        value: backups.length,
                        unit: 'fichiers',
                        icon: FileCode2,
                        color: 'from-blue-500 to-indigo-600',
                        shadow: 'shadow-blue-500/20'
                    },
                    {
                        label: 'Espace Utilisé',
                        value: formatSize(totalSize),
                        unit: 'sur disque',
                        icon: HardDrive,
                        color: 'from-amber-500 to-orange-600',
                        shadow: 'shadow-amber-500/20'
                    },
                    {
                        label: 'Dernière Sauvegarde',
                        value: latestBackup ? extractTimestampLabel(latestBackup.filename) : 'Aucune',
                        unit: 'automatique / manuelle',
                        icon: Clock,
                        color: 'from-emerald-500 to-teal-600',
                        shadow: 'shadow-emerald-500/20'
                    },
                    {
                        label: 'Prochain Backup Auto',
                        value: scheduleTime,
                        unit: 'chaque nuit',
                        icon: Calendar,
                        color: 'from-purple-500 to-violet-600',
                        shadow: 'shadow-purple-500/20'
                    }
                ].map((card, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                        className={`p-5 rounded-2xl border ${dark ? 'bg-slate-900/60 border-white/5' : 'bg-white border-slate-200 shadow-xl ' + card.shadow}`}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${dark ? 'opacity-50' : 'text-slate-400'}`}>
                                {card.label}
                            </span>
                            <div className={`p-1.5 rounded-lg bg-gradient-to-br ${card.color}`}>
                                <card.icon size={14} className="text-white" />
                            </div>
                        </div>
                        <p className="text-xl font-black truncate">{card.value}</p>
                        <p className={`text-[10px] font-bold mt-1 ${dark ? 'opacity-30' : 'text-slate-400'}`}>{card.unit}</p>
                    </motion.div>
                ))}
            </div>

            {/* ── Security Banner ── */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-6 flex items-center gap-4 p-4 rounded-2xl border ${dark ? 'bg-amber-900/20 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-700'}`}
            >
                <div className={`p-2 rounded-xl ${dark ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
                    <Lock size={18} />
                </div>
                <div>
                    <p className="text-xs font-black uppercase tracking-wider">Zone Sécurisée — Super Administrateur</p>
                    <p className={`text-[11px] font-medium mt-0.5 ${dark ? 'opacity-70' : 'opacity-80'}`}>
                        Les sauvegardes contiennent l'intégralité des données. Conservez-les dans un emplacement sécurisé et chiffré.
                    </p>
                </div>
            </motion.div>

            {/* ── Backups Table ── */}
            <div className={`rounded-2xl border overflow-hidden ${dark ? 'bg-slate-900/50 border-white/5' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'}`}>

                {/* Table Header */}
                <div className={`px-6 py-4 border-b flex items-center justify-between ${dark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex items-center gap-2">
                        <Server size={16} className={dark ? 'text-white/40' : 'text-slate-400'} />
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${dark ? 'opacity-50' : 'text-slate-400'}`}>
                            Historique des sauvegardes
                        </span>
                    </div>
                    {backups.length > 0 && (
                        <span className={`text-[10px] font-black px-2 py-1 rounded-full ${dark ? 'bg-white/10 text-white/50' : 'bg-slate-100 text-slate-400'}`}>
                            {backups.length} fichier{backups.length > 1 ? 's' : ''}
                        </span>
                    )}
                </div>

                {/* State: Loading */}
                {loading && backups.length === 0 ? (
                    <div className="py-24 flex flex-col items-center justify-center space-y-4">
                        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        <p className={`text-sm font-black uppercase tracking-widest ${dark ? 'opacity-40' : 'text-slate-400'}`}>
                            Chargement des sauvegardes...
                        </p>
                    </div>

                ) : backups.length === 0 ? (
                    <div className="py-24 text-center">
                        <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center mb-4 ${dark ? 'bg-white/5' : 'bg-slate-50'}`}>
                            <HardDrive size={40} className={dark ? 'opacity-20' : 'text-slate-300'} />
                        </div>
                        <h3 className={`text-lg font-black uppercase ${dark ? 'opacity-30' : 'text-slate-400'}`}>Aucune sauvegarde trouvée</h3>
                        <p className={`text-sm mt-2 ${dark ? 'opacity-20' : 'text-slate-400'}`}>
                            Cliquez sur "Nouvelle Sauvegarde" pour créer votre premier backup.
                        </p>
                        <button
                            onClick={handleCreate}
                            disabled={creating}
                            className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/30 active:scale-95"
                        >
                            {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                            Créer maintenant
                        </button>
                    </div>

                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className={`border-b ${dark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                                    {['Fichier', 'Taille', 'Date de création', 'Méthode', 'Actions'].map(h => (
                                        <th key={h} className={`px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] ${dark ? 'opacity-40' : 'text-slate-400'}`}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence>
                                    {backups.map((backup, i) => {
                                        const isLatest = i === 0;
                                        const isDownloading = downloadingFile === backup.filename;

                                        return (
                                            <motion.tr
                                                key={backup.filename}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 10 }}
                                                transition={{ delay: i * 0.04 }}
                                                className={`group border-b last:border-0 transition-colors ${dark ? 'hover:bg-white/5 border-white/5' : 'hover:bg-slate-50/80 border-slate-100'}`}
                                            >
                                                {/* Filename */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-xl ${dark ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
                                                            <FileCode2 size={16} className="text-emerald-500" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-black font-mono truncate max-w-[260px]">
                                                                {backup.filename}
                                                            </p>
                                                            {isLatest && (
                                                                <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-black uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                                                    <CheckCircle2 size={9} /> Dernière
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Size */}
                                                <td className="px-6 py-4">
                                                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${dark ? 'bg-white/5 text-white/60' : 'bg-slate-100 text-slate-500'}`}>
                                                        {formatSize(backup.sizeBytes)}
                                                    </span>
                                                </td>

                                                {/* Date */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Clock size={13} className={dark ? 'opacity-30' : 'text-slate-300'} />
                                                        <span className={`text-xs font-medium ${dark ? 'opacity-60' : 'text-slate-500'}`}>
                                                            {formatDate(backup.createdAt)}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Method */}
                                                <td className="px-6 py-4">
                                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${dark ? 'bg-teal-500/10 text-teal-400' : 'bg-teal-50 text-teal-600'}`}>
                                                        SQL
                                                    </span>
                                                </td>

                                                {/* Actions */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            id={`backup-download-${backup.filename}`}
                                                            onClick={() => handleDownload(backup.filename)}
                                                            disabled={isDownloading}
                                                            title="Télécharger"
                                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${dark ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                                        >
                                                            {isDownloading
                                                                ? <Loader2 size={12} className="animate-spin" />
                                                                : <Download size={12} />}
                                                            {isDownloading ? '...' : 'Télécharger'}
                                                        </button>
                                                        <button
                                                            id={`backup-delete-${backup.filename}`}
                                                            onClick={() => setDeleteTarget(backup.filename)}
                                                            title="Supprimer"
                                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${dark ? 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white' : 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white'}`}
                                                        >
                                                            <Trash2 size={12} />
                                                            Supprimer
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Footer */}
                {backups.length > 0 && (
                    <div className={`px-6 py-3 border-t flex items-center justify-between ${dark ? 'border-white/5 bg-white/5' : 'border-slate-100 bg-slate-50'}`}>
                        <p className={`text-[10px] font-bold ${dark ? 'opacity-30' : 'text-slate-400'}`}>
                            Espace total utilisé : {formatSize(totalSize)}
                        </p>
                        <div className={`flex items-center gap-1.5 text-[10px] font-black ${dark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                            <ShieldAlert size={12} />
                            Backup automatique quotidien à {scheduleTime}
                        </div>
                    </div>
                )}
            </div>

            {/* ── How it Works Info ── */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    {
                        icon: Server,
                        color: 'from-blue-500 to-indigo-600',
                        title: 'Moteur hybride',
                        desc: 'Tente d\'abord un mysqldump natif. Si indisponible, bascule automatiquement sur un exporteur SQL pur JavaScript.'
                    },
                    {
                        icon: Clock,
                        color: 'from-purple-500 to-violet-600',
                        title: 'Planification automatique',
                        desc: `Un backup complet est déclenché automatiquement chaque nuit à ${scheduleTime} sans intervention manuelle.`
                    },
                    {
                        icon: CheckCircle2,
                        color: 'from-emerald-500 to-teal-600',
                        title: 'Format SQL standard',
                        desc: 'Chaque backup produit un fichier .sql compatible MySQL / MariaDB, restaurable en une seule commande.'
                    }
                ].map((card, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.07 }}
                        className={`p-5 rounded-2xl border ${dark ? 'bg-slate-900/50 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}
                    >
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3 shadow-lg`}>
                            <card.icon size={18} className="text-white" />
                        </div>
                        <p className="text-sm font-black mb-1">{card.title}</p>
                        <p className={`text-xs leading-relaxed ${dark ? 'opacity-40' : 'text-slate-400'}`}>{card.desc}</p>
                    </motion.div>
                ))}
            </div>

            {/* ── Delete Confirm Modal ── */}
            <ConfirmModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDeleteConfirm}
                title="Supprimer cette sauvegarde ?"
                message={`Le fichier "${deleteTarget}" sera définitivement supprimé du serveur. Cette action est irréversible.`}
                confirmText={deleting ? 'Suppression...' : 'Supprimer'}
                cancelText="Annuler"
                type="danger"
            />
        </div>
    );
}
