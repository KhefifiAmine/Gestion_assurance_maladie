import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getAllBeneficiaries, deleteBeneficiary, updateStatus } from '../../services/beneficiaryService';
import ConfirmModal from '../../components/ConfirmModal';
import {
    Users, Trash2, CheckCircle, XCircle, Clock, FileText, Search, LayoutGrid, List, X, Download, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminBeneficiarie = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [beneficiaries, setBeneficiaries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'


    // Delete confirm
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [beneficiaryToDelete, setBeneficiaryToDelete] = useState(null);

    // Reject confirm
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [beneficiaryToReject, setBeneficiaryToReject] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

    const [previewDocument, setPreviewDocument] = useState(null);

    const fetchBeneficiaries = async () => {
        try {
            setLoading(true);
            const data = await getAllBeneficiaries();
            setBeneficiaries(data);
        } catch (error) {
            showToast("Erreur lors de la récupération des bénéficiaires", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBeneficiaries();
    }, []);


    const confirmDelete = async () => {
        if (!beneficiaryToDelete) return;
        try {
            await deleteBeneficiary(beneficiaryToDelete.id);
            showToast("Bénéficiaire supprimé", "success");
            setShowDeleteConfirm(false);
            setBeneficiaryToDelete(null);
            fetchBeneficiaries();
        } catch (error) {
            showToast("Erreur de suppression", "error");
        }
    };

    const handleStatusUpdate = async (id, newStatus, motifRefus = null) => {
        try {
            await updateStatus(id, newStatus, motifRefus);
            showToast(`Statut mis à jour : ${newStatus}`, "success");
            fetchBeneficiaries();
            if (newStatus === 'Rejeté') {
                setShowRejectModal(false);
                setBeneficiaryToReject(null);
                setRejectReason('');
            }
        } catch (error) {
            showToast("Erreur de mise à jour", "error");
        }
    };

    const filteredBeneficiaries = beneficiaries.filter(b => {
        const searchRegex = new RegExp(searchTerm, 'i');
        const adherentName = b.user ? `${b.user.prenom} ${b.user.nom}` : '';
        return searchRegex.test(b.nom) || searchRegex.test(b.prenom) || searchRegex.test(b.relation) || searchRegex.test(adherentName) || searchRegex.test(b.userId);
    });

    const getStatusColor = (statut) => {
        if (statut === 'Validé') return 'text-emerald-500 bg-emerald-50 border-emerald-200';
        if (statut === 'Rejeté') return 'text-red-500 bg-red-50 border-red-200';
        return 'text-amber-500 bg-amber-50 border-amber-200';
    };

    const getStatusIcon = (statut) => {
        if (statut === 'Validé') return <CheckCircle size={16} />;
        if (statut === 'Rejeté') return <XCircle size={16} />;
        return <Clock size={16} />;
    };

    return (
        <div className="p-6 lg:p-10 space-y-8 min-h-full bg-slate-50 dark:bg-slate-950">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">Gestion des Bénéficiaires</h1>
                    <div className="flex items-center gap-2">
                        <span className="w-8 h-1 rounded-full bg-purple-600"></span>
                        <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em]">Vue Administrateur</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-purple-600'}`}
                            title="Vue Grille"
                        >
                            <LayoutGrid size={20} />
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-2.5 rounded-xl transition-all ${viewMode === 'table' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-purple-600'}`}
                            title="Vue Tableau"
                        >
                            <List size={20} />
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Search and Filters */}
            <div className="p-4 rounded-[2rem] bg-white dark:bg-slate-900 shadow-sm border border-slate-100 flex items-center gap-4">
                <Search size={20} className="text-slate-400 ml-4" />
                <input
                    type="text"
                    placeholder="Recherche par bénéficiaire ou adhérent..."
                    className="flex-1 bg-transparent py-4 font-bold text-sm outline-none placeholder:text-slate-300"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Beneficiaries List */}
            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4 opacity-30">
                    <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="font-black text-2xl uppercase tracking-tighter text-slate-400 text-center">Chargement...</p>
                </div>
            ) : filteredBeneficiaries.length === 0 ? (
                <div className="py-20 text-center space-y-4 opacity-30">
                    <Users size={64} className="mx-auto text-slate-400" />
                    <p className="font-black text-2xl uppercase tracking-tighter text-slate-400">Aucun bénéficiaire trouvé</p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBeneficiaries.map((b, i) => (
                        <motion.div
                            key={b.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className="p-6 rounded-[2rem] bg-white dark:bg-slate-900 shadow-sm border border-slate-100 flex flex-col gap-4 relative overflow-hidden group hover:shadow-xl transition-all"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 rounded-full blur-3xl -mr-16 -mt-16" />

                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                                        <Users size={24} className="text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-lg tracking-tight text-slate-900 dark:text-white">{b.prenom} {b.nom}</h3>
                                        <p className="text-[10px] font-black tracking-widest uppercase opacity-50">{b.relation} • {b.sexe}</p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border flex items-center gap-1 ${getStatusColor(b.statut)}`}>
                                    {getStatusIcon(b.statut)} {b.statut}
                                </span>
                            </div>

                            <div className="space-y-1">
                                <p className="text-xs font-bold text-slate-500">Né(e) le : {b.ddn ? new Date(b.ddn).toLocaleDateString() : 'N/A'}</p>
                                <div className="border-t border-slate-100 pt-2 mt-2">
                                    <p className="text-[10px] font-black opacity-40 uppercase tracking-widest">Adhérent : {b.user ? `${b.user.prenom} ${b.user.nom}` : b.userId}</p>
                                    <p className="text-[10px] font-bold opacity-30">{b.user?.email || ''}</p>
                                </div>
                                {b.statut === 'Rejeté' && b.motifRefus && (
                                    <div className="p-3 mt-2 rounded-xl bg-red-50/50 border border-red-100">
                                        <p className="text-[10px] font-black text-red-600 mb-1 uppercase tracking-widest">Motif du refus</p>
                                        <p className="text-xs font-bold text-slate-700">{b.motifRefus}</p>
                                    </div>
                                )}
                            </div>

                            {b.document && (
                                <button onClick={() => setPreviewDocument(b.document)} className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-sm font-bold text-slate-600 transition-colors w-max">
                                    <Eye size={18} className="text-purple-600" />
                                    Voir justificatif
                                </button>
                            )}

                            <div className="flex gap-2 mt-auto pt-4 border-t border-slate-100">
                                {b.statut === 'En attente' && (
                                    <>
                                        <button onClick={() => handleStatusUpdate(b.id, 'Validé')} className="flex-1 py-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 font-black text-xs uppercase tracking-widest rounded-xl transition-all">Valider</button>
                                        <button onClick={() => { setBeneficiaryToReject(b); setShowRejectModal(true); }} className="flex-1 py-3 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-black text-xs uppercase tracking-widest rounded-xl transition-all">Rejeter</button>
                                    </>
                                )}
                                <button
                                    onClick={() => { setBeneficiaryToDelete(b); setShowDeleteConfirm(true); }}
                                    className="w-full py-3 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    <Trash2 size={16} /> Supprimer
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="overflow-hidden rounded-[2rem] bg-white dark:bg-slate-900 shadow-sm border border-slate-100">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Bénéficiaire</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Relation</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Adhérent</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Naissance</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Statut</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredBeneficiaries.map((b, i) => (
                                    <motion.tr
                                        key={b.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        className="hover:bg-slate-50/50 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                                                    <Users size={20} />
                                                </div>
                                                <span className="font-bold text-slate-900 dark:text-white uppercase">{b.prenom} {b.nom}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-black uppercase tracking-widest opacity-60 text-slate-600">{b.relation}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-700">{b.user ? `${b.user.prenom} ${b.user.nom}` : b.userId}</span>
                                                <span className="text-[10px] font-black opacity-30 uppercase">{b.user?.email || ''}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-slate-600">{b.ddn ? new Date(b.ddn).toLocaleDateString() : 'N/A'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border inline-flex items-center gap-1 ${getStatusColor(b.statut)}`}>
                                                {getStatusIcon(b.statut)} {b.statut}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {b.document && (
                                                    <button onClick={() => setPreviewDocument(b.document)} title="Voir document" className="p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-purple-600 hover:text-white transition-all">
                                                        <Eye size={18} />
                                                    </button>
                                                )}
                                                <button onClick={() => handleStatusUpdate(b.id, 'Validé')} title="Valider" className="p-2.5 rounded-xl bg-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all"><CheckCircle size={18} /></button>
                                                <button onClick={() => { setBeneficiaryToReject(b); setShowRejectModal(true); }} title="Refuser" className="p-2.5 rounded-xl bg-red-100 text-red-600 hover:bg-red-600 hover:text-white transition-all"><XCircle size={18} /></button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={confirmDelete}
                title="Supprimer bénéficiaire"
                message="Êtes-vous sûr de vouloir supprimer ce bénéficiaire ? Cette action est irréversible."
                confirmText="Oui, supprimer"
                type="danger"
            />

            {/* Reject Modal */}
            <AnimatePresence>
                {showRejectModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl">
                            <h2 className="text-2xl font-black mb-2 text-slate-900">Refuser la demande</h2>
                            <p className="text-xs font-bold text-slate-500 mb-6">Veuillez indiquer le motif du refus pour l'adhérent.</p>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black opacity-40 uppercase tracking-widest block">Motif du refus (*)</label>
                                <textarea
                                    className="w-full bg-slate-50 p-4 rounded-xl font-bold text-sm outline-none min-h-[100px] border border-transparent focus:border-red-400"
                                    placeholder="Ex: Document illisible, Lien de parenté non justifié..."
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                ></textarea>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-slate-100">
                                <button type="button" onClick={() => { setShowRejectModal(false); setRejectReason(''); setBeneficiaryToReject(null); }} className="px-6 py-3 font-black text-xs uppercase tracking-widest bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Annuler</button>
                                <button
                                    type="button"
                                    disabled={!rejectReason.trim()}
                                    onClick={() => handleStatusUpdate(beneficiaryToReject.id, 'Rejeté', rejectReason)}
                                    className="px-6 py-3 font-black text-xs uppercase tracking-widest bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors disabled:opacity-50"
                                >
                                    Confirmer le refus
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Document Viewer Slide-over */}
            <AnimatePresence>
                {previewDocument && (
                    <div className="fixed inset-0 z-[110] flex justify-end overflow-hidden">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setPreviewDocument(null)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="relative w-full md:w-[600px] h-full bg-white dark:bg-slate-900 shadow-2xl z-[110] border-l border-slate-100 dark:border-white/5 flex flex-col"
                        >
                            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-2xl bg-purple-100 dark:bg-purple-900/20 text-purple-600">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-lg text-slate-900 dark:text-white leading-none">Justificatif</h3>
                                        <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest text-slate-900 dark:text-white">Aperçu du document sécurisé</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <a
                                        href={`http://localhost:5000/${previewDocument}`}
                                        download
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-2 rounded-2xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 hover:bg-purple-600 hover:text-white transition-all font-black text-xs flex items-center gap-2"
                                    >
                                        <Download size={14} /> TÉLÉCHARGER
                                    </a>
                                    <button onClick={() => setPreviewDocument(null)} className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all">
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 bg-slate-100 dark:bg-[#0B1120] relative p-8 flex items-center justify-center overflow-auto pattern-grid">
                                {previewDocument.toLowerCase().endsWith('.pdf') ? (
                                    <iframe
                                        src={`http://localhost:5000/${previewDocument}`}
                                        className="w-full h-full rounded-2xl shadow-sm border border-slate-200 dark:border-white/5 bg-white"
                                        title="Document"
                                    />
                                ) : (
                                    <img
                                        src={`http://localhost:5000/${previewDocument}`}
                                        alt="Document Justificatif"
                                        className="max-w-full max-h-full object-contain rounded-2xl shadow-xl border border-slate-200 dark:border-white/5"
                                    />
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminBeneficiarie;
