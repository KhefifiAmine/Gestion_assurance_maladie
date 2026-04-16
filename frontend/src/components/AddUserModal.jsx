import React, { useState } from 'react';
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
        ville: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const validateForm = () => {
        let newErrors = {};
        
        // Validation des champs vides
        if (!formData.nom.trim()) newErrors.nom = "Le nom est obligatoire";
        if (!formData.prenom.trim()) newErrors.prenom = "Le prénom est obligatoire";
        if (!formData.email.trim()) newErrors.email = "L'email est obligatoire";

        // Validation Nom & Prénom (si non vides)
        const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]{2,50}$/;
        if (formData.nom.trim() && !nameRegex.test(formData.nom)) newErrors.nom = "Nom invalide (2 lettres min)";
        if (formData.prenom.trim() && !nameRegex.test(formData.prenom)) newErrors.prenom = "Prénom invalide (2 lettres min)";

        // Validation Email (Domaines autorisés, si non vide)
        const emailRegex = /^[a-zA-Z0-9._%+-]+@(tunisietelecom\.tn|gmail\.com)$/;
        if (formData.email.trim() && !emailRegex.test(formData.email)) {
            newErrors.email = "Email invalide (@tunisietelecom.tn ou @gmail.com)";
        }

        // Validation Telephone (si non vide)
        if (formData.telephone && !/^\d{8}$/.test(formData.telephone)) {
            newErrors.telephone = "Le téléphone doit contenir 8 chiffres";
        }

        // Pour ddn, adresse et ville, c'est optionnel ou requis selon le cas
        // On n'impose pas pour l'Admin/RH, mais on garantit le bon type.

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        
        setLoading(true);
        try {
            await onSubmit(formData);
            setFormData({ nom: '', prenom: '', email: '', role: 'ADHERENT', matricule: '', telephone: '', ddn: '', adresse: '', ville: '' });
            setErrors({});
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const allRoles = [
        { id: 'ADHERENT', label: 'Adhérent', color: 'bg-green-500' },
        { id: 'ADMIN', label: 'Administrateur', color: 'bg-blue-500' },
        { id: 'RESPONSABLE_RH', label: 'Responsable RH', color: 'bg-amber-500' }
    ];

    // Filter roles based on current user role: Admin can only create simple users (Adherents)
    const roles = initiator?.role === 'ADMIN' 
        ? allRoles.filter(r => r.id === 'ADHERENT') 
        : allRoles;

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-700 to-indigo-800 p-6 text-white relative">
                        <button 
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all"
                        >
                            <X size={20} />
                        </button>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                <UserPlus size={28} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black tracking-tight">Ajouter un utilisateur</h2>
                                <p className="text-purple-100 text-xs font-medium">Un email d'activation lui sera envoyé</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-5" noValidate>
                        <div className="grid grid-cols-2 gap-4">
                            {/* Prenom */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                                    <User size={14} className="text-purple-500" /> Prénom
                                </label>
                                <input 
                                    type="text"
                                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border ${errors.prenom ? 'border-red-500' : 'border-slate-100 dark:border-slate-700'} rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium text-slate-900 dark:text-white`}
                                    value={formData.prenom}
                                    onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                                />
                                {errors.prenom && (
                                    <p className="text-[10px] text-red-500 font-bold flex items-center gap-1 mt-1 animate-in fade-in slide-in-from-top-1">
                                        <AlertCircle size={10} /> {errors.prenom}
                                    </p>
                                )}
                            </div>

                            {/* Nom */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                                    <User size={14} className="text-purple-500" /> Nom
                                </label>
                                <input 
                                    type="text"
                                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border ${errors.nom ? 'border-red-500' : 'border-slate-100 dark:border-slate-700'} rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all font-bold text-slate-900 dark:text-white`}
                                    value={formData.nom}
                                    onChange={(e) => setFormData({...formData, nom: e.target.value})}
                                />
                                {errors.nom && (
                                    <p className="text-[10px] text-red-500 font-bold flex items-center gap-1 mt-1 animate-in fade-in slide-in-from-top-1">
                                        <AlertCircle size={10} /> {errors.nom}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                                <Mail size={14} className="text-purple-500" /> Adresse Email
                            </label>
                                <input 
                                    type="email"
                                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border ${errors.email ? 'border-red-500' : 'border-slate-100 dark:border-slate-700'} rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all font-bold text-slate-900 dark:text-white`}
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                />
                                {errors.email && (
                                    <p className="text-[10px] text-red-500 font-bold flex items-center gap-1 mt-1 animate-in fade-in slide-in-from-top-1">
                                        <AlertCircle size={10} /> {errors.email}
                                    </p>
                                )}
                        </div>

                        {/* Matricule (Auto-généré) */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                                <Hash size={14} className="text-purple-500" /> Matricule
                            </label>
                                <input 
                                    type="text"
                                    readOnly
                                    className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none transition-all font-bold text-slate-400 dark:text-slate-500 cursor-not-allowed"
                                    value=""
                                    placeholder="Généré automatiquement"
                                />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Numéro de téléphone */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                                    <Phone size={14} className="text-purple-500" /> Téléphone
                                </label>
                                <input 
                                    type="text"
                                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border ${errors.telephone ? 'border-red-500' : 'border-slate-100 dark:border-slate-700'} rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all font-medium text-slate-900 dark:text-white`}
                                    value={formData.telephone}
                                    placeholder="8 chiffres"
                                    onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                                />
                                {errors.telephone && (
                                    <p className="text-[10px] text-red-500 font-bold flex items-center gap-1 mt-1 animate-in fade-in slide-in-from-top-1">
                                        <AlertCircle size={10} /> {errors.telephone}
                                    </p>
                                )}
                            </div>

                            {/* Date de naissance */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                                    <Calendar size={14} className="text-purple-500" /> Date de naissance
                                </label>
                                <input 
                                    type="date"
                                    max={new Date().toISOString().split('T')[0]}
                                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border ${errors.ddn ? 'border-red-500' : 'border-slate-100 dark:border-slate-700'} rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all font-medium text-slate-900 dark:text-white`}
                                    value={formData.ddn}
                                    onChange={(e) => setFormData({...formData, ddn: e.target.value})}
                                />
                                {errors.ddn && (
                                    <p className="text-[10px] text-red-500 font-bold flex items-center gap-1 mt-1 animate-in fade-in slide-in-from-top-1">
                                        <AlertCircle size={10} /> {errors.ddn}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Adresse */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                                    <MapPin size={14} className="text-purple-500" /> Adresse
                                </label>
                                <input 
                                    type="text"
                                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border ${errors.adresse ? 'border-red-500' : 'border-slate-100 dark:border-slate-700'} rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all font-medium text-slate-900 dark:text-white`}
                                    value={formData.adresse}
                                    onChange={(e) => setFormData({...formData, adresse: e.target.value})}
                                />
                            </div>

                            {/* Ville */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                                    <MapPin size={14} className="text-purple-500" /> Ville
                                </label>
                                <input 
                                    type="text"
                                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border ${errors.ville ? 'border-red-500' : 'border-slate-100 dark:border-slate-700'} rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all font-medium text-slate-900 dark:text-white`}
                                    value={formData.ville}
                                    onChange={(e) => setFormData({...formData, ville: e.target.value})}
                                />
                            </div>
                        </div>

                        {/* Role Selection */}
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                                <Shield size={14} className="text-purple-500" /> Rôle de l'utilisateur
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {roles.map((role) => (
                                    <button
                                        key={role.id}
                                        type="button"
                                        onClick={() => setFormData({...formData, role: role.id})}
                                        className={`px-4 py-2.5 rounded-xl border-2 transition-all flex items-center gap-2 ${
                                            formData.role === role.id
                                                ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-500 text-purple-600 dark:text-purple-400 font-bold'
                                                : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-500 hover:border-slate-200 dark:hover:border-slate-700'
                                        }`}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${role.color}`} />
                                        <span className="text-xs">{role.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="pt-4 flex gap-3">
                            <button 
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                            >
                                Annuler
                            </button>
                            <button 
                                type="submit"
                                disabled={loading}
                                className="flex-[2] bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:shadow-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <CheckCircle2 size={20} />
                                )}
                                Créer l'utilisateur
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default AddUserModal;
