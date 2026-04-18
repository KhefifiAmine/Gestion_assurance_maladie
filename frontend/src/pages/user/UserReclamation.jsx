import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, AlertTriangle, XCircle, Info, X, FileText, Send, Plus, 
  ArrowLeft, Clock, ShieldAlert, ChevronRight, ChevronDown, Bell, RefreshCw, Trash2
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  getReclamations, 
  createReclamation, 
  updateReclamation, 
  deleteReclamation 
} from '../../services/reclamationService';
import { getMyBulletins } from '../../services/bulletinService';

import ReclamationDetail from '../../components/ReclamationDetail';
import ConfirmModal from '../../components/ConfirmModal';

/* =========================================================================
   UI COMPONENTS (Local)
   ========================================================================= */

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

const ReclamationForm = ({ onBack, initialData = null, bulletins = [], addToast, onActionSuccess }) => {
  const isEdit = !!initialData;
  const [formData, setFormData] = useState({ 
    bulletinId: initialData?.bulletinId || '', 
    prestataire: initialData?.prestataire || 'GAT', 
    objet: initialData?.objet || '', 
    description: initialData?.description || '',
    commentaireModif: initialData?.commentaireModif || ''
  });
  const [isReasonDropdownOpen, setIsReasonDropdownOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reasons = [
    "ADHERENT NON DECLARE", "AUTRES RECLAMATIONS BS", "BULLETIN SANS SUITE", "CONTESTATION D'UNE REPONSE",
    "CONVOCATION NON PARVENUE", "DEMANDE D'EXPLICATION DE REJET", "PRESTATAIRE NON DECLARE",
    "REMBOURSEMENT DU COUPLE ASSURE", "REMBOURSEMENT NON CONFORME", "RETARD DE REGLEMENT APRES CONTRE VISITE",
    "RETARD DE REMBOURSEMENT APRES DEPOT DES COMPLEMENTS D'INFO", "VIREMENT NON RECU"
  ];

  const validateField = (name, value) => {
    let error = '';
    if (name === 'objet' && !value) error = "L'objet est obligatoire";
    if (isEdit && name === 'commentaireModif' && !value.trim()) error = 'Veuillez justifier la modification';
    setErrors(prev => ({ ...prev, [name]: error }));
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) validateField(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e1 = validateField('objet', formData.objet);
    const e2 = isEdit ? validateField('commentaireModif', formData.commentaireModif) : '';

    if (e1 || e2) {
      addToast('Veuillez remplir les champs obligatoires.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit) {
        const data = await updateReclamation(initialData.id, formData);
        addToast('Réclamation mise à jour', 'success');
        onActionSuccess(data, 'update');
      } else {
        const data = await createReclamation(formData);
        addToast('Réclamation envoyée', 'success');
        onActionSuccess({ ...data, adherentNom: 'Moi' }, 'add');
      }
      onBack();
    } catch (err) {
      addToast(err.message || 'Erreur lors de l’opération', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-scale-in">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-purple-600 transition font-bold mb-6 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
        <ArrowLeft className="w-4 h-4" /> Retour
      </button>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {isEdit ? `Modifier la réclamation ${initialData.reference || initialData.id}` : 'Nouvelle Réclamation'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 px-1">Prestataire</label>
              <input type="text" readOnly value={formData.prestataire} className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-100 dark:border-white/5 rounded-2xl p-4 outline-none font-black text-slate-400 cursor-not-allowed shadow-inner" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 px-1">Objet <span className="text-red-500">*</span></label>
              <div className="relative">
                <button type="button" onClick={() => setIsReasonDropdownOpen(!isReasonDropdownOpen)} className={`w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 border ${errors.objet ? 'border-red-500' : 'border-slate-100 dark:border-slate-800'} rounded-2xl outline-none focus:ring-4 focus:ring-purple-500/10 font-bold text-sm dark:text-white text-left transition shadow-inner`}>
                  <span className="truncate">{formData.objet || 'SÉLECTIONNER S.V.P.'}</span>
                  <ChevronDown className={`shrink-0 transition-transform ${isReasonDropdownOpen ? 'rotate-180' : ''}`} size={18} />
                </button>
                <AnimatePresence>
                  {isReasonDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-[1001]" onClick={() => setIsReasonDropdownOpen(false)} />
                      <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 5, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute top-full left-0 right-0 z-[1002] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] shadow-2xl p-2 max-h-60 overflow-y-auto mt-2">
                        {reasons.map((r) => (
                          <button key={r} type="button" className={`w-full text-left p-4 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${formData.objet === r ? 'bg-purple-600 text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-white'}`} onClick={() => { setFormData({ ...formData, objet: r }); setIsReasonDropdownOpen(false); }}>
                            {r}
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div>
             <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 px-1">Description</label>
             <textarea name="description" value={formData.description} onChange={handleChange} rows={4} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] p-6 outline-none focus:ring-4 focus:ring-purple-500/10 font-bold dark:text-white transition shadow-inner resize-none" placeholder="Ajoutez des détails si nécessaire..." />
          </div>

          {isEdit && (
            <div className="animate-slide-up">
               <label className="block text-[10px] font-black uppercase text-purple-600 mb-2 px-1">Commentaire de modification <span className="text-red-500">*</span></label>
               <textarea name="commentaireModif" value={formData.commentaireModif} onChange={handleChange} rows={3} className={`w-full bg-purple-50/30 dark:bg-purple-900/10 border ${errors.commentaireModif ? 'border-red-500' : 'border-purple-100 dark:border-purple-800/30'} rounded-[1.5rem] p-6 outline-none focus:ring-4 focus:ring-purple-500/10 font-bold dark:text-white transition shadow-inner resize-none`} placeholder="Justifiez votre modification..." />
               {errors.commentaireModif && <p className="text-red-500 text-[10px] font-black mt-2 px-1 uppercase">{errors.commentaireModif}</p>}
            </div>
          )}

          <div className="pt-4">
             <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 px-1">Lien avec un bulletin (Optionnel)</label>
             <select name="bulletinId" value={formData.bulletinId} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl p-4 outline-none focus:ring-4 focus:ring-purple-500/10 font-bold dark:text-white transition shadow-inner">
                <option value="">Sélectionner un bulletin...</option>
                {bulletins.map(b => (
                  <option key={b.id} value={b.id}>#{b.numero_bulletin} - {b.type_dossier}</option>
                ))}
             </select>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <button type="button" onClick={onBack} disabled={isSubmitting} className="px-6 py-3 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50">Annuler</button>
            <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-bold transition shadow-lg shadow-purple-500/20 disabled:opacity-70">
              {isSubmitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              {isSubmitting ? 'Chargement...' : (isEdit ? 'Mettre à jour' : 'Envoyer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* =========================================================================
   MAIN ADHERENT LIST
   ========================================================================= */

const AdherentList = ({ reclamations, isLoading, onNew, onView, onDelete }) => {
  if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center p-20 text-purple-600">
           <RefreshCw className="w-10 h-10 animate-spin mb-4" />
           <p className="font-bold uppercase tracking-tighter">Chargement...</p>
        </div>
      );
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-purple-600 dark:text-purple-400 font-black uppercase tracking-tighter">Mes Réclamations</h2>
          <p className="text-gray-500 text-sm mt-1 font-medium">Suivez l'état de vos demandes</p>
        </div>
        <button onClick={onNew} className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 shadow-purple-500/20 active:scale-95 transition-all px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white">
          <Plus className="w-5 h-5" /> Nouvelle Réclamation
        </button>
      </div>

      {reclamations.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-16 text-center border border-gray-100 dark:border-white/5 shadow-sm flex flex-col items-center">
          <FileText className="w-12 h-12 text-slate-300 mb-6" />
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Aucune réclamation</h3>
          <button onClick={onNew} className="text-purple-600 dark:text-purple-400 font-black uppercase tracking-widest text-[10px] hover:underline transition-all flex items-center gap-2 mt-4">
            Créer ma première réclamation <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-slate-100 dark:border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Référence</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Date de dépôt</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Raison / Objet</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Statut</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {reclamations.map((r) => (
                  <tr key={r.id} onClick={() => onView(r.id)} className={`transition-all duration-300 cursor-pointer group relative border-l-[6px] ${r.statut === 'Ouverte' ? 'border-purple-500' : r.statut === 'En cours' ? 'border-amber-500' : r.statut === 'Traitée' ? 'border-emerald-500' : 'border-slate-400'} hover:bg-slate-50 dark:hover:bg-slate-800/50`}>
                    <td className="p-6"><span className="font-black text-slate-900 dark:text-white group-hover:text-purple-600 transition">#{r.reference || r.id}</span></td>
                    <td className="p-6 font-medium text-slate-500 dark:text-slate-400">{r.createdAt ? new Date(r.createdAt).toLocaleDateString('fr-FR') : 'N/A'}</td>
                    <td className="p-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700 dark:text-slate-200">{r.objet}</span>
                        {r.unread && <span className="text-[9px] font-black text-blue-600 uppercase flex items-center gap-1 mt-1 animate-pulse"><Bell className="w-3 h-3" /> Nouveau message</span>}
                      </div>
                    </td>
                    <td className="p-6"><StatusBadge statut={r.statut} /></td>
                    <td className="p-6 text-right">
                      <div className="flex items-center justify-end gap-3 px-1">
                        {r.statut === 'Ouverte' && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); onDelete(r.id); }} 
                            className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 hover:text-white shadow-sm"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                        <span className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-sm">
                          <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

/* =========================================================================
   USER RECLAMATION (ROOT COMPONENT)
   ========================================================================= */

const UserReclamation = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activeView, setActiveView] = useState('list');
  const [selectedId, setSelectedId] = useState(null);
  const [editData, setEditData] = useState(null);
  const [reclamations, setReclamations] = useState([]);
  const [bulletins, setBulletins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', type: 'warning', onConfirm: () => {} });

  const triggerConfirm = (title, message, onConfirm, type = 'warning') => {
    setConfirmModal({ isOpen: true, title, message, onConfirm, type });
  };

  const closeConfirm = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [recs, bulls] = await Promise.all([getReclamations(), getMyBulletins().catch(() => [])]);
        setReclamations(recs);
        setBulletins(bulls);
      } catch (err) {
        showToast("Erreur de chargement", 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [showToast]);

  const handleActionSuccess = (data, type) => {
    if (type === 'add') setReclamations(prev => [data, ...prev]);
    else if (type === 'update') setReclamations(prev => prev.map(r => r.id === data.id ? data : r));
    else if (type === 'delete') setReclamations(prev => prev.filter(r => r.id !== data));
  };

  const handleReclamationUpdate = (updated) => {
    setReclamations(prev => prev.map(r => r.id === updated.id ? { ...r, ...updated } : r));
  };

  const handleDelete = (id) => {
    triggerConfirm(
      'Supprimer la réclamation',
      'Confirmer la suppression définitive de cette réclamation ?',
      async () => {
        try {
          await deleteReclamation(id);
          setReclamations(prev => prev.filter(r => r.id !== id));
          showToast('Réclamation supprimée', 'success');
        } catch (err) { showToast(err.message, 'error'); }
      },
      'danger'
    );
  };

  return (
    <div className="w-full h-full relative font-sans animate-scale-in">
       <div className="p-2 sm:p-6 pb-24 w-full">
          {activeView === 'list' && (
            <AdherentList 
              reclamations={reclamations} isLoading={isLoading}
              onNew={() => { setEditData(null); setActiveView('form'); }} 
              onView={(id) => { setSelectedId(id); setActiveView('detail'); }}
              onDelete={handleDelete}
            />
          )}

          {activeView === 'form' && (
            <ReclamationForm 
              initialData={editData} bulletins={bulletins} addToast={showToast}
              onBack={() => setActiveView('list')} 
              onActionSuccess={handleActionSuccess}
            />
          )}

          {activeView === 'detail' && (
            <ReclamationDetail 
              id={selectedId} userRole={user?.role} allBulletins={bulletins}
              onBack={() => setActiveView('list')} 
              onEdit={(data) => { setEditData(data); setActiveView('form'); }}
              onReclamationUpdate={handleReclamationUpdate}
              onReclamationDelete={(id) => handleActionSuccess(id, 'delete')}
            />
          )}
       </div>

      <ConfirmModal 
        isOpen={confirmModal.isOpen} 
        onClose={closeConfirm} 
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(147, 51, 234, 0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
}

export default UserReclamation;
