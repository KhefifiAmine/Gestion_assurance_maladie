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
    const [documentFiles, setDocumentFiles] = useState([]);
    const [previewDocument, setPreviewDocument] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [documentPreviewUrls, setDocumentPreviewUrls] = useState([]);

    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchBeneficiaries();
    }, []);

    useEffect(() => {
        if (documentFiles && documentFiles.length > 0) {
            const urls = documentFiles.map(file => URL.createObjectURL(file));
            setDocumentPreviewUrls(urls);
            return () => urls.forEach(url => URL.revokeObjectURL(url));
        } else if (editingBeneficiaryId) {
            const b = listBeneficiaires.find(x => x.id === editingBeneficiaryId);
            if (b && b.document) {
                try {
                    const files = JSON.parse(b.document);
                    if (Array.isArray(files)) {
                        setDocumentPreviewUrls(files.map(f => `http://localhost:5000/uploads/${f}`));
                    } else {
                        setDocumentPreviewUrls([`http://localhost:5000/uploads/${b.document}`]);
                    }
                } catch (e) {
                    setDocumentPreviewUrls([`http://localhost:5000/uploads/${b.document}`]);
                }
            } else {
                setDocumentPreviewUrls([]);
            }
        } else {
            setDocumentPreviewUrls([]);
        }
    }, [documentFiles, editingBeneficiaryId, listBeneficiaires]);

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
        if (!newBeneficiary.nom || !newBeneficiary.prenom || !newBeneficiary.ddn || (documentFiles.length === 0 && !editingBeneficiaryId)) {
            showToast("Veuillez remplir tous les champs obligatoires et joindre au moins un document", "error");
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

            if (documentFiles && documentFiles.length > 0) {
                documentFiles.forEach(file => {
                    formData.append('document', file);
                });
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
            setDocumentFiles([]);
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
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="space-y-1">
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Mes Bénéficiaires</h3>
                    <p className="text-[10px] font-black opacity-60 uppercase tracking-[0.2em]">Visualisez et gérez les membres de votre famille</p>
                </div>
                <button
                    onClick={() => {
                        setEditingBeneficiaryId(null);
                        setNewBeneficiary(INITIAL_BENEFICIARY_STATE);
                        setDocumentFiles([]);
                        setIsAddModalOpen(true);
                    }}
                    className="px-8 py-4 rounded-2xl bg-purple-600 text-white hover:bg-purple-700 font-black text-xs uppercase tracking-widest transition-all flex items-center gap-3 shadow-xl shadow-purple-500/20 active:scale-95"
                >
                    <PlusCircle size={20} /> NOUVEAU BÉNÉFICIAIRE
                </button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-white/5 overflow-hidden">
                <div className="overflow-x-auto pb-4">
                    <table className="w-full border-separate border-spacing-y-3 px-8">
                        <thead>
                            <tr className="text-slate-400 dark:text-slate-500">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-left">Bénéficiaire</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-left">Sexe & Age</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-left">Lien de Parenté</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-center">Statut</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {listBeneficiaires.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="py-20 text-center">
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
                            ) : listBeneficiaires.map((b, i) => (
                                <motion.tr
                                    key={b.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 + (i * 0.05) }}
                                    className="group"
                                >
                                    {/* Colonne Bénéficiaire */}
                                    <td className="bg-white dark:bg-slate-900 first:rounded-l-[2rem] border-y border-l border-slate-100 dark:border-white/5 px-6 py-5 group-hover:bg-slate-50/50 dark:group-hover:bg-white/[0.02] transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-sm transition-transform group-hover:scale-110" style={{ backgroundColor: b.bg }}>
                                                {b.initials}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1">
                                                    {b.nom} {b.prenom}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    #{b.id.toString().padStart(4, '0')}
                                                </span>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Colonne Sexe & Age */}
                                    <td className="bg-white dark:bg-slate-900 border-y border-slate-100 dark:border-white/5 px-6 py-5 group-hover:bg-slate-50/50 dark:group-hover:bg-white/[0.02] transition-colors">
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                {b.sexe === 'M' ? 'HOMME' : 'FEMME'}
                                            </span>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                Né(e) le {b.ddn ? new Date(b.ddn).toLocaleDateString('fr-FR') : 'N/A'}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Colonne Relation */}
                                    <td className="bg-white dark:bg-slate-900 border-y border-slate-100 dark:border-white/5 px-6 py-5 group-hover:bg-slate-50/50 dark:group-hover:bg-white/[0.02] transition-colors">
                                        <div className="flex flex-col gap-1.5">
                                            <span className="font-black text-[11px] text-purple-600 dark:text-purple-400 uppercase tracking-widest">
                                                {b.relation}
                                            </span>
                                            {b.relation === 'Enfant' && (
                                                <div className="flex flex-wrap gap-1">
                                                    {b.handicape && <span className="px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-600 text-[8px] font-bold border border-purple-100">Handicapé</span>}
                                                    {b.etudiant && <span className="px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[8px] font-bold border border-blue-100">Étudiant</span>}
                                                    {b.chomage && <span className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-600 text-[8px] font-bold border border-amber-100">Chômage</span>}
                                                    {b.celibataire && <span className="px-1.5 py-0.5 rounded-md bg-pink-50 text-pink-600 text-[8px] font-bold border border-pink-100">Célibataire</span>}
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    {/* Colonne Statut */}
                                    <td className="bg-white dark:bg-slate-900 border-y border-slate-100 dark:border-white/5 px-6 py-5 group-hover:bg-slate-50/50 dark:group-hover:bg-white/[0.02] transition-colors">
                                        <div className="flex flex-col items-center gap-1.5">
                                            <div className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-[0.1em] border shadow-sm flex items-center gap-2 ${
                                                b.statut === 'Validé' ? 'text-emerald-500 bg-emerald-50 border-emerald-100' :
                                                b.statut === 'Rejeté' ? 'text-red-500 bg-red-50 border-red-100' :
                                                'text-amber-500 bg-amber-50 border-amber-100'
                                            }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${
                                                    b.statut === 'Validé' ? 'bg-emerald-500' :
                                                    b.statut === 'Rejeté' ? 'bg-red-500' : 'bg-amber-500'
                                                }`} />
                                                {b.statut || 'En attente'}
                                            </div>
                                            {b.statut === 'Rejeté' && b.motifRefus && (
                                                <span className="text-[9px] text-red-500 font-bold max-w-[120px] truncate" title={b.motifRefus}>
                                                    {b.motifRefus}
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Colonne Actions */}
                                    <td className="bg-white dark:bg-slate-900 last:rounded-r-[2rem] border-y border-r border-slate-100 dark:border-white/5 px-6 py-5 group-hover:bg-slate-50/50 dark:group-hover:bg-white/[0.02] transition-colors text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => setViewingBeneficiary(b)}
                                                className="p-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:bg-purple-600 dark:hover:bg-purple-500 hover:text-white transition-all shadow-sm"
                                                title="Détails"
                                            >
                                                <Info size={16} />
                                            </button>
                                            {(b.statut === 'En attente' || b.statut === 'Rejeté') && (
                                                <button
                                                    onClick={() => {
                                                        setEditingBeneficiaryId(b.id);
                                                        setNewBeneficiary({
                                                            nom: b.nom, prenom: b.prenom, relation: b.relation,
                                                            ddn: b.ddn ? b.ddn.split('T')[0] : '', sexe: b.sexe,
                                                            handicape: b.handicape || false, etudiant: b.etudiant || false,
                                                            chomage: b.chomage || false, celibataire: b.celibataire || false
                                                        });
                                                        setDocumentFiles([]);
                                                        setIsAddModalOpen(true);
                                                    }}
                                                    className="p-2.5 bg-blue-500/10 text-blue-600 rounded-xl hover:bg-blue-500 hover:text-white transition-all"
                                                    title="Modifier"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                            )}
                                            {b.statut === 'En attente' && (
                                                <button
                                                    onClick={() => { setDeleteId(b.id); setIsDeleting(false); }}
                                                    className="p-2.5 bg-red-500/10 text-red-600 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                                                    title="Supprimer"
                                                >
                                                    <X size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>


            {/* --- ADD BENEFICIARY MODAL --- */}
            <AddBeneficiaryModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                editingBeneficiaryId={editingBeneficiaryId}
                documentPreviewUrls={documentPreviewUrls}
                newBeneficiary={newBeneficiary}
                setNewBeneficiary={setNewBeneficiary}
                isRulesOpen={isRulesOpen}
                setIsRulesOpen={setIsRulesOpen}
                calculateAge={calculateAge}
                isRelationDropdownOpen={isRelationDropdownOpen}
                setIsRelationDropdownOpen={setIsRelationDropdownOpen}
                avezConjoint={avezConjoint}
                currentUser={currentUser}
                documentFiles={documentFiles}
                setDocumentFiles={setDocumentFiles}
                fileInputRef={fileInputRef}
                handleAddBeneficiary={handleAddBeneficiary}
                isSaving={isSaving}
            />

            {/* --- BENEFICIARY DETAILS MODAL --- */}
            <BeneficiaryDetailsModal
                isOpen={!!viewingBeneficiary}
                beneficiary={viewingBeneficiary}
                onClose={() => setViewingBeneficiary(null)}
                calculateAge={calculateAge}
            />

            <ConfirmModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDeleteBenef}
                title="Supprimer le bénéficiaire"
                message="Êtes-vous sûr de vouloir retirer ce membre de votre liste de bénéficiaires ?"
                type="danger"
                isLoading={isDeleting}
            />
            <AnimatePresence>
                {previewDocument && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-xl flex flex-col p-4 md:p-8"
                    >
                        <div className="flex justify-between items-center mb-6 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/10">
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <h3 className="text-white font-black text-xl tracking-tight">Justificatif</h3>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Aperçu du document</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setPreviewDocument(null)}
                                className="p-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all hover:rotate-90"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="flex-1 bg-white dark:bg-slate-900 rounded-[40px] overflow-hidden shadow-2xl relative border border-white/10">
                            {previewDocument.toLowerCase().endsWith('.pdf') ? (
                                <iframe 
                                    src={`http://localhost:5000/uploads/${previewDocument}`} 
                                    className="w-full h-full border-none"
                                    title="Full Preview"
                                />
                            ) : (
                                <img 
                                    src={`http://localhost:5000/uploads/${previewDocument}`} 
                                    alt="Full Preview" 
                                    className="w-full h-full object-contain"
                                />
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UserBeneficiarie;
