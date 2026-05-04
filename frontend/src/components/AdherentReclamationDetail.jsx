import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Clock, MessageSquare, RefreshCw,
  Trash2, FileText, Eye, ShieldCheck
} from 'lucide-react';

import {
  getReclamationById,
  deleteReclamation
} from '../services/reclamationService';
import BulletinDetailsModal from './BulletinDetailsModal';
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
    <span className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-full border ${styles[statut] || 'bg-gray-100 text-gray-700'}`}>
      {statut}
    </span>
  );
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const opts = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateStr).toLocaleDateString('fr-FR', opts);
};

const AdherentReclamationDetail = ({ id, onBack, onEdit, allBulletins = [], onReclamationDelete }) => {
  const { showToast } = useToast();
  const [reclamation, setReclamation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBulletinModalOpen, setIsBulletinModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', type: 'danger', onConfirm: () => { } });

  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoading(true);
      try {
        const fullData = await getReclamationById(id);
        setReclamation(fullData);
      } catch (err) {
        showToast(err.message || "Erreur de chargement", 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetails();
  }, [id, showToast]);

  if (isLoading) return <div className="flex flex-col items-center justify-center p-20 text-purple-600"><RefreshCw className="w-10 h-10 animate-spin mb-4" /><p className="font-bold tracking-widest uppercase text-[10px]">Chargement de votre dossier...</p></div>;
  if (!reclamation) return <div className="p-10 text-center"><p className="text-red-500 font-bold">Réclamation introuvable.</p><button onClick={onBack} className="text-purple-600 underline">Retour</button></div>;

  const bulletin = reclamation.bulletinId ? (reclamation.bulletinSoin || allBulletins.find(b => b.id === reclamation.bulletinId)) : null;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-scale-in">
      {/* Header User */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl border border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl hover:bg-slate-900 hover:text-white transition-all active:scale-95 shadow-sm">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-4 mb-2">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Réclamation {reclamation.reference || reclamation.id}</h2>
              <StatusBadge statut={reclamation.statut} />
            </div>
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-500" /> Soumise le {formatDate(reclamation.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          {reclamation.statut === 'Ouverte' && (
            <>
              <button onClick={() => onEdit(reclamation)} className="px-6 py-3 bg-purple-50 text-purple-600 rounded-xl font-black text-[10px] uppercase tracking-widest border border-purple-100 hover:bg-purple-600 hover:text-white transition-all shadow-sm">
                <RefreshCw size={16} className="inline mr-2" /> Modifier
              </button>
              <button 
                onClick={() => setConfirmModal({
                  isOpen: true,
                  title: 'Supprimer',
                  message: 'Confirmer la suppression de cette réclamation ?',
                  type: 'danger',
                  onConfirm: async () => {
                    try {
                      await deleteReclamation(id);
                      if (onReclamationDelete) onReclamationDelete(id);
                      showToast('Supprimée avec succès', 'success');
                      onBack();
                    } catch (err) { showToast(err.message, 'error'); }
                  }
                })}
                className="px-6 py-3 bg-red-50 text-red-600 rounded-xl font-black text-[10px] uppercase tracking-widest border border-red-100 hover:bg-red-600 hover:text-white transition-all shadow-sm"
              >
                <Trash2 size={16} className="inline mr-2" /> Supprimer
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Description Block */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-white/5 relative overflow-hidden">
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-purple-600 mb-6 flex items-center gap-3">
              <MessageSquare size={18} /> Détails de votre demande
            </h3>
            <div className="bg-slate-50 dark:bg-slate-800/80 p-8 rounded-[2rem] text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-bold tracking-tight border border-slate-100 dark:border-white/5 leading-relaxed shadow-inner">
              {reclamation.description || "Pas de description fournie."}
            </div>
          </motion.div>

          {/* Admin Response Block */}
          {reclamation.reponseAdmin && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-indigo-50/50 dark:bg-indigo-900/10 p-10 rounded-[3rem] shadow-xl border-l-[8px] border-indigo-500 relative overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-500 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">Réponse de l'administration</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase">{reclamation.dateReponse ? formatDate(reclamation.dateReponse) : ''}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] text-slate-900 dark:text-slate-100 whitespace-pre-wrap font-bold tracking-tight shadow-2xl border border-indigo-100/50 leading-relaxed">
                {reclamation.reponseAdmin}
              </div>
            </motion.div>
          )}
        </div>

        <div className="space-y-8">
          {/* Bulletin Card */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-white/5 overflow-hidden">
             <div className="bg-purple-600 p-6 flex items-center justify-between text-white">
                <h3 className="text-xs font-black uppercase tracking-widest">Dossier Lié</h3>
                <FileText size={18} />
             </div>
             <div className="p-8">
               {bulletin ? (
                 <div className="space-y-6">
                    <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100">
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Bulletin N°</p>
                      <p className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">#{bulletin.numero_bulletin}</p>
                    </div>
                    <button onClick={() => setIsBulletinModalOpen(true)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-purple-600 transition-all shadow-xl shadow-slate-900/10">
                      <Eye size={16} className="inline mr-2" /> Voir Dossier
                    </button>
                 </div>
               ) : <div className="p-8 text-center text-slate-400 font-black uppercase text-[10px] border border-dashed rounded-2xl">Aucun bulletin</div>}
             </div>
          </div>
        </div>
      </div>

      <BulletinDetailsModal isOpen={isBulletinModalOpen} onClose={() => setIsBulletinModalOpen(false)} bulletin={bulletin} />
      <ConfirmModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} onConfirm={confirmModal.onConfirm} title={confirmModal.title} message={confirmModal.message} type={confirmModal.type} />
    </div>
  );
};

export default AdherentReclamationDetail;
