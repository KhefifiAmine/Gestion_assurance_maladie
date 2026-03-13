import React, { useState, useReducer, useContext, useEffect, createContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, AlertTriangle, XCircle, Info, X, 
  FileText, LayoutDashboard, List, Search, Filter, 
  MessageSquare, Eye, Send, Plus, 
  ArrowLeft, Clock, ShieldAlert, User,
  Activity, ChevronRight, Bell, RefreshCw
} from 'lucide-react';

/* =========================================================================
   IMPORTS & SETUP
   ========================================================================= */
import { getReclamations, createReclamation, updateReclamation, markReclamationAsRead } from '../services/reclamationService';
import { getMyBulletins } from '../services/bulletinService';

/* =========================================================================
   GLOBAL CONTEXT
   ========================================================================= */
export const ReclamationContext = createContext();

const initialState = {
  role: 'Adhérent', // Sera écrasé par AppLayout.defaultRole
  reclamations: [],
  bulletins: [],
  isLoading: true,
  toasts: [],
  confirmModal: { isOpen: false, title: '', message: '', type: 'warning', onConfirm: null }
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_DATA':
      return { ...state, reclamations: action.payload.reclamations, bulletins: action.payload.bulletins, isLoading: false };
    case 'SET_ROLE':
      return { ...state, role: action.payload };
    case 'ADD_RECLAMATION':
      return { ...state, reclamations: [action.payload, ...state.reclamations] };
    case 'UPDATE_RECLAMATION':
      return {
        ...state,
        reclamations: state.reclamations.map(r => r.id === action.payload.id ? { ...r, ...action.payload } : r)
      };
    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, action.payload] };
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };
    case 'SHOW_CONFIRM':
      return { ...state, confirmModal: { ...action.payload, isOpen: true } };
    case 'HIDE_CONFIRM':
      return { ...state, confirmModal: { ...state.confirmModal, isOpen: false } };
    case 'MARK_READ':
      return {
        ...state,
        reclamations: state.reclamations.map(r => r.id === action.payload ? { ...r, unread: false } : r)
      };
    default:
      return state;
  }
};

const ReclamationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const [reclamationsData, bulletinsData] = await Promise.all([
          getReclamations(),
          getMyBulletins().catch(() => []) // Fallback si l'admin n'a pas de bulletins persos
        ]);

        // Map backend shape to UI expected shape if necessary
        const formattedReclamations = reclamationsData.map(r => ({
          ...r,
          adherentNom: r.adherent ? `${r.adherent.prenom} ${r.adherent.nom}` : 'Utilisateur',
          dateCreation: r.createdAt
        }));

        if (isMounted) {
          dispatch({ 
            type: 'SET_DATA', 
            payload: { reclamations: formattedReclamations, bulletins: bulletinsData } 
          });
        }
      } catch (error) {
        console.error('Erreur de chargement', error);
        addToast('Impossible de charger les réclamations.', 'error');
        if (isMounted) dispatch({ type: 'SET_DATA', payload: { reclamations: [], bulletins: [] } });
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, []);

  const addToast = (message, type = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    dispatch({ type: 'ADD_TOAST', payload: { id, message, type } });
  };

  const showConfirm = (title, message, onConfirm, type = 'warning') => {
    dispatch({ type: 'SHOW_CONFIRM', payload: { title, message, onConfirm, type } });
  };

  return (
    <ReclamationContext.Provider value={{ state, dispatch, addToast, showConfirm }}>
      {children}
    </ReclamationContext.Provider>
  );
};

/* =========================================================================
   UI COMPONENTS
   ========================================================================= */
const ToastManager = () => {
  const { state, dispatch } = useContext(ReclamationContext);
  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 pointer-events-none">
      {state.toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} dispatch={dispatch} />
      ))}
    </div>
  );
};

const ToastItem = ({ toast, dispatch }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch({ type: 'REMOVE_TOAST', payload: toast.id });
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, dispatch]);

  const icons = {
    success: <CheckCircle className="text-emerald-500 w-6 h-6" />,
    warning: <AlertTriangle className="text-amber-500 w-6 h-6" />,
    error: <XCircle className="text-red-500 w-6 h-6" />,
    info: <Info className="text-purple-500 w-6 h-6" />
  };

  const bgs = {
    success: 'bg-white border-emerald-100 dark:bg-slate-900 dark:border-emerald-900/30',
    warning: 'bg-white border-amber-100 dark:bg-slate-900 dark:border-amber-900/30',
    error: 'bg-white border-red-100 dark:bg-slate-900 dark:border-red-900/30',
    info: 'bg-white border-purple-100 dark:bg-slate-900 dark:border-purple-900/30'
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`pointer-events-auto relative flex items-center p-5 min-w-[340px] max-w-sm border rounded-[1.5rem] shadow-2xl overflow-hidden ${bgs[toast.type]}`}
    >
      <div className="mr-4 flex-shrink-0">{icons[toast.type]}</div>
      <div className="flex-1 font-black text-[11px] uppercase tracking-wide text-slate-800 dark:text-slate-100 pr-6">{toast.message}</div>
      <button 
        onClick={() => dispatch({ type: 'REMOVE_TOAST', payload: toast.id })} 
        className="absolute top-5 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
      >
        <X size={16} />
      </button>
      <motion.div 
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: 4, ease: "linear" }}
        className={`absolute bottom-0 left-0 h-1 ${
          toast.type === 'success' ? 'bg-emerald-500' : 
          toast.type === 'warning' ? 'bg-amber-500' : 
          toast.type === 'error' ? 'bg-red-500' : 'bg-purple-600'
        }`} 
      />
    </motion.div>
  );
};

const ConfirmModal = () => {
  const { state, dispatch } = useContext(ReclamationContext);
  const { isOpen, title, message, onConfirm, type } = state.confirmModal;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => dispatch({ type: 'HIDE_CONFIRM' })}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex justify-center items-center p-4"
          />
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 pointer-events-auto border border-slate-100 dark:border-white/5 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 rounded-full blur-3xl" />
              <div className="flex flex-col items-center text-center mb-8">
                <div className={`p-4 rounded-3xl mb-6 shadow-xl ${type === 'danger' ? 'bg-red-50 text-red-600' : 'bg-purple-50 text-purple-600'}`}>
                  <ShieldAlert size={32} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">{title}</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-4 text-sm font-medium leading-relaxed">{message}</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => dispatch({ type: 'HIDE_CONFIRM' })} 
                  className="flex-1 py-4 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95"
                >
                  Annuler
                </button>
                <button 
                  onClick={() => { onConfirm(); dispatch({ type: 'HIDE_CONFIRM' }); }} 
                  className={`flex-1 py-4 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 ${
                    type === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20' : 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20'
                  }`}
                >
                  Confirmer
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

const StatusBadge = ({ statut }) => {
  const styles = {
    'Ouverte': 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/10 dark:text-purple-400 dark:border-purple-800/30',
    'En cours': 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/10 dark:text-amber-400 dark:border-amber-800/30',
    'Traitée': 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/10 dark:text-emerald-400 dark:border-emerald-800/30',
    'Clôturée': 'bg-slate-50 text-slate-500 border-slate-100 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700/30'
  };

  return (
    <span className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-full border shadow-inner ${styles[statut] || 'bg-gray-100 text-gray-700'}`}>
      {statut}
    </span>
  );
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const opts = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit' };
  return new Date(dateStr).toLocaleDateString('fr-FR', opts);
};

/* =========================================================================
   ADHERENT SUB-COMPONENTS
   ========================================================================= */
const ReclamationForm = ({ onBack }) => {
  const { state, dispatch, addToast } = useContext(ReclamationContext);
  const [formData, setFormData] = useState({ bulletinId: '', objet: '', description: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = (name, value) => {
    let error = '';
    if (name === 'objet') {
      if (!value.trim()) error = 'L\'objet est obligatoire';
      else if (value.trim().length < 5) error = 'Minimum 5 caractères requis';
    }
    if (name === 'description') {
       if (!value.trim()) error = 'La description est obligatoire';
       else if (value.trim().length < 15) error = 'Veuillez détailler un peu plus (min 15 caractères)';
    }
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) validateField(name, value);
  };

  const handleBlur = (e) => validateField(e.target.name, e.target.value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.objet.trim()) newErrors.objet = 'L\'objet est obligatoire';
    else if (formData.objet.length < 5) newErrors.objet = 'Minimum 5 caractères requis';
    if (!formData.description.trim()) newErrors.description = 'La description est obligatoire';
    else if (formData.description.length < 15) newErrors.description = 'Minimum 15 caractères requis';

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      addToast('Veuillez remplir tous les champs obligatoires.', 'warning');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const data = await createReclamation({
        objet: formData.objet.trim(),
        description: formData.description.trim(),
        bulletinId: formData.bulletinId || null
      });

      // format back for UI
      const formatted = {
        ...data,
        adherentNom: 'Moi' // On the list, it's just me anyway
      };

      dispatch({ type: 'ADD_RECLAMATION', payload: formatted });
      addToast('Réclamation envoyée avec succès', 'success');
      onBack();
    } catch (err) {
      addToast(err.message || 'Erreur lors de la création', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-scale-in">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-purple-600 transition font-bold mb-6 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 inline-flex">
        <ArrowLeft className="w-4 h-4" /> Retour
      </button>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Nouvelle Réclamation</h2>
          <p className="text-gray-500 text-sm mt-1">Veuillez détailler votre problème pour un traitement rapide par nos équipes.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
             <label className="block text-sm font-semibold text-gray-700 mb-2">Bulletin de soins associé (Optionnel)</label>
             <select 
                name="bulletinId" value={formData.bulletinId} onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:border-[#1E3A5F] focus:ring-4 focus:ring-[#1E3A5F]/10 transition"
             >
                <option value="">Sélectionnez un bulletin...</option>
                {state.bulletins.map(b => (
                  <option key={b.id} value={b.id}>
                     {b.numero_bulletin} - {b.type_dossier} ({b.date_depot ? new Date(b.date_depot).toLocaleDateString('fr-FR') : ''})
                  </option>
                ))}
             </select>
          </div>

          <div>
             <label className="block text-sm font-semibold text-gray-700 mb-2">Objet de la réclamation <span className="text-red-500">*</span></label>
             <input 
                type="text" name="objet" value={formData.objet} onChange={handleChange} onBlur={handleBlur}
                placeholder="Ex: Erreur sur le montant remboursé"
                className={`w-full border ${errors.objet ? 'border-red-500 focus:ring-red-500/10' : 'border-gray-300 focus:border-[#1E3A5F] focus:ring-[#1E3A5F]/10'} rounded-xl p-3 outline-none focus:ring-4 transition`}
             />
             {errors.objet && <p className="text-red-500 text-sm mt-1.5 flex items-center gap-1"><AlertTriangle className="w-4 h-4"/>{errors.objet}</p>}
          </div>

          <div>
             <label className="block text-sm font-semibold text-gray-700 mb-2">Description détaillée <span className="text-red-500">*</span></label>
             <textarea 
                name="description" value={formData.description} onChange={handleChange} onBlur={handleBlur} rows={5}
                placeholder="Décrivez précisément votre problème ici..."
                className={`w-full border ${errors.description ? 'border-red-500 focus:ring-red-500/10' : 'border-gray-300 focus:border-[#1E3A5F] focus:ring-[#1E3A5F]/10'} rounded-xl p-3 outline-none focus:ring-4 transition resize-y`}
             />
             {errors.description && <p className="text-red-500 text-sm mt-1.5 flex items-center gap-1"><AlertTriangle className="w-4 h-4"/>{errors.description}</p>}
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <button type="button" onClick={onBack} disabled={isSubmitting} className="px-6 py-3 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50">
              Annuler
            </button>
            <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-bold transition shadow-lg shadow-purple-500/20 disabled:opacity-70 disabled:cursor-not-allowed">
              {isSubmitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              {isSubmitting ? 'Envoi en cours...' : 'Envoyer la réclamation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ReclamationCard = ({ r, onView }) => (
  <div 
    onClick={() => onView(r.id)}
    className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center group"
  >
    <div className="flex-1">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-sm font-bold text-gray-400">#{r.reference || r.id}</span>
        <StatusBadge statut={r.statut} />
        {r.unread && (
          <span className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full animate-pulse border border-blue-100">
            <Bell className="w-3.5 h-3.5" /> Nouvelle réponse
          </span>
        )}
      </div>
      <h3 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-[#1E3A5F] transition">{r.objet}</h3>
      <p className="text-sm text-gray-500 line-clamp-1">{r.description}</p>
    </div>
    <div className="flex items-center gap-4 text-sm text-gray-400 mt-2 sm:mt-0">
      <div className="flex items-center gap-1.5 font-medium">
        <Clock className="w-4 h-4" />
        {new Date(r.dateCreation).toLocaleDateString('fr-FR')}
      </div>
      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-purple-600 dark:bg-purple-600 transition-all duration-300 shadow-lg shadow-purple-500/20">
        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </div>
  </div>
);

const AdherentList = ({ onNew, onView }) => {
  const { state } = useContext(ReclamationContext);
  const myReclamations = state.reclamations;

  if (state.isLoading) {
      return (
        <div className="flex flex-col items-center justify-center p-20 text-purple-600 dark:text-purple-400 font-black uppercase tracking-tighter">
           <RefreshCw className="w-10 h-10 animate-spin mb-4" />
           <p className="font-bold">Chargement de vos réclamations...</p>
        </div>
      );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-purple-600 dark:text-purple-400 font-black uppercase tracking-tighter">Mes Réclamations</h2>
          <p className="text-gray-500 text-sm mt-1 font-medium">Suivez l'état de vos demandes de régularisation</p>
        </div>
        <button 
          onClick={onNew}
          className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 shadow-purple-500/20 active:scale-95 transition-all duration-200 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest"
        >
          <Plus className="w-5 h-5" />
          Nouvelle Réclamation
        </button>
      </div>

      {myReclamations.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-gray-100 shadow-sm flex flex-col items-center">
          <div className="w-24 h-24 bg-blue-50/50 rounded-full flex items-center justify-center mb-6 text-[#1E3A5F]">
            <FileText className="w-12 h-12" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Aucune réclamation</h3>
          <p className="text-gray-500 max-w-sm mx-auto mb-8 leading-relaxed">Vous n'avez soumis aucune réclamation pour le moment. Tout semble en ordre avec vos bulletins de soins !</p>
          <button onClick={onNew} className="text-purple-600 dark:text-purple-400 font-black uppercase tracking-widest text-[10px] hover:underline transition-all flex items-center gap-2 mt-4">
            Créer ma première réclamation <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {myReclamations.map(r => <ReclamationCard key={r.id} r={r} onView={onView} />)}
        </div>
      )}
    </div>
  );
};

/* =========================================================================
   ADMIN SUB-COMPONENTS
   ========================================================================= */
const KPI = ({ title, value, icon, onClick, type = 'purple' }) => {
  const colors = {
    purple: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800 shadow-purple-500/5',
    amber: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800 shadow-amber-500/5',
    emerald: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800 shadow-emerald-500/5',
    indigo: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800 shadow-indigo-500/5'
  };

  return (
    <div 
      onClick={onClick} 
      className={`bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between group hover:shadow-xl transition-all duration-500 cursor-pointer`}
    >
      <div>
        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1">{title}</p>
        <h3 className={`text-4xl font-black tracking-tighter text-slate-900 dark:text-white`}>{value}</h3>
      </div>
      <div className={`p-4 rounded-2xl ${colors[type] || colors.purple}`}>
        {icon}
      </div>
    </div>
  );
};

const AdminDashboard = ({ onViewAll }) => {
  const { state } = useContext(ReclamationContext);
  const total = state.reclamations.length;
  const ouvertes = state.reclamations.filter(r => r.statut === 'Ouverte').length;
  const enCours = state.reclamations.filter(r => r.statut === 'En cours').length;
  const traitees = state.reclamations.filter(r => r.statut === 'Traitée').length;

  return (
    <div className="space-y-12 max-w-7xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-2"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-600/10 rounded-xl">
            <LayoutDashboard size={20} className="text-purple-600" />
          </div>
          <h2 className="text-[10px] font-black tracking-[0.3em] uppercase opacity-40 text-slate-900 dark:text-white">Statistiques</h2>
        </div>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Réclamations</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight">Vue d'ensemble et monitoring des dossiers adhérents</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <KPI onClick={onViewAll} title="Total Demandes" value={total} type="purple" icon={<List size={28} />} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <KPI onClick={onViewAll} title="Ouvertes" value={ouvertes} type="indigo" icon={<AlertTriangle size={28} />} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <KPI onClick={onViewAll} title="En Cours" value={enCours} type="amber" icon={<RefreshCw size={28} />} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <KPI onClick={onViewAll} title="Traitées" value={traitees} type="emerald" icon={<CheckCircle size={28} />} />
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl p-8 md:p-12 flex flex-col lg:flex-row items-center justify-between gap-10 border border-slate-100 dark:border-white/5 relative overflow-hidden"
      >
         <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl -mr-20 -mt-20" />
         <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-purple-500/20">
               <Activity size={36} />
            </div>
            <div className="text-center md:text-left">
               <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Pilotage des incidents</h3>
               <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xl font-medium leading-relaxed">Accédez à l'outil complet de gestion pour répondre aux adhérents, modifier les statuts et clôturer les dossiers résolus.</p>
            </div>
         </div>
         <button onClick={onViewAll} className="w-full lg:w-auto bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-10 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all shadow-2xl hover:bg-purple-600 dark:hover:bg-purple-400 dark:hover:text-white active:scale-95 relative z-10">
            Voir la table complète
         </button>
      </motion.div>
    </div>
  )
};

const AdminTable = ({ onView }) => {
  const { state } = useContext(ReclamationContext);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = state.reclamations.filter(r => {
    const s = search.toLowerCase();
    const matchSearch = r.adherentNom.toLowerCase().includes(s) || r.objet.toLowerCase().includes(s) || (r.reference || r.id).toLowerCase().includes(s);
    const matchStatus = statusFilter ? r.statut === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-2"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-600/10 rounded-xl">
            <AlertTriangle size={20} className="text-purple-600" />
          </div>
          <h2 className="text-[10px] font-black tracking-[0.3em] uppercase opacity-40 text-slate-900 dark:text-white">Back-Office</h2>
        </div>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Gestion des Réclamations</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight">Traitement et suivi des sollicitations des adhérents</p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-white/5 flex flex-col lg:flex-row gap-6"
      >
        <div className="relative flex-1 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-purple-600 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Rechercher par ID, Nom adhérent ou Objet..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-16 pr-6 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all font-bold tracking-tight text-slate-700 dark:text-slate-200 shadow-inner"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 text-slate-400">
            <Filter size={20} />
          </div>
          <select 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value)}
            className="px-8 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 font-black text-[11px] uppercase tracking-widest text-slate-600 dark:text-slate-300 cursor-pointer shadow-sm transition-all appearance-none min-w-[200px]"
          >
            <option value="">Tous les statuts</option>
            <option value="Ouverte">Ouverte</option>
            <option value="En cours">En cours</option>
            <option value="Traitée">Traitée</option>
            <option value="Clôturée">Clôturée</option>
          </select>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-white/5"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Référence</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Adhérent</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Objet</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Date</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Statut</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filtered.length > 0 ? filtered.map((r, idx) => (
                <motion.tr 
                  key={r.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + (idx * 0.05) }}
                  className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-all duration-300 group"
                >
                  <td className="px-10 py-7 font-black text-purple-600 dark:text-purple-400 tracking-tighter text-lg">
                    #{r.reference || r.id}
                  </td>
                  <td className="px-8 py-7">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-xs font-black text-white shadow-lg shadow-purple-500/10">
                           {r.adherentNom.charAt(0)}
                        </div>
                        <span className="font-black text-slate-800 dark:text-slate-100 tracking-tight">{r.adherentNom}</span>
                     </div>
                  </td>
                  <td className="px-8 py-7">
                    <div className="max-w-[250px] truncate font-bold text-slate-700 dark:text-slate-300">
                      {r.objet}
                    </div>
                  </td>
                  <td className="px-8 py-7">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      {new Date(r.dateCreation).toLocaleDateString('fr-FR')}
                    </span>
                  </td>
                  <td className="px-8 py-7">
                    <StatusBadge statut={r.statut} />
                  </td>
                  <td className="px-10 py-7 text-center">
                    <button 
                      onClick={() => onView(r.id)} 
                      className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg shadow-slate-900/10 hover:bg-purple-600 hover:shadow-purple-500/20 transition-all active:scale-95" 
                      title="Consulter et traiter"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </motion.tr>
              )) : (
                <tr>
                  <td colSpan="6" className="py-32">
                    <div className="flex flex-col items-center justify-center text-slate-400 gap-4">
                      <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-[2rem] border border-slate-100 dark:border-white/5">
                        <Search size={48} className="opacity-20" />
                      </div>
                      <p className="font-black text-[10px] uppercase tracking-[0.3em] opacity-40">Aucune réclamation trouvée</p>
                      {(search || statusFilter) && (
                        <button 
                          onClick={() => { setSearch(''); setStatusFilter(''); }} 
                          className="mt-4 px-6 py-3 bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 font-black text-[10px] uppercase tracking-widest rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-lg transition-all active:scale-95"
                        >
                          Réinitialiser les filtres
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
};

/* =========================================================================
   DETAIL VIEW (SHARED)
   ========================================================================= */
const ReclamationDetail = ({ id, onBack }) => {
  const { state, dispatch, addToast, showConfirm } = useContext(ReclamationContext);
  const reclamation = state.reclamations.find(r => r.id === id);
  const bulletin = reclamation?.bulletinId ? state.bulletins.find(b => b.id === reclamation.bulletinId) : null;
  const isAdherent = state.role === 'Adhérent';

  const [replyText, setReplyText] = useState('');
  const [status, setStatus] = useState(reclamation?.statut || 'Ouverte');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // If Adhérent opens it and it has an unread response, mark as read
    if (isAdherent && reclamation?.unread) {
      markReclamationAsRead(id).then(() => {
         dispatch({ type: 'MARK_READ', payload: id });
      }).catch(err => console.error("Erreur read:", err));
    }
  }, [isAdherent, reclamation, id, dispatch]);

  if (!reclamation) return null;

  const handleUpdate = () => {
    if (!replyText.trim() && status === reclamation.statut) {
      addToast('Modifiez le statut ou ajoutez une réponse pour mettre à jour.', 'warning');
      return;
    }

    if (status === 'Clôturée' && reclamation.statut !== 'Clôturée') {
      showConfirm(
        'Clôturer la réclamation',
        'La clôture d\'une réclamation verrouille le dossier. L\'adhérent considérera sa demande resolue. Continuer ?',
        commitUpdate,
        'danger'
      );
    } else {
      commitUpdate();
    }
  };

  const commitUpdate = async () => {
    setIsSubmitting(true);
    try {
      const payload = { statut: status };
      if (replyText.trim()) {
        payload.reponseAdmin = replyText.trim();
      }

      const updated = await updateReclamation(id, payload);

      dispatch({
        type: 'UPDATE_RECLAMATION',
        payload: {
          id,
          statut: updated.statut,
          reponseAdmin: updated.reponseAdmin,
          dateReponse: updated.dateReponse,
          unread: updated.unread
        }
      });
      if (replyText.trim()) {
        addToast('Réponse envoyée et statut mis à jour', 'success');
        setReplyText('');
      } else {
        addToast(`Le statut a été changé à "${status}"`, 'info');
      }
    } catch (err) {
      addToast(err.message || 'Erreur lors de la mise à jour', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-scale-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2.5 bg-gray-50 rounded-xl hover:bg-gray-100 border border-gray-200 transition">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-extrabold text-gray-800">Réclamation {reclamation.reference || reclamation.id}</h2>
              <StatusBadge statut={reclamation.statut} />
            </div>
            <p className="text-gray-500 font-medium flex items-center gap-2">
               <Clock className="w-4 h-4"/> Soumise le {formatDate(reclamation.dateCreation)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Section */}
        <div className="lg:col-span-2 space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-white/5 relative overflow-hidden"
          >
             <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 rounded-full blur-3xl" />
             <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100 dark:border-white/5 relative z-10">
               <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex justify-center items-center text-xl font-black text-slate-600 dark:text-slate-300 shadow-inner">
                  {reclamation.adherentNom.charAt(0)}
               </div>
               <div>
                  <h3 className="font-black text-xl text-slate-900 dark:text-white tracking-tight">{reclamation.adherentNom}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Adhérent Titulaire</p>
               </div>
             </div>

            <div className="relative z-10">
              <h4 className="text-2xl font-black text-purple-600 dark:text-purple-400 tracking-tight mb-6 flex items-center gap-3">
                <MessageSquare className="w-6 h-6" /> {reclamation.objet}
              </h4>
              <div className="bg-slate-50 dark:bg-slate-800/40 p-8 rounded-[1.5rem] text-slate-700 dark:text-slate-200 whitespace-pre-wrap border border-slate-100 dark:border-white/5 leading-relaxed font-bold tracking-tight shadow-inner">
                {reclamation.description}
              </div>
            </div>
          </motion.div>

          {/* Admin Response Block */}
          {reclamation.reponseAdmin && (
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="bg-indigo-50/30 dark:bg-indigo-900/10 p-8 sm:p-10 rounded-[2.5rem] shadow-xl border-l-[6px] border-indigo-500 relative overflow-hidden"
             >
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
                <div className="flex items-center gap-4 mb-6 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 flex justify-center items-center text-indigo-500 shadow-xl border border-indigo-100 dark:border-indigo-900/30">
                     <ShieldAlert size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-indigo-950 dark:text-indigo-200 tracking-tight">Réponse Administration</h3>
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-widest mt-0.5">{formatDate(reclamation.dateReponse)}</p>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[1.5rem] text-slate-800 dark:text-slate-100 whitespace-pre-wrap font-bold tracking-tight shadow-2xl border border-indigo-100 dark:border-indigo-900/20 relative z-10">
                  {reclamation.reponseAdmin}
                </div>
             </motion.div>
          )}

          {/* Admin Reply Action Form */}
          {!isAdherent && reclamation.statut !== 'Clôturée' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-white/5 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 rounded-full blur-3xl" />
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-8 flex items-center gap-3 relative z-10">
                 <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400">
                  <CheckCircle size={20} />
                 </div>
                 Traiter la demande
              </h3>
              <div className="space-y-8 relative z-10">
                <div className="group">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Votre réponse à l'adhérent</label>
                  <textarea 
                    value={replyText} onChange={e => setReplyText(e.target.value)}
                    rows={5} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] p-6 outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all font-bold tracking-tight text-slate-700 dark:text-slate-200 shadow-inner resize-none"
                    placeholder="Saisissez ici les explications pour l'adhérent..."
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-6 items-center justify-between bg-slate-50/50 dark:bg-slate-800/30 p-6 rounded-[1.5rem] border border-slate-100 dark:border-white/5">
                  <div className="w-full sm:w-auto flex items-center gap-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Nouveau Statut :</label>
                    <div className="relative w-full sm:w-auto min-w-[200px]">
                       <select 
                         value={status} onChange={e => setStatus(e.target.value)}
                         className="w-full px-6 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 font-black text-[11px] uppercase tracking-widest text-slate-700 dark:text-slate-200 cursor-pointer shadow-sm appearance-none transition-all"
                       >
                         <option value="Ouverte">Ouverte</option>
                         <option value="En cours">En cours</option>
                         <option value="Traitée">Traitée</option>
                         <option value="Clôturée">Clôturée</option>
                       </select>
                       <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none"/>
                    </div>
                  </div>
                  <button 
                    onClick={handleUpdate}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto flex items-center justify-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-10 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-2xl hover:bg-purple-600 dark:hover:bg-purple-400 dark:hover:text-white disabled:opacity-50 active:scale-95"
                  >
                    {isSubmitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send size={20} />}
                    {isSubmitting ? 'Mise à jour...' : 'Enregistrer'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Sidebar Info Section */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-white/5 sticky top-6 overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-600" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8 flex items-center gap-3">
               <FileText size={16} /> Bulletin Associé
            </h3>
            {bulletin ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-inner">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Réf. Dossier</span>
                  <span className="font-black text-slate-900 dark:text-white tracking-tight">#{bulletin.numero_bulletin || 'N/A'}</span>
                </div>
                <div className="px-1 space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-500">Date de dépôt</span>
                    <span className="font-black text-slate-800 dark:text-slate-100">{bulletin.date_depot ? new Date(bulletin.date_depot).toLocaleDateString('fr-FR') : '-'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-500">Nature du soin</span>
                    <span className="px-3 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-purple-100 dark:border-purple-800/30">
                      {bulletin.type_dossier || 'Standard'}
                    </span>
                  </div>
                  <div className="py-2 flex justify-between items-center border-t border-slate-100 dark:border-white/5 mt-4">
                    <span className="font-bold text-slate-500">Montant déclaré</span>
                    <span className="text-2xl font-black text-purple-600 dark:text-purple-400 tracking-tighter">
                      {bulletin.montant_total} <small className="text-xs font-black uppercase tracking-widest">TND</small>
                    </span>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100 dark:border-white/5">
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">État du traitement B.S.</span>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${bulletin.statut === 1 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                      <span className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                        {bulletin.statut === 0 ? 'En attente' : bulletin.statut === 1 ? 'Validé' : bulletin.statut === 2 ? 'Rejeté' : 'Archivé'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 px-6">
                <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5 mb-6 inline-flex">
                  <FileText size={48} className="text-slate-200" />
                </div>
                <p className="font-bold text-slate-400 leading-tight">Aucun bulletin de soin lié à cette demande.</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   SHELL & LAYOUT
   ========================================================================= */

const DashboardTabs = ({ activeView, setActiveView, role }) => {
  if (role === 'Adhérent') return null;
  return (
    <div className="flex gap-10 mb-12 border-b border-slate-100 dark:border-white/5 pb-1 overflow-x-auto custom-scrollbar">
      {['dashboard', 'list'].map((view) => (
        <button 
          key={view}
          onClick={() => setActiveView(view)}
          className={`px-4 py-5 font-black text-[11px] uppercase tracking-[0.25em] transition-all relative group ${activeView === view ? 'text-purple-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
        >
          <span className="relative z-10">{view === 'dashboard' ? 'Tableau de bord' : 'Liste des réclamations'}</span>
          {activeView === view && (
            <motion.div 
              layoutId="activeTabRecl"
              className="absolute bottom-0 left-0 w-full h-1.5 bg-purple-600 rounded-full shadow-[0_0_15px_rgba(147,51,234,0.5)]" 
            />
          )}
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-purple-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left opacity-20" />
        </button>
      ))}
    </div>
  );
};

const AppLayout = ({ defaultRole }) => {
  const { state, dispatch } = useContext(ReclamationContext);
  
  // Set initial role based on parent route context
  useEffect(() => {
    if (defaultRole && state.role !== defaultRole) {
      dispatch({ type: 'SET_ROLE', payload: defaultRole });
    }
  }, [defaultRole, state.role, dispatch]);

  const isAdherent = state.role === 'Adhérent';
  
  // Routes State
  const [activeView, setActiveView] = useState(isAdherent ? 'list' : 'dashboard');
  const [selectedId, setSelectedId] = useState(null);

  // Sync state correctly if role changes dynamically
  useEffect(() => {
     setActiveView(state.role === 'Adhérent' ? 'list' : 'dashboard');
  }, [state.role]);

  const goToDetail = (id) => {
    setSelectedId(id);
    setActiveView('detail');
  };

  return (
    <div className="w-full h-full relative font-sans animate-scale-in">
       <div className="p-2 sm:p-6 pb-24 max-w-[1600px] mx-auto">
          <DashboardTabs activeView={activeView} setActiveView={setActiveView} role={state.role} />
          
          {isAdherent ? (
            <>
               {activeView === 'list' && <AdherentList onNew={() => setActiveView('form')} onView={goToDetail} />}
               {activeView === 'form' && <ReclamationForm onBack={() => setActiveView('list')} />}
               {activeView === 'detail' && <ReclamationDetail id={selectedId} onBack={() => setActiveView('list')} />}
            </>
          ) : (
            <>
               {activeView === 'dashboard' && <AdminDashboard onViewAll={() => setActiveView('list')} />}
               {activeView === 'list' && <AdminTable onView={goToDetail} />}
               {activeView === 'detail' && <ReclamationDetail id={selectedId} onBack={() => setActiveView('list')} />}
            </>
          )}
       </div>

      <ToastManager />
      <ConfirmModal />
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(147, 51, 234, 0.2);
          border-radius: 10px;
        }
      `}</style>
    </div>
  )
}

/* =========================================================================
   ENTRY POINT EXPORT
   ========================================================================= */
export default function ReclamationsManager({ defaultRole = 'Adhérent' }) {
  return (
    <ReclamationProvider>
      <AppLayout defaultRole={defaultRole} />
    </ReclamationProvider>
  );
}
