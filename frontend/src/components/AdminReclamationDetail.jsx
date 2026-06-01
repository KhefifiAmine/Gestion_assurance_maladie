import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Clock, MessageSquare, Send, RefreshCw,
  FileText, Eye, ChevronDown, ShieldCheck, Lock, ShieldAlert
} from 'lucide-react';

import {
  getReclamationById,
  updateReclamationStatus,
  sendReclamationMessage
} from '../services/reclamationService';
import UserDetailsModal from './UserDetailsModal';
import ConfirmModal from './ConfirmModal';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const StatusBadge = ({ statut }) => {
  const styles = {
    'Ouverte': 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/10 dark:text-purple-400 dark:border-purple-800/30',
    'En cours': 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/10 dark:text-amber-400 dark:border-amber-800/30',
    'Répondu': 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/10 dark:text-emerald-400 dark:border-emerald-800/30',
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
      'Basse': 'bg-slate-50 text-slate-550 border-slate-100 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700/30',
      'Moyenne': 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/10 dark:text-blue-400 dark:border-blue-800/30',
      'Haute': 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/10 dark:text-orange-400 dark:border-orange-800/30'
  };
  return (
      <span className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full border shadow-inner ${styles[priorite] || styles['Moyenne']}`}>
          Priorité: {priorite || 'Moyenne'}
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
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [reclamation, setReclamation] = useState(null);
  const [status, setStatus] = useState('Ouverte');
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isPriorityOpen, setIsPriorityOpen] = useState(false);
  const [priority, setPriority] = useState('Moyenne');
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', type: 'danger', onConfirm: () => { } });

  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoading(true);
      try {
        const fullData = await getReclamationById(id);
        setReclamation(fullData);
        setStatus(fullData.statut);
        setPriority(fullData.priorite || 'Moyenne');
      } catch (err) {
        showToast(err.message || "Erreur de chargement", 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetails();
  }, [id, showToast]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const sentMsg = await sendReclamationMessage(id, replyText);
      setReclamation(prev => ({
        ...prev,
        messages: [...(prev.messages || []), sentMsg],
        statut: 'En cours'
      }));
      setStatus('En cours');
      setReplyText('');
      showToast("Message envoyé avec succès !", "success");
    } catch (err) {
      showToast(err.message || "Erreur lors de l'envoi", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatut) => {
    setConfirmModal({
      isOpen: true,
      title: "Changer le statut",
      message: `Voulez-vous vraiment passer le statut de cette réclamation à "${newStatut}" ?`,
      type: "warning",
      onConfirm: async () => {
        try {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          const sentMsg = await sendReclamationMessage(id, { statusChange: newStatut });
          setStatus(newStatut);
          setReclamation(prev => ({
            ...prev,
            statut: newStatut,
            messages: [...(prev.messages || []), sentMsg]
          }));
          if (onReclamationUpdate) onReclamationUpdate({ ...reclamation, statut: newStatut });
          showToast(`Statut mis à jour : ${newStatut}`, 'success');
        } catch (err) {
          showToast(err.message || 'Erreur lors de la mise à jour du statut', 'error');
        }
      }
    });
  };

  const handlePriorityChange = async (newPriority) => {
    setConfirmModal({
      isOpen: true,
      title: "Changer la priorité",
      message: `Voulez-vous vraiment changer la priorité à "${newPriority}" ?`,
      type: "warning",
      onConfirm: async () => {
        try {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          const sentMsg = await sendReclamationMessage(id, { priorityChange: newPriority });
          setPriority(newPriority);
          setReclamation(prev => ({
            ...prev,
            priorite: newPriority,
            messages: [...(prev.messages || []), sentMsg]
          }));
          if (onReclamationUpdate) onReclamationUpdate({ ...reclamation, priorite: newPriority });
          showToast(`Priorité mise à jour`, 'success');
        } catch (err) {
          showToast(err.message || 'Erreur lors de la mise à jour de la priorité', 'error');
        }
      }
    });
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

          {/* Fil de discussion / Échanges de messages */}
          {!reclamation.isRestricted ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/5 to-transparent rounded-full blur-2xl"></div>
              
              <div className="p-6 md:p-8 flex flex-col h-[550px]">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl shadow-lg shadow-purple-500/25">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Discussion / Échanges
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                        Dialogue en direct avec l'adhérent
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-6 custom-scrollbar flex flex-col">
                  {/* Initial description message */}
                  <div className="flex items-start gap-3 max-w-[85%] self-start">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-850 flex items-center justify-center text-xs font-black text-slate-600 shrink-0">
                      {reclamation.adherent?.nom?.charAt(0) || 'U'}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                          {reclamation.adherent ? `${reclamation.adherent.nom} ${reclamation.adherent.prenom}` : 'Adhérent'} (Demande Initiale)
                        </span>
                        <span className="text-[9px] text-slate-400">{formatDate(reclamation.createdAt)}</span>
                      </div>
                      <div className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-3 rounded-2xl rounded-tl-none text-sm font-medium">
                        {reclamation.description}
                      </div>
                    </div>
                  </div>

                  {/* Message thread */}
                  {reclamation.messages && reclamation.messages.length > 0 ? (
                    reclamation.messages.map((msg) => {
                      const isMe = ['ADMIN', 'SUPER_ADMIN'].includes(msg.sender?.role);
                      const hasStatusChange = !!msg.statusChange;
                      const hasPriorityChange = !!msg.priorityChange;

                      return (
                        <div key={msg.id} className="w-full space-y-3 flex flex-col">
                          {/* S'il y a un changement de statut ou de priorité, afficher des badges de notification système */}
                          {(hasStatusChange || hasPriorityChange) && (
                            <div className="self-center flex flex-wrap justify-center gap-2 my-2 select-none">
                              {hasStatusChange && (
                                <span className="px-3 py-1 text-[9px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full border border-slate-200/50">
                                  Statut : {msg.statusChange}
                                </span>
                              )}
                              {hasPriorityChange && (
                                <span className="px-3 py-1 text-[9px] font-black uppercase tracking-wider bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-full border border-purple-100/30">
                                  Priorité : {msg.priorityChange}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Afficher le contenu du message s'il existe */}
                          {msg.content && msg.content.trim() && (
                            <div className={`flex items-start gap-3 max-w-[85%] ${isMe ? 'self-end flex-row-reverse' : 'self-start'}`}>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${isMe ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600' : 'bg-slate-100 dark:bg-slate-850 text-slate-650'}`}>
                                {isMe ? 'A' : (reclamation.adherent?.nom?.charAt(0) || 'U')}
                              </div>
                              <div className={`space-y-1 ${isMe ? 'text-right' : 'text-left'}`}>
                                <div className="flex items-baseline gap-2 justify-start">
                                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                    {isMe ? `Vous (${msg.sender?.nom || 'Admin'})` : (reclamation.adherent ? `${reclamation.adherent.nom} ${reclamation.adherent.prenom}` : 'Adhérent')}
                                  </span>
                                  <span className="text-[9px] text-slate-400">
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <div className={`px-4 py-3 rounded-2xl text-sm font-medium text-left ${isMe ? 'bg-purple-600 text-white rounded-tr-none shadow-md shadow-purple-600/10' : 'bg-slate-100 dark:bg-slate-800 text-slate-750 dark:text-slate-350 rounded-tl-none'}`}>
                                  {msg.content}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    reclamation.reponseAdmin && (
                      <div className="flex items-start gap-3 max-w-[85%] self-end flex-row-reverse">
                        <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-xs font-black text-purple-600 shrink-0">
                          A
                        </div>
                        <div className="space-y-1 text-right">
                          <div className="flex items-baseline gap-2 justify-start">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Vous (Réponse Initiale)</span>
                            <span className="text-[9px] text-slate-400">{reclamation.dateReponse}</span>
                          </div>
                          <div className="bg-purple-600 text-white px-4 py-3 rounded-2xl rounded-tr-none text-sm font-medium text-left shadow-md shadow-purple-600/10">
                            {reclamation.reponseAdmin}
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>

                {/* Input Area */}
                {reclamation.statut !== 'Clôturée' ? (
                  <form onSubmit={handleSendMessage} className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Tapez votre message de réponse ici..."
                      className="flex-1 px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all dark:text-white"
                      disabled={isSubmitting}
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      disabled={isSubmitting || !replyText.trim()}
                      className="p-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/35 transition-all disabled:opacity-50 flex items-center justify-center shrink-0 w-[50px] h-[50px]"
                    >
                      {isSubmitting ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </motion.button>
                  </form>
                ) : (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl text-center border border-slate-100 dark:border-slate-700/50 shrink-0">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                      🔒 Cette réclamation est clôturée. Les échanges sont fermés.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="p-10 bg-amber-50 dark:bg-amber-900/10 rounded-[2rem] border border-amber-200 text-center flex flex-col items-center gap-4">
              <Lock size={40} className="text-amber-600" />
              <p className="font-black text-amber-900 uppercase text-xs tracking-widest">{reclamation.restrictionMessage || "Discussion gérée par un autre administrateur"}</p>
            </div>
          )}
        </div>

        {/* Sidebar Info Blocks */}
        <div className="space-y-8 lg:sticky lg:top-8">
          {/* Actions Administratives Card */}
          {!reclamation.isRestricted && reclamation?.userId !== currentUser?.id && (
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-white/5 overflow-hidden">
              <div className="bg-slate-950 p-6 flex items-center justify-between text-white">
                <h3 className="text-xs font-black uppercase tracking-widest">Contrôles Administratifs</h3>
                <ShieldAlert size={18} className="text-purple-500" />
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2.5">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Statut du dossier</label>
                  <select
                    value={status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 font-bold text-xs uppercase outline-none focus:ring-4 focus:ring-purple-500/10 transition-all"
                  >
                    <option value="Ouverte">Ouverte</option>
                    <option value="En cours">En cours</option>
                    <option value="Répondu">Répondu</option>
                    <option value="Clôturée">Clôturée</option>
                  </select>
                </div>

                <div className="space-y-2.5">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Niveau de Priorité</label>
                  <select
                    value={priority}
                    onChange={(e) => handlePriorityChange(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 font-bold text-xs uppercase outline-none focus:ring-4 focus:ring-purple-500/10 transition-all"
                  >
                    <option value="Basse">Basse</option>
                    <option value="Moyenne">Moyenne</option>
                    <option value="Haute">Haute</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {reclamation?.userId === currentUser?.id && (
            <div className="bg-amber-50 dark:bg-amber-950/10 p-6 rounded-[2.5rem] border border-amber-200 dark:border-amber-800/30 text-center flex flex-col items-center gap-2">
              <Lock size={24} className="text-amber-600 dark:text-amber-400" />
              <p className="font-black text-amber-900 dark:text-amber-400 uppercase text-[10px] tracking-widest">Auto-traitement interdit</p>
              <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">Vous ne pouvez pas modifier le statut ou la priorité de votre propre réclamation.</p>
            </div>
          )}

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
                    <button onClick={() => navigate(`/admin/bulletins/${bulletin.id}`)} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-purple-600 transition-all">Détails Dossier</button>
                 </div>
               ) : <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed text-[10px] font-black text-slate-400 uppercase tracking-widest">Aucun bulletin</div>}
             </div>
          </div>
        </div>
      </div>

      <UserDetailsModal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} user={reclamation.adherent} />
      <ConfirmModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} onConfirm={confirmModal.onConfirm} title={confirmModal.title} message={confirmModal.message} type={confirmModal.type} />
    </div>
  );
};

export default AdminReclamationDetail;
