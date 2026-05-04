import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { getMyBeneficiaries, addBeneficiary, deleteBeneficiary, updateBeneficiary } from '../../services/beneficiaryService';
import ConfirmModal from '../../components/ConfirmModal';
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
            {isAddModalOpen && createPortal(
                <AnimatePresence>
                    <div className="fixed inset-0 z-[100] overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsAddModalOpen(false)}
                                className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
                            />
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 30 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: 30 }}
                                transition={{ type: "spring", duration: 0.5 }}
                                className={`relative w-full ${documentPreviewUrl ? 'max-w-6xl' : 'max-w-2xl'} bg-white dark:bg-slate-900 rounded-[48px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-white/10 overflow-hidden`}
                            >
                                {/* Header Section */}
                                <div className="relative bg-gradient-to-r from-purple-600 to-indigo-600 p-10 overflow-hidden">
                                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                                    <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-purple-400/20 rounded-full blur-2xl" />

                                    <div className="relative flex justify-between items-start">
                                        <div className="flex items-center gap-5">
                                            <div className="w-16 h-16 rounded-[24px] bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center text-white shadow-inner">
                                                {editingBeneficiaryId ? <Edit2 size={28} /> : <UserPlus size={28} />}
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-3xl font-black text-white tracking-tight leading-tight">
                                                    {editingBeneficiaryId ? "Modifier le membre" : "Nouveau bénéficiaire"}
                                                </h3>
                                                <div className="flex items-center gap-2 text-purple-100 text-[11px] font-bold uppercase tracking-[0.2em] opacity-90">
                                                    <Sparkles size={14} className="animate-pulse" />
                                                    <span>Gestion de votre cercle familial</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setIsAddModalOpen(false)}
                                            className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all active:scale-90"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col lg:flex-row h-full">
                                    {/* Form Section */}
                                    <div className={`flex-1 p-8 lg:p-10 space-y-10 max-h-[70vh] overflow-y-auto custom-scrollbar`}>

                                        {/* Eligibility Alerts */}
                                        <AnimatePresence mode="wait">
                                            {newBeneficiary.relation === 'Enfant' && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0, y: -20 }}
                                                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                                                    exit={{ opacity: 0, height: 0, y: -20 }}
                                                    className="space-y-4"
                                                >
                                                    <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-[28px] overflow-hidden transition-all duration-300">
                                                        <button
                                                            onClick={(e) => { e.preventDefault(); setIsRulesOpen(!isRulesOpen); }}
                                                            className="w-full p-5 flex items-center justify-between gap-4 text-left transition-colors hover:bg-indigo-100/50 dark:hover:bg-indigo-900/40"
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                                                                    <Info size={20} />
                                                                </div>
                                                                <h4 className="text-xs font-black uppercase tracking-widest text-indigo-700 dark:text-indigo-300">Règles d'éligibilité</h4>
                                                            </div>
                                                            <ChevronDown size={18} className={`text-indigo-400 transition-transform duration-300 ${isRulesOpen ? 'rotate-180' : ''}`} />
                                                        </button>
                                                        <AnimatePresence>
                                                            {isRulesOpen && (
                                                                <motion.div
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: 'auto', opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                                                >
                                                                    <div className="px-5 pb-5 pt-0 md:pl-[76px]">
                                                                        <p className="text-[11px] font-medium text-indigo-600/80 dark:text-indigo-400/80 leading-relaxed">
                                                                            Un enfant est considéré à charge s’il a moins de 20 ans, ou jusqu’à 26 ans s’il poursuit des études ou une formation non rémunérée ou de sexe féminin au chômage et célibataire (tout âge confondu). Les personnes en situation de handicap sont prises en charge sans limite d’âge.
                                                                        </p>
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>

                                                    {newBeneficiary.ddn && (
                                                        <div className={`p-5 rounded-[28px] flex gap-4 transition-colors duration-500 ${calculateAge(newBeneficiary.ddn) < 20 ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800' :
                                                                calculateAge(newBeneficiary.ddn) < 26 ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800' :
                                                                    'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800'
                                                            } border`}>
                                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${calculateAge(newBeneficiary.ddn) < 20 ? 'bg-emerald-100 dark:bg-emerald-800 text-emerald-600' :
                                                                    calculateAge(newBeneficiary.ddn) < 26 ? 'bg-amber-100 dark:bg-amber-800 text-amber-600' :
                                                                        'bg-rose-100 dark:bg-rose-800 text-rose-600'
                                                                }`}>
                                                                {calculateAge(newBeneficiary.ddn) < 26 ? <CheckCircle size={20} /> : <XCircle size={20} />}
                                                            </div>
                                                            <div className="space-y-1">
                                                                <h4 className={`text-xs font-black uppercase tracking-widest ${calculateAge(newBeneficiary.ddn) < 20 ? 'text-emerald-700' :
                                                                        calculateAge(newBeneficiary.ddn) < 26 ? 'text-amber-700' :
                                                                            'text-rose-700'
                                                                    }`}>Âge calculé : {calculateAge(newBeneficiary.ddn)} ans</h4>
                                                                <p className="text-[11px] font-medium opacity-80 leading-relaxed">
                                                                    {calculateAge(newBeneficiary.ddn) < 20 ? "Éligibilité validée par l'âge." :
                                                                        calculateAge(newBeneficiary.ddn) < 26 ? "Justificatif d'études ou de handicap requis." :
                                                                            "Conditions spécifiques (Handicap ou Chômage/Célibat) requises."}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                                            {/* Section: Identité */}
                                            <div className="space-y-6 md:col-span-2">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                                        <User size={16} />
                                                    </div>
                                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Identité & Sexe</h4>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-3">
                                                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">Nom</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Ex: Ben Salah"
                                                            className="w-full px-6 py-4 rounded-[20px] bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none text-sm font-bold transition-all"
                                                            value={newBeneficiary.nom}
                                                            onChange={e => setNewBeneficiary({ ...newBeneficiary, nom: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="space-y-3">
                                                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">Prénom</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Ex: Ahmed"
                                                            className="w-full px-6 py-4 rounded-[20px] bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none text-sm font-bold transition-all"
                                                            value={newBeneficiary.prenom}
                                                            onChange={e => setNewBeneficiary({ ...newBeneficiary, prenom: e.target.value })}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">Sexe</label>
                                                    <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-[22px] gap-1">
                                                        {['M', 'F'].map(s => {
                                                            const isLocked = newBeneficiary.relation === 'Conjoint';
                                                            const active = newBeneficiary.sexe === s;
                                                            return (
                                                                <button
                                                                    key={s}
                                                                    disabled={isLocked}
                                                                    onClick={() => !isLocked && setNewBeneficiary({ ...newBeneficiary, sexe: s })}
                                                                    className={`flex-1 py-3 px-4 rounded-[18px] text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${active
                                                                            ? 'bg-white dark:bg-slate-700 text-purple-600 shadow-sm border border-slate-200 dark:border-slate-600 scale-[1.02]'
                                                                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                                                        } ${isLocked ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                                                                >
                                                                    <div className={`w-2 h-2 rounded-full ${active ? 'bg-purple-500' : 'bg-slate-300'}`} />
                                                                    {s === 'M' ? 'Masculin' : 'Féminin'}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Section: Relation & Date */}
                                            <div className="space-y-6 md:col-span-2">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                                        <Heart size={16} />
                                                    </div>
                                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Relation & Naissance</h4>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-3 relative">
                                                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">Relation</label>
                                                        <div
                                                            className="w-full px-6 py-4 rounded-[20px] bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus-within:border-purple-500 outline-none text-sm font-bold flex justify-between items-center cursor-pointer select-none transition-all group"
                                                            onClick={() => setIsRelationDropdownOpen(!isRelationDropdownOpen)}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-2 h-2 rounded-full ${newBeneficiary.relation ? 'bg-purple-500' : 'bg-slate-300'}`} />
                                                                <span className={newBeneficiary.relation ? "text-slate-900 dark:text-white" : "text-slate-400"}>
                                                                    {newBeneficiary.relation === 'Enfant' ? 'Enfant' : (newBeneficiary.relation === 'Conjoint' ? 'Conjoint(e)' : "Sélectionnez...")}
                                                                </span>
                                                            </div>
                                                            <ChevronDown size={18} className={`text-slate-400 group-hover:text-purple-500 transition-transform ${isRelationDropdownOpen ? 'rotate-180' : ''}`} />
                                                        </div>

                                                        <AnimatePresence>
                                                            {isRelationDropdownOpen && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                                    className="absolute bottom-full left-0 w-full mb-3 py-3 bg-white dark:bg-slate-800 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 dark:border-slate-700 z-[60] overflow-hidden"
                                                                >
                                                                    {[
                                                                        { value: "Enfant", label: "Enfant", icon: "👶" },
                                                                        { value: "Conjoint", label: "Conjoint(e)", icon: "💍" },
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
                                                                            className={`w-full px-6 py-4 text-left text-sm font-bold transition-all hover:bg-purple-50 dark:hover:bg-purple-900/10 flex items-center justify-between ${newBeneficiary.relation === option.value ? 'text-purple-600 bg-purple-50 dark:bg-purple-900/10' : 'text-slate-700 dark:text-slate-300'}`}
                                                                        >
                                                                            <div className="flex items-center gap-3">
                                                                                <span className="text-lg">{option.icon}</span>
                                                                                {option.label}
                                                                            </div>
                                                                            {newBeneficiary.relation === option.value && <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center"><Check size={12} className="text-white" /></div>}
                                                                        </button>
                                                                    ))}
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>

                                                        {!editingBeneficiaryId && avezConjoint && newBeneficiary.relation === 'Conjoint' && (
                                                            <div className="flex items-center gap-2 mt-2 px-2 text-rose-500">
                                                                <XCircle size={14} />
                                                                <span className="text-[10px] font-black uppercase tracking-tight">Un conjoint est déjà enregistré</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="space-y-3">
                                                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">Date de naissance</label>
                                                        <div className="relative group">
                                                            <input
                                                                type="date"
                                                                className="w-full px-6 py-4 rounded-[20px] bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-purple-500 outline-none text-sm font-bold transition-all"
                                                                value={newBeneficiary.ddn}
                                                                onChange={e => setNewBeneficiary({ ...newBeneficiary, ddn: e.target.value })}
                                                            />
                                                            <Calendar className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 pointer-events-none transition-colors" size={18} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Section: Éligibilité Enfant */}
                                            <AnimatePresence>
                                                {newBeneficiary.relation === 'Enfant' && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: 20 }}
                                                        className="space-y-6 md:col-span-2"
                                                    >
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                                                <ShieldCheck size={16} />
                                                            </div>
                                                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Conditions Particulières</h4>
                                                        </div>

                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            {[
                                                                { key: 'handicape', label: 'Handicapé', icon: '♿' },
                                                                { key: 'etudiant', label: 'Étudiant (-26 ans)', icon: '🎓' },
                                                                { key: 'chomage', label: 'Au chômage', icon: '💼' },
                                                                { key: 'celibataire', label: 'Célibataire', icon: '👤' },
                                                            ].map(item => (
                                                                <button
                                                                    key={item.key}
                                                                    onClick={() => setNewBeneficiary({ ...newBeneficiary, [item.key]: !newBeneficiary[item.key] })}
                                                                    className={`p-5 rounded-[24px] border-2 flex items-center gap-4 transition-all ${newBeneficiary[item.key]
                                                                            ? 'bg-purple-600 border-purple-600 text-white shadow-[0_10px_20px_-5px_rgba(124,58,237,0.3)]'
                                                                            : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-purple-200'
                                                                        }`}
                                                                >
                                                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 ${newBeneficiary[item.key] ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700'
                                                                        }`}>
                                                                        {item.icon}
                                                                    </div>
                                                                    <div className="flex-1 text-left">
                                                                        <span className="text-xs font-black uppercase tracking-tight block leading-none mb-1">{item.label}</span>
                                                                        <span className={`text-[9px] font-bold uppercase tracking-widest opacity-60 ${newBeneficiary[item.key] ? 'text-white' : 'text-slate-400'}`}>
                                                                            {newBeneficiary[item.key] ? 'Activé' : 'Désactivé'}
                                                                        </span>
                                                                    </div>
                                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${newBeneficiary[item.key] ? 'bg-white border-white' : 'border-slate-200 dark:border-slate-600'
                                                                        }`}>
                                                                        {newBeneficiary[item.key] && <Check size={12} className="text-purple-600" strokeWidth={4} />}
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            {/* Section: Justificatif */}
                                            <div className="space-y-6 md:col-span-2">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                                        <FileText size={16} />
                                                    </div>
                                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Document Justificatif</h4>
                                                </div>

                                                <div className="relative">
                                                    <input
                                                        ref={fileInputRef}
                                                        type="file"
                                                        accept="image/*,.pdf"
                                                        onChange={e => setDocumentFile(e.target.files[0])}
                                                        className="hidden"
                                                    />

                                                    {(documentFile || (editingBeneficiaryId && documentPreviewUrl)) ? (
                                                        <div className="group relative overflow-hidden p-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-[32px] transition-all hover:bg-white dark:hover:bg-slate-800 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none">
                                                            <div className="flex items-center justify-between relative z-10">
                                                                <div className="flex items-center gap-5 overflow-hidden">
                                                                    <div className="w-16 h-16 rounded-[20px] bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 shrink-0">
                                                                        {documentFile?.type === 'application/pdf' ? <FileText size={32} /> : <Camera size={32} />}
                                                                    </div>
                                                                    <div className="overflow-hidden space-y-1">
                                                                        <p className="text-sm font-black text-slate-900 dark:text-white truncate">
                                                                            {documentFile ? documentFile.name : "Justificatif déjà enregistré"}
                                                                        </p>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-lg">Prêt</span>
                                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                                                {(documentFile?.size / 1024 / 1024).toFixed(2)} MB
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => fileInputRef.current?.click()}
                                                                        className="p-4 rounded-2xl bg-white dark:bg-slate-700 text-slate-400 hover:text-purple-600 hover:shadow-lg transition-all active:scale-90 border border-slate-100 dark:border-slate-600"
                                                                    >
                                                                        <Edit2 size={20} />
                                                                    </button>
                                                                    {documentFile && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setDocumentFile(null)}
                                                                            className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/10 text-rose-500 hover:bg-rose-500 hover:text-white hover:shadow-lg transition-all active:scale-90"
                                                                        >
                                                                            <X size={20} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-600/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
                                                        </div>
                                                    ) : (
                                                        <div
                                                            onClick={() => fileInputRef.current?.click()}
                                                            className="group relative w-full py-16 rounded-[40px] border-4 border-dashed border-slate-100 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-500 bg-slate-50 dark:bg-slate-800/30 transition-all cursor-pointer flex flex-col items-center gap-6 overflow-hidden"
                                                        >
                                                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-indigo-500/0 group-hover:from-purple-500/5 group-hover:to-indigo-500/5 transition-colors duration-500" />

                                                            <div className="w-20 h-20 rounded-[28px] bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-purple-600 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-xl shadow-slate-200/50 dark:shadow-none relative z-10 border border-slate-50 dark:border-slate-700">
                                                                <UploadCloud size={36} strokeWidth={1.5} />
                                                            </div>

                                                            <div className="text-center relative z-10 space-y-2">
                                                                <p className="text-lg font-black text-slate-700 dark:text-slate-200 group-hover:text-purple-600 transition-colors">Déposez votre justificatif ici</p>
                                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-8">
                                                                    Fiche d'état civil, carte d'étudiant ou certificat médical (JPG, PNG, PDF)
                                                                </p>
                                                            </div>

                                                            <div className="px-6 py-2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 group-hover:bg-purple-600 group-hover:text-white text-[10px] font-black uppercase tracking-widest transition-all relative z-10">
                                                                Parcourir les fichiers
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Submit Button */}
                                        <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
                                            <button
                                                onClick={handleAddBeneficiary}
                                                disabled={isSaving}
                                                className="w-full relative group overflow-hidden py-6 rounded-[32px] bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-sm uppercase tracking-[0.2em] shadow-[0_20px_40px_-10px_rgba(124,58,237,0.4)] hover:shadow-[0_25px_50px_-12px_rgba(124,58,237,0.5)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale"
                                            >
                                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                                <div className="relative flex items-center justify-center gap-3">
                                                    {isSaving ? (
                                                        <>
                                                            <Loader2 className="w-5 h-5 animate-spin" />
                                                            <span>Traitement en cours...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            {editingBeneficiaryId ? <CheckCircle2 size={20} /> : <PlusCircle size={20} />}
                                                            <span>{editingBeneficiaryId ? "Mettre à jour le profil" : "Finaliser l'inscription"}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Preview Section (Sticky on the right for large screens) */}
                                    {documentPreviewUrl && (
                                        <div className="hidden lg:flex w-[450px] bg-slate-50 dark:bg-slate-950/50 p-10 flex-col gap-8 border-l border-slate-100 dark:border-white/5 relative">
                                            <div className="absolute top-0 right-0 p-10 opacity-5">
                                                <FileText size={120} />
                                            </div>

                                            <div className="relative z-10">
                                                <div className="flex items-center gap-3 mb-8">
                                                    <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-purple-600 shadow-sm border border-slate-100 dark:border-slate-700">
                                                        <Eye size={20} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Aperçu en direct</h4>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Vérification de lisibilité</p>
                                                    </div>
                                                </div>

                                                <div className="w-full aspect-[3/4] rounded-[40px] overflow-hidden border-8 border-white dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl relative group">
                                                    {documentPreviewUrl.toLowerCase().includes('pdf') || (documentFile && documentFile.type === 'application/pdf') ? (
                                                        <iframe src={documentPreviewUrl} className="w-full h-full border-none" title="Preview" />
                                                    ) : (
                                                        <img src={documentPreviewUrl} alt="Preview" className="w-full h-full object-contain" />
                                                    )}

                                                    <div className="absolute inset-0 bg-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </AnimatePresence>,
                document.body
            )}

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
