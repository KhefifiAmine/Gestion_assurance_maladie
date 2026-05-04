import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, FileText, User, Activity, Upload, ChevronRight, ChevronDown,
    Hash, Users, CheckCircle2, Lock, Eye, ExternalLink, Plus
} from 'lucide-react';
import { createBulletin, updateBulletin, analyzeBulletinIA } from '../services/bulletinService';
import { getMyBeneficiaries } from '../services/beneficiaryService';
import { UPLOADS_BASE } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const DocumentPreview = ({ file, url }) => {
    const [fileUrl, setFileUrl] = useState(null);

    useEffect(() => {
        if (file) {
            const objectUrl = URL.createObjectURL(file);
            setFileUrl(objectUrl);

            return () => URL.revokeObjectURL(objectUrl); // 🔥 cleanup
        } else if (url) {
            setFileUrl(`${UPLOADS_BASE}/uploads/${url}`);
        }
    }, [file, url]);

    if (!fileUrl) return null;

    const fileName = file ? file.name : url;
    const isPdf = fileName?.toLowerCase().endsWith('.pdf');

    return <div className="h-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 flex items-center justify-center relative group min-h-[400px] lg:min-h-0">
            {isPdf ? (
                <iframe
                    src={`${fileUrl}#toolbar=0`}
                    className="w-full h-full"
                    title="Aperçu du document"
                />
            ) : (
                <img
                    src={fileUrl}
                    alt="Aperçu"
                    className="max-w-full h-full object-contain"
                />
            )}
        </div>
};

const AddBulletinModal = ({ isOpen, onClose, onSubmit, initialData = null }) => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [step, setStep] = useState(1);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isUploadingDoc, setIsUploadingDoc] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]); // Changé de selectedFile (unique) à selectedFiles (tableau)
    const [previewIndex, setPreviewIndex] = useState(0); // Pour naviguer entre les aperçus
    const [beneficiaries, setBeneficiaries] = useState([]);
    const [isBeneficiaryDropdownOpen, setIsBeneficiaryDropdownOpen] = useState(false);
    const initialFormState = {
        numero_bulletin: '',
        code_cnam: '',
        matricule_adherent: user?.matricule || '',
        nom_prenom_adherent: `${user?.prenom || ''} ${user?.nom || ''}`.trim(),
        adresse_adherent: user?.adresse || '',
        client: '', // ex: Assureur ou Entreprise

        nom_prenom_malade: '',
        qualite_malade: 'Lui-même',
        date_naissance_malade: '',

        date_soin: new Date().toISOString().split('T')[0],

        est_apci: false,
        suivi_grossesse: false,
        date_prevue_accouchement: '',
        soins_cadre: 'Autres',

        pharmacie: {
            identifiant_unique_mf: '',
            est_cachet: false,
            est_signature: false,
            date: '',
            montant_pharmacie: 0
        },

        actes: [],

        montant_total: 0,
        
        // Champs UI interne
        type_dossier: 'Consultation',
        notes: '',
        est_suspect: false,
        zones_modifiees: '',
        confiance_score: null,
        documentHash: '',
        documentType: '',
        fichiers: [],
        beneficiaireId: null,
        alerte_beneficiaire: null,
        showPreview: false
    };

    const [formData, setFormData] = useState(initialFormState);
    const fileInputRef = useRef(null);
    const manualFileInputRef = useRef(null);

    const isEdit = !!initialData;

    const fetchBeneficiaries = async () => {
        try {
            const data = await getMyBeneficiaries();
            setBeneficiaries(data);
        } catch (error) {
            console.error("Erreur bénéficiaires:", error);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchBeneficiaries();
            if (isEdit) {
                setFormData({
                    numero_bulletin: initialData.numero_bulletin || '',
                    code_cnam: initialData.code_cnam || '',
                    matricule_adherent: initialData.matricule_adherent || user?.matricule || '',
                    nom_prenom_adherent: initialData.nom_prenom_adherent || `${user?.prenom || ''} ${user?.nom || ''}`.trim(),
                    adresse_adherent: initialData.adresse_adherent || user?.adresse || '',
                    client: initialData.client || '',
                    nom_prenom_malade: initialData.nom_prenom_malade || '',
                    qualite_malade: initialData.qualite_malade || 'Lui-même',
                    date_naissance_malade: initialData.date_naissance_malade || '',
                    date_soin: initialData.date_soin || new Date().toISOString().split('T')[0],
                    est_apci: initialData.est_apci || false,
                    suivi_grossesse: initialData.suivi_grossesse || false,
                    date_prevue_accouchement: initialData.date_prevue_accouchement || '',
                    soins_cadre: initialData.soins_cadre || 'Autres',
                    pharmacie: initialData.pharmacie ? {
                        identifiant_unique_mf: initialData.pharmacie.identifiant_unique_mf || '',
                        est_cachet: initialData.pharmacie.est_cachet || false,
                        est_signature: initialData.pharmacie.est_signature || false,
                        date: initialData.pharmacie.date || initialData.pharmacie.date_achat || '',
                        montant_pharmacie: initialData.pharmacie.montant_pharmacie || 0
                    } : initialFormState.pharmacie,
                    actes: initialData.actes || [],
                    montant_total: initialData.montant_total || 0,
                    type_dossier: initialData.type_dossier || 'Consultation',
                    notes: initialData.notes || '',
                    est_suspect: initialData.documents?.[0]?.est_suspect || false,
                    zones_modifiees: initialData.documents?.[0]?.zones_modifiees || '',
                    confiance_score: initialData.documents?.[0]?.score || null,
                    documentHash: initialData.documents?.[0]?.hash_fichier || '',
                    documentType: initialData.documents?.[0]?.type_document || '',
                    fichiers: initialData.documents || [],
                    beneficiaireId: initialData.beneficiaireId || null,
                    alerte_beneficiaire: null,
                    showPreview: (initialData.documents && initialData.documents.length > 0)
                });
                setStep(2);
            } else {
                setFormData({
                    ...initialFormState,
                    matricule_adherent: user?.matricule || '',
                    code_cnam: user?.code_cnam || '',
                    nom_prenom_malade: `${user?.prenom || ''} ${user?.nom || ''}`.trim(),
                });
                setSelectedFiles([]);
                setStep(1);
            }
        } else {
            setSelectedFiles([]);
        }
    }, [isOpen, user, initialData, isEdit]);


    const handleManualFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setSelectedFiles(prev => [...prev, ...files]);
        setFormData(prev => ({
            ...prev,
            showPreview: true
        }));
        showToast(`${files.length} fichier(s) ajouté(s)`, "success");
    };

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // On analyse le premier fichier pour extraire les données, mais on garde tous les fichiers
        const fileToAnalyze = files[0];

        try {
            setIsAnalyzing(true);
            showToast("Analyse du document principal par l'IA en cours...", "info");

            const aiData = await analyzeBulletinIA(fileToAnalyze);
            
            if (aiData.est_document_medical === false) {
                showToast("ALERTE : Ce document n'est PAS un document médical valide.", "error");
                setIsAnalyzing(false);
                if (fileInputRef.current) fileInputRef.current.value = "";
                return;
            }

            const clean = (v) => {
                if (!v) return '';
                const s = String(v).toLowerCase().trim();
                if (['null', 'undefined', 'string', 'none', 'inconnu'].includes(s)) return '';
                return v;
            };

            const formatDateForInput = (dateStr) => {
                if (!dateStr) return '';
                const s = String(dateStr).trim();
                const parts = s.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
                if (parts) return `${parts[3]}-${parts[2]}-${parts[1]}`;
                if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.split(' ')[0];
                const date = new Date(s);
                if (!isNaN(date.getTime())) return date.toISOString().split('T')[0];
                return '';
            };

            setSelectedFiles(files);
            setFormData(prev => ({
                ...prev,
                numero_bulletin: clean(aiData.numero_bulletin) || prev.numero_bulletin,
                code_cnam: clean(aiData.code_cnam) || prev.code_cnam,
                matricule_adherent: clean(aiData.matricule_adherent) || user?.matricule || prev.matricule_adherent,
                nom_prenom_adherent: clean(aiData.nom_prenom_adherent) || prev.nom_prenom_adherent,
                adresse_adherent: clean(aiData.adresse_adherent) || prev.adresse_adherent,
                client: clean(aiData.client) || prev.client,
                
                nom_prenom_malade: clean(aiData.nom_prenom_malade) || prev.nom_prenom_malade,
                qualite_malade: clean(aiData.qualite_malade) || prev.qualite_malade,
                date_naissance_malade: formatDateForInput(aiData.date_naissance_malade) || prev.date_naissance_malade,
                
                date_soin: formatDateForInput(aiData.date_soin) || prev.date_soin,
                
                est_apci: aiData.est_apci ?? prev.est_apci,
                suivi_grossesse: aiData.suivi_grossesse ?? prev.suivi_grossesse,
                date_prevue_accouchement: formatDateForInput(aiData.date_prevue_accouchement) || prev.date_prevue_accouchement,
                soins_cadre: clean(aiData.soins_cadre) || prev.soins_cadre,
                
                pharmacie: aiData.pharmacie ? {
                    identifiant_unique_mf: clean(aiData.pharmacie.identifiant_unique_mf) || '',
                    est_cachet: aiData.pharmacie.est_cachet || false,
                    est_signature: aiData.pharmacie.est_signature || false,
                    date: formatDateForInput(aiData.pharmacie.date) || '',
                    montant_pharmacie: Number(aiData.pharmacie.montant_pharmacie) || 0
                } : prev.pharmacie,
                
                actes: Array.isArray(aiData.actes) ? aiData.actes.map(a => ({
                    date_acte: formatDateForInput(a.date_acte) || '',
                    acte: clean(a.acte) || '',
                    cote: a.cote || null,
                    code_acte: clean(a.code_acte) || '',
                    numero_dent: clean(a.numero_dent) || '',
                    honoraires: Number(a.honoraires) || 0,
                    identifiant_unique_mf: clean(a.identifiant_unique_mf) || '',
                    est_cachet: a.est_cachet || false,
                    est_signature: a.est_signature || false,
                    date_cachet_signature: formatDateForInput(a.date_cachet_signature) || ''
                })) : prev.actes,
                
                montant_total: Number(aiData.montant_total) || prev.montant_total,
                
                // Champs UI
                type_dossier: clean(aiData.type_dossier) || prev.type_dossier,
                est_suspect: aiData.est_suspect || false,
                zones_modifiees: clean(aiData.zones_modifiees) || '',
                confiance_score: aiData.confiance_score || 0,
                documentHash: aiData.hash_fichier || '',
                documentType: clean(aiData.type_document) || '',
                beneficiaireId: aiData.beneficiaireId !== undefined ? aiData.beneficiaireId : null,
                alerte_beneficiaire: aiData.alerte_beneficiaire || null,
                showPreview: true
            }));

            setStep(2);
        } catch (error) {
            console.error(error);
            showToast(error.message || "Erreur lors de l'analyse du fichier", "error");
        } finally {
            setIsAnalyzing(false);
            setIsUploadingDoc(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    // Calcul automatique du montant total
    useEffect(() => {
        const actesTotal = formData.actes.reduce((sum, a) => sum + (Number(a.honoraires) || 0), 0);
        const pharmacieTotal = Number(formData.pharmacie.montant_pharmacie) || 0;
        const total = (actesTotal + pharmacieTotal).toFixed(3);
        
        if (total !== String(formData.montant_total)) {
            setFormData(prev => ({ ...prev, montant_total: Number(total) }));
        }
    }, [formData.actes, formData.pharmacie.montant_pharmacie]);

    const addActe = () => {
        setFormData(prev => ({
            ...prev,
            actes: [...prev.actes, {
                date_acte: prev.date_soin,
                acte: '',
                cote: null,
                code_acte: '',
                numero_dent: '',
                honoraires: 0,
                identifiant_unique_mf: '',
                est_cachet: false,
                est_signature: false,
                date_cachet_signature: ''
            }]
        }));
    };

    const updateActe = (index, fields) => {
        setFormData(prev => {
            const newActes = [...prev.actes];
            newActes[index] = { ...newActes[index], ...fields };
            return { ...prev, actes: newActes };
        });
    };

    const removeActe = (index) => {
        setFormData(prev => ({
            ...prev,
            actes: prev.actes.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEdit) {
                const updated = await updateBulletin(initialData.id, formData, selectedFiles);
                onSubmit(updated.bulletin);
            } else {
                const result = await createBulletin(formData, selectedFiles);
                onSubmit(result.bulletin);
            }
            setStep(1);
            setSelectedFiles([]);
            showToast(isEdit ? "Bulletin mis à jour avec succès !" : "Bulletin enregistré avec succès !", "success");
            onClose();
        } catch (error) {
            console.error(error);
            showToast(error?.message || "Erreur lors de l'opération", "error");
        }
    };

    const backdropVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 }
    };

    const modalVariants = {
        hidden: { opacity: 0, scale: 0.9, y: 20 },
        visible: { opacity: 1, scale: 1, y: 0 }
    };

    if (!isOpen) return null;
    
    // On définit le fichier actuellement prévisualisé
    const currentPreviewFile = selectedFiles[previewIndex];
    const currentExistingFile = !currentPreviewFile && formData.fichiers?.[previewIndex];
    const showSidePreview = step === 2 && (selectedFiles.length > 0 || (formData.fichiers && formData.fichiers.length > 0));

    const removeFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        if (previewIndex >= selectedFiles.length - 1 && previewIndex > 0) {
            setPreviewIndex(previewIndex - 1);
        }
    };

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            variants={backdropVariants}
                            onClick={onClose}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />

                        <motion.div
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            variants={modalVariants}
                            className={`relative bg-white dark:bg-slate-900 w-full rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[95vh] flex flex-col transition-all duration-500 ${showSidePreview ? 'max-w-7xl' : 'max-w-2xl'}`}
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-r from-purple-700 to-indigo-800 p-8 text-white relative sticky top-0 z-10">
                                <button
                                    onClick={onClose}
                                    className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all"
                                >
                                    <X size={20} />
                                </button>
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                        <FileText size={32} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black tracking-tight">{isEdit ? 'Modifier le Bulletin' : 'Nouveau Bulletin de Soin'}</h2>
                                        <p className="text-purple-100 text-sm font-medium">
                                            {isAnalyzing ? "Analyse IA en cours..." : isEdit ? 'Vérification et modification' : `Étape ${step} sur 2 : ${step === 1 ? 'Scan IA du document' : 'Vérification et confirmation'}`}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className={`flex flex-col lg:flex-row overflow-hidden h-full ${showSidePreview ? 'lg:divide-x lg:divide-x-reverse divide-slate-100 dark:divide-slate-800' : ''}`}>
                                {/* Preview Column */}
                                {showSidePreview && (
                                    <div className="flex-1 bg-slate-50 dark:bg-slate-950 p-6 overflow-hidden flex flex-col min-h-[400px] lg:min-h-0 border-b lg:border-b-0 border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center justify-between mb-4 shrink-0">
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                <Eye size={14} className="text-purple-500" /> APERÇU DU JUSTIFICATIF { (selectedFiles.length + (formData.fichiers?.length || 0)) > 1 ? `(${previewIndex + 1}/${selectedFiles.length + (formData.fichiers?.length || 0)})` : '' }
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                { (selectedFiles.length + (formData.fichiers?.length || 0)) > 1 && (
                                                    <div className="flex gap-1 mr-2">
                                                        <button 
                                                            type="button"
                                                            onClick={() => setPreviewIndex(prev => Math.max(0, prev - 1))}
                                                            disabled={previewIndex === 0}
                                                            className="p-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-30"
                                                        >
                                                            <ChevronRight className="rotate-180" size={14} />
                                                        </button>
                                                        <button 
                                                            type="button"
                                                            onClick={() => setPreviewIndex(prev => Math.min(selectedFiles.length + (formData.fichiers?.length || 0) - 1, prev + 1))}
                                                            disabled={previewIndex === selectedFiles.length + (formData.fichiers?.length || 0) - 1}
                                                            className="p-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-30"
                                                        >
                                                            <ChevronRight size={14} />
                                                        </button>
                                                    </div>
                                                ) }
                                                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-[9px] font-black uppercase">
                                                    { (currentPreviewFile?.name || currentExistingFile?.fichier || '').split('.').pop().toUpperCase() }
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <DocumentPreview file={currentPreviewFile} url={currentExistingFile?.fichier} />
                                        </div>
                                    </div>
                                )}

                                {/* Form Column */}
                                <div className={`flex-1 overflow-y-auto ${showSidePreview ? 'lg:max-w-2xl' : ''}`}>
                                    <form onSubmit={handleSubmit} className="p-8">
                                        {step === 1 ? (
                                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                                <div className="text-center mb-8 mt-4">
                                                    <div className="inline-flex items-center justify-center p-4 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-4">
                                                        <Upload size={32} className="text-purple-600 dark:text-purple-400" />
                                                    </div>
                                                    <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Déposez votre justificatif</h3>
                                                    <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">Notre Intelligence Artificielle va scanner et extraire automatiquement toutes les informations.</p>
                                                </div>

                                                <div className="border-2 border-dashed border-purple-200 dark:border-purple-800 rounded-3xl p-12 flex flex-col items-center justify-center gap-6 bg-purple-50/50 dark:bg-purple-900/10 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all cursor-pointer group relative">
                                                    <input
                                                        ref={fileInputRef}
                                                        type="file"
                                                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                        onChange={handleFileUpload}
                                                        disabled={isAnalyzing}
                                                        accept=".pdf,image/*"
                                                        multiple
                                                    />
                                                    <div className={`p-6 bg-white dark:bg-slate-800 rounded-full shadow-lg group-hover:scale-110 transition-transform ${isAnalyzing ? 'animate-pulse ring-4 ring-purple-500/30' : ''}`}>
                                                        <Upload className={`${isAnalyzing ? 'text-purple-600' : 'text-purple-500'}`} size={32} />
                                                    </div>
                                                    <div className="text-center space-y-1">
                                                        <p className="text-lg font-black text-slate-700 dark:text-slate-200">
                                                            {isAnalyzing ? "Analyse IA en cours..." : "Cliquez ou Glissez un fichier ici"}
                                                        </p>
                                                        <p className="text-xs font-medium text-slate-400">PDF, JPG, PNG acceptés</p>
                                                    </div>
                                                </div>

                                                <div className="flex justify-center mt-8">
                                                    <button
                                                        type="button"
                                                        onClick={() => setStep(2)}
                                                        className="group relative flex items-center gap-4 px-8 py-4 bg-gradient-to-r from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20 hover:from-purple-100 hover:to-fuchsia-100 dark:hover:from-purple-900/40 dark:hover:to-fuchsia-900/40 border border-purple-200/50 dark:border-purple-700/50 rounded-2xl text-sm font-black transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/20 active:scale-95 overflow-hidden"
                                                    >
                                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out"></div>
                                                        <div className="relative p-2.5 bg-white dark:bg-slate-800 shadow-sm rounded-xl text-purple-600 dark:text-purple-400 group-hover:scale-110 group-hover:text-fuchsia-600 dark:group-hover:text-fuchsia-400 transition-all duration-300">
                                                            <FileText size={18} />
                                                        </div>
                                                        <span className="relative z-10 bg-gradient-to-r from-purple-700 to-fuchsia-600 dark:from-purple-300 dark:to-fuchsia-300 bg-clip-text text-transparent group-hover:from-fuchsia-700 group-hover:to-purple-700 transition-all duration-500">
                                                            Saisir les informations manuellement
                                                        </span>
                                                        <div className="relative p-1.5 bg-purple-200 dark:bg-purple-800/80 rounded-lg text-purple-700 dark:text-purple-300 transform group-hover:translate-x-1 transition-all duration-300">
                                                            <ChevronRight size={14} strokeWidth={3} />
                                                        </div>
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl border border-green-100 dark:border-green-800 flex items-center gap-3">
                                                    <div className="p-2 bg-green-500 rounded-lg text-white">
                                                        <CheckCircle2 size={18} />
                                                    </div>
                                                    <h3 className="text-sm font-bold text-green-900 dark:text-green-100 uppercase tracking-tight">Vérifiez et complétez les données</h3>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Matricule Adhérent</label>
                                                        <input
                                                            className="w-full p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm dark:text-white"
                                                            value={formData.matricule_adherent}
                                                            onChange={e => setFormData({ ...formData, matricule_adherent: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nom Adhérent</label>
                                                        <input
                                                            className="w-full p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm dark:text-white"
                                                            value={formData.nom_prenom_adherent}
                                                            onChange={e => setFormData({ ...formData, nom_prenom_adherent: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="space-y-1 col-span-1 md:col-span-2">
                                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Adresse Adhérent</label>
                                                        <input
                                                            className="w-full p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm dark:text-white"
                                                            value={formData.adresse_adherent}
                                                            onChange={e => setFormData({ ...formData, adresse_adherent: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-2">
                                                            <Hash size={12} className="text-indigo-500" /> Code CNAM
                                                        </label>
                                                        <input
                                                            className="w-full p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm dark:text-white"
                                                            value={formData.code_cnam || ''}
                                                            onChange={e => setFormData({ ...formData, code_cnam: e.target.value })}
                                                            placeholder="Code CNAM"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Client / Assureur</label>
                                                        <input
                                                            className="w-full p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm dark:text-white"
                                                            value={formData.client}
                                                            onChange={e => setFormData({ ...formData, client: e.target.value })}
                                                            placeholder="Nom du client"
                                                        />
                                                    </div>
                                                    <div className="space-y-1 col-span-1 md:col-span-2">
                                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-2">
                                                            <Users size={12} className="text-purple-500" /> Personne Concernée par les soins
                                                        </label>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                            <div className="md:col-span-1 lg:col-span-1">
                                                                <input
                                                                    placeholder="Nom du patient"
                                                                    className={`w-full p-3 bg-slate-50 dark:bg-slate-800/50 border ${formData.alerte_beneficiaire ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded-xl font-bold text-sm dark:text-white`}
                                                                    value={formData.nom_prenom_malade}
                                                                    onChange={e => setFormData({ ...formData, nom_prenom_malade: e.target.value })}
                                                                />
                                                            </div>
                                                            <div>
                                                                <select
                                                                    className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm dark:text-white focus:ring-4 focus:ring-purple-500/10 outline-none"
                                                                    value={formData.qualite_malade}
                                                                    onChange={e => setFormData({ ...formData, qualite_malade: e.target.value })}
                                                                >
                                                                    <option value="Lui-même">Lui-même</option>
                                                                    <option value="Conjoint">Conjoint</option>
                                                                    <option value="Enfant">Enfant</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <div className="relative">
                                                                    <label className="absolute -top-2 left-3 bg-white dark:bg-slate-900 px-1 text-[8px] font-black uppercase text-slate-400">Date de Naissance</label>
                                                                    <input
                                                                        type="date"
                                                                        className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm dark:text-white"
                                                                        value={formData.date_naissance_malade}
                                                                        onChange={e => setFormData({ ...formData, date_naissance_malade: e.target.value })}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {formData.alerte_beneficiaire && (
                                                            <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-lg flex items-start gap-2 border border-red-100 dark:border-red-800">
                                                                <span className="text-base leading-none">⚠️</span>
                                                                <p className="flex-1">{formData.alerte_beneficiaire}</p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="space-y-1 col-span-1 md:col-span-2">
                                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Cadre de soins</label>
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                            <select
                                                                className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm dark:text-white focus:ring-4 focus:ring-purple-500/10 outline-none"
                                                                value={formData.soins_cadre}
                                                                onChange={e => {
                                                                    const val = e.target.value;
                                                                    setFormData({ 
                                                                        ...formData, 
                                                                        soins_cadre: val,
                                                                        est_apci: val === 'APCI',
                                                                        suivi_grossesse: val === 'Suivi de la grossesse'
                                                                    });
                                                                }}
                                                            >
                                                                <option value="Autres">Autres (Standard)</option>
                                                                <option value="APCI">APCI (Affection Longue Durée)</option>
                                                                <option value="Suivi de la grossesse">Suivi de la grossesse</option>
                                                            </select>
                                                            
                                                            {formData.soins_cadre === 'Suivi de la grossesse' && (
                                                                <div className="md:col-span-2">
                                                                    <div className="relative">
                                                                        <label className="absolute -top-2 left-3 bg-white dark:bg-slate-900 px-1 text-[8px] font-black uppercase text-purple-500">Date prévue accouchement</label>
                                                                        <input
                                                                            type="date"
                                                                            className="w-full p-3 bg-purple-50/30 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800/50 rounded-xl font-bold text-sm dark:text-white"
                                                                            value={formData.date_prevue_accouchement}
                                                                            onChange={e => setFormData({ ...formData, date_prevue_accouchement: e.target.value })}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Date de Soin</label>
                                                        <input type="date" required className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm dark:text-white" value={formData.date_soin} onChange={e => setFormData({ ...formData, date_soin: e.target.value })} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Montant Total (TND)</label>
                                                        <input required type="number" step="0.100" placeholder="0.000" className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm dark:text-white" value={formData.montant_total} onChange={e => setFormData({ ...formData, montant_total: e.target.value })} />
                                                    </div>

                                            {/* Section pour attacher un document */}
                                            <div className="col-span-1 md:col-span-2 space-y-2">
                                                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex justify-between">
                                                    <span>Documents Justificatifs</span>
                                                    <span>{selectedFiles.length + (formData.fichiers?.length || 0)} fichier(s)</span>
                                                </label>
                                                
                                                <div className="space-y-2">
                                                    {/* Liste des fichiers existants (si édition) */}
                                                    {formData.fichiers?.map((f, i) => (
                                                        <div key={`exist-${i}`} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl group">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 bg-slate-200 dark:bg-slate-700 rounded-lg text-slate-500">
                                                                    <FileText size={16} />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate max-w-[200px]">{f.fichier}</p>
                                                                    <p className="text-[9px] text-slate-400 uppercase font-black tracking-tighter italic">Document déjà enregistré</p>
                                                                </div>
                                                            </div>
                                                            <button 
                                                                type="button"
                                                                onClick={() => setPreviewIndex(selectedFiles.length + i)}
                                                                className="p-2 text-purple-500 hover:bg-purple-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                            >
                                                                <Eye size={16} />
                                                            </button>
                                                        </div>
                                                    ))}

                                                    {/* Liste des nouveaux fichiers sélectionnés */}
                                                    {selectedFiles.map((f, i) => (
                                                        <div key={`new-${i}`} className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-xl group">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg text-purple-600 dark:text-purple-300">
                                                                    <FileText size={16} />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate max-w-[200px]">{f.name}</p>
                                                                    <p className="text-[9px] text-purple-500 uppercase font-black tracking-tighter">Nouveau document</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => setPreviewIndex(i)}
                                                                    className="p-2 text-purple-500 hover:bg-purple-100 rounded-lg transition-all"
                                                                >
                                                                    <Eye size={16} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeFile(i)}
                                                                    className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                >
                                                                    <X size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {/* Bouton pour ajouter plus de fichiers */}
                                                    <div className="relative pt-1">
                                                        <input
                                                            ref={manualFileInputRef}
                                                            type="file"
                                                            multiple
                                                            className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full"
                                                            onChange={handleManualFileUpload}
                                                            disabled={isUploadingDoc}
                                                            accept=".pdf,image/*"
                                                        />
                                                        <button
                                                            type="button"
                                                            className="w-full flex items-center justify-center gap-2 py-3 bg-slate-50 hover:bg-purple-50 dark:bg-slate-800/50 dark:hover:bg-purple-900/20 border border-dashed border-slate-300 hover:border-purple-300 dark:border-slate-700 dark:hover:border-purple-700 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-purple-600 transition-all"
                                                        >
                                                            <Plus size={14} className="mr-1" /> Ajouter d'autres documents
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                                </div>

                                                {/* Section Actes Médicaux */}
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400 flex items-center gap-2">
                                                            <Activity size={14} /> Actes Médicaux ({formData.actes.length})
                                                        </h4>
                                                        <button
                                                            type="button"
                                                            onClick={addActe}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg text-[10px] font-black uppercase hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-all"
                                                        >
                                                            <Plus size={14} /> Ajouter un acte
                                                        </button>
                                                    </div>

                                                    <div className="space-y-4">
                                                        {formData.actes.map((acte, idx) => (
                                                            <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 relative group animate-in slide-in-from-top-2 duration-300">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeActe(idx)}
                                                                    className="absolute -top-2 -right-2 p-1.5 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                                
                                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                                                    <div className="space-y-1">
                                                                        <label className="text-[8px] font-black text-slate-400 uppercase">Nature de l'acte</label>
                                                                        <input placeholder="Ex: Consultation" className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white font-bold" value={acte.acte} onChange={e => updateActe(idx, { acte: e.target.value })} />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <label className="text-[8px] font-black text-slate-400 uppercase">Date</label>
                                                                        <input type="date" className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white" value={acte.date_acte} onChange={e => updateActe(idx, { date_acte: e.target.value })} />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <label className="text-[8px] font-black text-slate-400 uppercase">Honoraires (TND)</label>
                                                                        <input type="number" step="0.1" className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white font-black text-purple-600" value={acte.honoraires} onChange={e => updateActe(idx, { honoraires: Number(e.target.value) })} />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <label className="text-[8px] font-black text-slate-400 uppercase">MF Médecin</label>
                                                                        <input placeholder="MF" className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white" value={acte.identifiant_unique_mf} onChange={e => updateActe(idx, { identifiant_unique_mf: e.target.value })} />
                                                                    </div>
                                                                    
                                                                    {/* Champs optionnels / Dentaire */}
                                                                    <div className="space-y-1">
                                                                        <label className="text-[8px] font-black text-slate-400 uppercase">Code Acte (Dent.)</label>
                                                                        <input placeholder="Code" className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white" value={acte.code_acte} onChange={e => updateActe(idx, { code_acte: e.target.value })} />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <label className="text-[8px] font-black text-slate-400 uppercase">N° Dent</label>
                                                                        <input placeholder="Ex: 14" className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white" value={acte.numero_dent} onChange={e => updateActe(idx, { numero_dent: e.target.value })} />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <label className="text-[8px] font-black text-slate-400 uppercase">Cote</label>
                                                                        <input type="number" placeholder="Cote" className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white" value={acte.cote || ''} onChange={e => updateActe(idx, { cote: e.target.value ? Number(e.target.value) : null })} />
                                                                    </div>
                                                                    <div className="flex items-center gap-2 mt-4">
                                                                        <input type="checkbox" id={`cachet-${idx}`} className="w-3 h-3 rounded text-purple-600" checked={acte.est_cachet} onChange={e => updateActe(idx, { est_cachet: e.target.checked })} />
                                                                        <label htmlFor={`cachet-${idx}`} className="text-[9px] font-bold text-slate-500">Cachet/Sig</label>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        
                                                        {formData.actes.length === 0 && (
                                                            <div className="text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                                                                <p className="text-xs text-slate-400 font-medium">Aucun acte médical saisi. Ajoutez-en un ou utilisez le scan IA.</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800/50">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2"><Activity size={14} /> Détails Pharmacie</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">MF Pharmacie</label>
                                                        <input placeholder="Identifiant fiscal" className="w-full p-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white" value={formData.pharmacie.identifiant_unique_mf || ''} onChange={e => setFormData({ ...formData, pharmacie: { ...formData.pharmacie, identifiant_unique_mf: e.target.value } })} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Date Achat</label>
                                                        <input type="date" className="w-full p-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white" value={formData.pharmacie.date || ''} onChange={e => setFormData({ ...formData, pharmacie: { ...formData.pharmacie, date: e.target.value } })} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Montant Pharmacie (TND)</label>
                                                        <input type="number" step="0.001" placeholder="0.000" className="w-full p-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white font-bold" value={formData.pharmacie.montant_pharmacie || ''} onChange={e => setFormData({ ...formData, pharmacie: { ...formData.pharmacie, montant_pharmacie: Number(e.target.value) } })} />
                                                    </div>
                                                    <div className="flex items-center gap-4 col-span-full">
                                                        <div className="flex items-center gap-2">
                                                            <input type="checkbox" id="cachet_ph" className="w-4 h-4 rounded text-blue-600" checked={formData.pharmacie.est_cachet} onChange={e => setFormData({ ...formData, pharmacie: { ...formData.pharmacie, est_cachet: e.target.checked } })} />
                                                            <label htmlFor="cachet_ph" className="text-xs font-bold text-slate-600">Cachet</label>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <input type="checkbox" id="sig_ph" className="w-4 h-4 rounded text-blue-600" checked={formData.pharmacie.est_signature} onChange={e => setFormData({ ...formData, pharmacie: { ...formData.pharmacie, est_signature: e.target.checked } })} />
                                                            <label htmlFor="sig_ph" className="text-xs font-bold text-slate-600">Signature</label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                                <div className="pt-4 flex items-center justify-between gap-4">
                                                    <button type="button" onClick={() => setStep(1)} className="px-6 py-3.5 text-slate-500 font-bold hover:text-slate-700 dark:hover:text-slate-300 transition-all">Retour</button>
                                                    <button
                                                        type="submit"
                                                disabled={!formData.nom_prenom_malade || !formData.montant_total }
                                                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-green-600/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                                                    >
                                                <CheckCircle2 size={20} /> Valider et Sauvegarder
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </form>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
};

export default AddBulletinModal;
