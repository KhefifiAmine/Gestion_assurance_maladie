import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, FileText, User, Activity, Upload, ChevronRight, ChevronDown,
    Hash, Users, CheckCircle2, Lock, Eye, ExternalLink
} from 'lucide-react';
import { createBulletin, updateBulletin, analyzeBulletinIA } from '../services/bulletinService';
import { getMyBeneficiaries } from '../services/beneficiaryService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const AddBulletinModal = ({ isOpen, onClose, onSubmit, initialData = null }) => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [step, setStep] = useState(1);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isUploadingDoc, setIsUploadingDoc] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [beneficiaries, setBeneficiaries] = useState([]);
    const [isBeneficiaryDropdownOpen, setIsBeneficiaryDropdownOpen] = useState(false);
    const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
    const initialFormState = {
        code_cnam: '',
        nom_prenom_malade: '',
        qualite_malade: 'Lui-même',
        type_dossier: 'Consultation',
        date_soin: new Date().toISOString().split('T')[0],
        montant_total: '',
        matricule_adherent: user?.matricule || '',
        notes: '',
        actes: [],
        est_suspect: false,
        zones_modifiees: '',
        confiance_score: null,
        documentHash: '',
        documentType: '',
        fichierUrl: '',
        medecin: {
            nom_prenom: '',
            specialite: '',
            telephone: ''
        },
        pharmacie: {
            nom: '',
            adresse: '',
            telephone: ''
        },
        beneficiaireId: null,
        showPreview: false
    };

    const [formData, setFormData] = useState(initialFormState);
    const fileInputRef = useRef(null);
    const manualFileInputRef = useRef(null);

    const isEdit = !!initialData;

    const fetchBeneficiaries = async () => {
        try {
            const data = await getMyBeneficiaries();
            // Filtrer uniquement ceux qui sont acceptés (statut 1 d'après le contrôleur ?)
            // On va garder tout ce qui est retourné pour l'instant
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
                    code_cnam: initialData.code_cnam || '',
                    nom_prenom_malade: initialData.nom_prenom_malade || '',
                    qualite_malade: initialData.qualite_malade || 'Lui-même',
                    type_dossier: initialData.type_dossier || 'Consultation',
                    date_soin: initialData.date_soin || new Date().toISOString().split('T')[0],
                    montant_total: initialData.montant_total || '',
                    matricule_adherent: initialData.matricule_adherent || user?.matricule || '',
                    notes: initialData.notes || '',
                    actes: initialData.actes || [],
                    est_suspect: initialData.documents?.[0]?.est_suspect || false,
                    zones_modifiees: initialData.documents?.[0]?.zones_modifiees || '',
                    confiance_score: initialData.documents?.[0]?.score || null,
                    documentHash: initialData.documents?.[0]?.hash_fichier || '',
                    documentType: initialData.documents?.[0]?.type_document || '',
                    fichierUrl: initialData.documents?.[0]?.fichier || '',
                    medecin: {
                        nom_prenom: '',
                        specialite: '',
                        telephone: ''
                    },
                    pharmacie: {
                        nom: '',
                        adresse: '',
                        telephone: ''
                    },
                    beneficiaireId: initialData.beneficiaireId || null,
                    showPreview: !!initialData.documents?.[0]?.fichier
                });
                setStep(2);
            } else {
                // Réinitialisation complète pour un nouveau bulletin
                setFormData({
                    ...initialFormState,
                    matricule_adherent: user?.matricule || '',
                    code_cnam: user?.code_cnam || '',
                    nom_prenom_malade: `${user?.prenom || ''} ${user?.nom || ''}`.trim(),
                });
                setSelectedFile(null);
                setStep(1);
            }
        } else {
            setSelectedFile(null);
        }
    }, [isOpen, user, initialData, isEdit]);

    const careTypes = [
        { id: 'Consultation', label: 'Consultation Médicale', icon: <User size={18} /> },
        { id: 'Pharmacie', label: 'Pharmacie / Médicaments', icon: <Activity size={18} /> },
        { id: 'Optique', label: 'Optique / Lunettes', icon: <ChevronRight size={18} /> },
        { id: 'Dentaire', label: 'Soins Dentaires', icon: <Activity size={18} /> },
        { id: 'Analyse', label: 'Analyses Médicales', icon: <FileText size={18} /> }
    ];


    const handleManualFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setSelectedFile(file);
        setFormData(prev => ({
            ...prev,
            fichierUrl: file.name,
            showPreview: true
        }));
        showToast("Fichier bien téléchargé", "success");
    };


    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setIsAnalyzing(true);
            showToast("Analyse du document par l'IA en cours...", "info");

            const aiData = await analyzeBulletinIA(file);

            // Vérification si le document est médical
            if (aiData.est_document_medical === false) {
                showToast("Ce document n'a pas été reconnu comme un document médical valide (ordonnance, facture pharmacie, etc.).", "error");
                setIsAnalyzing(false);
                return;
            }

            setSelectedFile(file);
            setFormData(prev => ({
                ...prev,
                nom_prenom_malade: aiData.nom_prenom_malade || prev.nom_prenom_malade,
                qualite_malade: aiData.qualite_malade || prev.qualite_malade,
                montant_total: aiData.montant_total || prev.montant_total,
                date_soin: aiData.date_soin || prev.date_soin,
                type_dossier: aiData.type_dossier || prev.type_dossier,
                matricule_adherent: user?.matricule || prev.matricule_adherent,
                est_suspect: aiData.est_suspect || false,
                zones_modifiees: aiData.zones_modifiees || '',
                confiance_score: aiData.confiance_score,
                documentHash: aiData.hash_fichier || '',
                documentType: aiData.type_document || '',
                fichierUrl: file.name,
                medecin: aiData.medecin ? { ...prev.medecin, ...aiData.medecin } : prev.medecin,
                pharmacie: aiData.pharmacie ? { ...prev.pharmacie, ...aiData.pharmacie } : prev.pharmacie,
                beneficiaireId: null,
                showPreview: true
            }));

            // Tentative de matching automatique du bénéficiaire par rapport au nom trouvé par l'IA
            /*if (aiData.nom_prenom_malade) {
                const normalizedName = String(aiData.nom_prenom_malade || '').toLowerCase();
                const userNom = String(user?.nom || '').toLowerCase();
                const userPrenom = String(user?.prenom || '').toLowerCase();

                // Vérifier si c'est l'adhérent lui-même
                if (user && (userNom.includes(normalizedName) || userPrenom.includes(normalizedName) || normalizedName.includes(userNom))) {
                    setFormData(prev => ({
                        ...prev,
                        qualite_malade: 'Lui-même',
                        nom_prenom_malade: `${user?.prenom || ''} ${user?.nom || ''}`.trim(),
                        beneficiaireId: null
                    }));
                } else if (beneficiaries && Array.isArray(beneficiaries)) {
                    // Vérifier dans les bénéficiaires sauvegardés
                    const found = beneficiaries.find(b => {
                        const bNom = String(b.nom || '').toLowerCase();
                        const bPrenom = String(b.prenom || '').toLowerCase();
                        return bNom.includes(normalizedName) || bPrenom.includes(normalizedName) || normalizedName.includes(bNom);
                    });

                    if (found) {
                        setFormData(prev => ({
                            ...prev,
                            qualite_malade: found.relation || 'Autre',
                            nom_prenom_malade: `${found.prenom || ''} ${found.nom || ''}`.trim(),
                            beneficiaireId: found.id
                        }));
                    }
                }
            }*/

            setStep(2); // Aller directement à l'étape de vérification
        } catch (error) {
            console.error(error);
            showToast(error.message || "Erreur lors de l'analyse du fichier", "error");
        } finally {
            setIsAnalyzing(false);
            setIsUploadingDoc(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEdit) {
                const updated = await updateBulletin(initialData.id, formData, selectedFile);
                onSubmit(updated.bulletin);
            } else {
                const result = await createBulletin(formData, selectedFile);
                onSubmit(result.bulletin);
            }
            setStep(1);
            setSelectedFile(null);
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

    const DocumentPreview = ({ file, url }) => {
        if (!file && !url) return null;

        // Si on a un fichier local (objet File), on utilise createObjectURL
        // Sinon on utilise l'URL du backend
        const fileUrl = file ? URL.createObjectURL(file) : `http://localhost:5000/uploads/${url}`;
        const fileName = file ? file.name : url;
        const isPdf = fileName?.toLowerCase().endsWith('.pdf');

        return (
            <div className="h-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 flex items-center justify-center relative group min-h-[400px] lg:min-h-0">
                {isPdf ? (
                    <iframe
                        src={`${fileUrl}#toolbar=0`}
                        className="w-full h-full min-h-[500px]"
                        title="Aperçu du document"
                    />
                ) : (
                    <img
                        src={fileUrl}
                        alt="Aperçu"
                        className="max-w-full h-full object-contain"
                        onLoad={() => {
                            // Si c'est un blob local, on pourrait vouloir libérer l'URL après chargement
                            // Mais attention si le composant re-render
                        }}
                    />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-4 bg-white rounded-full text-purple-600 hover:scale-110 transition-transform shadow-xl"
                        title="Ouvrir dans un nouvel onglet"
                    >
                        <ExternalLink size={24} />
                    </a>
                </div>
            </div>
        );
    };

    const showSidePreview = step === 2 && formData.fichierUrl;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
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
                    className={`relative bg-white dark:bg-slate-900 w-full rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-[95vh] flex flex-col transition-all duration-500 ${showSidePreview ? 'max-w-7xl' : 'max-w-2xl'}`}
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
                                        <Eye size={14} className="text-purple-500" /> APERÇU DU JUSTIFICATIF
                                    </h3>
                                    <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-[9px] font-black uppercase">
                                        {formData.fichierUrl.split('.').pop().toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <DocumentPreview file={selectedFile} url={formData.fichierUrl} />
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
                                                {/* Shine effect */}
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
                                                    readOnly
                                                    className="w-full p-3 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed"
                                                    value={formData.matricule_adherent}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-2">
                                                    <Hash size={12} className="text-indigo-500" /> Code CNAM
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        readOnly
                                                        className="w-full p-3 pr-10 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800/40 rounded-xl font-black text-sm text-indigo-700 dark:text-indigo-300 cursor-not-allowed"
                                                        value={formData.code_cnam || ''}
                                                        placeholder="Non attribué"
                                                    />
                                                    <Lock size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 opacity-60" />
                                                </div>
                                                {!formData.code_cnam && (
                                                    <p className="text-[9px] text-amber-500 font-bold ml-1">⚠ Code CNAM non attribué — Tu peux l'ajouter ou modifier au section information personnelles</p>
                                                )}
                                            </div>
                                            <div className="space-y-1 col-span-1 md:col-span-2">
                                                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-2">
                                                    <Users size={12} className="text-purple-500" /> Personne Concernée par les soins
                                                </label>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="relative">
                                                        <button
                                                            type="button"
                                                            onClick={() => setIsBeneficiaryDropdownOpen(!isBeneficiaryDropdownOpen)}
                                                            className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm dark:text-white text-left focus:ring-4 focus:ring-purple-500/10 transition-all"
                                                        >
                                                            <span className="truncate">
                                                                {formData.beneficiaireId
                                                                    ? beneficiaries.find(b => b.id === formData.beneficiaireId)?.prenom + ' ' + beneficiaries.find(b => b.id === formData.beneficiaireId)?.nom
                                                                    : `Lui-même (${user?.prenom} ${user?.nom})`}
                                                            </span>
                                                            <ChevronDown className={`shrink-0 transition-transform ${isBeneficiaryDropdownOpen ? 'rotate-180' : ''}`} size={16} />
                                                        </button>

                                                        <AnimatePresence>
                                                            {isBeneficiaryDropdownOpen && (
                                                                <>
                                                                    <div className="fixed inset-0 z-[1001]" onClick={() => setIsBeneficiaryDropdownOpen(false)} />
                                                                    <motion.div
                                                                        initial={{ opacity: 0, y: 10 }}
                                                                        animate={{ opacity: 1, y: 5 }}
                                                                        exit={{ opacity: 0, y: 10 }}
                                                                        className="absolute top-full left-0 right-0 z-[1002] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl p-2 max-h-60 overflow-y-auto"
                                                                    >
                                                                        <button
                                                                            type="button"
                                                                            className={`w-full text-left p-3 rounded-xl text-sm font-bold transition-all ${!formData.beneficiaireId ? 'bg-purple-600 text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-white'}`}
                                                                            onClick={() => {
                                                                                const pNom = user?.prenom || '';
                                                                                const nNom = user?.nom || '';
                                                                                setFormData({ ...formData, qualite_malade: 'Lui-même', nom_prenom_malade: `${pNom} ${nNom}`.trim(), beneficiaireId: null });
                                                                                setIsBeneficiaryDropdownOpen(false);
                                                                            }}
                                                                        >
                                                                            Lui-même ({user?.prenom} {user?.nom})
                                                                        </button>
                                                                        {beneficiaries.map(b => (
                                                                            <button
                                                                                key={b.id}
                                                                                type="button"
                                                                                className={`w-full text-left p-3 rounded-xl text-sm font-bold transition-all ${formData.beneficiaireId === b.id ? 'bg-purple-600 text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-white'}`}
                                                                                onClick={() => {
                                                                                    setFormData({
                                                                                        ...formData,
                                                                                        qualite_malade: b.relation || 'Autre',
                                                                                        nom_prenom_malade: `${b.prenom || ''} ${b.nom || ''}`.trim(),
                                                                                        beneficiaireId: b.id
                                                                                    });
                                                                                    setIsBeneficiaryDropdownOpen(false);
                                                                                }}
                                                                            >
                                                                                {b.prenom} {b.nom} ({b.relation})
                                                                            </button>
                                                                        ))}
                                                                    </motion.div>
                                                                </>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                    <input
                                                        placeholder="Confirmation du nom"
                                                        className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm dark:text-white"
                                                        value={formData.nom_prenom_malade}
                                                        onChange={e => setFormData({ ...formData, nom_prenom_malade: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            {/* Nouveaux champs rajoutés suite à la fusion */}
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Date de Soin</label>
                                                <input type="date" required className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm dark:text-white" value={formData.date_soin} onChange={e => setFormData({ ...formData, date_soin: e.target.value })} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Montant Total (TND)</label>
                                                <input required type="number" step="0.100" placeholder="0.000" className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm dark:text-white" value={formData.montant_total} onChange={e => setFormData({ ...formData, montant_total: e.target.value })} />
                                            </div>
                                            <div className="col-span-2 space-y-1">
                                                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Type de Document</label>
                                                <div className="relative">
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                                                        className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm dark:text-white text-left focus:ring-4 focus:ring-purple-500/10 transition-all"
                                                    >
                                                        <span>{careTypes.find(c => c.id === formData.type_dossier)?.label || 'Choisir un type...'}</span>
                                                        <ChevronDown className={`shrink-0 transition-transform ${isTypeDropdownOpen ? 'rotate-180' : ''}`} size={16} />
                                                    </button>

                                                    <AnimatePresence>
                                                        {isTypeDropdownOpen && (
                                                            <>
                                                                <div className="fixed inset-0 z-[1001]" onClick={() => setIsTypeDropdownOpen(false)} />
                                                                <motion.div
                                                                    initial={{ opacity: 0, y: 10 }}
                                                                    animate={{ opacity: 1, y: 5 }}
                                                                    exit={{ opacity: 0, y: 10 }}
                                                                    className="absolute top-full left-0 right-0 z-[1002] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl p-2"
                                                                >
                                                                    {careTypes.map(c => (
                                                                        <button
                                                                            key={c.id}
                                                                            type="button"
                                                                            className={`w-full text-left p-3 rounded-xl text-sm font-bold transition-all flex items-center gap-3 ${formData.type_dossier === c.id ? 'bg-purple-600 text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-white'}`}
                                                                            onClick={() => {
                                                                                setFormData({ ...formData, type_dossier: c.id, documentType: c.id });
                                                                                setIsTypeDropdownOpen(false);
                                                                            }}
                                                                        >
                                                                            {c.icon}
                                                                            {c.label}
                                                                        </button>
                                                                    ))}
                                                                </motion.div>
                                                            </>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </div>

                                            {/* Section pour attacher un document */}
                                            <div className="col-span-1 md:col-span-2 space-y-1">
                                                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Document Justificatif</label>
                                                <div className="relative">
                                                    {formData.fichierUrl ? (
                                                        <div className="space-y-4">
                                                            <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-xl">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg text-purple-600 dark:text-purple-300">
                                                                        <FileText size={18} />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate max-w-[200px] sm:max-w-[300px]">{formData.fichierUrl}</p>
                                                                        <p className="text-[10px] font-medium text-purple-500 uppercase tracking-tight">Document attaché avec succès</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setSelectedFile(null);
                                                                            setFormData({ ...formData, fichierUrl: '', documentHash: '', showPreview: false });
                                                                        }}
                                                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                    >
                                                                        <X size={16} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="relative">
                                                            <input
                                                                ref={manualFileInputRef}
                                                                type="file"
                                                                className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full"
                                                                onChange={handleManualFileUpload}
                                                                disabled={isUploadingDoc}
                                                            />
                                                            <button
                                                                type="button"
                                                                className="w-full flex items-center justify-center gap-2 p-4 bg-slate-50 hover:bg-purple-50 dark:bg-slate-800/50 dark:hover:bg-purple-900/20 border-2 border-dashed border-slate-200 hover:border-purple-300 dark:border-slate-700 dark:hover:border-purple-700 rounded-xl font-bold text-sm text-slate-500 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400 focus:ring-4 focus:ring-purple-500/10 transition-all"
                                                            >
                                                                {isUploadingDoc ? (
                                                                    <>
                                                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent"></div>
                                                                        Importation en cours...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Upload size={18} />
                                                                        Ajouter le document justificatif
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                        </div>

                                        <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-800/50">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-3 flex items-center gap-2"><User size={14} /> Informations du Médecin Trouvées</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <input placeholder="Nom du médecin" className="w-full p-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white" value={formData.medecin.nom_prenom} onChange={e => setFormData({ ...formData, medecin: { ...formData.medecin, nom_prenom: e.target.value } })} />
                                                <input placeholder="Spécialité médecin" className="w-full p-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white" value={formData.medecin.specialite} onChange={e => setFormData({ ...formData, medecin: { ...formData.medecin, specialite: e.target.value } })} />
                                            </div>
                                        </div>

                                        {(formData.type_dossier === 'Pharmacie' || formData.documentType === 'Facture Pharmacie') && (
                                            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800/50">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2"><Activity size={14} /> Détails Pharmacie</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <input placeholder="Nom de la pharmacie" className="w-full p-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white" value={formData.pharmacie.nom || ''} onChange={e => setFormData({ ...formData, pharmacie: { ...formData.pharmacie, nom: e.target.value } })} />
                                                    <input placeholder="Téléphone pharmacie" className="w-full p-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white" value={formData.pharmacie.telephone || ''} onChange={e => setFormData({ ...formData, pharmacie: { ...formData.pharmacie, telephone: e.target.value } })} />
                                                </div>
                                            </div>
                                        )}

                                        <div className="pt-4 flex items-center justify-between gap-4">
                                            <button type="button" onClick={() => setStep(1)} className="px-6 py-3.5 text-slate-500 font-bold hover:text-slate-700 dark:hover:text-slate-300 transition-all">Retour</button>
                                            <button
                                                type="submit"
                                                disabled={!formData.nom_prenom_malade || !formData.montant_total}
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
        </AnimatePresence>
    );
};

export default AddBulletinModal;
