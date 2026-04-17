import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    User, 
    Mail, 
    Shield, 
    Hash, 
    Phone,
    Calendar,
    MapPin,
    Activity,
    Info
} from 'lucide-react';

const UserDetailsModal = ({ isOpen, onClose, user }) => {

    if (!isOpen || !user) return null;

    const detailsFields = [
        { label: 'Nom', value: user.nom, icon: User },
        { label: 'Prénom', value: user.prenom, icon: User },
        { label: 'Matricule', value: user.matricule || 'N/A', icon: Hash },
        { label: 'Email', value: user.email, icon: Mail },
        { label: 'Téléphone', value: user.telephone || 'Non renseigné', icon: Phone },
        { label: 'Date de naissance', value: user.ddn ? new Date(user.ddn).toLocaleDateString('fr-FR') : 'Non renseignée', icon: Calendar },
        { label: 'Adresse', value: user.adresse || 'Non renseignée', icon: MapPin },
        { label: 'Ville', value: user.ville || 'Non renseignée', icon: MapPin },
        { label: 'Rôle', value: user.role, icon: Shield },
        { 
            label: 'Statut', 
            icon: Activity,
            value: user.statut === 1 ? 'Actif' : 
                   user.statut === 2 ? 'Refusé' : 
                   user.statut === 3 ? 'Bloqué' : 'En attente' 
        }
    ];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex justify-end overflow-hidden">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 250 }}
                    className="relative bg-white dark:bg-slate-900 w-full sm:w-[400px] md:w-[450px] max-w-lg h-full shadow-[-20px_0_60px_-15px_rgba(0,0,0,0.3)] flex flex-col overflow-y-auto border-l border-slate-200 dark:border-slate-800"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-700 to-indigo-800 p-8 text-white relative flex-shrink-0">
                        <button 
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all"
                        >
                            <X size={20} />
                        </button>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                <Info size={28} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black tracking-tight">Détails de l'utilisateur</h2>
                                <p className="text-purple-100 text-xs font-medium">Informations complètes du profil</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 flex-1 flex flex-col">
                        <div className="flex flex-col gap-6">
                            {detailsFields.map((field, index) => {
                                const Icon = field.icon;
                                return (
                                    <div key={index} className="flex flex-col space-y-1">
                                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                                            <Icon size={14} className="text-purple-500" /> {field.label}
                                        </label>
                                        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white text-sm break-all">
                                            {field.value}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-8 flex flex-col mt-auto pt-8 border-t border-slate-100 dark:border-slate-800">
                            <button 
                                onClick={onClose}
                                className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 transition-all font-black text-xs uppercase tracking-widest active:scale-95"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default UserDetailsModal;
