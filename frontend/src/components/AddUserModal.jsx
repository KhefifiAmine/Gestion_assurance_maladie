import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { 
    X, 
    User, 
    Mail, 
    Shield, 
    Hash, 
    Phone,
    Calendar,
    MapPin,
    CheckCircle2, 
    AlertCircle,
    UserPlus
} from 'lucide-react';

const AddUserModal = ({ isOpen, onClose, onSubmit }) => {
    const { user: initiator } = useAuth();
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        role: 'ADHERENT',
        matricule: '',
        telephone: '',
        ddn: '',
        adresse: '',
        ville: '',
        sexe: 'M'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await onSubmit(formData);
            onClose();
            setFormData({
                nom: '',
                prenom: '',
                email: '',
                role: 'ADHERENT',
                matricule: '',
                telephone: '',
                ddn: '',
                adresse: '',
                ville: '',
                sexe: 'M'
            });
        } catch (err) {
            setError(err.response?.data?.message || "Erreur lors de la création de l'utilisateur");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-white/5 flex flex-col max-h-[90vh]"
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-r from-purple-700 to-indigo-800 p-8 text-white relative flex-shrink-0">
                                <button 
                                    onClick={onClose}
                                    className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all"
                                >
                                    <X size={20} />
                                </button>
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                        <UserPlus size={32} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black tracking-tight uppercase">Nouvel Utilisateur</h2>
                                        <p className="text-purple-100 text-xs font-bold uppercase tracking-widest opacity-70">Création d'un profil adhérent ou admin</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 overflow-y-auto custom-scrollbar">
                                {error && (
                                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm font-bold">
                                        <AlertCircle size={18} />
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-8">
                                    {/* Personal Info Section */}
                                    <div className="space-y-6">
                                        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                            <User size={14} className="text-purple-500" /> Informations Personnelles
                                        </h3>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-600 dark:text-slate-400 ml-1">Nom *</label>
                                                <input 
                                                    type="text" required
                                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all outline-none dark:text-white"
                                                    value={formData.nom}
                                                    onChange={(e) => setFormData({...formData, nom: e.target.value})}
                                                    placeholder="ex: Ben Salah"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-600 dark:text-slate-400 ml-1">Prénom *</label>
                                                <input 
                                                    type="text" required
                                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all outline-none dark:text-white"
                                                    value={formData.prenom}
                                                    onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                                                    placeholder="ex: Ahmed"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-600 dark:text-slate-400 ml-1">Date de Naissance</label>
                                                <div className="relative">
                                                    <Calendar size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <input 
                                                        type="date"
                                                        className="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-purple-500/10 transition-all outline-none dark:text-white"
                                                        value={formData.ddn}
                                                        onChange={(e) => setFormData({...formData, ddn: e.target.value})}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-600 dark:text-slate-400 ml-1">Sexe *</label>
                                                <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                                                    <button 
                                                        type="button"
                                                        onClick={() => setFormData({...formData, sexe: 'M'})}
                                                        className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.sexe === 'M' ? 'bg-white dark:bg-slate-700 text-purple-600 shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}
                                                    >
                                                        Masculin
                                                    </button>
                                                    <button 
                                                        type="button"
                                                        onClick={() => setFormData({...formData, sexe: 'F'})}
                                                        className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.sexe === 'F' ? 'bg-white dark:bg-slate-700 text-purple-600 shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}
                                                    >
                                                        Féminin
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Account Section */}
                                    <div className="space-y-6">
                                        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                            <Mail size={14} className="text-purple-500" /> Compte & Sécurité
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-600 dark:text-slate-400 ml-1">Email *</label>
                                                <div className="relative">
                                                    <Mail size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <input 
                                                        type="email" required
                                                        className="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-purple-500/10 transition-all outline-none dark:text-white"
                                                        value={formData.email}
                                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                                        placeholder="email@exemple.com"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-600 dark:text-slate-400 ml-1">Rôle *</label>
                                                <div className="relative">
                                                    <Shield size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <select 
                                                        className="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-purple-500/10 transition-all outline-none dark:text-white appearance-none cursor-pointer"
                                                        value={formData.role}
                                                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                                                    >
                                                        <option value="ADHERENT">Adhérent</option>
                                                        <option value="ADMIN">Administrateur</option>
                                                        <option value="RESPONSABLE_RH">Responsable RH</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-600 dark:text-slate-400 ml-1">Matricule (Optionnel)</label>
                                                <div className="relative">
                                                    <Hash size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <input 
                                                        type="text"
                                                        className="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-purple-500/10 transition-all outline-none dark:text-white"
                                                        value={formData.matricule}
                                                        onChange={(e) => setFormData({...formData, matricule: e.target.value})}
                                                        placeholder="ex: M12345"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-600 dark:text-slate-400 ml-1">Téléphone</label>
                                                <div className="relative">
                                                    <Phone size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <input 
                                                        type="tel"
                                                        className="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-purple-500/10 transition-all outline-none dark:text-white"
                                                        value={formData.telephone}
                                                        onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                                                        placeholder="ex: 55 123 456"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Address Section */}
                                    <div className="space-y-6">
                                        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                            <MapPin size={14} className="text-purple-500" /> Localisation
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-600 dark:text-slate-400 ml-1">Ville</label>
                                                <input 
                                                    type="text"
                                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-purple-500/10 transition-all outline-none dark:text-white"
                                                    value={formData.ville}
                                                    onChange={(e) => setFormData({...formData, ville: e.target.value})}
                                                    placeholder="ex: Tunis"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-600 dark:text-slate-400 ml-1">Adresse</label>
                                                <input 
                                                    type="text"
                                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-purple-500/10 transition-all outline-none dark:text-white"
                                                    value={formData.adresse}
                                                    onChange={(e) => setFormData({...formData, adresse: e.target.value})}
                                                    placeholder="ex: Rue Habib Bourguiba"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <button 
                                            type="submit"
                                            disabled={loading}
                                            className="w-full py-5 bg-purple-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-purple-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
                                        >
                                            {loading ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : <CheckCircle2 size={18} />}
                                            {loading ? "Création en cours..." : "Créer l'utilisateur"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
};

export default AddUserModal;
