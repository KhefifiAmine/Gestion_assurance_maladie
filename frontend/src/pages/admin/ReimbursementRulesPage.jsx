import React, { useState, useEffect, useReducer, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sliders, 
  Save, 
  RefreshCw, 
  DollarSign, 
  Percent, 
  Activity, 
  Eye, 
  Glasses, 
  ShieldCheck, 
  HeartPulse, 
  Home, 
  AlertCircle,
  Search,
  Download,
  Upload,
  ChevronDown,
  ChevronUp,
  History,
  FileText,
  HelpCircle,
  TrendingUp,
  Sparkles,
  Info,
  CheckCircle,
  Printer
} from 'lucide-react';
import { fetchReimbursementRules, updateReimbursementRules } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';

// ==========================================
// 1. CONSTANTS, TOOLTIPS & PRESETS DEFINITIONS
// ==========================================

const FIELD_HELPERS = {
  'plafond_annuel_global_par_prestataire': 'Le plafond annuel global limite la somme totale de tous les remboursements accordés à un adhérent et ses bénéficiaires pour l\'année en cours.',
  'pharmacie.taux': 'Pourcentage de remboursement appliqué au prix d\'achat public des médicaments autorisés.',
  'pharmacie.plafond_annuel': 'Montant maximum remboursé par an pour l\'achat de médicaments.',
  'analyses.taux': 'Taux de prise en charge pour les analyses de laboratoires de biologie médicale.',
  'analyses.plafond_annuel': 'Limite annuelle de remboursement pour toutes les analyses biologiques cumulées.',
  'radiologie_electroradiologie.taux': 'Taux appliqué sur les actes d\'imagerie médicale (Radiographie, IRM, Scanner, etc.).',
  'radiologie_electroradiologie.plafond_annuel': 'Budget de remboursement maximum par an pour l\'imagerie médicale.',
  'chirurgie.taux': 'Taux de remboursement pour les actes de chirurgie.',
  'chirurgie.plafond_annuel': 'Plafond maximum de prise en charge pour les frais chirurgicaux annuels.',
  'anesthesie.taux': 'Taux appliqué pour les honoraires des médecins anesthésistes lors des opérations.',
  'anesthesie.plafond_annuel': 'Limite de remboursement pour les frais d\'anesthésie par an.',
  'salle_operation.taux': 'Prise en charge des frais de salle d\'opération et de bloc opératoire.',
  'salle_operation.plafond_annuel': 'Plafond annuel de remboursement des frais de bloc opératoire.',
  'dentaire.soins_protheses_implants.taux': 'Taux de prise en charge pour les soins courants, couronnes et implants dentaires.',
  'dentaire.soins_protheses_implants.plafond_annuel': 'Plafond cumulé annuel pour la prothèse, l\'implantologie et les soins dentaires.',
  'dentaire.orthopedie_dento_faciale.plafond_annuel': 'Forfait annuel pour l\'orthodontie des enfants et adolescents (ODF).',
  'optique.monture.plafond_max': 'Remboursement maximal par monture de lunettes.',
  'optique.verre.plafond_max': 'Budget maximal alloué pour les verres de lunettes.',
  'hospitalisation.clinique.montant_par_jour': 'Indemnité journalière maximale pour les séjours en clinique privée conventionnée.',
  'hospitalisation.hopital.montant_par_jour': 'Indemnité journalière pour les séjours en établissement hospitalier public.',
  'hospitalisation.reanimation.montant_par_jour': 'Prise en charge par jour pour les séjours en unité de soins intensifs ou réanimation.',
  'hospitalisation.couveuse.montant_par_jour': 'Prise en charge journalière pour le séjour d\'un nouveau-né en couveuse.',
  'maternite.accouchement_simple': 'Forfait fixe alloué pour un accouchement simple en clinique.',
  'maternite.gemellaire': 'Forfait alloué pour un accouchement multiple (jumeaux/triplés).',
  'maternite.sterilite': 'Plafond maximal d\'aide pour les traitements liés à l\'infertilité ou aide médicale à la procréation.',
  'consultations.C1': 'Tarif fixe remboursé pour une consultation cabinet chez un médecin généraliste (Code C1).',
  'consultations.C2': 'Tarif fixe remboursé pour une consultation cabinet chez un médecin spécialiste (Code C2).',
  'consultations.C3': 'Tarif fixe remboursé pour une consultation cabinet chez un médecin clinicien ou professeur (Code C3).',
  'consultations.V1': 'Tarif fixe remboursé pour une visite à domicile d\'un médecin généraliste (Code V1).',
  'consultations.V2': 'Tarif fixe remboursé pour une visite à domicile d\'un médecin spécialiste (Code V2).',
  'consultations.V3': 'Tarif fixe remboursé pour une visite à domicile d\'un médecin clinicien ou professeur (Code V3).'
};

const PRESETS = {
  standard: {
    name: 'Barème Standard 2026',
    description: 'Configuration réglementaire de base pour Tunisie Telecom.',
    rules: {
      plafond_annuel_global_par_prestataire: 4500,
      pharmacie: { taux: 0.90, plafond_annuel: 1000 },
      analyses: { taux: 0.80, plafond_annuel: 800 },
      chirurgie: { taux: 0.90, plafond_annuel: 600 },
      anesthesie: { taux: 0.90, plafond_annuel: 250 },
      salle_operation: { taux: 0.90, plafond_annuel: 250 },
      radiologie_electroradiologie: { taux: 0.90, plafond_annuel: 600 },
      dentaire: {
        soins_protheses_implants: { taux: 0.80, plafond_annuel: 1000 },
        orthopedie_dento_faciale: { plafond_annuel: 300 }
      },
      optique: {
        monture: { taux: 0.90, plafond_max: 250 },
        verre: { taux: 0.90, plafond_max: 200 }
      },
      hospitalisation: {
        clinique: { montant_par_jour: 110 },
        hopital: { montant_par_jour: 10 },
        reanimation: { montant_par_jour: 150 },
        couveuse: { montant_par_jour: 80 }
      },
      maternite: { accouchement_simple: 500, gemellaire: 600, sterilite: 1500 }
    }
  },
  premium: {
    name: 'Barème TT Prestige (Haut de gamme)',
    description: 'Plafonds doublés et prise en charge à 100% pour les cadres dirigeants.',
    rules: {
      plafond_annuel_global_par_prestataire: 9000,
      pharmacie: { taux: 1.00, plafond_annuel: 2500 },
      analyses: { taux: 1.00, plafond_annuel: 1600 },
      chirurgie: { taux: 1.00, plafond_annuel: 1500 },
      anesthesie: { taux: 1.00, plafond_annuel: 600 },
      salle_operation: { taux: 1.00, plafond_annuel: 600 },
      radiologie_electroradiologie: { taux: 1.00, plafond_annuel: 1200 },
      dentaire: {
        soins_protheses_implants: { taux: 0.90, plafond_annuel: 2000 },
        orthopedie_dento_faciale: { plafond_annuel: 800 }
      },
      optique: {
        monture: { taux: 1.00, plafond_max: 500 },
        verre: { taux: 1.00, plafond_max: 400 }
      },
      hospitalisation: {
        clinique: { montant_par_jour: 250 },
        hopital: { montant_par_jour: 30 },
        reanimation: { montant_par_jour: 350 },
        couveuse: { montant_par_jour: 150 }
      },
      maternite: { accouchement_simple: 1000, gemellaire: 1200, sterilite: 3000 }
    }
  },
  eco: {
    name: 'Barème TT Économique',
    description: 'Plafonds modérés et prise en charge à 70% pour une formule budgétaire.',
    rules: {
      plafond_annuel_global_par_prestataire: 3000,
      pharmacie: { taux: 0.70, plafond_annuel: 600 },
      analyses: { taux: 0.70, plafond_annuel: 500 },
      chirurgie: { taux: 0.80, plafond_annuel: 400 },
      anesthesie: { taux: 0.80, plafond_annuel: 150 },
      salle_operation: { taux: 0.80, plafond_annuel: 150 },
      radiologie_electroradiologie: { taux: 0.80, plafond_annuel: 400 },
      dentaire: {
        soins_protheses_implants: { taux: 0.70, plafond_annuel: 700 },
        orthopedie_dento_faciale: { plafond_annuel: 200 }
      },
      optique: {
        monture: { taux: 0.70, plafond_max: 150 },
        verre: { taux: 0.70, plafond_max: 120 }
      },
      hospitalisation: {
        clinique: { montant_par_jour: 70 },
        hopital: { montant_par_jour: 5 },
        reanimation: { montant_par_jour: 100 },
        couveuse: { montant_par_jour: 50 }
      },
      maternite: { accouchement_simple: 350, gemellaire: 400, sterilite: 1000 }
    }
  }
};

// ==========================================
// 2. STATE REDUCER FOR ADVANCED UX
// ==========================================

const initialState = {
  activeRules: null,     // Rules synchronized with backend
  draftRules: null,      // Rules currently in modification
  history: [],           // Local edits history tracking
  errors: {},            // Form validation errors
  activeTab: 'global',
  searchQuery: '',
  collapses: {
    global: false,
    consultations: false,
    pharmacie: false,
    analyses: false,
    chirurgie: false,
    dentaire: false,
    optique: false,
    hospitalisation: false,
    maternite: false
  },
  workflowStep: 'active', // 'active', 'draft_saved'
  bulkMode: false
};

function rulesReducer(state, action) {
  switch (action.type) {
    case 'INIT_RULES':
      return {
        ...state,
        activeRules: JSON.parse(JSON.stringify(action.payload)),
        draftRules: JSON.parse(JSON.stringify(action.payload)),
        errors: {},
        workflowStep: 'active'
      };
    case 'UPDATE_FIELD': {
      const { path, value } = action.payload;
      const newDraft = JSON.parse(JSON.stringify(state.draftRules));
      const keys = path.split('.');
      let current = newDraft;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      const lastKey = keys[keys.length - 1];
      
      // Keep state values as-is, parsing will be validated
      current[lastKey] = value;
      
      // Track input validation errors
      const errors = { ...state.errors };
      if (value === undefined || value === null || value === '' || isNaN(value)) {
        errors[path] = "Ce champ est obligatoire et ne peut pas être vide.";
      } else {
        const numVal = parseFloat(value);
        if (lastKey === 'taux' || lastKey === 'coefficient_B') {
          if (numVal < 0 || numVal > 1) {
            errors[path] = "Le taux de remboursement doit être compris entre 0% et 100% (ex: 90).";
          } else {
            delete errors[path];
          }
        } else {
          if (numVal < 0) {
            errors[path] = "La valeur doit être un montant supérieur ou égal à 0.";
          } else {
            delete errors[path];
          }
        }
      }

      return {
        ...state,
        draftRules: newDraft,
        errors,
        workflowStep: 'draft_saved'
      };
    }
    case 'APPLY_PRESET': {
      const presetRules = action.payload;
      // Merge with remaining items if any
      const newDraft = JSON.parse(JSON.stringify({ ...state.draftRules, ...presetRules }));
      return {
        ...state,
        draftRules: newDraft,
        workflowStep: 'draft_saved',
        errors: {}
      };
    }
    case 'SET_ERRORS':
      return {
        ...state,
        errors: action.payload
      };
    case 'SET_TAB':
      return { ...state, activeTab: action.payload };
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.payload };
    case 'TOGGLE_COLLAPSE':
      return {
        ...state,
        collapses: {
          ...state.collapses,
          [action.payload]: !state.collapses[action.payload]
        }
      };
    case 'EXPAND_ALL': {
      const collapses = {};
      Object.keys(state.collapses).forEach(k => collapses[k] = false);
      return { ...state, collapses };
    }
    case 'COLLAPSE_ALL': {
      const collapses = {};
      Object.keys(state.collapses).forEach(k => collapses[k] = true);
      return { ...state, collapses };
    }
    case 'SAVE_SUCCESS':
      return {
        ...state,
        activeRules: JSON.parse(JSON.stringify(state.draftRules)),
        history: [
          {
            timestamp: new Date().toISOString(),
            rules: JSON.parse(JSON.stringify(state.draftRules)),
            user: action.user || 'Admin'
          },
          ...state.history
        ],
        workflowStep: 'active'
      };
    case 'LOAD_DRAFT_FROM_STORAGE':
      return {
        ...state,
        draftRules: action.payload,
        workflowStep: 'draft_saved'
      };
    case 'TOGGLE_BULK':
      return { ...state, bulkMode: !state.bulkMode };
    case 'APPLY_BULK_RATES': {
      const rate = action.payload / 100;
      const newDraft = JSON.parse(JSON.stringify(state.draftRules));
      // Apply rate to ALL taux fields recursively
      const applyTaux = (obj) => {
        for (const k in obj) {
          if (k === 'taux') {
            obj[k] = rate;
          } else if (typeof obj[k] === 'object' && obj[k] !== null) {
            applyTaux(obj[k]);
          }
        }
      };
      applyTaux(newDraft);
      return {
        ...state,
        draftRules: newDraft,
        workflowStep: 'draft_saved'
      };
    }
    default:
      return state;
  }
}

// ==========================================
// 3. MAIN COMPONENT
// ==========================================

const ReimbursementRulesPage = () => {
  const { showToast } = useToast();
  const { theme } = useTheme();
  
  const [state, dispatch] = useReducer(rulesReducer, initialState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeHistoryIndex, setActiveHistoryIndex] = useState(-1);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Simulation parameters for instant claims dry run
  const [simClaim, setSimClaim] = useState({ type: 'Pharmacie', honoraires: 100 });
  const [simResult, setSimResult] = useState(null);

  // Load from backend API
  const loadRules = async () => {
    try {
      setLoading(true);
      const data = await fetchReimbursementRules();
      dispatch({ type: 'INIT_RULES', payload: data });
      
      // Auto-load draft from localStorage if present
      const savedDraft = localStorage.getItem('reimbursement_rules_draft');
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        dispatch({ type: 'LOAD_DRAFT_FROM_STORAGE', payload: parsed });
        showToast("Brouillon local récupéré avec succès !", "info");
      }
    } catch (err) {
      showToast(err.message || "Erreur de chargement des barèmes", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  // Sync draft to localStorage on change (Auto-save draft)
  useEffect(() => {
    if (state.draftRules && state.workflowStep === 'draft_saved') {
      localStorage.setItem('reimbursement_rules_draft', JSON.stringify(state.draftRules));
    }
  }, [state.draftRules, state.workflowStep]);

  // Real-time claims simulator (WOW Factor UX)
  useEffect(() => {
    if (!state.draftRules) return;
    
    const calculateReimbursement = () => {
      const type = simClaim.type;
      const hon = parseFloat(simClaim.honoraires) || 0;
      let remb = 0;
      let rate = 0;
      let limit = Infinity;

      if (type === 'Pharmacie') {
        rate = state.draftRules.pharmacie.taux;
        limit = state.draftRules.pharmacie.plafond_annuel;
        remb = hon * rate;
      } else if (type === 'Analyses') {
        rate = state.draftRules.analyses.taux;
        limit = state.draftRules.analyses.plafond_annuel;
        remb = hon * rate;
      } else if (type === 'Radiologie') {
        rate = state.draftRules.radiologie_electroradiologie.taux;
        limit = state.draftRules.radiologie_electroradiologie.plafond_annuel;
        remb = hon * rate;
      } else if (type === 'Chirurgie') {
        rate = state.draftRules.chirurgie.taux;
        limit = state.draftRules.chirurgie.plafond_annuel;
        remb = hon * rate;
      } else if (type === 'Dentaire') {
        rate = state.draftRules.dentaire.soins_protheses_implants.taux;
        limit = state.draftRules.dentaire.soins_protheses_implants.plafond_annuel;
        remb = hon * rate;
      } else if (type === 'Optique (Monture)') {
        rate = state.draftRules.optique.monture.taux;
        limit = state.draftRules.optique.monture.plafond_max;
        remb = hon * rate;
      }

      const finalRemb = Math.min(remb, limit);

      setSimResult({
        reimbursement: finalRemb.toFixed(3),
        appliedRate: (rate * 100).toFixed(0),
        appliedLimit: limit === Infinity ? 'Aucun' : `${limit} TND`,
        rembExceeded: remb > limit
      });
    };

    calculateReimbursement();
  }, [simClaim, state.draftRules]);

  // Check if draft rules differ from active rules
  const hasChanges = JSON.stringify(state.activeRules) !== JSON.stringify(state.draftRules);

  // Compute form completion percentage
  const getCompletionPercentage = () => {
    if (!state.draftRules) return 0;
    const requiredPaths = [
      'plafond_annuel_global_par_prestataire',
      'pharmacie.taux',
      'pharmacie.plafond_annuel',
      'analyses.taux',
      'analyses.plafond_annuel',
      'chirurgie.taux',
      'chirurgie.plafond_annuel',
      'dentaire.soins_protheses_implants.taux',
      'optique.monture.plafond_max'
    ];
    let filled = 0;
    const getVal = (path) => {
      const keys = path.split('.');
      let cur = state.draftRules;
      for (const k of keys) {
        if (!cur) return undefined;
        cur = cur[k];
      }
      return cur;
    };
    requiredPaths.forEach(p => {
      const v = getVal(p);
      if (v !== undefined && v !== '' && !isNaN(v)) filled++;
    });
    return Math.round((filled / requiredPaths.length) * 100);
  };

  // Exhaustive validation check for all fields
  const validateAllRules = (rules) => {
    const errors = {};
    const checkValue = (path, val, isTaux) => {
      if (val === undefined || val === null || val === '' || isNaN(val)) {
        errors[path] = "Ce champ est obligatoire et ne peut pas être vide.";
      } else {
        const num = parseFloat(val);
        if (isTaux) {
          if (num < 0 || num > 1) {
            errors[path] = "Le taux de remboursement doit être compris entre 0% et 100%.";
          }
        } else {
          if (num < 0) {
            errors[path] = "La valeur doit être un montant supérieur ou égal à 0.";
          }
        }
      }
    };

    checkValue('plafond_annuel_global_par_prestataire', rules.plafond_annuel_global_par_prestataire, false);
    checkValue('pharmacie.taux', rules.pharmacie.taux, true);
    checkValue('pharmacie.plafond_annuel', rules.pharmacie.plafond_annuel, false);
    checkValue('analyses.taux', rules.analyses.taux, true);
    checkValue('analyses.plafond_annuel', rules.analyses.plafond_annuel, false);
    checkValue('radiologie_electroradiologie.taux', rules.radiologie_electroradiologie.taux, true);
    checkValue('radiologie_electroradiologie.plafond_annuel', rules.radiologie_electroradiologie.plafond_annuel, false);
    checkValue('chirurgie.taux', rules.chirurgie.taux, true);
    checkValue('chirurgie.plafond_annuel', rules.chirurgie.plafond_annuel, false);
    checkValue('anesthesie.taux', rules.anesthesie.taux, true);
    checkValue('anesthesie.plafond_annuel', rules.anesthesie.plafond_annuel, false);
    checkValue('salle_operation.taux', rules.salle_operation.taux, true);
    checkValue('salle_operation.plafond_annuel', rules.salle_operation.plafond_annuel, false);
    checkValue('dentaire.soins_protheses_implants.taux', rules.dentaire.soins_protheses_implants.taux, true);
    checkValue('dentaire.soins_protheses_implants.plafond_annuel', rules.dentaire.soins_protheses_implants.plafond_annuel, false);
    checkValue('dentaire.orthopedie_dento_faciale.plafond_annuel', rules.dentaire.orthopedie_dento_faciale.plafond_annuel, false);
    checkValue('optique.monture.plafond_max', rules.optique.monture.plafond_max, false);
    checkValue('optique.verre.plafond_max', rules.optique.verre.plafond_max, false);
    checkValue('hospitalisation.clinique.montant_par_jour', rules.hospitalisation.clinique.montant_par_jour, false);
    checkValue('hospitalisation.hopital.montant_par_jour', rules.hospitalisation.hopital.montant_par_jour, false);
    checkValue('hospitalisation.reanimation.montant_par_jour', rules.hospitalisation.reanimation.montant_par_jour, false);
    checkValue('hospitalisation.couveuse.montant_par_jour', rules.hospitalisation.couveuse.montant_par_jour, false);
    checkValue('maternite.accouchement_simple', rules.maternite.accouchement_simple, false);
    checkValue('maternite.gemellaire', rules.maternite.gemellaire, false);
    checkValue('maternite.sterilite', rules.maternite.sterilite, false);
    checkValue('consultations.C1', rules.consultations?.C1, false);
    checkValue('consultations.C2', rules.consultations?.C2, false);
    checkValue('consultations.C3', rules.consultations?.C3, false);
    checkValue('consultations.V1', rules.consultations?.V1, false);
    checkValue('consultations.V2', rules.consultations?.V2, false);
    checkValue('consultations.V3', rules.consultations?.V3, false);

    return errors;
  };

  // Safe publication save to server
  const handlePublish = async () => {
    const validationErrors = validateAllRules(state.draftRules);
    
    if (Object.keys(validationErrors).length > 0) {
      dispatch({ type: 'SET_ERRORS', payload: validationErrors });
      showToast("Certains champs sont vides ou invalides. Veuillez les corriger avant de publier.", "error");
      
      // Auto-expand any section containing errors so the user sees it
      // Simple logic to find the first category with error
      return;
    }
    
    try {
      setSaving(true);
      await updateReimbursementRules(state.draftRules);
      dispatch({ type: 'SAVE_SUCCESS', user: 'Super Admin' });
      localStorage.removeItem('reimbursement_rules_draft');
      showToast("Les barèmes ont été publiés avec succès !", "success");
    } catch (err) {
      showToast(err.message || "Erreur de publication des barèmes", "error");
    } finally {
      setSaving(false);
    }
  };

  // Export layout to dynamic JSON file
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.draftRules, null, 4));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `reimbursement_rules_export_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("Fichier JSON exporté avec succès !", "success");
  };

  // Import layout from JSON file
  const handleImportJSON = (e) => {
    const fileReader = new FileReader();
    const file = e.target.files[0];
    if (!file) return;
    fileReader.onload = event => {
      try {
        const parsed = JSON.parse(event.target.result);
        dispatch({ type: 'APPLY_PRESET', payload: parsed });
        showToast("Configuration importée avec succès ! Pensez à sauvegarder/publier.", "success");
      } catch (err) {
        showToast("Format de fichier JSON invalide.", "error");
      }
    };
    fileReader.readAsText(file);
  };

  // Print support
  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
        <RefreshCw className="animate-spin text-purple-600 dark:text-purple-400" size={48} />
        <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-xs">Chargement de la console des barèmes...</p>
      </div>
    );
  }

  // Component inside code block helper
  const RenderTooltip = ({ field }) => {
    const text = FIELD_HELPERS[field];
    if (!text) return null;
    return (
      <div className="group relative inline-block ml-1.5 cursor-help align-middle">
        <HelpCircle size={14} className="text-slate-300 dark:text-slate-600 hover:text-purple-500 transition-colors" />
        <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-900 text-white text-[11px] p-3 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50 leading-relaxed font-normal normal-case tracking-normal">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 print:p-0 print:max-w-full">
      
      {/* Printable Title Block */}
      <div className="hidden print:block mb-8">
        <h1 className="text-2xl font-bold text-black">GAT ASSURANCE / TUNISIE TELECOM</h1>
        <h2 className="text-xl font-medium text-slate-700">Barèmes Officiels de Remboursement - Groupe Maladie 2026</h2>
        <p className="text-xs text-slate-500 mt-1">Imprimé le : {new Date().toLocaleDateString('fr-FR')}</p>
      </div>

      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/5 pb-6 print:hidden">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
              <Sliders className="text-purple-600 dark:text-purple-400" size={28} />
              Console des Barèmes
            </h1>
            <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
              state.workflowStep === 'active' 
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse'
            }`}>
              {state.workflowStep === 'active' ? '● En Ligne' : '● Brouillon en cours'}
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Modifiez en temps réel les barèmes, contrôlez les impacts et prévisualisez la tarification.
          </p>
        </div>

        {/* Action controls */}
        <div className="flex flex-wrap items-center gap-2.5">


          <button
            onClick={handlePublish}
            disabled={saving || !hasChanges}
            className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-purple-500/25 transition-all active:scale-95 disabled:opacity-50 h-[48px]"
          >
            {saving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
            Publier les Barèmes
          </button>
        </div>
      </div>

      {/* Unsaved changes alert */}
      {hasChanges && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 px-5 py-4 rounded-2xl flex items-center justify-between gap-4 print:hidden"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="shrink-0" size={20} />
            <div className="text-xs font-bold uppercase tracking-wider">
              Vous avez des modifications non publiées. Le brouillon est enregistré localement !
            </div>
          </div>
          <button 
            onClick={() => dispatch({ type: 'INIT_RULES', payload: state.activeRules })}
            className="text-[10px] font-black uppercase bg-amber-500/20 hover:bg-amber-500/30 px-3 py-1.5 rounded-lg transition-colors"
          >
            Annuler
          </button>
        </motion.div>
      )}

      {/* Primary Dashboard Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ======================================================== */}
        {/* LEFT COLUMN: CONTROL PANEL & LIVE SIMULATOR (1/3 width)  */}
        {/* ======================================================== */}
        <div className="lg:col-span-4 space-y-6 print:hidden">

          {/* Dynamic Simulator (WOW Factor Component) */}
          <div className="bg-gradient-to-br from-purple-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden border border-purple-500/20">
            <div className="absolute -right-16 -top-16 w-32 h-32 bg-purple-500/10 rounded-full blur-[40px]" />
            
            <h3 className="text-xs font-black uppercase tracking-widest text-purple-300 mb-4 flex items-center gap-2">
              <TrendingUp size={16} />
              Simulateur d'Actes en Direct
            </h3>
            
            <p className="text-[11px] text-purple-200/80 mb-5 leading-normal">
              Testez instantanément le remboursement généré par votre configuration actuelle :
            </p>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-purple-200">Nature du Soin</label>
                <select
                  value={simClaim.type}
                  onChange={(e) => setSimClaim(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-white/30"
                >
                  <option value="Pharmacie" className="bg-purple-950">Pharmacie (Médicament)</option>
                  <option value="Analyses" className="bg-purple-950">Analyses</option>
                  <option value="Radiologie" className="bg-purple-950">Radiologie</option>
                  <option value="Chirurgie" className="bg-purple-950">Chirurgie</option>
                  <option value="Dentaire" className="bg-purple-950">Soins Dentaires</option>
                  <option value="Optique (Monture)" className="bg-purple-950">Monture Lunettes</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-purple-200">Frais Réels (Honoraires TND)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-purple-300">
                    <DollarSign size={14} />
                  </div>
                  <input
                    type="number"
                    value={simClaim.honoraires}
                    onChange={(e) => setSimClaim(prev => ({ ...prev, honoraires: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-xs text-white outline-none focus:border-white/30 font-bold"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Results dry run output */}
            {simResult && (
              <div className="mt-6 pt-5 border-t border-white/10 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-purple-200 font-medium">Taux Appliqué :</span>
                  <span className="text-xs font-black">{simResult.appliedRate}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-purple-200 font-medium">Plafond Acte :</span>
                  <span className="text-xs font-black">{simResult.appliedLimit}</span>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 flex flex-col items-center mt-2">
                  <span className="text-[9px] uppercase tracking-widest text-purple-300">Remboursement Estimé</span>
                  <span className="text-2xl font-black text-purple-300 mt-1">{simResult.reimbursement} <span className="text-xs">TND</span></span>
                  {simResult.rembExceeded && (
                    <span className="text-[8px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full mt-2 font-bold uppercase tracking-wider">Plafond d'acte dépassé</span>
                  )}
                </div>
              </div>
            )}
          </div>



        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: ACCORDION FORM SECTIONS (2/3 width)        */}
        {/* ======================================================== */}
        <div className="lg:col-span-8 space-y-6">

          {/* Interactive toolbar */}
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-3xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md print:hidden">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search size={16} />
              </div>
              <input
                type="text"
                placeholder="Recherche rapide (ex: dentaire, ODF, taux...)"
                value={state.searchQuery}
                onChange={(e) => dispatch({ type: 'SET_SEARCH', payload: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 transition-all"
              />
            </div>
            
            <div className="flex items-center gap-2 self-end">
              <button
                type="button"
                onClick={() => dispatch({ type: 'EXPAND_ALL' })}
                className="px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
              >
                Tout ouvrir
              </button>
              <button
                type="button"
                onClick={() => dispatch({ type: 'COLLAPSE_ALL' })}
                className="px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
              >
                Tout fermer
              </button>
              <button
                type="button"
                onClick={() => dispatch({ type: 'TOGGLE_BULK' })}
                className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                  state.bulkMode 
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' 
                    : 'border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`}
              >
                Édition globale
              </button>
            </div>
          </div>

          {/* Bulk edit popup */}
          <AnimatePresence>
            {state.bulkMode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-purple-600/10 border border-purple-500/20 p-5 rounded-3xl space-y-3 print:hidden"
              >
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                  <Sparkles size={16} />
                  <span className="text-xs font-black uppercase tracking-wider">Mode Édition Globale Rapide</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                  Modifiez instantanément le taux de prise en charge de **TOUS** les soins à une valeur commune :
                </p>
                <div className="flex items-center gap-3">
                  <div className="relative max-w-[150px]">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Percent size={14} />
                    </div>
                    <input
                      type="number"
                      placeholder="Ex: 85"
                      min="0"
                      max="100"
                      className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:border-purple-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          dispatch({ type: 'APPLY_BULK_RATES', payload: e.target.value });
                          showToast(`Taux globaux configurés sur ${e.target.value}% !`, "success");
                        }
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">(Appuyez sur Entrée pour appliquer à l'ensemble)</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ACCORDION FORM */}
          <div className="space-y-4">
            
            {/* 1. SECTEUR GLOBAL LIMIT */}
            {(!state.searchQuery || 'global'.includes(state.searchQuery.toLowerCase()) || 'plafond global'.includes(state.searchQuery.toLowerCase())) && (
              <AccordionCard
                title="Plafonds Globaux Système"
                icon={ShieldCheck}
                collapsed={state.collapses.global}
                toggle={() => dispatch({ type: 'TOGGLE_COLLAPSE', payload: 'global' })}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormInput
                    label="Plafond Annuel Global par Adhérent (TND)"
                    field="plafond_annuel_global_par_prestataire"
                    value={state.draftRules.plafond_annuel_global_par_prestataire}
                    onChange={(val) => dispatch({ type: 'UPDATE_FIELD', payload: { path: 'plafond_annuel_global_par_prestataire', value: val } })}
                    error={state.errors['plafond_annuel_global_par_prestataire']}
                    icon={DollarSign}
                  />
                </div>
              </AccordionCard>
            )}

            {/* 1.5. SECTEUR CONSULTATIONS */}
            {(!state.searchQuery || 'consultations'.includes(state.searchQuery.toLowerCase()) || 'visite'.includes(state.searchQuery.toLowerCase()) || 'tarif'.includes(state.searchQuery.toLowerCase()) || 'c1'.includes(state.searchQuery.toLowerCase())) && (
              <AccordionCard
                title="Consultations & Visites Médicales"
                icon={Activity}
                collapsed={state.collapses.consultations}
                toggle={() => dispatch({ type: 'TOGGLE_COLLAPSE', payload: 'consultations' })}
              >
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <FormInput
                      label="Tarif C1 (Généraliste Cabinet) (TND)"
                      field="consultations.C1"
                      value={state.draftRules.consultations?.C1 || ''}
                      onChange={(val) => dispatch({ type: 'UPDATE_FIELD', payload: { path: 'consultations.C1', value: parseFloat(val) || 0 } })}
                      error={state.errors['consultations.C1']}
                      icon={DollarSign}
                    />
                    <FormInput
                      label="Tarif C2 (Spécialiste Cabinet) (TND)"
                      field="consultations.C2"
                      value={state.draftRules.consultations?.C2 || ''}
                      onChange={(val) => dispatch({ type: 'UPDATE_FIELD', payload: { path: 'consultations.C2', value: parseFloat(val) || 0 } })}
                      error={state.errors['consultations.C2']}
                      icon={DollarSign}
                    />
                    <FormInput
                      label="Tarif C3 (Professeur Cabinet) (TND)"
                      field="consultations.C3"
                      value={state.draftRules.consultations?.C3 || ''}
                      onChange={(val) => dispatch({ type: 'UPDATE_FIELD', payload: { path: 'consultations.C3', value: parseFloat(val) || 0 } })}
                      error={state.errors['consultations.C3']}
                      icon={DollarSign}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4 border-t border-slate-100 dark:border-white/5">
                    <FormInput
                      label="Tarif V1 (Généraliste Visite) (TND)"
                      field="consultations.V1"
                      value={state.draftRules.consultations?.V1 || ''}
                      onChange={(val) => dispatch({ type: 'UPDATE_FIELD', payload: { path: 'consultations.V1', value: parseFloat(val) || 0 } })}
                      error={state.errors['consultations.V1']}
                      icon={DollarSign}
                    />
                    <FormInput
                      label="Tarif V2 (Spécialiste Visite) (TND)"
                      field="consultations.V2"
                      value={state.draftRules.consultations?.V2 || ''}
                      onChange={(val) => dispatch({ type: 'UPDATE_FIELD', payload: { path: 'consultations.V2', value: parseFloat(val) || 0 } })}
                      error={state.errors['consultations.V2']}
                      icon={DollarSign}
                    />
                    <FormInput
                      label="Tarif V3 (Professeur Visite) (TND)"
                      field="consultations.V3"
                      value={state.draftRules.consultations?.V3 || ''}
                      onChange={(val) => dispatch({ type: 'UPDATE_FIELD', payload: { path: 'consultations.V3', value: parseFloat(val) || 0 } })}
                      error={state.errors['consultations.V3']}
                      icon={DollarSign}
                    />
                  </div>
                </div>
              </AccordionCard>
            )}

            {/* 2. PHARMACIE */}
            {(!state.searchQuery || 'pharmacie'.includes(state.searchQuery.toLowerCase()) || 'medicament'.includes(state.searchQuery.toLowerCase())) && (
              <AccordionCard
                title="Secteur Pharmacie & Médicaments"
                icon={HeartPulse}
                collapsed={state.collapses.pharmacie}
                toggle={() => dispatch({ type: 'TOGGLE_COLLAPSE', payload: 'pharmacie' })}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormInput
                    label="Taux de Prise en Charge (%)"
                    field="pharmacie.taux"
                    value={state.draftRules.pharmacie.taux * 100}
                    onChange={(val) => dispatch({ type: 'UPDATE_FIELD', payload: { path: 'pharmacie.taux', value: parseFloat(val) / 100 } })}
                    error={state.errors['pharmacie.taux']}
                    icon={Percent}
                  />
                  <FormInput
                    label="Plafond Annuel (TND)"
                    field="pharmacie.plafond_annuel"
                    value={state.draftRules.pharmacie.plafond_annuel}
                    onChange={(val) => dispatch({ type: 'UPDATE_FIELD', payload: { path: 'pharmacie.plafond_annuel', value: val } })}
                    error={state.errors['pharmacie.plafond_annuel']}
                    icon={DollarSign}
                  />
                </div>
              </AccordionCard>
            )}

            {/* 3. ANALYSES & DIAGNOSTIC */}
            {(!state.searchQuery || 'analyses'.includes(state.searchQuery.toLowerCase()) || 'radiologie'.includes(state.searchQuery.toLowerCase())) && (
              <AccordionCard
                title="Analyses Médicales & Imagerie"
                icon={Activity}
                collapsed={state.collapses.analyses}
                toggle={() => dispatch({ type: 'TOGGLE_COLLAPSE', payload: 'analyses' })}
              >
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormInput
                      label="Analyses - Taux de Remboursement (%)"
                      field="analyses.taux"
                      value={state.draftRules.analyses.taux * 100}
                      onChange={(val) => dispatch({ type: 'UPDATE_FIELD', payload: { path: 'analyses.taux', value: parseFloat(val) / 100 } })}
                      error={state.errors['analyses.taux']}
                      icon={Percent}
                    />
                    <FormInput
                      label="Analyses - Plafond Annuel (TND)"
                      field="analyses.plafond_annuel"
                      value={state.draftRules.analyses.plafond_annuel}
                      onChange={(val) => dispatch({ type: 'UPDATE_FIELD', payload: { path: 'analyses.plafond_annuel', value: val } })}
                      error={state.errors['analyses.plafond_annuel']}
                      icon={DollarSign}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-100 dark:border-white/5">
                    <FormInput
                      label="Imagerie - Taux de Remboursement (%)"
                      field="radiologie_electroradiologie.taux"
                      value={state.draftRules.radiologie_electroradiologie.taux * 100}
                      onChange={(val) => dispatch({ type: 'UPDATE_FIELD', payload: { path: 'radiologie_electroradiologie.taux', value: parseFloat(val) / 100 } })}
                      error={state.errors['radiologie_electroradiologie.taux']}
                      icon={Percent}
                    />
                    <FormInput
                      label="Imagerie - Plafond Annuel (TND)"
                      field="radiologie_electroradiologie.plafond_annuel"
                      value={state.draftRules.radiologie_electroradiologie.plafond_annuel}
                      onChange={(val) => dispatch({ type: 'UPDATE_FIELD', payload: { path: 'radiologie_electroradiologie.plafond_annuel', value: val } })}
                      error={state.errors['radiologie_electroradiologie.plafond_annuel']}
                      icon={DollarSign}
                    />
                  </div>
                </div>
              </AccordionCard>
            )}

            {/* 4. CHIRURGIE & BLOC */}
            {(!state.searchQuery || 'chirurgie'.includes(state.searchQuery.toLowerCase()) || 'anesthesie'.includes(state.searchQuery.toLowerCase()) || 'bloc'.includes(state.searchQuery.toLowerCase())) && (
              <AccordionCard
                title="Chirurgie, Anesthésie & Bloc"
                icon={Sliders}
                collapsed={state.collapses.chirurgie}
                toggle={() => dispatch({ type: 'TOGGLE_COLLAPSE', payload: 'chirurgie' })}
              >
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormInput
                      label="Chirurgie - Taux (%)"
                      field="chirurgie.taux"
                      value={state.draftRules.chirurgie.taux * 100}
                      onChange={(val) => dispatch({ type: 'UPDATE_FIELD', payload: { path: 'chirurgie.taux', value: parseFloat(val) / 100 } })}
                      error={state.errors['chirurgie.taux']}
                      icon={Percent}
                    />
                    <FormInput
                      label="Chirurgie - Plafond (TND)"
                      field="chirurgie.plafond_annuel"
                      value={state.draftRules.chirurgie.plafond_annuel}
                      onChange={(val) => dispatch({ type: 'UPDATE_FIELD', payload: { path: 'chirurgie.plafond_annuel', value: val } })}
                      error={state.errors['chirurgie.plafond_annuel']}
                      icon={DollarSign}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-100 dark:border-white/5">
                    <FormInput
                      label="Anesthésie - Taux (%)"
                      field="anesthesie.taux"
                      value={state.draftRules.anesthesie.taux * 100}
                      onChange={(val) => dispatch({ type: 'UPDATE_FIELD', payload: { path: 'anesthesie.taux', value: parseFloat(val) / 100 } })}
                      error={state.errors['anesthesie.taux']}
                      icon={Percent}
                    />
                    <FormInput
                      label="Anesthésie - Plafond (TND)"
                      field="anesthesie.plafond_annuel"
                      value={state.draftRules.anesthesie.plafond_annuel}
                      onChange={(val) => dispatch({ type: 'UPDATE_FIELD', payload: { path: 'anesthesie.plafond_annuel', value: val } })}
                      error={state.errors['anesthesie.plafond_annuel']}
                      icon={DollarSign}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-100 dark:border-white/5">
                    <FormInput
                      label="Bloc Opératoire - Taux (%)"
                      field="salle_operation.taux"
                      value={state.draftRules.salle_operation.taux * 100}
                      onChange={(val) => dispatch({ type: 'UPDATE_FIELD', payload: { path: 'salle_operation.taux', value: parseFloat(val) / 100 } })}
                      error={state.errors['salle_operation.taux']}
                      icon={Percent}
                    />
                    <FormInput
                      label="Bloc Opératoire - Plafond (TND)"
                      field="salle_operation.plafond_annuel"
                      value={state.draftRules.salle_operation.plafond_annuel}
                      onChange={(val) => dispatch({ type: 'UPDATE_FIELD', payload: { path: 'salle_operation.plafond_annuel', value: val } })}
                      error={state.errors['salle_operation.plafond_annuel']}
                      icon={DollarSign}
                    />
                  </div>
                </div>
              </AccordionCard>
            )}

            {/* 5. SECTEUR DENTAIRE */}
            {(!state.searchQuery || 'dentaire'.includes(state.searchQuery.toLowerCase()) || 'orthodontie'.includes(state.searchQuery.toLowerCase()) || 'odf'.includes(state.searchQuery.toLowerCase())) && (
              <AccordionCard
                title="Secteur Dentaire & Orthodontie"
                icon={Activity}
                collapsed={state.collapses.dentaire}
                toggle={() => dispatch({ type: 'TOGGLE_COLLAPSE', payload: 'dentaire' })}
              >
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormInput
                      label="Soins Dentaires - Taux (%)"
                      field="dentaire.soins_protheses_implants.taux"
                      value={state.draftRules.dentaire.soins_protheses_implants.taux * 100}
                      onChange={(val) => dispatch({ type: 'UPDATE_FIELD', payload: { path: 'dentaire.soins_protheses_implants.taux', value: parseFloat(val) / 100 } })}
                      error={state.errors['dentaire.soins_protheses_implants.taux']}
                      icon={Percent}
                    />
                    <FormInput
                      label="Soins Dentaires - Plafond (TND)"
                      field="dentaire.soins_protheses_implants.plafond_annuel"
                      value={state.draftRules.dentaire.soins_protheses_implants.plafond_annuel}
                      onChange={(val) => dispatch({ type: 'UPDATE_FIELD', payload: { path: 'dentaire.soins_protheses_implants.plafond_annuel', value: val } })}
                      error={state.errors['dentaire.soins_protheses_implants.plafond_annuel']}
                      icon={DollarSign}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-100 dark:border-white/5">
                    <FormInput
                      label="Orthodontie Enfant (ODF) - Plafond Annuel (TND)"
                      field="dentaire.orthopedie_dento_faciale.plafond_annuel"
                      value={state.draftRules.dentaire.orthopedie_dento_faciale.plafond_annuel}
                      onChange={(val) => dispatch({ type: 'UPDATE_FIELD', payload: { path: 'dentaire.orthopedie_dento_faciale.plafond_annuel', value: val } })}
                      error={state.errors['dentaire.orthopedie_dento_faciale.plafond_annuel']}
                      icon={DollarSign}
                    />
                  </div>
                </div>
              </AccordionCard>
            )}

            {/* 5.5. SECTEUR OPTIQUE */}
            {(!state.searchQuery || 'optique'.includes(state.searchQuery.toLowerCase()) || 'lunettes'.includes(state.searchQuery.toLowerCase()) || 'verre'.includes(state.searchQuery.toLowerCase()) || 'monture'.includes(state.searchQuery.toLowerCase())) && (
              <AccordionCard
                title="Secteur Optique & Lunettes"
                icon={Glasses}
                collapsed={state.collapses.optique}
                toggle={() => dispatch({ type: 'TOGGLE_COLLAPSE', payload: 'optique' })}
              >
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormInput
                      label="Optique Montures - Limite Max (TND)"
                      field="optique.monture.plafond_max"
                      value={state.draftRules.optique.monture.plafond_max}
                      onChange={(val) => dispatch({ type: 'UPDATE_FIELD', payload: { path: 'optique.monture.plafond_max', value: val } })}
                      error={state.errors['optique.monture.plafond_max']}
                      icon={DollarSign}
                    />
                    <FormInput
                      label="Optique Verres - Limite Max (TND)"
                      field="optique.verre.plafond_max"
                      value={state.draftRules.optique.verre.plafond_max}
                      onChange={(val) => dispatch({ type: 'UPDATE_FIELD', payload: { path: 'optique.verre.plafond_max', value: val } })}
                      error={state.errors['optique.verre.plafond_max']}
                      icon={DollarSign}
                    />
                  </div>
                </div>
              </AccordionCard>
            )}

            {/* 6. HOSPITALISATION & MATERNITE */}
            {(!state.searchQuery || 'hospitalisation'.includes(state.searchQuery.toLowerCase()) || 'clinique'.includes(state.searchQuery.toLowerCase()) || 'accouchement'.includes(state.searchQuery.toLowerCase()) || 'maternite'.includes(state.searchQuery.toLowerCase())) && (
              <AccordionCard
                title="Hospitalisation & Maternité"
                icon={Home}
                collapsed={state.collapses.hospitalisation}
                toggle={() => dispatch({ type: 'TOGGLE_COLLAPSE', payload: 'hospitalisation' })}
              >
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormInput
                      label="Clinique Privée - Indemnité / jour (TND)"
                      field="hospitalisation.clinique.montant_par_jour"
                      value={state.draftRules.hospitalisation.clinique.montant_par_jour}
                      onChange={(val) => dispatch({ type: 'UPDATE_FIELD', payload: { path: 'hospitalisation.clinique.montant_par_jour', value: val } })}
                      error={state.errors['hospitalisation.clinique.montant_par_jour']}
                      icon={DollarSign}
                    />
                    <FormInput
                      label="Hôpital Public - Indemnité / jour (TND)"
                      field="hospitalisation.hopital.montant_par_jour"
                      value={state.draftRules.hospitalisation.hopital.montant_par_jour}
                      onChange={(val) => dispatch({ type: 'UPDATE_FIELD', payload: { path: 'hospitalisation.hopital.montant_par_jour', value: val } })}
                      error={state.errors['hospitalisation.hopital.montant_par_jour']}
                      icon={DollarSign}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-100 dark:border-white/5">
                    <FormInput
                      label="Réanimation - Prise en charge / jour (TND)"
                      field="hospitalisation.reanimation.montant_par_jour"
                      value={state.draftRules.hospitalisation.reanimation.montant_par_jour}
                      onChange={(val) => dispatch({ type: 'UPDATE_FIELD', payload: { path: 'hospitalisation.reanimation.montant_par_jour', value: val } })}
                      error={state.errors['hospitalisation.reanimation.montant_par_jour']}
                      icon={DollarSign}
                    />
                    <FormInput
                      label="Couveuse Enfant - Prise en charge / jour (TND)"
                      field="hospitalisation.couveuse.montant_par_jour"
                      value={state.draftRules.hospitalisation.couveuse.montant_par_jour}
                      onChange={(val) => dispatch({ type: 'UPDATE_FIELD', payload: { path: 'hospitalisation.couveuse.montant_par_jour', value: val } })}
                      error={state.errors['hospitalisation.couveuse.montant_par_jour']}
                      icon={DollarSign}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-100 dark:border-white/5">
                    <FormInput
                      label="Accouchement Simple - Forfait (TND)"
                      field="maternite.accouchement_simple"
                      value={state.draftRules.maternite.accouchement_simple}
                      onChange={(val) => dispatch({ type: 'UPDATE_FIELD', payload: { path: 'maternite.accouchement_simple', value: val } })}
                      error={state.errors['maternite.accouchement_simple']}
                      icon={DollarSign}
                    />
                    <FormInput
                      label="Accouchement Gémellaire - Forfait (TND)"
                      field="maternite.gemellaire"
                      value={state.draftRules.maternite.gemellaire}
                      onChange={(val) => dispatch({ type: 'UPDATE_FIELD', payload: { path: 'maternite.gemellaire', value: val } })}
                      error={state.errors['maternite.gemellaire']}
                      icon={DollarSign}
                    />
                    <FormInput
                      label="Traitement Stérilité - Plafond (TND)"
                      field="maternite.sterilite"
                      value={state.draftRules.maternite.sterilite}
                      onChange={(val) => dispatch({ type: 'UPDATE_FIELD', payload: { path: 'maternite.sterilite', value: val } })}
                      error={state.errors['maternite.sterilite']}
                      icon={DollarSign}
                      className="md:col-span-2"
                    />
                  </div>
                </div>
              </AccordionCard>
            )}

          </div>

        </div>

      </div>

      {/* ======================================================== */}
      {/* HISTORY & VERSIONS COMPARATOR MODAL                      */}
      {/* ======================================================== */}
      <AnimatePresence>
        {showHistoryModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 max-w-2xl w-full rounded-3xl p-6 md:p-8 shadow-2xl relative"
            >
              <h3 className="text-lg font-black uppercase text-slate-800 dark:text-white tracking-widest mb-4 flex items-center gap-2">
                <History className="text-purple-600" />
                Historique des modifications & versions
              </h3>
              
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                Comparez et restaurez les versions des barèmes enregistrées durant cette session de travail.
              </p>

              {state.history.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                  <Info size={32} className="mx-auto text-slate-400 mb-2" />
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Aucun historique enregistré pour le moment.</p>
                  <p className="text-[10px] text-slate-400 mt-1">Publiez des changements pour créer une nouvelle révision.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                  {state.history.map((hist, index) => (
                    <div 
                      key={index}
                      className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2">
                          <CheckCircle size={14} className="text-emerald-500" />
                          Version #{state.history.length - index}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          Modifié par {hist.user} • {new Date(hist.timestamp).toLocaleTimeString('fr-FR')} ({new Date(hist.timestamp).toLocaleDateString('fr-FR')})
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          dispatch({ type: 'APPLY_PRESET', payload: hist.rules });
                          setShowHistoryModal(false);
                          showToast(`Restauration de la version #${state.history.length - index} appliquée au brouillon !`, "info");
                        }}
                        className="text-[10px] font-black uppercase tracking-wider bg-purple-600/10 hover:bg-purple-600 text-purple-600 hover:text-white px-3.5 py-2 rounded-xl transition-all"
                      >
                        Restaurer
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-8 pt-4 border-t border-slate-200 dark:border-white/5 text-right">
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-xl text-xs font-bold"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

// ==========================================
// 4. HELPER COMPONENTS (FORM & CARD)
// ==========================================

const AccordionCard = ({ title, icon: Icon, children, collapsed, toggle }) => {
  return (
    <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-3xl shadow-xl overflow-hidden print:border-none print:shadow-none">
      
      {/* Header section toggle click */}
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between p-5 md:p-6 text-left hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors outline-none focus:ring-2 focus:ring-purple-500/10 print:pointer-events-none"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Icon size={20} />
          </div>
          <span className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            {title}
          </span>
        </div>
        <div className="text-slate-400 print:hidden">
          {collapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </div>
      </button>

      {/* Slide Transition body */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="p-6 md:p-8 border-t border-slate-100 dark:border-white/5 bg-slate-50/20 dark:bg-slate-900/10">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

const FormInput = ({ label, field, value, onChange, error, icon: Icon, className = '' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 ml-1 uppercase tracking-widest flex items-center">
          {label}
          <div className="group relative inline-block ml-1.5 cursor-help align-middle">
            <HelpCircle size={14} className="text-slate-300 dark:text-slate-600 hover:text-purple-500 transition-colors" />
            <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-900 text-white text-[11px] p-3 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50 leading-relaxed font-normal normal-case tracking-normal">
              {FIELD_HELPERS[field] || 'Aucune description disponible pour ce champ.'}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
            </div>
          </div>
        </label>
      </div>

      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300 dark:text-slate-600 group-focus-within:text-purple-600 transition-colors">
          <Icon size={16} />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900 border ${
            error 
              ? 'border-red-500 ring-4 ring-red-500/10' 
              : 'border-slate-200 dark:border-slate-800 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10'
          } rounded-2xl outline-none text-xs font-bold text-slate-900 dark:text-white transition-all`}
        />
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[10px] font-bold text-red-500 dark:text-red-400 ml-1.5"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};

export default ReimbursementRulesPage;
