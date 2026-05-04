import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Clock, MessageSquare, Send, RefreshCw,
  FileText, Eye, ChevronDown, ShieldCheck, Lock, ShieldAlert
} from 'lucide-react';

import {
  getReclamationById,
  updateReclamationStatus
} from '../services/reclamationService';
import BulletinDetailsModal from './BulletinDetailsModal';
import UserDetailsModal from './UserDetailsModal';
import ConfirmModal from './ConfirmModal';
import { useToast } from '../context/ToastContext';

const StatusBadge = ({ statut }) => {
  const styles = {
    'Ouverte': 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/10 dark:text-purple-400 dark:border-purple-800/30',
    'En cours': 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/10 dark:text-amber-400 dark:border-amber-800/30',
    'Traitée': 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/10 dark:text-emerald-400 dark:border-emerald-800/30',
    'Clôturée': 'bg-slate-50 text-slate-500 border-slate-100 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700/30'
  };

  return (
    <span className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-full border shadow-inner whitespace-nowrap ${styles[statut] || 'bg-gray-100 text-gray-700'}`}>
      {statut}
    </span>
  );
};

const PriorityBadge = ({ priorite }) => {
  const styles = {
      1: 'bg-black-50 text-black-500 border-black-100 dark:bg-black-800/40 dark:text-black-400 dark:border-black-700/30',
      2: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/10 dark:text-blue-400 dark:border-blue-800/30',
      3: 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/10 dark:text-orange-400 dark:border-orange-800/30',
      4: 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/10 dark:text-red-400 dark:border-red-800/30'
  };
  const labels = { 1: 'Basse', 2: 'Moyenne', 3: 'Haute', 4: 'Urgente' };
  return (
      <span className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full border shadow-inner ${styles[priorite] || styles[1]}`}>
          Priorité: {labels[priorite] || 'Basse'}
      </span>
  );
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const opts = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateStr).toLocaleDateString('fr-FR', opts);
};

const AdminReclamationDetail = ({ id, onBack, onReclamationUpdate, allBulletins = [] }) => {
  const { showToast } = useToast();
  const [reclamation, setReclamation] = useState(null);
  const [status, setStatus] = useState('Ouverte');
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isBulletinModalOpen, setIsBulletinModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isPriorityOpen, setIsPriorityOpen] = useState(false);
  const [priority, setPriority] = useState(2);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', type: 'danger', onConfirm: () => { } });

  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoading(true);
      try {
        const fullData = await getReclamationById(id);
        setReclamation(fullData);
        setStatus(fullData.statut);
        setPriority(fullData.priorite || 2);
      } catch (err) {
        showToast(err.message || "Erreur de chargement", 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetails();
  }, [id, showToast]);

  const handleUpdate = () => {
    if (!replyText.trim() && status === reclamation.statut && priority === reclamation.priorite) {
      showToast('Modifiez le statut ou ajoutez une réponse.', 'warning');
      return;
    }
    if (status === 'Clôturée' && reclamation.statut !== 'Clôturée') {
      setConfirmModal({
        isOpen: true,
        title: 'Clôturer la réclamation',
        message: 'Ceci verrouillera le dossier. Continuer ?',
        type: 'danger',
        onConfirm: commitUpdate
      });
    } else {
      commitUpdate();
    }
  };

  const commitUpdate = async () => {
    setIsSubmitting(true);
    try {
      const payload = { statut: status, priorite: priority };
      if (replyText.trim()) payload.reponseAdmin = replyText.trim();
      
      const updated = await updateReclamationStatus(id, payload);
      const updatedLocal = { ...reclamation, ...updated };
      setReclamation(updatedLocal);
      if (onReclamationUpdate) onReclamationUpdate(updatedLocal);

      showToast(replyText.trim() ? 'Réponse envoyée' : `Statut mis à jour`, 'success');
      setReplyText('');
    } catch (err) {
      showToast(err.message || 'Erreur', 'error');
    } finally {
      setIsSubmitting(false);
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
    }
  };

  if (isLoading) return <div className="flex flex-col items-center justify-center p-20 text-purple-600"><RefreshCw className="w-10 h-10 animate-spin mb-4" /><p className="font-bold tracking-widest uppercase text-[10px]">Chargement Dossier Admin...</p></div>;
  if (!reclamation) return <div className="p-10 text-center"><p className="text-red-500 font-bold">Réclamation introuvable.</p><button onClick={onBack} className="text-purple-600 underline">Retour</button></div>;

  const bulletin = reclamation.bulletinId ? (reclamation.bulletinSoin || allBulletins.find(b => b.id === reclamation.bulletinId)) : null;

  return (
    <div className="space-y-6 mx-auto animate-scale-in">
      {/* Header Admin */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl border border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl hover:bg-slate-900 hover:text-white transition-all active:scale-95 group shadow-sm">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-4 mb-2">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Réclamation {reclamation.reference || reclamation.id}</h2>
              <StatusBadge statut={reclamation.statut} />
              <PriorityBadge priorite={reclamation.priorite} />
            </div>
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-500" /> Reçue le {formatDate(reclamation.createdAt)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Description */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl -mr-32 -mt-32" />
            
            <div className="flex items-center justify-between mb-10 pb-8 border-b border-slate-50 dark:border-white/5 relative z-10">
              <div onClick={() => setIsUserModalOpen(true)} className="flex items-center gap-4 cursor-pointer group">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 flex justify-center items-center text-2xl font-black text-white group-hover:scale-110 transition-transform shadow-xl shadow-slate-900/20">
                  {reclamation?.adherent?.nom?.charAt(0) || 'U'}
                </div>
                <div>
                  <h3 className="font-black text-2xl text-slate-900 dark:text-white tracking-tight leading-none group-hover:text-purple-600 transition-colors mb-1.5">
                    {reclamation?.adherent ? `${reclamation.adherent.nom} ${reclamation.adherent.prenom}` : 'Utilisateur'}
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Adhérent Titulaire</p>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-white/5">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Prestataire</p>
                <p className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-wider">{reclamation?.prestataire || 'GAT'}</p>
              </div>
            </div>

            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-purple-600 mb-6 flex items-center gap-3">
              <MessageSquare size={18} /> Description du problème
            </h3>
            <div className="bg-slate-50 dark:bg-slate-800/80 p-8 rounded-[2rem] text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-bold tracking-tight border border-slate-100 dark:border-white/5 leading-relaxed shadow-inner">
              {reclamation.description || "Aucun détail complémentaire fourni."}
            </div>
          </motion.div>

          {/* Action Panel */}
          {reclamation.statut !== 'Clôturée' && !reclamation.isRestricted && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-2xl border-2 border-purple-50 dark:border-purple-900/20 relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-5 mb-10">
                  <div className="w-14 h-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-2xl shadow-purple-600/30">
                    <Send size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Traitement de la réclamation</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Actions administratives en direct</p>
                  </div>
                </div>
                
                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Réponse à l'adhérent</label>
                    <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={5} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 rounded-[2rem] p-8 outline-none focus:ring-4 focus:ring-purple-500/10 transition-all font-bold text-slate-700 dark:text-slate-200 text-sm shadow-inner" placeholder="Expliquez la décision..." />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Priority & Status dropdowns (simplified logic from original) */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Priorité</label>
                      <select value={priority} onChange={e => setPriority(Number(e.target.value))} className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 font-black text-[10px] uppercase outline-none">
                        <option value={1}>Basse</option><option value={2}>Moyenne</option><option value={3}>Haute</option><option value={4}>Urgente</option>
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Statut</label>
                      <select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 font-black text-[10px] uppercase outline-none">
                        <option value="Ouverte">Ouverte</option><option value="En cours">En cours</option><option value="Traitée">Traitée</option><option value="Clôturée">Clôturée</option>
                      </select>
                    </div>
                  </div>

                  <button onClick={handleUpdate} disabled={isSubmitting} className="w-full py-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl transition-all hover:bg-purple-600 hover:text-white active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4">
                    {isSubmitting ? <RefreshCw className="animate-spin" /> : <ShieldCheck size={22} />}
                    {isSubmitting ? 'Envoi...' : 'Valider la décision'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {reclamation.isRestricted && (
            <div className="p-10 bg-amber-50 dark:bg-amber-900/10 rounded-[2rem] border border-amber-200 text-center flex flex-col items-center gap-4">
              <Lock size={40} className="text-amber-600" />
              <p className="font-black text-amber-900 uppercase text-xs tracking-widest">{reclamation.restrictionMessage || "Discussion gérée par un autre administrateur"}</p>
            </div>
          )}
        </div>

        {/* Sidebar Info Blocks */}
        <div className="space-y-8 lg:sticky lg:top-8">
          {/* Adhérent Profile Card */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-white/5 overflow-hidden">
             <div className="bg-slate-900 p-6 flex items-center justify-between text-white">
                <h3 className="text-xs font-black uppercase tracking-widest">Profil Adhérent</h3>
                <ShieldCheck size={18} className="text-emerald-500" />
             </div>
             <div className="p-8">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-50">
                  <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center text-xl font-black text-slate-400 uppercase">{reclamation?.adherent?.nom?.charAt(0)}</div>
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-white leading-tight">{reclamation?.adherent?.nom} {reclamation?.adherent?.prenom}</h4>
                    <p className="text-[9px] font-black text-purple-600 uppercase tracking-widest mt-1">ID: {reclamation?.adherent?.matricule}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl"><p className="text-[8px] font-black text-slate-400 uppercase mb-1">Ville</p><p className="font-black text-[10px]">{reclamation?.adherent?.ville || 'N/A'}</p></div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl"><p className="text-[8px] font-black text-slate-400 uppercase mb-1">Sexe</p><p className="font-black text-[10px]">{reclamation?.adherent?.sexe || 'M'}</p></div>
                </div>
                <button onClick={() => setIsUserModalOpen(true)} className="w-full py-4 bg-slate-50 dark:bg-slate-800 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">Consulter Fiche</button>
             </div>
          </div>

          {/* Dossier Médical Card */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-white/5 overflow-hidden">
             <div className="bg-purple-600 p-6 flex items-center justify-between text-white">
                <h3 className="text-xs font-black uppercase tracking-widest">Dossier Médical</h3>
                <FileText size={18} />
             </div>
             <div className="p-8">
               {bulletin ? (
                 <div className="space-y-4">
                    <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100">
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Bulletin N°</p>
                      <p className="text-xl font-black tracking-tight text-slate-900 dark:text-white">#{bulletin.numero_bulletin}</p>
                    </div>
                    <button onClick={() => setIsBulletinModalOpen(true)} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-purple-600 transition-all">Détails Dossier</button>
                 </div>
               ) : <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed text-[10px] font-black text-slate-400 uppercase tracking-widest">Aucun bulletin</div>}
             </div>
          </div>
        </div>
      </div>

      <BulletinDetailsModal isOpen={isBulletinModalOpen} onClose={() => setIsBulletinModalOpen(false)} bulletin={bulletin} />
      <UserDetailsModal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} user={reclamation.adherent} />
      <ConfirmModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} onConfirm={confirmModal.onConfirm} title={confirmModal.title} message={confirmModal.message} type={confirmModal.type} />
    </div>
  );
};

export default AdminReclamationDetail;
