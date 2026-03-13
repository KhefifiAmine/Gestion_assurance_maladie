import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  User,
  CheckCircle2,
  CreditCard,
  Mail,
  Phone,
  Users,
  FileText,
  MessageSquare,
  Edit2,
  Camera,
  Eye,
  AlertCircle,
  Home,
  Lock,
  Calendar,
  MapPin,
  Hash,
  Activity,
  ChevronRight,
  Loader2,
  X,
  Check,
  Key,
  ShieldCheck,
  UserPlus,
  Clock,
  PlusCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { updateProfile, changePassword } from '../../services/api';
import { getMyBulletins } from '../../services/bulletinService';
import { getReclamations } from '../../services/reclamationService';
import { useToast } from '../../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from '../../components/ConfirmModal';

const UserProfile = () => {
    // --- COLOR SYSTEM (60-30-10 Rule) ---
    const colors = {
        base60: '#F3F4F6',    // Gris clair (Fond principal)
        secondary30: '#4B0082', // Violet foncé
        secondaryGradient: 'linear-gradient(135deg, #4B0082 0%, #9B4DCA 100%)',
        accent10: '#7C3AED',    // Violet vif (Accents)
        white: '#FFFFFF',
        textDark: '#1F2937'
    };

    const { user, refreshUser } = useAuth();
    const { showToast } = useToast();

    const [activeTab, setActiveTab] = useState('beneficiaires');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isFetchingStats, setIsFetchingStats] = useState(true);
    const [counts, setCounts] = useState({ bulletins: 0, reclamations: 0, beneficiaires: 0 });
    const [listBeneficiaires, setListBeneficiaires] = useState([]);
    const [avatar, setAvatar] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [newBeneficiary, setNewBeneficiary] = useState({ nom: '', prenom: '', relation: 'Conjoint', ddn: '', sexe: 'M' });
    const fileInputRef = useRef(null);

    const fetchStats = async () => {
        try {
            setIsFetchingStats(true);
            const [bulletins, reclamations] = await Promise.all([
                getMyBulletins(),
                getReclamations()
            ]);

            const staticBeneficiaries = [
                { id: 'sb-1', nom: 'Ben Salah', prenom: 'Amira', relation: 'Conjoint', ddn: '12/05/1988', sexe: 'F', bg: '#EC4899', initials: 'BA' },
                { id: 'sb-2', nom: 'Ben Salah', prenom: 'Youssef', relation: 'Enfant', ddn: '24/08/2015', sexe: 'M', bg: '#3B82F6', initials: 'BY' },
                { id: 'sb-3', nom: 'Ben Salah', prenom: 'Lina', relation: 'Enfant', ddn: '03/11/2018', sexe: 'F', bg: '#10B981', initials: 'BL' }
            ];

            setCounts({
                bulletins: bulletins.length,
                reclamations: reclamations.length,
                beneficiaires: staticBeneficiaries.length
            });
            setListBeneficiaires(staticBeneficiaries);
        } catch (error) {
            console.error("Erreur stats:", error);
        } finally {
            setIsFetchingStats(false);
        }
    };

    const [form, setForm] = useState({
        nom: '',
        prenom: '',
        adresse: '',
        telephone: '',
        ddn: '',
        ville: ''
    });

    const [pwdForm, setPwdForm] = useState({
        ancienMdp: '',
        nouveauMdp: '',
        confirmMdp: ''
    });

    useEffect(() => {
        fetchStats();
        if (user) {
            setForm({
                nom: user.nom || '',
                prenom: user.prenom || '',
                adresse: user.adresse || '',
                telephone: user.telephone || '',
                ddn: user.ddn ? user.ddn.split('T')[0] : '',
                ville: user.ville || ''
            });
        }
    }, [user, isEditing]);

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => setAvatar(reader.result);
        reader.readAsDataURL(file);
    };

    const handleInfoSave = async () => {
        setIsSaving(true);
        try {
            await updateProfile(form);
            await refreshUser();
            setIsEditing(false);
            showToast("Profil mis à jour avec succès", "success");
        } catch (e) {
            showToast(e.message || "Erreur lors de la mise à jour", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handlePasswordChange = async () => {
        if (pwdForm.nouveauMdp !== pwdForm.confirmMdp) {
            showToast("Les mots de passe ne correspondent pas", "error");
            return;
        }
        setIsSaving(true);
        try {
            await changePassword(pwdForm.ancienMdp, pwdForm.nouveauMdp);
            setPwdForm({ ancienMdp: '', nouveauMdp: '', confirmMdp: '' });
            showToast("Mot de passe modifié avec succès", "success");
        } catch (e) {
            showToast(e.message || "Erreur lors du changement", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddBeneficiary = async () => {
        if (!newBeneficiary.nom || !newBeneficiary.prenom) {
            showToast("Veuillez remplir tous les champs obligatoires", "error");
            return;
        }
        setIsSaving(true);
        try {
            // Simulated local add
            const beneficiary = {
                ...newBeneficiary,
                id: Date.now().toString(),
                initials: (newBeneficiary.nom[0] + newBeneficiary.prenom[0]).toUpperCase(),
                bg: '#8B5CF6'
            };
            setListBeneficiaires(prev => [...prev, beneficiary]);
            setCounts(prev => ({ ...prev, beneficiaires: prev.beneficiaires + 1 }));
            
            setNewBeneficiary({ nom: '', prenom: '', relation: 'Conjoint', ddn: '', sexe: 'M' });
            setIsAddModalOpen(false);
            showToast("Bénéficiaire ajouté (Local uniquement)", "success");
        } catch (e) {
            showToast("Erreur lors de l'ajout", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteBenef = async () => {
        setIsDeleting(true);
        try {
            // Simulated local delete
            setListBeneficiaires(prev => prev.filter(b => b.id !== deleteId));
            setCounts(prev => ({ ...prev, beneficiaires: prev.beneficiaires - 1 }));
            setDeleteId(null);
            showToast("Bénéficiaire supprimé (Local uniquement)", "success");
        } catch (e) {
            showToast("Erreur lors de la suppression", "error");
        } finally {
            setIsDeleting(false);
        }
    };

    if (!user) return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin" size={48} /></div>;

    return (
        <div className="p-6 lg:p-10 space-y-8 min-h-full bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            
            {/* --- TOP COVER CARD --- */}
            <div className="relative overflow-hidden rounded-[40px] shadow-2xl border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900">
                {/* Cover Banner with Decorative Pattern */}
                <div className="h-52 w-full relative overflow-hidden" style={{ background: colors.secondaryGradient }}>
                    {/* Decorative Geometric Circles */}
                    <div className="absolute top-[-50px] right-[-50px] w-64 h-64 rounded-full bg-white/10 blur-3xl"></div>
                    <div className="absolute bottom-[-20px] left-[20%] w-32 h-32 rounded-full bg-white/5 blur-2xl"></div>
                    
                    {/* Glassmorphic Stats Overlay (Positioned higher to avoid overlap) */}
                    <div className="absolute right-10 bottom-8 flex gap-4 z-20">
                        {[
                            { label: 'Bénéficiaires', value: counts.beneficiaires, icon: Users, color: '#3B82F6' },
                            { label: 'Bulletins', value: counts.bulletins, icon: FileText, color: '#10B981' },
                            { label: 'Réclamations', value: counts.reclamations, icon: MessageSquare, color: '#F43F5E' },
                        ].map((stat, i) => (
                            <div key={i} className="p-4 px-6 rounded-[24px] flex flex-col items-center justify-center min-w-[125px] min-h-[100px] backdrop-blur-2xl bg-white/30 shadow-2xl border border-white/40 hover:translate-y-[-5px] transition-all duration-300 group">
                                <div className="p-2 rounded-xl bg-white/20 mb-2 group-hover:scale-110 transition-transform">
                                    <stat.icon size={20} className="text-white" />
                                </div>
                                {isFetchingStats ? (
                                    <Loader2 className="animate-spin text-white mb-1" size={24} />
                                ) : (
                                    <span className="text-3xl font-black tracking-tighter text-white drop-shadow-md">{stat.value}</span>
                                )}
                                <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">{stat.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="px-10 pb-12">
                    <div className="relative flex flex-col md:flex-row items-center md:items-end gap-8 -mt-12">
                        {/* Avatar Section */}
                    <div className="relative z-30 group">
                            <div className="w-48 h-48 rounded-[40px] border-[8px] border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 overflow-hidden shadow-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-[1.02]">
                                {avatar || user.avatar ? (
                                    <img src={avatar || user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                                        <User size={90} strokeWidth={1} className="text-purple-600/20" />
                                    </div>
                                )}
                            </div>
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-3 right-3 p-3.5 rounded-2xl bg-white dark:bg-slate-800 shadow-xl text-purple-600 dark:text-purple-400 hover:scale-110 transition-all border border-slate-100 dark:border-slate-700 active:scale-95 z-40"
                            >
                                <Camera size={22} />
                            </button>
                            <input type="file" ref={fileInputRef} className="hidden" onChange={handleAvatarChange} />
                        </div>

                        {/* User Header Info */}
                        <div className="flex-1 space-y-6 pb-2 z-10 text-center md:text-left">
                            <div className="flex flex-col gap-3">
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 dark:text-white">
                                        {user.prenom} <span className="text-purple-600 dark:text-purple-400">{user.nom}</span>
                                    </h1>
                                    <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border shadow-sm ${user.statut === 1 ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                                        <div className={`w-2 h-2 rounded-full ${user.statut === 1 ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
                                        <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${user.statut === 1 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                            {user.statut === 1 ? 'Profil Vérifié' : 'En attente'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-3">
                                    <div className="flex items-center gap-2">
                                        <span className="h-px w-4 bg-slate-200 dark:bg-slate-700"></span>
                                        <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em] text-slate-900 dark:text-white">Membre {user.role === 'ADMIN' ? 'Administration' : user.role === 'RESPONSABLE_RH' ? 'Direction RH' : 'Adhérent'} TT Assurance</p>
                                        <span className="h-px w-4 bg-slate-200 dark:bg-slate-700"></span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/50">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            Session Actuelle: Active
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap justify-center md:justify-start gap-8 pt-2">
                                {[
                                    { icon: Hash, val: user.matricule },
                                    { icon: Mail, val: user.email },
                                    { icon: Phone, val: user.telephone }
                                ].map((item, id) => (
                                    <div key={id} className="flex items-center gap-3 group">
                                        <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-purple-50 dark:group-hover:bg-purple-900/20 transition-all duration-300">
                                            <item.icon size={16} className="opacity-40 group-hover:opacity-100 group-hover:text-purple-600 dark:group-hover:text-purple-400" />
                                        </div>
                                        <span className="text-[13px] font-bold text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{item.val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MAIN TABS --- */}
            <div className="flex flex-col gap-6">
                <div className="flex gap-2 p-1.5 rounded-2xl w-fit bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-white/5">
                    {[
                        { id: 'beneficiaires', label: 'Bénéficiaires', icon: Users },
                        { id: 'infos', label: 'Informations personnelles', icon: UserPlus },
                        { id: 'securite', label: 'Sécurité', icon: ShieldCheck },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                                activeTab === tab.id 
                                ? 'bg-purple-600 text-white shadow-xl shadow-purple-500/20' 
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 opacity-50 hover:opacity-100'
                            }`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* --- TAB CONTENT AREA --- */}
                <div className="min-h-[400px]">
                    
                    {/* 1. BENEFICIAIRES */}
                    {activeTab === 'beneficiaires' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {isFetchingStats ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="h-[250px] rounded-[32px] bg-slate-100 dark:bg-slate-900 animate-pulse border border-slate-200 dark:border-white/5" />
                                ))
                            ) : listBeneficiaires.length === 0 ? (
                                <div className="col-span-full py-20 flex flex-col items-center gap-4 opacity-20">
                                    <Users size={48} />
                                    <span className="text-xs font-black uppercase tracking-widest">Aucun bénéficiaire enregistré</span>
                                </div>
                            ) : (
                                listBeneficiaires.map((b) => (
                                    <motion.div 
                                        key={b.id} 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="relative p-6 rounded-[32px] shadow-sm border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900 flex flex-col items-center gap-4 hover:shadow-xl transition-all duration-300 group"
                                    >
                                        <button 
                                            onClick={() => setDeleteId(b.id)}
                                            className="absolute top-4 right-4 p-2 rounded-xl bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                                        >
                                            <X size={14} />
                                        </button>
                                        <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-black text-xl shadow-lg" style={{ backgroundColor: b.bg }}>
                                            {b.initials}
                                        </div>
                                        <div className="text-center">
                                            <h3 className="font-black text-lg text-slate-900 dark:text-white">{b.nom} {b.prenom}</h3>
                                            <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em] text-slate-900 dark:text-white">{b.relation}</p>
                                        </div>
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="text-[10px] font-bold text-slate-400">{b.ddn || 'Date non renseignée'}</span>
                                            <div className="px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-800 text-[9px] font-black text-slate-500 uppercase tracking-widest border border-slate-100 dark:border-slate-700">
                                                {b.sexe === 'M' ? 'Masculin' : 'Féminin'}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    )}

                    {/* 2. INFOS PERSO */}
                    {activeTab === 'infos' && (
                        <div className="p-8 rounded-[32px] shadow-sm border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900 space-y-8">
                            <div className="flex justify-between items-center">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Informations d'Adhésion</h3>
                                    <p className="text-xs font-bold opacity-30 uppercase tracking-widest text-slate-900 dark:text-white">Gérez vos coordonnées personnelles</p>
                                </div>
                                {!isEditing ? (
                                    <button 
                                        onClick={() => setIsEditing(true)}
                                        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 font-bold text-sm tracking-tight hover:scale-105 transition-all text-purple-600 dark:text-purple-400"
                                    >
                                        <Edit2 size={16} /> Modifier le profil
                                    </button>
                                ) : (
                                    <div className="flex gap-3">
                                        <button onClick={() => setIsEditing(false)} className="px-6 py-3 rounded-2xl font-bold text-sm text-slate-500 dark:text-slate-400 opacity-60 hover:opacity-100 transition-opacity">Annuler</button>
                                        <button 
                                            onClick={handleInfoSave}
                                            disabled={isSaving}
                                            className="px-8 py-3 rounded-2xl text-white font-black text-sm shadow-xl active:scale-95 transition-all bg-purple-600 hover:bg-purple-700 shadow-purple-500/20"
                                        >
                                            {isSaving ? "Enregistrement..." : "Enregistrer"}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {[
                                    { label: 'Nom', key: 'nom', icon: User },
                                    { label: 'Prénom', key: 'prenom', icon: User },
                                    { label: 'Email', key: 'email', icon: Mail, disabled: true },
                                    { label: 'Téléphone', key: 'telephone', icon: Phone },
                                    { label: 'Ville', key: 'ville', icon: Home },
                                    { label: 'Adresse', key: 'adresse', icon: MapPin },
                                    { label: 'Date de naissance', key: 'ddn', icon: Calendar, type: 'date' },
                                    { label: 'Matricule', key: 'matricule', icon: Hash, disabled: true },
                                ].map((field) => (
                                    <div key={field.key} className="space-y-2">
                                        <label className="flex items-center gap-2 text-[10px] font-black opacity-40 uppercase tracking-widest text-slate-900 dark:text-white">
                                            <field.icon size={14} /> {field.label}
                                        </label>
                                        <div className="relative group">
                                            <input 
                                                type={field.type || "text"}
                                                disabled={!isEditing || field.disabled}
                                                className={`w-full px-6 py-4 rounded-2xl border transition-all text-sm font-bold outline-none text-slate-800 dark:text-slate-100 ${
                                                    isEditing && !field.disabled 
                                                    ? 'border-purple-300 dark:border-purple-700 bg-purple-50/20 dark:bg-purple-900/10 focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500' 
                                                    : 'border-transparent bg-slate-50 dark:bg-slate-800/50 cursor-default'
                                                }`}
                                                value={form[field.key] || user[field.key] || ''}
                                                onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                                            />
                                            {field.disabled && <Lock size={14} className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20 text-slate-400" />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 3. SECURITE */}
                    {activeTab === 'securite' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="p-8 rounded-[32px] shadow-sm border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900 space-y-8">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Changer de mot de passe</h3>
                                    <p className="text-xs font-bold opacity-30 uppercase tracking-widest text-slate-900 dark:text-white">Protégez votre compte avec un mot de passe fort</p>
                                </div>

                                <div className="space-y-6">
                                    {[
                                        { label: 'Ancien mot de passe', key: 'ancienMdp' },
                                        { label: 'Nouveau mot de passe', key: 'nouveauMdp' },
                                        { label: 'Confirmer le nouveau mot de passe', key: 'confirmMdp' },
                                    ].map((field) => (
                                        <div key={field.key} className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{field.label}</label>
                                            <input 
                                                type="password"
                                                className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-purple-400 dark:focus:border-purple-600 focus:ring-4 focus:ring-purple-500/10 transition-all text-sm font-bold text-slate-800 dark:text-slate-100 outline-none"
                                                value={pwdForm[field.key]}
                                                onChange={(e) => setPwdForm({ ...pwdForm, [field.key]: e.target.value })}
                                            />
                                        </div>
                                    ))}
                                    <button 
                                        onClick={handlePasswordChange}
                                        disabled={isSaving || !pwdForm.ancienMdp || !pwdForm.nouveauMdp}
                                        className="w-full py-4 rounded-2xl text-white font-black text-sm shadow-xl active:scale-95 transition-all bg-purple-600 hover:bg-purple-700 shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSaving ? "Mise à jour..." : "Mettre à jour le mot de passe"}
                                    </button>
                                </div>
                            </div>

                            <div className="p-8 rounded-[32px] shadow-sm border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900 space-y-8 flex flex-col items-center justify-center text-center">
                                <div className="p-6 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                                    <ShieldCheck size={48} />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Sécurité du compte</h3>
                                    <p className="text-xs font-medium opacity-50 px-8 text-slate-900 dark:text-white">Votre compte est protégé par un cryptage de bout en bout pour vos données médicales sensibles.</p>
                                </div>
                                <div className="flex flex-col gap-3 w-full">
                                    <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Authentification active</span>
                                        </div>
                                        <ChevronRight size={14} className="text-emerald-500" />
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 opacity-50 grayscale">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Double authentification (Bientôt)</span>
                                        </div>
                                        <ChevronRight size={14} className="text-slate-400" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* --- ADD BENEFICIARY MODAL --- */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl border border-slate-100 dark:border-white/5 overflow-hidden"
                        >
                            <div className="p-8 space-y-8">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">Nouveau Bénéficiaire</h3>
                                        <p className="text-xs font-bold opacity-30 uppercase tracking-widest">Enregistrez un membre de votre famille</p>
                                    </div>
                                    <button onClick={() => setIsAddModalOpen(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nom</label>
                                            <input 
                                                type="text" 
                                                className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-purple-400 outline-none text-sm font-bold"
                                                value={newBeneficiary.nom}
                                                onChange={e => setNewBeneficiary({...newBeneficiary, nom: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Prénom</label>
                                            <input 
                                                type="text" 
                                                className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-purple-400 outline-none text-sm font-bold"
                                                value={newBeneficiary.prenom}
                                                onChange={e => setNewBeneficiary({...newBeneficiary, prenom: e.target.value})}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Relation</label>
                                        <select 
                                            className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-purple-400 outline-none text-sm font-bold appearance-none"
                                            value={newBeneficiary.relation}
                                            onChange={e => setNewBeneficiary({...newBeneficiary, relation: e.target.value})}
                                        >
                                            <option value="Conjoint">Conjoint(e)</option>
                                            <option value="Enfant">Enfant</option>
                                            <option value="Parent">Parent</option>
                                            <option value="Autre">Autre</option>
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date de naissance</label>
                                            <input 
                                                type="date" 
                                                className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-purple-400 outline-none text-sm font-bold"
                                                value={newBeneficiary.ddn}
                                                onChange={e => setNewBeneficiary({...newBeneficiary, ddn: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sexe</label>
                                            <div className="flex gap-2">
                                                {['M', 'F'].map(s => (
                                                    <button 
                                                        key={s}
                                                        onClick={() => setNewBeneficiary({...newBeneficiary, sexe: s})}
                                                        className={`flex-1 py-4 rounded-2xl border font-black transition-all ${newBeneficiary.sexe === s ? 'bg-purple-600 border-purple-600 text-white' : 'bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-400'}`}
                                                    >
                                                        {s === 'M' ? 'Masculin' : 'Féminin'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    onClick={handleAddBeneficiary}
                                    disabled={isSaving}
                                    className="w-full py-5 rounded-[24px] bg-purple-600 hover:bg-purple-700 text-white font-black text-sm shadow-xl shadow-purple-500/20 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {isSaving ? "Ajout en cours..." : "Confirmer l'ajout"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <ConfirmModal 
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDeleteBenef}
                title="Supprimer le bénéficiaire"
                message="Êtes-vous sûr de vouloir retirer ce membre de votre liste de bénéficiaires ?"
                type="danger"
                isLoading={isDeleting}
            />
        </div>
    );
};

export default UserProfile;
