import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getAllBeneficiaries, deleteBeneficiary, updateStatus } from '../../services/beneficiaryService';
import ConfirmModal from '../../components/ConfirmModal';
import BeneficiaryDetailsModal from '../../components/BeneficiaryDetailsModal';
import {
    Users, Trash2, CheckCircle, XCircle, Clock, FileText, Search, LayoutGrid, List, X, Download, Eye, Info, ExternalLink
} from 'lucide-react';
import UserDetailsModal from '../../components/UserDetailsModal';
import { motion, AnimatePresence } from 'framer-motion';

const AdminBeneficiarie = () => {

    const motifs = [
      "Document obligatoire manquant ou incomplet",
      "Pièce justificative non conforme ou illisible",
      "Informations incohérentes entre les documents fournis",
      "Document expiré ou non valide",
      "Justificatif de situation familiale manquant ou invalide",
      "Justificatif de scolarité ou dépendance non fourni ou non valide",
      "Attestation administrative manquante ou expirée",
      "Non-respect des conditions d’éligibilité du bénéficiaire",
      "Absence de preuve suffisante pour valider le statut du bénéficiaire"
    ];
    
    const { user } = useAuth();
    const { showToast } = useToast();
    const [beneficiaries, setBeneficiaries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Delete confirm
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [beneficiaryToDelete, setBeneficiaryToDelete] = useState(null);

    // Validate confirm
    const [showValidateConfirm, setShowValidateConfirm] = useState(false);
    const [beneficiaryToValidate, setBeneficiaryToValidate] = useState(null);

    // Reject confirm
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [beneficiaryToReject, setBeneficiaryToReject] = useState(null);
    const [selectedMotifRejet, setSelectedMotifRejet] = useState('');
    const [rejectReason, setRejectReason] = useState('');

    const [previewDocument, setPreviewDocument] = useState(null);
    const [viewingBeneficiary, setViewingBeneficiary] = useState(null);
    const [selectedUserForDetails, setSelectedUserForDetails] = useState(null);

    const calculateAge = (dateString) => {
        if (!dateString) return 0;
        const today = new Date();
        const birthDate = new Date(dateString);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

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

    const handleStatusUpdate = async (id, newStatus, objetRefus = null, motifRefus = null) => {
        try {
            await updateStatus(id, newStatus, objetRefus, motifRefus);
            showToast(`Statut mis à jour : ${newStatus}`, "success");
            fetchBeneficiaries();
            if (newStatus === 'Rejeté') {
                setShowRejectModal(false);
                setBeneficiaryToReject(null);
                setSelectedMotifRejet('');
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
            ) : (
                <div className="overflow-hidden rounded-[2rem] bg-white dark:bg-slate-900 shadow-sm border border-slate-100">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-900">Adhérent</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-900">Bénéficiaire</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-900">Sexe</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-900">Naissance</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-900">Relation</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-900">Statut</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-900">Objet &amp; Motif de Rejet</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-900 text-right">Actions</th>
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
                                            <div className="flex flex-col">
                                                <button 
                                                    onClick={() => b.user && setSelectedUserForDetails(b.user)}
                                                    className="text-sm font-bold text-slate-700 uppercase hover:text-purple-600 transition-colors text-left"
                                                >
                                                    {b.user ? `${b.user.prenom} ${b.user.nom}` : b.userId}
                                                </button>
                                                <div className="flex items-center gap-2">
                                                    <span 
                                                        onClick={() => b.user && setSelectedUserForDetails(b.user)}
                                                        className="text-[10px] font-black opacity-70 uppercase cursor-pointer hover:text-purple-600 transition-colors"
                                                    >
                                                        {b.user?.matricule}
                                                    </span>
                                                    <span className="text-[10px] opacity-30">|</span>
                                                    <span className="text-[10px] font-medium opacity-70">{b.user?.email || ''}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-slate-900 dark:text-white uppercase">{b.prenom} {b.nom}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-slate-600">{b.sexe === 'M' ? "Homme" : "Femme"}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-slate-600">{b.ddn ? new Date(b.ddn).toLocaleDateString() : 'N/A'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs font-black uppercase tracking-widest opacity-80 text-slate-900">{b.relation}</span>
                                                {b.relation === 'Enfant' && (
                                                    <div className="flex flex-wrap gap-1">
                                                        {b.handicape && <span className="px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-600 text-[8px] border border-purple-200">Handicapé</span>}
                                                        {b.etudiant && <span className="px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-600 text-[8px] border border-blue-200">Étudiant</span>}
                                                        {b.chomage && <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-600 text-[8px] border border-amber-200">Chômage</span>}
                                                        {b.celibataire && <span className="px-1.5 py-0.5 rounded-md bg-pink-100 text-pink-600 text-[8px] border border-pink-200">Célibataire</span>}
                                                    </div>
                                                )}
                                            </div>
                                        </td>


                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border inline-flex items-center gap-1 ${getStatusColor(b.statut)}`}>
                                                {getStatusIcon(b.statut)} {b.statut}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 max-w-[220px]">
                                            {b.objetRefus ? (
                                                <div className="flex flex-col gap-1.5">
                                                    {/* Objet du refus — badge rouge */}
                                                    <span className="inline-flex items-center gap-1.5 text-red-700 text-[10px] font-black uppercase tracking-wide leading-tight">
                                                        {b.objetRefus}
                                                    </span>
                                                    {/* Motif additionnel — description grise */}
                                                    {b.motifRefus && (
                                                        <span className="text-[12px] text-slate-900 font-medium leading-snug pl-1">
                                                            {b.motifRefus}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-slate-300 text-xs font-bold">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => setViewingBeneficiary(b)}
                                                    title="Détails"
                                                    className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all"
                                                >
                                                    <Info size={18} />
                                                </button>
                                                {b.statut === 'En attente' && (
                                                    <>
                                                        <button
                                                            onClick={() => { setBeneficiaryToValidate(b); setShowValidateConfirm(true); }}
                                                            title="Valider"
                                                            className="p-2.5 rounded-xl bg-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all"
                                                        >
                                                            <CheckCircle size={18} />
                                                        </button>
                                                        <button onClick={() => { setBeneficiaryToReject(b); setShowRejectModal(true); }} title="Refuser" className="p-2.5 rounded-xl bg-red-100 text-red-600 hover:bg-red-600 hover:text-white transition-all"><XCircle size={18} /></button>
                                                    </>
                                                )}
                                            </div>
                                        </td>

                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Validate Confirm Modal */}
            <ConfirmModal
                isOpen={showValidateConfirm}
                onClose={() => { setShowValidateConfirm(false); setBeneficiaryToValidate(null); }}
                onConfirm={() => {
                    if (beneficiaryToValidate) {
                        handleStatusUpdate(beneficiaryToValidate.id, 'Validé');
                        setShowValidateConfirm(false);
                        setBeneficiaryToValidate(null);
                    }
                }}
                title="Valider le bénéficiaire"
                message={beneficiaryToValidate
                    ? `Confirmez-vous la validation de ${beneficiaryToValidate.prenom} ${beneficiaryToValidate.nom} (${beneficiaryToValidate.relation}) ? Cette action autorisera la prise en charge de ce bénéficiaire.`
                    : ''}
                confirmText="Oui, valider"
                type="success"
            />

            {/* Delete Confirm Modal */}
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
            {showRejectModal && createPortal(
                <AnimatePresence>
                    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 max-w-md w-full shadow-2xl"
                            >
                                {/* Header */}
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                                        <XCircle size={20} className="text-red-500" />
                                    </div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white">Refuser la demande</h2>
                                </div>
                                <p className="text-xs font-bold text-slate-500 mb-6">
                                    Sélectionnez le motif du refus et ajoutez une description si nécessaire.
                                </p>

                                <div className="space-y-4">
                                    {/* Motif dropdown */}
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">
                                            Motif du refus *
                                        </label>
                                        <select
                                            value={selectedMotifRejet}
                                            onChange={(e) => setSelectedMotifRejet(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-red-400 transition-all"
                                        >
                                            <option value="">-- Sélectionner un motif --</option>
                                            {motifs.map((m, idx) => (
                                                <option key={idx} value={m}>{m}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Optional description */}
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">
                                            Description supplémentaire (optionnelle)
                                        </label>
                                        <textarea
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl font-bold text-sm outline-none min-h-[80px] focus:ring-2 focus:ring-red-400 transition-all resize-none dark:text-white"
                                            placeholder="Détails supplémentaires pour l'adhérent..."
                                            value={rejectReason}
                                            onChange={(e) => setRejectReason(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-5 mt-5 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => { setShowRejectModal(false); setSelectedMotifRejet(''); setRejectReason(''); setBeneficiaryToReject(null); }}
                                        className="px-6 py-3 font-black text-xs uppercase tracking-widest bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="button"
                                        disabled={!selectedMotifRejet}
                                        onClick={() => {
                                            handleStatusUpdate(
                                                beneficiaryToReject.id,
                                                'Rejeté',
                                                selectedMotifRejet || null,
                                                rejectReason.trim() || null
                                            );
                                        }}
                                        className="px-6 py-3 font-black text-xs uppercase tracking-widest bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors disabled:opacity-50"
                                    >
                                        Confirmer le refus
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </AnimatePresence>,
                document.body
            )}

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
                                    <button onClick={() => setPreviewDocument(null)} className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all">
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 bg-slate-100 dark:bg-[#0B1120] relative p-8 flex items-center justify-center overflow-auto pattern-grid">
                                {previewDocument.toLowerCase().endsWith('.pdf') ? (
                                    <iframe
                                        src={`http://localhost:5000/uploads/${previewDocument}`}
                                        className="w-full h-full rounded-2xl shadow-sm border border-slate-200 dark:border-white/5 bg-white"
                                        title="Document"
                                    />
                                ) : (
                                    <img
                                        src={`http://localhost:5000/uploads/${previewDocument}`}
                                        alt="Document Justificatif"
                                        className="max-w-full max-h-full object-contain rounded-2xl shadow-xl border border-slate-200 dark:border-white/5"
                                    />
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Beneficiary Details Modal */}
            <BeneficiaryDetailsModal
                isOpen={!!viewingBeneficiary}
                beneficiary={viewingBeneficiary}
                onClose={() => setViewingBeneficiary(null)}
                onViewAdherent={(u) => {
                    setViewingBeneficiary(null);
                    setTimeout(() => setSelectedUserForDetails(u), 300);
                }}
                calculateAge={calculateAge}
            />

            <UserDetailsModal
                isOpen={selectedUserForDetails !== null}
                onClose={() => setSelectedUserForDetails(null)}
                user={selectedUserForDetails}
            />

        </div>
    );
};

export default AdminBeneficiarie;
