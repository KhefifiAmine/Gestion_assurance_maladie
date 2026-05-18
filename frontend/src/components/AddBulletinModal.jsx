import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, FileText, User, Activity, Upload, ChevronRight, ChevronDown,
    Hash, Users, CheckCircle2, Lock, Eye, ExternalLink, Plus, Download
} from 'lucide-react';
import { createBulletin, updateBulletin, analyzeBulletinIA, downloadPreFilledBulletin } from '../services/bulletinService';
import { getMyBeneficiaries } from '../services/beneficiaryService';
import { UPLOADS_BASE } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const ACTE_STRUCTURE = {
    "Consultation": ["C1", "C2", "C3", "V1", "V2", "V3"],
    "Analyses": ["B"],
    "Actes médicaux courants": ["PC", "AMM", "AMO", "AMY"],
    "Chirurgie": ["KC"],
    "Radiologie / Électroradiologie": ["R", "REK"],
    "Optique": ["Monture", "Verre"],
    "Dentaire": ["Soin dentaire", "Orthopedie Dento Faciale", "Prothèses dentaires", "Implants dentaires"],
    "Hospitalisation": ["Clinique", "Hôpital", "Réanimation", "Couveuse", "Usage unique medical"],
    "Maternité": ["Accouchement simple", "Gémellaire", "Stérilité"],
    "Divers": ["Transport Maladie", "Circoncision", "Cure thermale"],
    "Traitement Spécial": ["Traitement spécial"],
    "Orthopédie / Prothèse": ["Orthopédie", "Prothèse"],
    "Salle d’opération": ["SO"],
    "Anesthésie": ["ANE"]
};

// --- Utilities ---
const cleanIAValue = (v) => {
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

// --- Sub-components ---
const DocumentPreview = memo(({ file, url }) => {
    const [fileUrl, setFileUrl] = useState(null);

    useEffect(() => {
        let objectUrl = null;
        if (file) {
            objectUrl = URL.createObjectURL(file);
            setFileUrl(objectUrl);
        } else if (url) {
            setFileUrl(`${UPLOADS_BASE}/uploads/${url}`);
        }
        return () => {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [file, url]);

    if (!fileUrl) return null;

    const fileName = file ? file.name : url;
    const isPdf = fileName?.toLowerCase().endsWith('.pdf');

    return (
        <div className="h-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 flex items-center justify-center relative group min-h-[400px] lg:min-h-0">
            {isPdf ? (
                <iframe src={`${fileUrl}#toolbar=0`} className="w-full h-full" title="Aperçu du document" />
            ) : (
                <img src={fileUrl} alt="Aperçu" className="max-w-full h-full object-contain" />
            )}
        </div>
    );
});

const FormField = memo(({ label, icon: Icon, children, className = "" }) => (
    <div className={`space-y-1 ${className}`}>
        {label && (
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-2">
                {Icon && <Icon size={12} className="text-purple-500" />}
                {label}
            </label>
        )}
        {children}
    </div>
));

const ActeItem = memo(({ acte, index, onUpdate, onRemove, structure, onLookup }) => (
    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 relative group animate-in slide-in-from-top-2 duration-300">
        <button
            type="button"
            onClick={() => onRemove(index)}
            className="absolute -top-2 -right-2 p-1.5 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-10"
        >
            <X size={14} />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <FormField label="Nature de l'acte">
                <select 
                    className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white font-bold" 
                    value={acte.acte || ''} 
                    onChange={e => onUpdate(index, { acte: e.target.value })}
                >
                    <option value="">Sélectionner...</option>
                    {Object.keys(structure).map(k => <option key={k} value={k}>{k}</option>)}
                </select>
            </FormField>

            <FormField label="Cote / Code">
                <select 
                    className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white font-bold" 
                    value={acte.cote || ''} 
                    onChange={e => onUpdate(index, { cote: e.target.value })}
                >
                    <option value="">Cote...</option>
                    {acte.acte && structure[acte.acte]?.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </FormField>
            {acte.acte === "Dentaire" ? (
                <>
                    <FormField label="Code acte">
                        <input 
                            placeholder="Code de l'acte" 
                            className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white font-black" 
                            value={acte.code_acte || ''} 
                            onChange={e => onUpdate(index, { code_acte: e.target.value })} 
                        />
                    </FormField>
                    
                    <FormField label="N° Dent">
                        <input placeholder="Ex: 14" className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white" value={acte.numero_dent || ''} onChange={e => onUpdate(index, { numero_dent: e.target.value })} />
                    </FormField>
                </>
            ) : <></>}
            <FormField label="Date">
                <input type="date" className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white" value={acte.date_acte || ''} onChange={e => onUpdate(index, { date_acte: e.target.value })} />
            </FormField>

            <FormField label="Honoraires (TND)">
                <input type="number" step="0.1" className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white font-black text-purple-600" value={acte.honoraires || 0} onChange={e => onUpdate(index, { honoraires: Number(e.target.value) })} />
            </FormField>

            <FormField label="MF Médecin">
                <input placeholder="MF" className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white" value={acte.prestataire?.identifiant_unique_mf || ''} onChange={e => onUpdate(index, { prestataire: { ...(acte.prestataire || {}), identifiant_unique_mf: e.target.value } })} onBlur={e => onLookup && onLookup(e.target.value, p => onUpdate(index, { prestataire: { ...(acte.prestataire || {}), identifiant_unique_mf: p.identifiant_unique_mf || '', nom: p.nom || '', telephone: p.telephone || '', adresse: p.adresse || '', specialite: p.specialite || '', gsm: p.gsm || '' } }))} />
            </FormField>

            <FormField label="Nom Prestataire">
                <input placeholder="Nom" className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white" value={acte.prestataire?.nom || ''} onChange={e => onUpdate(index, { prestataire: { ...(acte.prestataire || {}), nom: e.target.value } })} />
            </FormField>

            <FormField label="Téléphone">
                <input placeholder="Téléphone" className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white" value={acte.prestataire?.telephone || ''} onChange={e => onUpdate(index, { prestataire: { ...(acte.prestataire || {}), telephone: e.target.value } })} onBlur={e => onLookup && onLookup(e.target.value, p => onUpdate(index, { prestataire: { ...(acte.prestataire || {}), identifiant_unique_mf: p.identifiant_unique_mf || '', nom: p.nom || '', telephone: p.telephone || '', adresse: p.adresse || '', specialite: p.specialite || '', gsm: p.gsm || '' } }))} />
            </FormField>

            <FormField label="Adresse">
                <input placeholder="Adresse" className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white" value={acte.prestataire?.adresse || ''} onChange={e => onUpdate(index, { prestataire: { ...(acte.prestataire || {}), adresse: e.target.value } })} />
            </FormField>

            <FormField label="Spécialité">
                <input placeholder="Spécialité" className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white" value={acte.prestataire?.specialite || ''} onChange={e => onUpdate(index, { prestataire: { ...(acte.prestataire || {}), specialite: e.target.value } })} />
            </FormField>

            <FormField label="GSM">
                <input placeholder="GSM" className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white" value={acte.prestataire?.gsm || ''} onChange={e => onUpdate(index, { prestataire: { ...(acte.prestataire || {}), gsm: e.target.value } })} />
            </FormField>

            <FormField label="Nb Jours">
                <input type="number" placeholder="Ex: 5" className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white" value={acte.nb_jour || ''} onChange={e => onUpdate(index, { nb_jour: Number(e.target.value) })} />
            </FormField>

            
            <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" id={`cachet-${index}`} className="w-3 h-3 rounded text-purple-600" checked={!!acte.est_cachet} onChange={e => onUpdate(index, { est_cachet: e.target.checked })} />
                <label htmlFor={`cachet-${index}`} className="text-[9px] font-bold text-slate-500">Cachet/Signature</label>
            </div>
        </div>
    </div>
));

const MedicamentItem = memo(({ med, index, onUpdate, onRemove }) => (
    <div className="p-4 bg-white dark:bg-slate-900/50 rounded-xl border border-blue-100 dark:border-blue-800 relative group animate-in slide-in-from-top-2 duration-300">
        <button
            type="button"
            onClick={() => onRemove(index)}
            className="absolute -top-2 -right-2 p-1.5 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-10"
        >
            <X size={14} />
        </button>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <FormField label="Nom" className="lg:col-span-1">
                <input 
                    placeholder="Ex: Doliprane" 
                    className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white font-bold" 
                    value={med.nom_medicament || ''} 
                    onChange={e => onUpdate(index, { nom_medicament: e.target.value })} 
                />
            </FormField>
            <FormField label="Dosage">
                <input placeholder="1000mg" className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white" value={med.dosage || ''} onChange={e => onUpdate(index, { dosage: e.target.value })} />
            </FormField>
            <FormField label="Qté">
                <input type="number" className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white font-black" value={med.quantite || 1} onChange={e => onUpdate(index, { quantite: Number(e.target.value) })} />
            </FormField>
            <FormField label="P.U (TND)">
                <input type="number" step="0.001" className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white font-black text-blue-600" value={med.prix_unitaire || 0} onChange={e => onUpdate(index, { prix_unitaire: Number(e.target.value) })} />
            </FormField>
            <FormField label="M.T (TND)">
                <input type="number" step="0.001" className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white font-black text-blue-600 cursor-not-allowed" value={med.montant_total} readOnly/>
            </FormField>
        </div>
    </div>
));

const FileItem = memo(({ file, index, isNew, onPreview, onRemove }) => (
    <div className={`flex items-center justify-between p-3 rounded-xl group border ${isNew ? 'bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800' : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700'}`}>
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isNew ? 'bg-purple-100 dark:bg-purple-800 text-purple-600' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                <FileText size={16} />
            </div>
            <div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate max-w-[200px]">{isNew ? file.name : file.fichier}</p>
                <p className={`text-[9px] uppercase font-black tracking-tighter ${isNew ? 'text-purple-500' : 'text-slate-400 italic'}`}>
                    {isNew ? 'Nouveau document' : 'Document déjà enregistré'}
                </p>
            </div>
        </div>
        <div className="flex items-center gap-1">
            <button type="button" onClick={() => onPreview(index)} className="p-2 text-purple-500 hover:bg-purple-50 rounded-lg transition-all" title="Voir l'aperçu">
                <Eye size={16} />
            </button>
            <button type="button" onClick={() => onRemove(index)} className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Supprimer">
                <X size={16} />
            </button>
        </div>
    </div>
));

// --- Main Component ---
const AddBulletinModal = ({ isOpen, onClose, onSubmit, initialData = null }) => {
    const { user } = useAuth();
    const { showToast } = useToast();
    
    // UI State
    const [step, setStep] = useState(1);
    const [subStep, setSubStep] = useState('choice'); 
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previewIndex, setPreviewIndex] = useState(0);
    const [beneficiaries, setBeneficiaries] = useState([]);
    const [isBeneficiaryDropdownOpen, setIsBeneficiaryDropdownOpen] = useState(false);

    const initialFormState = useMemo(() => ({
        numero_bulletin: '',
        code_cnam: user?.code_cnam || '',
        matricule_adherent: user?.matricule || '',
        nom_prenom_adherent: `${user?.prenom || ''} ${user?.nom || ''}`.trim(),
        adresse_adherent: user?.adresse || '',
        client: '',
        nom_prenom_malade: `${user?.prenom || ''} ${user?.nom || ''}`.trim(),
        qualite_malade: 'Titulaire',
        date_naissance_malade: '',
        date_soin: new Date().toISOString().split('T')[0],
        est_apci: false,
        suivi_grossesse: false,
        date_prevue_accouchement: '',
        soins_cadre: 'Autres',
        est_signe_adherent: false,
        pharmacie_detecte: false,
        pharmacie: {
            identifiant_unique_mf: '',
            prestataire: {
                identifiant_unique_mf: '',
                nom: '',
                telephone: '',
                adresse: '',
                specialite: '',
                gsm: ''
            },
            est_cachet: false,
            est_signature: false,
            date: '',
            montant_pharmacie: 0,
            medicaments: []
        },
        actes: [],
        montant_total: 0,
        resultat_analyse: '',
        confiance_score: null,
        fichiers: [],
        beneficiaireId: null,
        showPreview: false
    }), [user]);

    const [formData, setFormData] = useState(initialFormState);
    const fileInputRef = useRef(null);
    const manualFileInputRef = useRef(null);
    const isEdit = !!initialData;

    const fetchBeneficiaries = useCallback(async () => {
        try {
            const data = await getMyBeneficiaries();
            setBeneficiaries(data);
        } catch (error) {
            console.error("Erreur bénéficiaires:", error);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            fetchBeneficiaries();
            if (isEdit && initialData) {
                const mappedData = {
                    ...initialFormState,
                    ...initialData,
                    nom_prenom_malade: initialData.beneficiaire ? `${initialData.beneficiaire.prenom} ${initialData.beneficiaire.nom}`.trim() : initialData.nom_prenom_malade || '',
                    date_naissance_malade: initialData.beneficiaire?.ddn || initialData.date_naissance_malade || '',
                    pharmacie_detecte: !!initialData.pharmacie,
                    pharmacie: initialData.pharmacie ? {
                        identifiant_unique_mf: initialData.pharmacie.identifiant_unique_mf || '',
                        prestataire: {
                            identifiant_unique_mf: initialData.pharmacie.prestataire?.identifiant_unique_mf || initialData.pharmacie.identifiant_unique_mf || '',
                            nom: initialData.pharmacie.prestataire?.nom || initialData.pharmacie.nom || '',
                            telephone: initialData.pharmacie.prestataire?.telephone || initialData.pharmacie.telephone || '',
                            adresse: initialData.pharmacie.prestataire?.adresse || initialData.pharmacie.adresse || '',
                            specialite: initialData.pharmacie.prestataire?.specialite || '',
                            gsm: initialData.pharmacie.prestataire?.gsm || ''
                        },
                        est_cachet: !!initialData.pharmacie.est_cachet,
                        est_signature: !!initialData.pharmacie.est_signature,
                        date: initialData.pharmacie.date || initialData.pharmacie.date_achat || '',
                        montant_pharmacie: initialData.pharmacie.montant_pharmacie || initialData.pharmacie.montant || 0,
                        medicaments: initialData.pharmacie.medicaments || []
                    } : {
                        identifiant_unique_mf: '',
                        prestataire: {
                            identifiant_unique_mf: '',
                            nom: '',
                            telephone: '',
                            adresse: '',
                            specialite: '',
                            gsm: ''
                        },
                        est_cachet: false,
                        est_signature: false,
                        date: '',
                        montant_pharmacie: 0,
                        medicaments: []
                    },
                    actes: (initialData.actes || []).map(a => ({
                        ...a,
                        est_cachet: a.est_cachet ?? a.cachet_signature_present ?? false,
                        est_signature: a.est_signature ?? false
                    })),
                    fichiers: initialData.documents || initialData.fichiers || []
                };
                setFormData(mappedData);
                setStep(2);
            } else {
                setFormData(initialFormState);
                setSelectedFiles([]);
                setStep(1);
                setSubStep('choice');
            }
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen, initialData, isEdit, initialFormState, fetchBeneficiaries]);

    // Auto-calculate total
    useEffect(() => {
        const actesTotal = formData.actes.reduce((sum, a) => sum + (Number(a.honoraires) || 0), 0);
        const pharmacieTotal = formData.pharmacie_detecte ? Number(formData.pharmacie.montant_pharmacie) : 0;
        const total = Number((actesTotal + pharmacieTotal).toFixed(3));
        if (total !== formData.montant_total) {
            setFormData(prev => ({ ...prev, montant_total: total }));
        }
    }, [formData.actes, formData.pharmacie.montant_pharmacie, formData.montant_total, formData.pharmacie_detecte]);

    // Handlers
    const handleManualFileUpload = useCallback((e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        setSelectedFiles(prev => [...prev, ...files]);
        setFormData(prev => ({ ...prev, showPreview: true }));
        showToast(`${files.length} fichier(s) ajouté(s)`, "success");
        if (manualFileInputRef.current) manualFileInputRef.current.value = "";
    }, [showToast]);

    const handleFileUpload = useCallback(async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        try {
            setIsAnalyzing(true);
            showToast("Analyse des documents par l'IA en cours...", "info");
            const aiData = await analyzeBulletinIA(files);

            if (aiData.est_document_medical === false) {
                showToast("ALERTE : Ce document n'est PAS un document médical valide.", "error");
                return;
            }

            console.log(aiData);
            setSelectedFiles(files);
            setFormData(prev => ({
                ...prev,
                numero_bulletin: cleanIAValue(aiData.numero_bulletin),
                code_cnam: cleanIAValue(aiData.code_cnam),
                matricule_adherent: cleanIAValue(aiData.matricule_adherent) || user?.matricule,
                nom_prenom_adherent: cleanIAValue(aiData.nom_prenom_adherent),
                adresse_adherent: cleanIAValue(aiData.adresse_adherent),
                client: cleanIAValue(aiData.client),

                nom_prenom_malade: cleanIAValue(aiData.nom_prenom_malade),
                qualite_malade: cleanIAValue(aiData.qualite_malade),
                date_naissance_malade: formatDateForInput(aiData.date_naissance_malade),
                date_soin: formatDateForInput(aiData.date_soin),
                est_apci: aiData.est_apci ?? prev.est_apci,
                suivi_grossesse: aiData.suivi_grossesse ?? prev.suivi_grossesse,
                date_prevue_accouchement: formatDateForInput(aiData.date_prevue_accouchement),
                soins_cadre: cleanIAValue(aiData.soins_cadre),
                pharmacie: aiData.pharmacie ? (() => {
                    const meds = Array.isArray(aiData.pharmacie.medicaments) ? aiData.pharmacie.medicaments.map(m => ({
                        nom_medicament: cleanIAValue(m.nom_medicament) || '',
                        dosage: cleanIAValue(m.dosage) || '',
                        quantite: Number(m.quantite) || 1,
                        prix_unitaire: Number(m.prix_unitaire),
                        montant_total: Number(( (Number(m.quantite) || 1) * (Number(m.prix_unitaire) || 0) ).toFixed(3))
                    })) : [];
                    return {
                        identifiant_unique_mf: cleanIAValue(aiData.pharmacie.prestataire?.identifiant_unique_mf || aiData.pharmacie.identifiant_unique_mf) || '',
                        prestataire: {
                            identifiant_unique_mf: cleanIAValue(aiData.pharmacie.prestataire?.identifiant_unique_mf || aiData.pharmacie.identifiant_unique_mf) || '',
                            nom: cleanIAValue(aiData.pharmacie.prestataire?.nom || aiData.pharmacie.nom) || '',
                            telephone: cleanIAValue(aiData.pharmacie.prestataire?.telephone || aiData.pharmacie.telephone) || '',
                            adresse: cleanIAValue(aiData.pharmacie.prestataire?.adresse || aiData.pharmacie.adresse) || '',
                            specialite: cleanIAValue(aiData.pharmacie.prestataire?.specialite || aiData.pharmacie.prestataire?.specialité) || '',
                            gsm: cleanIAValue(aiData.pharmacie.prestataire?.gsm) || ''
                        },
                        est_cachet: !!aiData.pharmacie.est_cachet,
                        est_signature: !!aiData.pharmacie.est_signature,
                        date: formatDateForInput(aiData.pharmacie.date) || '',
                        montant_pharmacie: Number(aiData.pharmacie.montant_pharmacie),
                        medicaments: meds
                    };
                })() : prev.pharmacie,
                actes: Array.isArray(aiData.actes) ? aiData.actes.map(a => ({
                    date_acte: formatDateForInput(a.date_acte) || '',
                    acte: cleanIAValue(a.acte) || '',
                    cote: a.cote || null,
                    code_acte: cleanIAValue(a.code_acte) || '',
                    numero_dent: cleanIAValue(a.numero_dent) || '',
                    honoraires: Number(a.honoraires) || 0,
                    prestataire: {
                        identifiant_unique_mf: cleanIAValue(a.prestataire?.identifiant_unique_mf || a.identifiant_unique_mf) || '',
                        nom: cleanIAValue(a.prestataire?.nom || a.nom_prestataire) || '',
                        telephone: cleanIAValue(a.prestataire?.telephone || a.telephone_prestataire) || '',
                        adresse: cleanIAValue(a.prestataire?.adresse || a.adresse_prestataire) || '',
                        specialite: cleanIAValue(a.prestataire?.specialite || a.prestataire?.specialité) || '',
                        gsm: cleanIAValue(a.prestataire?.gsm) || ''
                    },
                    est_cachet: !!a.est_cachet,
                    est_signature: !!a.est_signature,
                    date_cachet_signature: formatDateForInput(a.date_cachet_signature) || '',
                    nb_jour: Number(a.nb_jour) || null
                })) : prev.actes,
                montant_total: Number(aiData.montant_total) || prev.montant_total,
                resultat_analyse: cleanIAValue(aiData.resultat_analyse) || '',
                confiance_score: aiData.confiance_score || 0,
                niveau_risque: aiData.niveau_risque || 'faible',
                suspicion_locale: aiData.suspicion_locale || false,
                est_signe_adherent: !!aiData.est_signe_adherent,
                showPreview: true,
                pharmacie_detecte: !!aiData.pharmacie_detecte
            }));
            setStep(2);
        } catch (error) {
            showToast(error.message || "Erreur lors de l'analyse", "error");
        } finally {
            setIsAnalyzing(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }, [user, showToast]);

    const addActe = useCallback(() => {
        setFormData(prev => ({
            ...prev,
            actes: [...prev.actes, { 
                date_acte: prev.date_soin, 
                acte: '', 
                cote: null, 
                code_acte: '', 
                numero_dent: '', 
                honoraires: 0, 
                prestataire: {
                    identifiant_unique_mf: '',
                    nom: '',
                    telephone: '',
                    adresse: '',
                    specialite: '',
                    gsm: ''
                },
                est_cachet: false, 
                est_signature: false, 
                date_cachet_signature: '', 
                nb_jour: null 
            }]
        }));
    }, []);

    const updateActe = useCallback((index, fields) => {
        setFormData(prev => {
            const newActes = [...prev.actes];
            newActes[index] = { ...newActes[index], ...fields };
            return { ...prev, actes: newActes };
        });
    }, []);

    const removeActe = useCallback((index) => {
        setFormData(prev => ({ ...prev, actes: prev.actes.filter((_, i) => i !== index) }));
    }, []);

    const addMedicament = useCallback(() => {
        setFormData(prev => ({
            ...prev,
            pharmacie: { ...prev.pharmacie, medicaments: [...prev.pharmacie.medicaments, { nom_medicament: '', dosage: '', quantite: 1, prix_unitaire: 0, montant_total: 0 }] }
        }));
    }, []);

    const updateMedicament = useCallback((index, fields) => {
        setFormData(prev => {
            const newMeds = [...prev.pharmacie.medicaments];
            const updated = { ...newMeds[index], ...fields };
            updated.montant_total = Number(( (Number(updated.quantite) || 0) * (Number(updated.prix_unitaire) || 0) ).toFixed(3));
            newMeds[index] = updated;
            const totalPharma = newMeds.reduce((sum, m) => sum + (Number(m.montant_total) || 0), 0);
            return { ...prev, pharmacie: { ...prev.pharmacie, medicaments: newMeds, montant_pharmacie: Number(totalPharma.toFixed(3)) } };
        });
    }, []);

    const removeMedicament = useCallback((index) => {
        setFormData(prev => {
            const newMeds = prev.pharmacie.medicaments.filter((_, i) => i !== index);
            const totalPharma = newMeds.reduce((sum, m) => sum + (Number(m.montant_total) || 0), 0);
            return { ...prev, pharmacie: { ...prev.pharmacie, medicaments: newMeds, montant_pharmacie: Number(totalPharma.toFixed(3)) } };
        });
    }, []);

    const handlePrestataireLookup = useCallback(async (queryValue, onFill) => {
        if (!queryValue || queryValue.trim().length < 3) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/bulletins/prestataires/lookup?query=${encodeURIComponent(queryValue.trim())}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.data) {
                    onFill(data.data);
                    showToast("Prestataire chargé depuis la base de données !", "success");
                }
            }
        } catch (e) {
            console.error("Error looking up prestataire:", e);
        }
    }, [showToast]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        
        // --- CONTROLE DE SAISIE GLOBAL ---
        
        // 1. Validation du numéro de bulletin
        if (!formData.numero_bulletin || !formData.numero_bulletin.trim()) {
            showToast("Le numéro du bulletin est obligatoire.", "error");
            return;
        }
        if (formData.numero_bulletin.trim().length < 3) {
            showToast("Le numéro du bulletin doit contenir au moins 3 caractères.", "error");
            return;
        }

        // 2. Validation du matricule adhérent
        if (!formData.matricule_adherent || !formData.matricule_adherent.trim()) {
            showToast("Le matricule de l'adhérent est obligatoire.", "error");
            return;
        }

        // 3. Validation du nom du malade
        if (!formData.nom_prenom_malade || !formData.nom_prenom_malade.trim()) {
            showToast("Le nom et prénom du malade sont obligatoires.", "error");
            return;
        }

        // 4. Validation de la date de soin
        if (!formData.date_soin) {
            showToast("La date de soin est obligatoire.", "error");
            return;
        }
        const today = new Date();
        today.setHours(23, 59, 59, 999); // Inclure toute la journée d'aujourd'hui
        const soinDate = new Date(formData.date_soin);
        if (soinDate > today) {
            showToast("La date de soin ne peut pas être dans le futur.", "error");
            return;
        }
        
        // Limite de dépôt de 60 jours
        const limitDate = new Date();
        limitDate.setDate(limitDate.getDate() - 60);
        limitDate.setHours(0, 0, 0, 0);
        if (soinDate < limitDate) {
            showToast("La date de soin dépasse la limite réglementaire de dépôt de 60 jours.", "error");
            return;
        }

        // 5. Validation de la grossesse / maternité
        if (formData.suivi_grossesse) {
            if (!formData.date_prevue_accouchement) {
                showToast("Veuillez renseigner la date prévue de l'accouchement.", "error");
                return;
            }
            const accDate = new Date(formData.date_prevue_accouchement);
            const pastLimit = new Date();
            pastLimit.setHours(0,0,0,0);
            if (accDate < pastLimit) {
                showToast("La date prévue d'accouchement ne peut pas être dans le passé.", "error");
                return;
            }
        }

        // 6. Validation des actes médicaux
        if (formData.actes && formData.actes.length > 0) {
            for (let i = 0; i < formData.actes.length; i++) {
                const acte = formData.actes[i];
                const actName = `Acte médical n°${i + 1}`;

                if (!acte.acte) {
                    showToast(`${actName} : La nature de l'acte est obligatoire.`, "error");
                    return;
                }
                if (!acte.cote && !acte.code_acte) {
                    showToast(`${actName} : La cote ou le code de l'acte est obligatoire.`, "error");
                    return;
                }
                if (!acte.date_acte) {
                    showToast(`${actName} : La date de l'acte est obligatoire.`, "error");
                    return;
                }
                
                const actDate = new Date(acte.date_acte);
                if (actDate > today) {
                    showToast(`${actName} : La date de l'acte ne peut pas être dans le futur.`, "error");
                    return;
                }
                if (actDate < limitDate) {
                    showToast(`${actName} : La date de l'acte dépasse la limite de 60 jours.`, "error");
                    return;
                }

                if (acte.honoraires === undefined || acte.honoraires === null || Number(acte.honoraires) <= 0) {
                    showToast(`${actName} : Les honoraires doivent être supérieurs à 0 TND.`, "error");
                    return;
                }

                if (!acte.est_cachet && !acte.est_signature) {
                    showToast(`${actName} : Le cachet et la signature du prestataire sont obligatoires.`, "error");
                    return;
                }

                if (!acte.prestataire?.nom || !acte.prestataire.nom.trim()) {
                    showToast(`${actName} : Le nom du médecin est obligatoire.`, "error");
                    return;
                }
                const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/;
                if (!nameRegex.test(acte.prestataire.nom.trim())) {
                    showToast(`${actName} : Le nom du médecin doit être une chaîne de caractères valide (lettres et espaces uniquement).`, "error");
                    return;
                }

                if (!acte.prestataire?.identifiant_unique_mf || !acte.prestataire.identifiant_unique_mf.trim()) {
                    showToast(`${actName} : Le matricule fiscal (MF) du médecin est obligatoire.`, "error");
                    return;
                }

                // Optionnel : vérification du format de téléphone si saisi
                const phone = acte.prestataire?.telephone || acte.prestataire?.gsm;
                if (phone && phone.trim()) {
                    const cleanPhone = phone.replace(/[^0-9]/g, '');
                    if (cleanPhone.length < 8) {
                        showToast(`${actName} : Le numéro de téléphone du médecin doit contenir au moins 8 chiffres.`, "error");
                        return;
                    }
                }
            }
        }

        // 7. Validation de la section Pharmacie
        if (formData.pharmacie_detecte) {
            if (!formData.pharmacie.identifiant_unique_mf || !formData.pharmacie.identifiant_unique_mf.trim()) {
                showToast("Pharmacie : Le matricule fiscal (MF) de la pharmacie est obligatoire.", "error");
                return;
            }
            if (!formData.pharmacie.prestataire?.nom || !formData.pharmacie.prestataire.nom.trim()) {
                showToast("Pharmacie : Le nom de la pharmacie est obligatoire.", "error");
                return;
            }
            const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/;
            if (!nameRegex.test(formData.pharmacie.prestataire.nom.trim())) {
                showToast("Pharmacie : Le nom de la pharmacie doit être une chaîne de caractères valide (lettres et espaces uniquement).", "error");
                return;
            }
            if (!formData.pharmacie.medicaments || formData.pharmacie.medicaments.length === 0) {
                showToast("Pharmacie : Vous devez ajouter au moins un médicament.", "error");
                return;
            }

            for (let i = 0; i < formData.pharmacie.medicaments.length; i++) {
                const med = formData.pharmacie.medicaments[i];
                const medName = `Médicament n°${i + 1}`;

                if (!med.nom_medicament || !med.nom_medicament.trim()) {
                    showToast(`${medName} : Le nom du médicament est obligatoire.`, "error");
                    return;
                }
                if (!med.quantite || Number(med.quantite) < 1) {
                    showToast(`${medName} : La quantité doit être supérieure ou égale à 1.`, "error");
                    return;
                }
                if (med.prix_unitaire === undefined || med.prix_unitaire === null || Number(med.prix_unitaire) <= 0) {
                    showToast(`${medName} : Le prix unitaire doit être supérieur à 0 TND.`, "error");
                    return;
                }
            }
        }

        try {
            let dataToSend = formData;
            if (isEdit) {
                // Envoyer seulement les champs modifiés
                dataToSend = {};
                const businessFields = [
                    'numero_bulletin', 'code_cnam', 'date_soin', 'montant_total',
                    'qualite_malade', 'nom_prenom_malade', 'est_apci', 'suivi_grossesse',
                    'date_prevue_accouchement', 'soins_cadre', 'est_signe_adherent',
                    'pharmacie', 'actes', 'beneficiaireId', 'pharmacie_detecte', 'fichiers'
                ];

                businessFields.forEach(key => {
                    if (formData[key] !== undefined) {
                        let initialValue = initialData[key];
                        
                        // Normalisation
                        if (key === 'date_soin' || key === 'date_prevue_accouchement') {
                            initialValue = formatDateForInput(initialValue);
                        } else if (key === 'pharmacie') {
                            initialValue = initialData.pharmacie ? {
                                ...initialData.pharmacie,
                                date: formatDateForInput(initialData.pharmacie.date || initialData.pharmacie.date_achat),
                                montant_pharmacie: Number(initialData.pharmacie.montant_pharmacie || initialData.pharmacie.montant || 0),
                                medicaments: initialData.pharmacie.medicaments || []
                            } : initialFormState.pharmacie;
                        } else if (key === 'actes') {
                            initialValue = initialData.actes || [];
                        } else if (key === 'montant_total') {
                            initialValue = Number(initialValue || 0);
                        }

                        if (JSON.stringify(formData[key]) !== JSON.stringify(initialValue)) {
                            dataToSend[key] = formData[key];
                        }
                    }
                });

                if (Object.keys(dataToSend).length === 0 && selectedFiles.length === 0) {
                    showToast("Aucune modification à enregistrer", "info");
                    onClose();
                    return;
                }
            }

            const result = isEdit ? await updateBulletin(initialData.id, dataToSend, selectedFiles) : await createBulletin(formData, selectedFiles);
            onSubmit(result.bulletin);
            showToast(isEdit ? "Bulletin mis à jour !" : "Bulletin enregistré !", "success");
            onClose();
        } catch (error) {
            showToast(error?.message || "Erreur lors de l'opération", "error");
        }
    }, [formData, isEdit, initialData, selectedFiles, onSubmit, onClose, showToast, initialFormState]);

    if (!isOpen) return null;

    const currentPreviewFile = selectedFiles[previewIndex];
    const currentExistingFile = !currentPreviewFile && formData.fichiers?.[previewIndex - selectedFiles.length];
    const showSidePreview = step === 2 && (selectedFiles.length > 0 || formData.fichiers?.length > 0);
    const totalFilesCount = selectedFiles.length + (formData.fichiers?.length || 0);

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className={`relative bg-white dark:bg-slate-900 w-full rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[95vh] flex flex-col transition-all duration-500 ${showSidePreview ? 'max-w-7xl' : 'max-w-2xl'}`}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-purple-700 to-indigo-800 p-8 text-white relative sticky top-0 z-10 shrink-0">
                            <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all" aria-label="Fermer"><X size={20} /></button>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md"><FileText size={32} /></div>
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
                                <div className="flex-1 bg-slate-50 dark:bg-slate-950 p-6 overflow-hidden flex flex-col min-h-[400px] lg:min-h-0">
                                    <div className="flex items-center justify-between mb-4 shrink-0">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            <Eye size={14} className="text-purple-500" /> APERÇU JUSTIFICATIF {totalFilesCount > 1 ? `(${previewIndex + 1}/${totalFilesCount})` : ''}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            {totalFilesCount > 1 && (
                                                <div className="flex gap-1 mr-2">
                                                    <button type="button" onClick={() => setPreviewIndex(p => Math.max(0, p - 1))} disabled={previewIndex === 0} className="p-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-30"><ChevronRight className="rotate-180" size={14} /></button>
                                                    <button type="button" onClick={() => setPreviewIndex(p => Math.min(totalFilesCount - 1, p + 1))} disabled={previewIndex === totalFilesCount - 1} className="p-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-30"><ChevronRight size={14} /></button>
                                                </div>
                                            )}
                                            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-[9px] font-black uppercase">
                                                {(currentPreviewFile?.name || currentExistingFile?.fichier || '').split('.').pop().toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                    <DocumentPreview file={currentPreviewFile} url={currentExistingFile?.fichier} />
                                </div>
                            )}

                            {/* Form Column */}
                            <div className={`flex-1 overflow-y-auto ${showSidePreview ? 'lg:max-w-2xl' : ''}`}>
                                <form onSubmit={handleSubmit} className="p-8">
                                    {step === 1 ? (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                            {subStep === 'choice' ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                                                    <div onClick={downloadPreFilledBulletin} className="group relative flex flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-100 dark:border-blue-800 rounded-3xl cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-2">
                                                        <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg mb-6 group-hover:scale-110 transition-transform group-hover:rotate-3"><Download className="text-blue-500" size={40} /></div>
                                                        <h4 className="text-xl font-black text-slate-800 dark:text-white mb-2">Tirer le bulletin</h4>
                                                        <p className="text-slate-500 dark:text-slate-400 text-sm text-center">Téléchargez un bulletin de soin déjà rempli avec vos informations personnelles.</p>
                                                        <div className="mt-6 flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm"><span>Télécharger le PDF</span><ChevronRight size={16} /></div>
                                                    </div>
                                                    <div onClick={() => setSubStep('upload')} className="group relative flex flex-col items-center justify-center p-8 bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20 border-2 border-purple-100 dark:border-purple-800 rounded-3xl cursor-pointer hover:border-purple-400 dark:hover:border-purple-600 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-2">
                                                        <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg mb-6 group-hover:scale-110 transition-transform group-hover:-rotate-3"><Upload className="text-purple-500" size={40} /></div>
                                                        <h4 className="text-xl font-black text-slate-800 dark:text-white mb-2">Déposer le bulletin</h4>
                                                        <p className="text-slate-500 dark:text-slate-400 text-sm text-center">Utilisez l'IA pour extraire les informations de vos bulletins déjà remplis ou scannés.</p>
                                                        <div className="mt-6 flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-sm"><span>Scanner un document</span><ChevronRight size={16} /></div>
                                                    </div>
                                                    <div className="md:col-span-2 flex justify-center mt-6">
                                                        <button type="button" onClick={() => setStep(2)} className="group flex items-center gap-3 px-8 py-4 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-black text-sm transition-all duration-300">
                                                            <FileText size={18} className="text-slate-400 group-hover:text-purple-500" />
                                                            <span>Sauter et remplir manuellement</span>
                                                            <ChevronRight size={16} className="text-slate-500 group-hover:translate-x-1" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="text-center mb-8 mt-4 relative">
                                                        <button type="button" onClick={() => setSubStep('choice')} className="absolute left-0 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500"><ChevronDown className="rotate-90" size={20} /></button>
                                                        <div className="inline-flex items-center justify-center p-4 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-4"><Upload size={32} className="text-purple-600 dark:text-purple-400" /></div>
                                                        <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Déposez votre justificatif</h3>
                                                        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">Notre IA va scanner et extraire automatiquement toutes les informations.</p>
                                                    </div>
                                                    <div className="border-2 border-dashed border-purple-200 dark:border-purple-800 rounded-3xl p-12 flex flex-col items-center justify-center gap-6 bg-purple-50/50 dark:bg-purple-900/10 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all cursor-pointer group relative">
                                                        <input ref={fileInputRef} type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleFileUpload} disabled={isAnalyzing} accept=".pdf,image/*" multiple />
                                                        <div className={`p-6 bg-white dark:bg-slate-800 rounded-full shadow-lg group-hover:scale-110 transition-transform ${isAnalyzing ? 'animate-pulse ring-4 ring-purple-500/30' : ''}`}><Upload className={isAnalyzing ? 'text-purple-600' : 'text-purple-500'} size={32} /></div>
                                                        <p className="text-lg font-black text-slate-700 dark:text-slate-200">{isAnalyzing ? "Analyse IA en cours..." : "Cliquez ou Glissez un fichier ici"}</p>
                                                    </div>
                                                    <div className="flex justify-center mt-8">
                                                        <button type="button" onClick={() => setStep(2)} className="group flex items-center gap-4 px-8 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-black transition-all hover:-translate-y-1">
                                                            <FileText size={18} className="text-purple-500" />
                                                            <span>Saisir les informations manuellement</span>
                                                            <ChevronRight size={14} className="group-hover:translate-x-1" />
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl border border-green-100 dark:border-green-800 flex items-center gap-3">
                                                <div className="p-2 bg-green-500 rounded-lg text-white"><CheckCircle2 size={18} /></div>
                                                <h3 className="text-sm font-bold text-green-900 dark:text-green-100 uppercase tracking-tight">Vérifiez et complétez les données</h3>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <FormField label="Numéro du Bulletin" icon={Hash} className="col-span-full">
                                                    <input className="w-full p-3 bg-purple-50/30 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800 rounded-xl font-black text-sm text-purple-700 dark:text-purple-300 focus:ring-4 focus:ring-purple-500/20 outline-none" value={formData.numero_bulletin} onChange={e => setFormData({ ...formData, numero_bulletin: e.target.value })} placeholder="Ex: BS-12345678" />
                                                </FormField>
                                                
                                                <FormField label="Matricule Adhérent">
                                                    <input className="w-full p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm dark:text-white" value={formData.matricule_adherent} onChange={e => setFormData({ ...formData, matricule_adherent: e.target.value })} />
                                                </FormField>
                                                
                                                <FormField label="Nom Adhérent">
                                                    <input className="w-full p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm dark:text-white" value={formData.nom_prenom_adherent} onChange={e => setFormData({ ...formData, nom_prenom_adherent: e.target.value })} />
                                                </FormField>
                                                
                                                <FormField label="Adresse Adhérent" className="col-span-full">
                                                    <input className="w-full p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm dark:text-white" value={formData.adresse_adherent} onChange={e => setFormData({ ...formData, adresse_adherent: e.target.value })} />
                                                </FormField>

                                                <div className="col-span-full relative">
                                                    <FormField label="Nom du Malade (Bénéficiaire)" icon={User}>
                                                        <div className="relative">
                                                                <input 
                                                                    className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-black text-sm dark:text-white pr-10" 
                                                                    value={formData.nom_prenom_malade} 
                                                                    onChange={e => {
                                                                        const value = e.target.value;
                                                                        const lowerValue = value.toLowerCase().trim();
                                                                        const matchedBeneficiary = beneficiaries.find(b => `${b.prenom} ${b.nom}`.toLowerCase() === lowerValue);
                                                                        const isTitulaire = user && `${user.prenom} ${user.nom}`.toLowerCase() === lowerValue;
                                                                        
                                                                        if (matchedBeneficiary) {
                                                                            setFormData({ ...formData, nom_prenom_malade: value, qualite_malade: matchedBeneficiary.relation, beneficiaireId: matchedBeneficiary.id, date_naissance_malade: matchedBeneficiary.ddn });
                                                                        } else if (isTitulaire) {
                                                                            setFormData({ ...formData, nom_prenom_malade: value, qualite_malade: 'Titulaire', beneficiaireId: null, date_naissance_malade: user.ddn });
                                                                        } else {
                                                                            setFormData({ ...formData, nom_prenom_malade: value });
                                                                        }
                                                                    }} 
                                                                    onFocus={() => setIsBeneficiaryDropdownOpen(true)}
                                                                />
                                                                <button type="button" onClick={() => setIsBeneficiaryDropdownOpen(!isBeneficiaryDropdownOpen)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" aria-label="Ouvrir la liste des bénéficiaires"><ChevronDown size={18} /></button>
                                                            </div>
                                                        </FormField>
                                                        {isBeneficiaryDropdownOpen && (
                                                            <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                                                <div className="p-2 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700"><p className="text-[10px] font-black text-slate-400 uppercase px-2">Choisissez un bénéficiaire</p></div>
                                                                <div className="max-h-60 overflow-y-auto">
                                                                    <button type="button" className="w-full p-3 text-left hover:bg-purple-50 dark:hover:bg-purple-900/20 flex items-center gap-3 transition-colors border-b border-slate-50 dark:border-slate-700/50" onClick={() => { setFormData({ ...formData, nom_prenom_malade: `${user.prenom} ${user.nom}`, qualite_malade: 'Titulaire', beneficiaireId: null, date_naissance_malade: user.ddn }); setIsBeneficiaryDropdownOpen(false); }}>
                                                                        <div className="p-2 bg-purple-100 dark:bg-purple-900 text-purple-600 rounded-lg"><User size={14} /></div>
                                                                        <div><p className="text-sm font-bold dark:text-white">{user.prenom} {user.nom}</p><p className="text-[10px] text-slate-500 uppercase font-bold">Titulaire (Adhérent)</p></div>
                                                                    </button>
                                                                    {beneficiaries.map(b => (
                                                                        <button key={b.id} type="button" className="w-full p-3 text-left hover:bg-purple-50 dark:hover:bg-purple-900/20 flex items-center gap-3 transition-colors border-b border-slate-50 dark:border-slate-700/50" onClick={() => { setFormData({ ...formData, nom_prenom_malade: `${b.prenom} ${b.nom}`, qualite_malade: b.relation, beneficiaireId: b.id, date_naissance_malade: b.ddn }); setIsBeneficiaryDropdownOpen(false); }}>
                                                                            <div className="p-2 bg-blue-100 dark:bg-blue-900 text-blue-600 rounded-lg"><Users size={14} /></div>
                                                                            <div><p className="text-sm font-bold dark:text-white">{b.prenom} {b.nom}</p><p className="text-[10px] text-slate-500 uppercase font-bold">{b.relation}</p></div>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                </div>

                                                <FormField label="Qualité">
                                                    <input className="w-full p-3 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm dark:text-slate-400" value={formData.qualite_malade} readOnly />
                                                </FormField>

                                                <FormField label="Date de naissance">
                                                    <input type="date" className="w-full p-3 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm dark:text-slate-400" value={formData.date_naissance_malade} readOnly />
                                                </FormField>

                                                <FormField label="Date de Soin">
                                                    <input type="date" className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm dark:text-white" value={formData.date_soin} onChange={e => setFormData({ ...formData, date_soin: e.target.value })} />
                                                </FormField>
                                            </div>

                                            {/* Actes Médicaux */}
                                            <div className="space-y-4 pt-4">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Activity size={14} className="text-purple-500" /> ACTES MÉDICAUX & HONORAIRES</h3>
                                                    <button type="button" onClick={addActe} className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[10px] font-black transition-all hover:shadow-lg hover:shadow-purple-500/20"><Plus size={14} /> AJOUTER UN ACTE</button>
                                                </div>
                                                <div className="space-y-3">
                                                    {formData.actes.map((acte, idx) => (
                                                        <ActeItem key={idx} acte={acte} index={idx} onUpdate={updateActe} onRemove={removeActe} structure={ACTE_STRUCTURE} onLookup={handlePrestataireLookup} />
                                                    ))}
                                                    {formData.actes.length === 0 && <div className="p-8 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl"><p className="text-slate-400 text-sm font-medium">Aucun acte saisi.</p></div>}
                                                </div>
                                            </div>

                                            {/* Pharmacie */}
                                            <div className="space-y-4 pt-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Activity size={14} className="text-blue-500" /> PHARMACIE / MÉDICAMENTS</h3>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => setFormData(prev => ({ ...prev, pharmacie_detecte: !prev.pharmacie_detecte }))}
                                                            className={`px-3 py-1 rounded-full text-[10px] font-black transition-all ${formData.pharmacie_detecte ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}
                                                        >
                                                            {formData.pharmacie_detecte ? 'ACTIVÉ' : 'DÉSACTIVÉ'}
                                                        </button>
                                                    </div>
                                                    {formData.pharmacie_detecte && (
                                                        <button type="button" onClick={addMedicament} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black transition-all hover:shadow-lg hover:shadow-blue-500/20"><Plus size={14} /> AJOUTER MÉDICAMENT</button>
                                                    )}
                                                </div>
                                                
                                                {formData.pharmacie_detecte && (
                                                    <div className="p-6 bg-blue-50/30 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800 space-y-4 animate-in zoom-in-95 duration-200">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <FormField label="MF Pharmacie">
                                                                <input placeholder="MF Pharmacie" className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white" value={formData.pharmacie.prestataire?.identifiant_unique_mf || formData.pharmacie.identifiant_unique_mf || ''} onChange={e => setFormData({ ...formData, pharmacie: { ...formData.pharmacie, identifiant_unique_mf: e.target.value, prestataire: { ...(formData.pharmacie.prestataire || {}), identifiant_unique_mf: e.target.value } } })} onBlur={e => handlePrestataireLookup(e.target.value, p => setFormData(prev => ({ ...prev, pharmacie: { ...prev.pharmacie, identifiant_unique_mf: p.identifiant_unique_mf || '', prestataire: { ...(prev.pharmacie.prestataire || {}), identifiant_unique_mf: p.identifiant_unique_mf || '', nom: p.nom || '', telephone: p.telephone || '', adresse: p.adresse || '', specialite: p.specialite || '', gsm: p.gsm || '' } } })))} />
                                                            </FormField>
                                                            <FormField label="Nom Pharmacie">
                                                                <input placeholder="Nom Pharmacie" className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white" value={formData.pharmacie.prestataire?.nom || ''} onChange={e => setFormData({ ...formData, pharmacie: { ...formData.pharmacie, prestataire: { ...(formData.pharmacie.prestataire || {}), nom: e.target.value } } })} />
                                                            </FormField>
                                                            <FormField label="Téléphone Pharmacie">
                                                                <input placeholder="Téléphone Pharmacie" className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white" value={formData.pharmacie.prestataire?.telephone || ''} onChange={e => setFormData({ ...formData, pharmacie: { ...formData.pharmacie, prestataire: { ...(formData.pharmacie.prestataire || {}), telephone: e.target.value } } })} onBlur={e => handlePrestataireLookup(e.target.value, p => setFormData(prev => ({ ...prev, pharmacie: { ...prev.pharmacie, identifiant_unique_mf: p.identifiant_unique_mf || '', prestataire: { ...(prev.pharmacie.prestataire || {}), identifiant_unique_mf: p.identifiant_unique_mf || '', nom: p.nom || '', telephone: p.telephone || '', adresse: p.adresse || '', specialite: p.specialite || '', gsm: p.gsm || '' } } })))} />
                                                            </FormField>
                                                            <FormField label="Adresse Pharmacie">
                                                                <input placeholder="Adresse Pharmacie" className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white" value={formData.pharmacie.prestataire?.adresse || ''} onChange={e => setFormData({ ...formData, pharmacie: { ...formData.pharmacie, prestataire: { ...(formData.pharmacie.prestataire || {}), adresse: e.target.value } } })} />
                                                            </FormField>
                                                            <FormField label="Spécialité">
                                                                <input placeholder="Spécialité (ex: Pharmacien)" className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white" value={formData.pharmacie.prestataire?.specialite || ''} onChange={e => setFormData({ ...formData, pharmacie: { ...formData.pharmacie, prestataire: { ...(formData.pharmacie.prestataire || {}), specialite: e.target.value } } })} />
                                                            </FormField>
                                                            <FormField label="GSM Pharmacie">
                                                                <input placeholder="GSM Pharmacie" className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white" value={formData.pharmacie.prestataire?.gsm || ''} onChange={e => setFormData({ ...formData, pharmacie: { ...formData.pharmacie, prestataire: { ...(formData.pharmacie.prestataire || {}), gsm: e.target.value } } })} />
                                                            </FormField>
                                                            <FormField label="Total Pharmacie (TND)">
                                                                <input type="number" step="0.001" className="w-full p-2 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-blue-400 font-black cursor-not-allowed" value={formData.pharmacie.montant_pharmacie} readOnly />
                                                                <p className="text-[9px] text-slate-400 font-medium italic mt-1">* Calculé automatiquement d'après les médicaments</p>
                                                            </FormField>
                                                        </div>
                                                        <div className="space-y-3">
                                                            {formData.pharmacie.medicaments.map((med, idx) => (
                                                                <MedicamentItem key={idx} med={med} index={idx} onUpdate={updateMedicament} onRemove={removeMedicament} />
                                                            ))}
                                                            {formData.pharmacie.medicaments.length === 0 && (
                                                                <div className="p-4 text-center border border-dashed border-blue-200 dark:border-blue-800 rounded-xl">
                                                                    <p className="text-slate-400 text-[10px] font-bold">Aucun médicament ajouté</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Documents */}
                                            <div className="space-y-4 pt-4">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Upload size={14} className="text-purple-500" /> PIÈCES JOINTES</h3>
                                                    <button type="button" onClick={() => manualFileInputRef.current?.click()} className="text-[10px] font-black text-purple-600 hover:text-purple-700 uppercase tracking-tight flex items-center gap-1"><Plus size={12} /> Ajouter un fichier</button>
                                                    <input ref={manualFileInputRef} type="file" className="hidden" onChange={handleManualFileUpload} multiple />
                                                </div>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {selectedFiles.map((f, idx) => <FileItem key={`new-${idx}`} file={f} index={idx} isNew={true} onPreview={setPreviewIndex} onRemove={(i) => setSelectedFiles(prev => prev.filter((_, idx) => idx !== i))} />)}
                                                    {(formData.fichiers || []).map((f, idx) => (
                                                        <FileItem 
                                                            key={`old-${idx}`} 
                                                            file={f} 
                                                            index={idx + selectedFiles.length} 
                                                            isNew={false} 
                                                            onPreview={setPreviewIndex} 
                                                            onRemove={() => setFormData(prev => ({ ...prev, fichiers: (prev.fichiers || []).filter((_, i) => i !== idx) }))}
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Footer Form */}
                                            <div className="pt-8 flex flex-col gap-4">
                                                <div className="p-6 bg-slate-100 dark:bg-black rounded-3xl text-white flex items-center justify-center shadow-xl">
                                                    <button type="submit" className="px-10 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl font-black text-sm transition-all hover:scale-105 active:scale-95 shadow-xl shadow-purple-500/20 flex items-center gap-2">
                                                        <CheckCircle2 size={20} /> {isEdit ? 'METTRE À JOUR' : 'VALIDER LE BULLETIN'}
                                                    </button>
                                                </div>
                                                <button type="button" onClick={() => setStep(1)} className="text-center p-4 text-slate-400 hover:text-slate-600 text-[10px] font-black uppercase tracking-widest transition-colors">Retour au scan</button>
                                            </div>
                                        </div>
                                    )}
                                </form>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </AnimatePresence>,
        document.body
    );
};

export default AddBulletinModal;
