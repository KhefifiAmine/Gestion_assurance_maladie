import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { getMyBeneficiaries, addBeneficiary, deleteBeneficiary, updateBeneficiary } from '../../services/beneficiaryService';
import ConfirmModal from '../../components/ConfirmModal';
import {
    FileText, X, Eye, PlusCircle, Edit2, ChevronDown, Check, UploadCloud, CheckCircle2, Loader2
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
    const [newBeneficiary, setNewBeneficiary] = useState({ nom: '', prenom: '', relation: 'Enfant', ddn: '', sexe: 'M', avezConjoint: 'false' });
    const [isRelationDropdownOpen, setIsRelationDropdownOpen] = useState(false);
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

            setNewBeneficiary(prev => ({
                ...prev,
                avezConjoint: !fetchedBeneficiaries.some(
                    b => b.relation === 'Conjoint'
                )
            }));

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
        if (!newBeneficiary.avezConjoint && newBeneficiary.relation === "Conjoint") {
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
                await updateBeneficiary(editingBeneficiaryId, formData);
                showToast("Bénéficiaire mis à jour avec succès", "success");
            } else {
                await addBeneficiary(formData);
                showToast("Bénéficiaire ajouté avec succès (En attente de validation)", "success");
            }

            setNewBeneficiary({ nom: '', prenom: '', relation: 'Enfant', ddn: '', sexe: 'M' });
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
        } catch (e) {
            showToast(e.message || "Erreur lors de la suppression", "error");
        } finally {
            setIsDeleting(false);
        }
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
                        setNewBeneficiary({ nom: '', prenom: '', relation: 'Enfant', ddn: '', sexe: 'M' });
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
                                        {b.relation}
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
                                            {b.document && (
                                                <button
                                                    onClick={() => setPreviewDocument(b.document)}
                                                    className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 hover:bg-purple-600 hover:text-white transition-all shadow-sm"
                                                    title="Voir document"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            )}
                                            {(b.statut === 'En attente' || b.statut === 'Rejeté') && (
                                                <button
                                                    onClick={() => {
                                                        setEditingBeneficiaryId(b.id);
                                                        setNewBeneficiary({
                                                            nom: b.nom,
                                                            prenom: b.prenom,
                                                            relation: b.relation,
                                                            ddn: b.ddn ? b.ddn.split('T')[0] : '',
                                                            sexe: b.sexe
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
                                                setNewBeneficiary({ nom: '', prenom: '', relation: 'Enfant', ddn: '', sexe: 'M' });
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
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className={`relative w-full ${documentPreviewUrl ? 'max-w-5xl' : 'max-w-lg'} bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl border border-slate-100 dark:border-white/5 overflow-hidden transition-all duration-500`}
                        >
                            <div className="p-8 space-y-8">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                                            {editingBeneficiaryId ? "Modifier le Bénéficiaire" : "Nouveau Bénéficiaire"}
                                        </h3>
                                        <p className="text-xs font-bold uppercase tracking-widest">
                                            {editingBeneficiaryId ? "Mettez à jour les informations du bénéficiaire" : "Enregistrez un membre de votre famille"}
                                        </p>
                                    </div>
                                    <button onClick={() => setIsAddModalOpen(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-5">
                                    <div className={`grid grid-cols-1 ${documentPreviewUrl ? 'lg:grid-cols-2' : ''} gap-8`}>
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-black-400">Nom</label>
                                                    <input
                                                        type="text"
                                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-gray-400 focus:border-purple-400 outline-none text-sm font-bold"
                                                        value={newBeneficiary.nom}
                                                        onChange={e => setNewBeneficiary({ ...newBeneficiary, nom: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-black-400">Prénom</label>
                                                    <input
                                                        type="text"
                                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-gray-400 focus:border-purple-400 outline-none text-sm font-bold"
                                                        value={newBeneficiary.prenom}
                                                        onChange={e => setNewBeneficiary({ ...newBeneficiary, prenom: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2 relative z-50">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-black-400">Relation</label>
                                                <div
                                                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-gray-400 focus-within:border-purple-400 outline-none text-sm font-bold flex justify-between items-center cursor-pointer select-none transition-all"
                                                    onClick={() => setIsRelationDropdownOpen(!isRelationDropdownOpen)}
                                                >
                                                    <span className={newBeneficiary.relation ? "text-slate-900 dark:text-white" : "text-black-400"}>
                                                        {newBeneficiary.relation === 'Enfant' ? 'Enfant' : (newBeneficiary.relation || "Sélectionnez une relation")}
                                                    </span>
                                                    <ChevronDown size={18} className={`text-slate-400 transition-transform ${isRelationDropdownOpen ? 'rotate-180' : ''}`} />
                                                </div>
                                                <AnimatePresence>
                                                    {isRelationDropdownOpen && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: -10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: -10 }}
                                                            className="absolute top-[100%] left-0 w-full mt-2 py-2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 flex flex-col overflow-hidden"
                                                        >
                                                            {[
                                                                { value: "Enfant", label: "Enfant" },
                                                                { value: "Conjoint", label: "Conjoint(e)" },
                                                            ].map((option) => (
                                                                <button
                                                                    key={option.value}
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        let autoSexe = newBeneficiary.sexe;
                                                                        if (option.value === 'Conjoint' && currentUser?.sexe) {
                                                                            autoSexe = currentUser.sexe === 'M' ? 'F' : 'M';
                                                                        }
                                                                        setNewBeneficiary({ ...newBeneficiary, relation: option.value, sexe: autoSexe });
                                                                        setIsRelationDropdownOpen(false);
                                                                    }}
                                                                    className={`px-6 py-4 text-left text-sm font-bold transition-all hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center justify-between ${newBeneficiary.relation === option.value ? 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' : 'text-slate-700 dark:text-slate-300'}`}
                                                                >
                                                                    {option.label}
                                                                    {newBeneficiary.relation === option.value && <Check size={16} className="text-purple-600" />}
                                                                </button>
                                                            ))}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                                {!newBeneficiary.avezConjoint && newBeneficiary.relation === 'Conjoint' && (
                                                    <span className="text-red-500 text-xs font-bold">
                                                        Attention ! Vous avez déjà ajouté un conjoint
                                                    </span>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-black-400">Date de naissance</label>
                                                    <input
                                                        type="date"
                                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-gray-400 focus:border-purple-400 outline-none text-sm font-bold"
                                                        value={newBeneficiary.ddn}
                                                        onChange={e => setNewBeneficiary({ ...newBeneficiary, ddn: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-black-400">Sexe</label>
                                                    <div className="flex gap-2">
                                                        {['M', 'F'].map(s => {
                                                            const isLocked = newBeneficiary.relation === 'Conjoint';

                                                            return (
                                                                <button
                                                                    key={s}
                                                                    disabled={isLocked}
                                                                    onClick={() => {
                                                                        if (!isLocked) {
                                                                            setNewBeneficiary({ ...newBeneficiary, sexe: s });
                                                                        }
                                                                    }}
                                                                    className={`flex-1 py-3 rounded-xl border
                                                                    ${newBeneficiary.sexe === s
                                                                            ? 'bg-purple-600 text-white'
                                                                            : 'bg-gray-100'}
                                                                    ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}
                                                                    `}
                                                                >
                                                                    {s === 'M' ? 'Masculin' : 'Féminin'}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-white/5">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-black-400 ml-1">
                                                    Document Justificatif {editingBeneficiaryId ? '(Optionnel si déjà fourni)' : '(*)'}
                                                </label>
                                                <div className="relative">
                                                    {(documentFile || (editingBeneficiaryId && documentPreviewUrl)) ? (
                                                        <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-2xl animate-scale-in">
                                                            <div className="flex items-center gap-3 overflow-hidden">
                                                                <div className="p-2.5 bg-purple-100 dark:bg-purple-800 rounded-xl text-purple-600 dark:text-purple-300 shrink-0">
                                                                    <FileText size={20} />
                                                                </div>
                                                                <div className="overflow-hidden cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                                                    <p className="text-sm font-black text-slate-900 dark:text-white truncate">
                                                                        {documentFile ? documentFile.name : (editingBeneficiaryId ? "Justificatif_Bénéficiaire" : "Document attaché")}
                                                                    </p>
                                                                    <p className="text-[10px] font-bold text-purple-500 uppercase tracking-widest">
                                                                        {documentFile ? "Document prêt pour l'envoi" : "Document déjà enregistré"}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => fileInputRef.current?.click()}
                                                                    className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-all"
                                                                    title="Remplacer le document"
                                                                >
                                                                    <UploadCloud size={18} />
                                                                </button>
                                                                {documentFile && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => { e.stopPropagation(); setDocumentFile(null); }}
                                                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                                                        title="Annuler le nouveau fichier"
                                                                    >
                                                                        <X size={18} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div
                                                            onClick={() => fileInputRef.current?.click()}
                                                            className="group relative w-full p-8 rounded-[24px] border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-600 bg-slate-50 dark:bg-slate-800/50 transition-all cursor-pointer flex flex-col items-center gap-3 overflow-hidden"
                                                        >
                                                            <div className="absolute inset-0 bg-purple-600/0 group-hover:bg-purple-600/5 transition-colors" />
                                                            <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-purple-600 group-hover:scale-110 transition-all shadow-sm relative z-10">
                                                                <UploadCloud size={24} />
                                                            </div>
                                                            <div className="text-center relative z-10">
                                                                <p className="text-sm font-black text-slate-600 dark:text-slate-300 group-hover:text-purple-600 transition-colors">Cliquez pour ajouter un fichier</p>
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">JPG, PNG ou PDF (Max 5MB)</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <input
                                                        ref={fileInputRef}
                                                        type="file"
                                                        accept="image/*,.pdf"
                                                        onChange={e => setDocumentFile(e.target.files[0])}
                                                        className="hidden"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {documentPreviewUrl && (
                                            <div className="hidden lg:flex flex-col gap-4 bg-slate-50 dark:bg-slate-800/50 rounded-[32px] p-6 border border-slate-100 dark:border-white/5 h-full min-h-[400px]">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Aperçu du justificatif</p>
                                                <div className="flex-1 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-inner relative group">
                                                    {documentPreviewUrl.toLowerCase().includes('pdf') || (documentFile && documentFile.type === 'application/pdf') ? (
                                                        <iframe src={documentPreviewUrl} className="w-full h-full border-none" title="Preview" />
                                                    ) : (
                                                        <img src={documentPreviewUrl} alt="Preview" className="w-full h-full object-contain" />
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={handleAddBeneficiary}
                                    disabled={isSaving}
                                    className="w-full py-5 rounded-[24px] bg-purple-600 hover:bg-purple-700 text-white font-black text-sm shadow-xl shadow-purple-500/20 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {isSaving ? "Enregistrement en cours..." : (editingBeneficiaryId ? "Mettre à jour" : "Confirmer l'ajout")}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- DOCUMENT VIEWER SLIDE-OVER --- */}
            <AnimatePresence>
                {previewDocument && (
                    <div className="fixed inset-0 z-[110] flex justify-end overflow-hidden">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setPreviewDocument(null)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-[110]"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="relative w-full md:w-[600px] h-full bg-white dark:bg-slate-900 shadow-2xl z-[120] border-l border-slate-100 dark:border-white/5 flex flex-col"
                        >
                            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-2xl bg-purple-100 dark:bg-purple-900/20 text-purple-600">
                                        <FileText size={20} />
                                    </div>
                                    <div className="space-y-1">
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
