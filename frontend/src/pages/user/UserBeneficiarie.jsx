import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { getMyBeneficiaries, addBeneficiary, deleteBeneficiary, updateBeneficiary } from '../../services/beneficiaryService';
import ConfirmModal from '../../components/ConfirmModal';
import BeneficiaryDetailsModal from '../../components/BeneficiaryDetailsModal';
import AddBeneficiaryModal from '../../components/AddBeneficiaryModal';
import {
    FileText, X, Eye, PlusCircle, Edit2, ChevronDown, Check, UploadCloud, CheckCircle, Loader2, CheckCircle2, Clock,
    User, Heart, Calendar, Info, ShieldCheck, Camera, Sparkles, UserPlus, XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const UserBeneficiarie = () => {
    const { showToast } = useToast();
    const { user: currentUser } = useAuth();
    const [listBeneficiaires, setListBeneficiaires] = useState([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [editingBeneficiaryId, setEditingBeneficiaryId] = useState(null);
    const [viewingBeneficiary, setViewingBeneficiary] = useState(null);
    const INITIAL_BENEFICIARY_STATE = {
        nom: '',
        prenom: '',
        relation: 'Enfant',
        ddn: '',
        sexe: 'M',
        handicape: false,
        etudiant: false,
        chomage: false,
        celibataire: false
    };
    const [avezConjoint, setAvezConjoint] = useState(false);
    const [newBeneficiary, setNewBeneficiary] = useState(INITIAL_BENEFICIARY_STATE);
    const [isRelationDropdownOpen, setIsRelationDropdownOpen] = useState(false);
    const [isRulesOpen, setIsRulesOpen] = useState(false);
    const [documentFile, setDocumentFile] = useState(null);
    const [previewDocument, setPreviewDocument] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [documentPreviewUrl, setDocumentPreviewUrl] = useState(null);

    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchBeneficiaries();
    }, []);

    useEffect(() => {
        if (documentFile) {
            const url = URL.createObjectURL(documentFile);
            setDocumentPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        } else if (editingBeneficiaryId) {
            const b = listBeneficiaires.find(x => x.id === editingBeneficiaryId);
            if (b && b.document) {
                setDocumentPreviewUrl(`http://localhost:5000/uploads/${b.document}`);
            } else {
                setDocumentPreviewUrl(null);
            }
        } else {
            setDocumentPreviewUrl(null);
        }
    }, [documentFile, editingBeneficiaryId, listBeneficiaires]);

    const fetchBeneficiaries = async () => {
        setIsLoading(true);
        try {
            const fetchedBeneficiaries = await getMyBeneficiaries();

            setAvezConjoint(fetchedBeneficiaries.some(
                (beneficiary) => beneficiary.relation === 'Conjoint'
            ));

            const beneficiariesWithStyle = fetchedBeneficiaries.map(b => ({
                ...b,
                initials: (b.nom[0] + (b.prenom ? b.prenom[0] : '')).toUpperCase(),
                bg: ['#EC4899', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'][Math.floor(Math.random() * 5)]
            }));

            setListBeneficiaires(beneficiariesWithStyle);
        } catch (error) {
            console.error("Erreur stats:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddBeneficiary = async () => {
        if (!newBeneficiary.nom || !newBeneficiary.prenom || !newBeneficiary.ddn || (!documentFile && !editingBeneficiaryId)) {
            showToast("Veuillez remplir tous les champs obligatoires et joindre un document", "error");
            return;
        }
        setIsSaving(true);
        if (!editingBeneficiaryId && avezConjoint && newBeneficiary.relation === "Conjoint") {
            showToast("Vous avez deja un conjoint dans les beneficiares", "error");
            return;
        }
        try {
            const formData = new FormData();
            Object.keys(newBeneficiary).forEach(key => {
                if (newBeneficiary[key] !== null && newBeneficiary[key] !== undefined) {
                    formData.append(key, newBeneficiary[key])
                }
            });

            if (documentFile) {
                formData.append('document', documentFile);
            }

            if (editingBeneficiaryId) {
                formData.append('id', editingBeneficiaryId);
                await updateBeneficiary(editingBeneficiaryId, formData);
                showToast("Bénéficiaire mis à jour avec succès", "success");
            } else {
                await addBeneficiary(formData);
                showToast("Bénéficiaire ajouté avec succès (En attente de validation)", "success");
            }
            await fetchBeneficiaries();

            setNewBeneficiary(INITIAL_BENEFICIARY_STATE);
            setDocumentFile(null);
            setEditingBeneficiaryId(null);
            setIsAddModalOpen(false);
        } catch (e) {
            showToast(e.message || "Erreur lors de l'enregistrement", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteBenef = async () => {
        setIsDeleting(true);
        try {
            await deleteBeneficiary(deleteId);
            setDeleteId(null);
            showToast("Bénéficiaire supprimé avec succès", "success");
            await fetchBeneficiaries();
        } catch (e) {
            showToast(e.message || "Erreur lors de la suppression", "error");
        } finally {
            setIsDeleting(false);
        }
    };


    const calculateAge = (birthDate) => {
        if (!birthDate) return 0;
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-purple-600 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm">
                <Loader2 className="w-12 h-12 animate-spin mb-4" />
                <p className="font-black uppercase tracking-widest text-xs">Chargement de vos bénéficiaires...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* View Toggle and Controls */}
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Mes Bénéficiaires</h3>
                    <p className="text-[10px] font-black opacity-80 uppercase tracking-[0.2em]">Visualisez et gérez les membres de votre famille</p>
                </div>
            </div>


            <div className="p-4 flex justify-start">
                <button
                    onClick={() => {
                        setEditingBeneficiaryId(null);
                        setNewBeneficiary(INITIAL_BENEFICIARY_STATE);
                        setDocumentFile(null);
                        setIsAddModalOpen(true);
                    }}
                    className="px-6 py-3 rounded-2xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 hover:bg-purple-600 hover:text-white font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2"
                >
                    <PlusCircle size={16} /> NOUVEAU BÉNÉFICIAIRE
                </button>
            </div>
            <div className="p-4 rounded-[32px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 shadow-sm">

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-50 dark:border-slate-800">
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-black-400">Bénéficiaire</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-black-400">Sexe</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-black-400">Date de Naissance</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-black-400">Relation</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-black-400">Status</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-black-400">Motif de Rejet</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-black-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {listBeneficiaires.map((b, i) => (
                                <motion.tr
                                    key={b.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                    className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm" style={{ backgroundColor: b.bg }}>
                                                {b.initials}
                                            </div>
                                            <span className="font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-tight">{b.nom} {b.prenom}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 px-6 text-xs font-black uppercase tracking-widest opacity-80 text-slate-900">
                                        {b.sexe === 'M' ? 'HOMME' : 'FEMME'}
                                    </td>
                                    <td className="px-6 py-4 text-xm font-bold text-slate-900">
                                        {(b.ddn && b.ddn !== '') ? new Date(b.ddn).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 px-6 text-xs font-black uppercase tracking-widest opacity-80 text-slate-900">
                                        <div className="flex flex-col gap-1">
                                            <span>{b.relation}</span>
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
                                        <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border inline-flex items-center gap-2 ${b.statut === 'Validé' ? 'text-emerald-500 bg-emerald-50 border-emerald-200' :
                                            b.statut === 'Rejeté' ? 'text-red-500 bg-red-50 border-red-200' :
                                                'text-amber-500 bg-amber-50 border-amber-200'
                                            }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${b.statut === 'Validé' ? 'bg-emerald-500' :
                                                b.statut === 'Rejeté' ? 'bg-red-500' : 'bg-amber-500'
                                                }`} />
                                            {b.statut || 'En attente'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 px-6 text-xs font-bold uppercase tracking-widest text-red-500">
                                        {b.motifRefus || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => setViewingBeneficiary(b)}
                                                className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                                title="Détails"
                                            >
                                                <Info size={16} />
                                            </button>
                                            {(b.statut === 'En attente' || b.statut === 'Rejeté') && (
                                                <button
                                                    onClick={() => {
                                                        setEditingBeneficiaryId(b.id);
                                                        setNewBeneficiary({
                                                            nom: b.nom,
                                                            prenom: b.prenom,
                                                            relation: b.relation,
                                                            ddn: b.ddn ? b.ddn.split('T')[0] : '',
                                                            sexe: b.sexe,
                                                            handicape: b.handicape || false,
                                                            etudiant: b.etudiant || false,
                                                            chomage: b.chomage || false,
                                                            celibataire: b.celibataire || false
                                                        });
                                                        setDocumentFile(null);
                                                        setIsAddModalOpen(true);
                                                    }}
                                                    className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 hover:bg-purple-600 hover:text-white transition-all shadow-sm"
                                                    title="Modifier"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                            )}
                                            {b.statut === 'En attente' && (<button
                                                onClick={() => { setDeleteId(b.id); setIsDeleting(false); }}
                                                className="p-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                                title="Supprimer"
                                            >
                                                <X size={16} />
                                            </button>)}
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                            {/* Add button inside table as a row or footer if empty */}
                            {listBeneficiaires.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center">
                                        <button
                                            onClick={() => {
                                                setEditingBeneficiaryId(null);
                                                setNewBeneficiary(INITIAL_BENEFICIARY_STATE);
                                                setDocumentFile(null);
                                                setIsAddModalOpen(true);
                                            }}
                                            className="px-8 py-4 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 font-black text-slate-400 uppercase tracking-widest text-xs hover:border-purple-500 hover:text-purple-600 transition-all"
                                        >
                                            + Ajouter un bénéficiaire
                                        </button>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- ADD BENEFICIARY MODAL --- */}
            <AddBeneficiaryModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                editingBeneficiaryId={editingBeneficiaryId}
                documentPreviewUrl={documentPreviewUrl}
                newBeneficiary={newBeneficiary}
                setNewBeneficiary={setNewBeneficiary}
                isRulesOpen={isRulesOpen}
                setIsRulesOpen={setIsRulesOpen}
                calculateAge={calculateAge}
                isRelationDropdownOpen={isRelationDropdownOpen}
                setIsRelationDropdownOpen={setIsRelationDropdownOpen}
                avezConjoint={avezConjoint}
                currentUser={currentUser}
                documentFile={documentFile}
                setDocumentFile={setDocumentFile}
                fileInputRef={fileInputRef}
                handleAddBeneficiary={handleAddBeneficiary}
                isSaving={isSaving}
            />

            {/* --- BENEFICIARY DETAILS MODAL --- */}
            <AnimatePresence>
                {viewingBeneficiary && (
                    <BeneficiaryDetailsModal
                        beneficiary={viewingBeneficiary}
                        onClose={() => setViewingBeneficiary(null)}
                        onPreviewDocument={(doc) => {
                            setViewingBeneficiary(null);
                            setTimeout(() => setPreviewDocument(doc), 300);
                        }}
                        calculateAge={calculateAge}
                    />
                )}
            </AnimatePresence>

            <ConfirmModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDeleteBenef}
                title="Supprimer le bénéficiaire"
                message="Êtes-vous sûr de vouloir retirer ce membre de votre liste de bénéficiaires ?"
                type="danger"
                isLoading={isDeleting}
            />
        </div>
    );
};

export default UserBeneficiarie;
