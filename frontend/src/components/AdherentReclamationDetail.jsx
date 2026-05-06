import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Clock, MessageSquare, RefreshCw,
  Trash2, FileText, Eye, ShieldCheck, ChevronRight,
  Calendar, Hash, AlertCircle, CheckCircle2, Loader2,
  Sparkles, Star, Send, Edit2, Archive
} from 'lucide-react';

import {
  getReclamationById,
  deleteReclamation
} from '../services/reclamationService';
import BulletinDetailsModal from './BulletinDetailsModal';
import ConfirmModal from './ConfirmModal';
import { useToast } from '../context/ToastContext';

const StatusBadge = ({ statut }) => {
  const configs = {
    'Ouverte': { 
      icon: AlertCircle,
      label: 'En attente',
      gradient: 'from-amber-500 to-orange-500',
      bgGlow: 'shadow-amber-500/20',
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50'
    },
    'En cours': { 
      icon: Loader2,
      label: 'En traitement',
      gradient: 'from-blue-500 to-cyan-500',
      bgGlow: 'shadow-blue-500/20',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    'Traitée': { 
      icon: CheckCircle2,
      label: 'Traitée',
      gradient: 'from-emerald-500 to-teal-500',
      bgGlow: 'shadow-emerald-500/20',
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    'Clôturée': { 
      icon: CheckCircle2,
      label: 'Clôturée',
      gradient: 'from-slate-500 to-gray-500',
      bgGlow: 'shadow-slate-500/20',
      textColor: 'text-slate-600',
      bgColor: 'bg-slate-50'
    }
  };

  const config = configs[statut] || configs['Ouverte'];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`flex items-center gap-2 px-4 py-2 rounded-full ${config.bgColor} border border-current/10 shadow-sm`}
    >
      <Icon className={`w-4 h-4 ${config.textColor} ${statut === 'En cours' ? 'animate-spin' : ''}`} />
      <span className={`text-xs font-bold uppercase tracking-wider ${config.textColor}`}>
        {config.label}
      </span>
    </motion.div>
  );
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950/30">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-200 dark:border-purple-800 rounded-full animate-pulse"></div>
            <Loader2 className="w-12 h-12 text-purple-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" />
          </div>
          <div className="space-y-2">
            <p className="font-bold text-slate-600 dark:text-slate-400 tracking-wider">CHARGEMENT</p>
            <p className="text-xs text-slate-400">Récupération de votre dossier...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!reclamation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-purple-50">
        <div className="text-center space-y-6 p-8 max-w-md">
          <div className="w-24 h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Réclamation introuvable</h3>
          <p className="text-slate-500">Le dossier que vous recherchez n'existe pas ou a été supprimé.</p>
          <button 
            onClick={onBack} 
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/30"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  const bulletin = reclamation.bulletinId ? (reclamation.bulletinSoin || allBulletins.find(b => b.id === reclamation.bulletinId)) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950/30 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header avec effet glassmorphism */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-white/5"
        >
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-transparent to-blue-600/10"></div>
          
          <div className="relative p-6 md:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-start gap-5">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onBack}
                  className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-md"
                >
                  <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </motion.button>
                
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                      {reclamation.reference}
                    </h2>
                    <StatusBadge statut={reclamation.statut} />
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-purple-500" />
                      <span className="font-medium">{reclamation.createdAt}</span>
                    </div>
                    <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                  </div>
                </div>
              </div>
              
              {reclamation.statut === 'Ouverte' && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex gap-3"
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onEdit(reclamation)}
                    className="group relative overflow-hidden px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl font-bold text-sm text-white shadow-lg shadow-purple-500/30 hover:shadow-xl transition-all"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <Edit2 className="w-4 h-4" />
                      Modifier
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setConfirmModal({
                      isOpen: true,
                      title: 'Supprimer la réclamation',
                      message: 'Cette action est irréversible. Confirmez-vous la suppression ?',
                      type: 'danger',
                      onConfirm: async () => {
                        try {
                          await deleteReclamation(id);
                          if (onReclamationDelete) onReclamationDelete(id);
                          showToast('Réclamation supprimée avec succès', 'success');
                          onBack();
                        } catch (err) { showToast(err.message, 'error'); }
                      }
                    })}
                    className="px-6 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-bold text-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition-all border border-red-200 dark:border-red-800/30"
                  >
                    <Trash2 className="w-4 h-4 inline mr-2" />
                    Supprimer
                  </motion.button>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Contenu principal en grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne principale - 2 colonnes */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="group relative bg-white dark:bg-slate-900 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-100 dark:border-slate-800"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/5 to-transparent rounded-full blur-2xl"></div>
              
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl shadow-lg shadow-purple-500/25">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-base font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Description de la demande
                  </h3>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/50">
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-wrap">
                    {reclamation.description || "Aucune description fournie."}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Réponse admin */}
            <AnimatePresence>
              {reclamation.reponseAdmin && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="relative bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-3xl shadow-xl overflow-hidden border-2 border-emerald-200 dark:border-emerald-800/30"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                  
                  <div className="p-6 md:p-8">
                    <div className="flex items-start gap-4 mb-6">
                      <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow-lg shadow-emerald-500/25">
                        <ShieldCheck className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                          Réponse de l'administration
                        </h3>
                        <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">
                          {reclamation.dateReponse}
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-emerald-100 dark:border-emerald-900/30 shadow-inner">
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                        {reclamation.reponseAdmin}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Colonne latérale */}
          <div className="space-y-6">
            {/* Carte du bulletin */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800"
            >
              <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 p-6 overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-white/80">Dossier médical lié</p>
                    <p className="text-lg font-black text-white mt-1">Bulletin de soins</p>
                  </div>
                  <FileText className="w-8 h-8 text-white/80" />
                </div>
              </div>
              
              <div className="p-6">
                {bulletin ? (
                  <div className="space-y-6">
                    <div className="text-center p-6 bg-gradient-to-br from-slate-50 to-purple-50 dark:from-slate-800 dark:to-purple-900/20 rounded-2xl border border-slate-100 dark:border-slate-700">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl shadow-lg mb-4">
                        <Star className="w-8 h-8 text-white" />
                      </div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Numéro de bulletin</p>
                      <p className="text-3xl font-black bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        #{bulletin.numero_bulletin}
                      </p>
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsBulletinModalOpen(true)}
                      className="w-full py-4 bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 text-white rounded-xl font-bold text-sm uppercase tracking-wider hover:from-purple-600 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl group"
                    >
                      <Eye className="w-4 h-4 inline mr-2 group-hover:scale-110 transition-transform" />
                      Consulter le dossier
                      <ChevronRight className="w-4 h-4 inline ml-2 group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <div className="w-20 h-20 mx-auto bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                      <FileText className="w-10 h-10 text-slate-400" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Aucun bulletin associé</p>
                    <p className="text-xs text-slate-400 mt-2">Cette réclamation n'est liée à aucun dossier médical</p>
                  </div>
                )}
              </div>
            </motion.div>
          
          </div>
        </div>
      </div>

      {/* Modals */}
      <BulletinDetailsModal 
        isOpen={isBulletinModalOpen} 
        onClose={() => setIsBulletinModalOpen(false)} 
        bulletin={bulletin} 
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

export default AdherentReclamationDetail;