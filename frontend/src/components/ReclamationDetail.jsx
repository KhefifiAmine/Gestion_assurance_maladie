import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Clock, MessageSquare, Send, RefreshCw,
  Trash2, CheckCircle, FileText, Eye, ChevronDown,
  ShieldCheck, Lock, ShieldAlert
} from 'lucide-react';

import {
  getReclamationById,
  updateReclamation,
  updateReclamationStatus,
  deleteReclamation
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

const ReclamationDetail = ({
  id,
  onBack,
  onEdit,
  userRole,
  allBulletins = [],
  onReclamationUpdate,
  onReclamationDelete
}) => {
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

  const isAdherent = userRole === 'ADHERENT';
  const isAdmin = userRole === "ADMIN";

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
  }, [id, isAdherent, showToast]);


  const handleUpdate = () => {
    if (!replyText.trim() && status === reclamation.statut) {
      showToast('Modifiez le statut ou ajoutez une réponse pour mettre à jour.', 'warning');
      return;
    }

    if (status === 'Clôturée' && reclamation.statut !== 'Clôturée') {
      setConfirmModal({
        isOpen: true,
        title: 'Clôturer la réclamation',
        message: 'La clôture d\'une réclamation verrouille le dossier. Continuer ?',
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
      const payload = { 
        statut: status,
        priorite: priority
      };
      if (replyText.trim()) payload.reponseAdmin = replyText.trim();

      let updated;
      if (userRole === 'ADMIN') {
        updated = await updateReclamationStatus(id, payload);
      } else {
        updated = await updateReclamation(id, payload);
      }
      
      const updatedLocal = { ...reclamation, ...updated };
      setReclamation(updatedLocal);
      if (onReclamationUpdate) onReclamationUpdate(updatedLocal);

      showToast(replyText.trim() ? 'Réponse envoyée' : `Statut mis à jour : ${status}`, 'success');
      setReplyText('');
    } catch (err) {
      showToast(err.message || 'Erreur lors de la mise à jour', 'error');
    } finally {
      setIsSubmitting(false);
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
    }
  };

  if (isLoading) return <div className="flex flex-col items-center justify-center p-20 text-purple-600"><RefreshCw className="w-10 h-10 animate-spin mb-4" /><p className="font-bold">Chargement...</p></div>;
  if (!reclamation) return <div className="p-10 text-center"><p className="text-red-500 font-bold">Réclamation introuvable.</p><button onClick={onBack} className="text-purple-600 underline">Retour</button></div>;

  const bulletin = reclamation.bulletinId ? allBulletins.find(b => b.id === reclamation.bulletinId) : null;

  return (
    <div className="space-y-6 mx-auto animate-scale-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2.5 bg-gray-50 dark:bg-slate-800 rounded-xl hover:bg-gray-100 border border-gray-200 transition">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-extrabold text-gray-800 dark:text-white">Réclamation {reclamation.reference || reclamation.id}</h2>
              <StatusBadge statut={reclamation.statut} />
             <PriorityBadge priorite={reclamation.priorite} />
            </div>
            <p className="text-gray-500 font-medium flex items-center gap-2"><Clock className="w-4 h-4" /> Soumise le {formatDate(reclamation.createdAt)}</p>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          {isAdherent && reclamation.statut === 'Ouverte' && (
            <button onClick={() => onEdit(reclamation)} className="px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 bg-purple-50 text-purple-600 border border-purple-100 hover:bg-purple-600 hover:text-white">
              <RefreshCw size={16} /> Modifier
            </button>
          )}
          {isAdherent && reclamation.statut === 'Ouverte' ? (
            <button
              onClick={() => {
                setConfirmModal({
                  isOpen: true,
                  title: 'Supprimer la réclamation',
                  message: 'Confirmer la suppression définitive de cette réclamation ?',
                  type: 'danger',
                  onConfirm: async () => {
                    try {
                      await deleteReclamation(id);
                      if (onReclamationDelete) onReclamationDelete(id);
                      showToast('Réclamation supprimée', 'success');
                      onBack();
                    } catch (err) { showToast(err.message, 'error'); }
                  }
                });
              }}
              className="px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 bg-red-50 text-red-600 border border-red-100 hover:bg-red-600 hover:text-white"
            >
              <Trash2 size={16} /> Supprimer
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-[2.5rem] shadow-xl border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 rounded-full blur-3xl" />
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100 relative z-10">
              {/* Zone cliquable utilisateur */}
              <div
                onClick={() => setIsUserModalOpen(true)}
                className="flex items-center gap-3 cursor-pointer group"
              >
                {/* Avatar */}
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex justify-center items-center text-xl font-black text-slate-600 group-hover:scale-110 transition-transform">
                  {reclamation?.adherent?.nom?.charAt(0) || 'U'}
                </div>

                {/* Infos utilisateur */}
                <div>
                  <h3 className="font-black text-xl text-slate-900 dark:text-white tracking-tight group-hover:text-purple-600 transition-colors">
                    {reclamation?.adherent
                      ? `${reclamation.adherent.nom} ${reclamation.adherent.prenom}`
                      : 'Utilisateur'}
                  </h3>

                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                    Adhérent Titulaire
                  </p>
                </div>
              </div>

              {/* Prestataire */}
              <div className="ml-auto bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Prestataire
                </p>

                <p className="font-bold text-slate-900 dark:text-white">
                  {reclamation?.prestataire || 'GAT'}
                </p>
              </div>

            </div>
            <div className="relative z-10">
              <h4 className="text-2xl font-black text-purple-600 dark:text-purple-400 tracking-tight mb-6 flex items-center gap-3"><MessageSquare className="w-6 h-6" /> {reclamation.objet}</h4>
              <div className="bg-slate-50 dark:bg-slate-800 p-8 rounded-[1.5rem] text-slate-700 dark:text-slate-200 whitespace-pre-wrap border border-slate-100 leading-relaxed font-bold tracking-tight shadow-inner">{reclamation.description || "Aucun détail complémentaire fourni."}</div>
            </div>
      
            <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-600" />
            <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-black-400 mb-8 flex items-center gap-3 mt-8"><FileText size={18} /> Bulletin Associé</h3>
            {bulletin ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-black-100"><span className="text-[10px] font-black tracking-widest text-black-400">Réf. Dossier</span><span className="font-black text-slate-900 dark:text-white">#{bulletin.numero_bulletin || 'N/A'}</span></div>
                <button onClick={() => setIsBulletinModalOpen(true)} className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg"><Eye size={16} /> Consulter</button>
              </div>
            ) : <p className="font-bold text-slate-400 text-center">Aucun bulletin lié.</p>}

          </motion.div>

          {reclamation.reponseAdmin && !reclamation.isRestricted && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="bg-indigo-50/30 dark:bg-indigo-900/10 p-8 sm:p-10 rounded-[2.5rem] shadow-xl border-l-[6px] border-indigo-500 relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-500 rounded-xl text-white shadow-lg shadow-indigo-500/20">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                      Réponse de l'administration
                    </h4>
                    <p className="text-[12px] font-bold text-slate-900 uppercase tracking-tight">
                      {reclamation.admin ? `Par ${reclamation.admin.prenom} ${reclamation.admin.nom}` : 'Officielle'}
                    </p>
                  </div>
                </div>
                {reclamation.dateReponse && (
                  <div className="text-[12px] font-black text-slate-900 uppercase tracking-widest bg-white/50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-indigo-100/50">
                    {formatDate(reclamation.dateReponse)}
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-slate-900 p-8 rounded-[1.5rem] text-slate-800 dark:text-slate-100 whitespace-pre-wrap font-bold tracking-tight shadow-2xl border border-indigo-100/50 leading-relaxed">
                {reclamation.reponseAdmin}
              </div>
              
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
            </motion.div>
          )}

          {reclamation.isRestricted && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="bg-amber-50 dark:bg-amber-900/10 p-8 rounded-[2rem] border border-amber-200 dark:border-amber-800/30 flex flex-col items-center text-center gap-4"
            >
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center text-amber-600">
                <Lock size={32} />
              </div>
              <div>
                <h4 className="text-lg font-black text-amber-900 dark:text-amber-400 mb-1">Accès Restreint</h4>
                <p className="text-sm font-bold text-amber-700/70 dark:text-amber-500/70 max-w-xs">
                  {reclamation.restrictionMessage || "Cette discussion est gérée par un autre administrateur."}
                </p>
              </div>
            </motion.div>
          )}

        </div>

        <div className="space-y-8">
          {isAdmin && reclamation.statut !== 'Clôturée' && !reclamation.isRestricted && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-white/5 relative">
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3">Traiter la demande</h3>
              <div className="space-y-6">
                <textarea 
                  value={replyText} 
                  onChange={e => setReplyText(e.target.value)} 
                  rows={4} 
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl p-4 outline-none focus:ring-4 focus:ring-purple-500/10 transition-all font-bold text-slate-700 dark:text-slate-200 resize-none text-sm" 
                  placeholder="Réponse..." 
                />
                
                <div className="space-y-4">
                  {/* Priorité */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                       Priorité de traitement
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setIsPriorityOpen(!isPriorityOpen);
                          setIsStatusOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl outline-none font-black text-[10px] uppercase tracking-widest cursor-pointer transition-all hover:border-purple-300"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            priority === 1 ? 'bg-slate-400' :
                            priority === 2 ? 'bg-blue-500' :
                            priority === 3 ? 'bg-orange-500' :
                            'bg-red-500'
                          }`} />
                          <span className="text-slate-700 dark:text-slate-200">
                            {priority === 1 ? 'Basse' : priority === 2 ? 'Moyenne' : priority === 3 ? 'Haute' : 'Urgente'}
                          </span>
                        </div>
                        <ChevronDown className={`text-slate-400 transition-transform duration-300 ${isPriorityOpen ? 'rotate-180' : ''}`} size={14} />
                      </button>

                      <AnimatePresence>
                        {isPriorityOpen && (
                          <>
                            <div className="fixed inset-0 z-[1001]" onClick={() => setIsPriorityOpen(false)} />
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 5, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              className="absolute top-full left-0 right-0 z-[1002] mt-2 p-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl"
                            >
                              {[
                                { val: 1, label: 'Basse', color: 'bg-slate-400' },
                                { val: 2, label: 'Moyenne', color: 'bg-blue-500' },
                                { val: 3, label: 'Haute', color: 'bg-orange-500' },
                                { val: 4, label: 'Urgente', color: 'bg-red-500' }
                              ].map((opt) => (
                                <button
                                  key={opt.val}
                                  type="button"
                                  onClick={() => {
                                    setPriority(opt.val);
                                    setIsPriorityOpen(false);
                                  }}
                                  className={`w-full text-left px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${
                                    priority === opt.val 
                                    ? 'bg-purple-600 text-white shadow-lg' 
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                  }`}
                                >
                                  <div className={`w-1.5 h-1.5 rounded-full ${priority === opt.val ? 'bg-white' : opt.color}`} />
                                  {opt.label}
                                </button>
                              ))}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Statut */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                       Statut de la résolution
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setIsStatusOpen(!isStatusOpen);
                          setIsPriorityOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl outline-none font-black text-[10px] uppercase tracking-widest cursor-pointer transition-all hover:border-purple-300"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            status === 'Ouverte' ? 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]' :
                            status === 'En cours' ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' :
                            status === 'Traitée' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' :
                            'bg-slate-400'
                          }`} />
                          <span className="text-slate-700 dark:text-slate-200">{status}</span>
                        </div>
                        <ChevronDown className={`text-slate-400 transition-transform duration-300 ${isStatusOpen ? 'rotate-180' : ''}`} size={14} />
                      </button>

                      <AnimatePresence>
                        {isStatusOpen && (
                          <>
                            <div className="fixed inset-0 z-[1001]" onClick={() => setIsStatusOpen(false)} />
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 5, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              className="absolute top-full left-0 right-0 z-[1002] mt-2 p-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl"
                            >
                              {['Ouverte', 'En cours', 'Traitée', 'Clôturée'].map((opt) => (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => {
                                    setStatus(opt);
                                    setIsStatusOpen(false);
                                  }}
                                  className={`w-full text-left px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${
                                    status === opt 
                                    ? 'bg-purple-600 text-white shadow-lg' 
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                  }`}
                                >
                                  <div className={`w-1.5 h-1.5 rounded-full ${
                                    opt === 'Ouverte' ? (status === opt ? 'bg-white' : 'bg-purple-500') :
                                    opt === 'En cours' ? (status === opt ? 'bg-white' : 'bg-amber-500') :
                                    opt === 'Traitée' ? (status === opt ? 'bg-white' : 'bg-emerald-500') :
                                    (status === opt ? 'bg-white' : 'bg-slate-400')
                                  }`} />
                                  {opt}
                                </button>
                              ))}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleUpdate} 
                  disabled={isSubmitting} 
                  className="w-full flex items-center justify-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl hover:bg-purple-600 group active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send size={18} />}
                  {isSubmitting ? 'Maj...' : 'Enregistrer'}
                </button>
              </div>
            </motion.div>
          )}


        </div>
      </div>

      <BulletinDetailsModal isOpen={isBulletinModalOpen} onClose={() => setIsBulletinModalOpen(false)} bulletin={bulletin} />
      <UserDetailsModal 
        isOpen={isUserModalOpen} 
        onClose={() => setIsUserModalOpen(false)} 
        user={reclamation.adherent} 
      />
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />
    </div>
  );
};

export default ReclamationDetail;
