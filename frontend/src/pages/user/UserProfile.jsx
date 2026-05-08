import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
    EyeOff,
    Home,
    Lock,
    Calendar,
    MapPin,
    Hash,
    ChevronRight,
    Loader2,
    X,
    Check,
    ShieldCheck,
    UserPlus,
    PlusCircle,
    ChevronDown,
    UploadCloud,
    Download,
    LayoutGrid,
    List
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { updateProfile, changePassword } from '../../services/api';
import { getMyBulletins } from '../../services/bulletinService';
import { getMyReclamations } from '../../services/reclamationService';
import { getMyBeneficiaries } from '../../services/beneficiaryService';
import { useToast } from '../../context/ToastContext';

import UserBeneficiarie from './UserBeneficiarie';

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
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('beneficiaires');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isFetchingStats, setIsFetchingStats] = useState(true);
    const [counts, setCounts] = useState({ bulletins: 0, reclamations: 0, beneficiaires: 0 });
    const [avatar, setAvatar] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null);

    const fileInputRef = useRef(null);

    const fetchStats = async () => {
        try {
            setIsFetchingStats(true);
            const [bulletins, reclamations, Beneficiarie] = await Promise.all([
                getMyBulletins(),
                getMyReclamations(),
                getMyBeneficiaries()
            ]);

            setCounts({
                bulletins: bulletins.length,
                reclamations: reclamations.length,
                beneficiaires: Beneficiarie.length
            });
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
        ville: '',
        code_cnam: ''
    });

    const [pwdForm, setPwdForm] = useState({
        ancienMdp: '',
        nouveauMdp: '',
        confirmMdp: ''
    });

    const [showPwd, setShowPwd] = useState({
        ancienMdp: false,
        nouveauMdp: false,
        confirmMdp: false
    });

    const togglePwd = (key) => {
        setShowPwd(prev => ({ ...prev, [key]: !prev[key] }));
    };

    useEffect(() => {
        fetchStats();
        if (user) {
            setForm({
                nom: user.nom || '',
                prenom: user.prenom || '',
                adresse: user.adresse || '',
                telephone: user.telephone || '',
                ddn: user.ddn ? user.ddn.split('T')[0] : '',
                ville: user.ville || '',
                code_cnam: user.code_cnam || ''
            });
        }
    }, [user, isEditing]);

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setAvatarFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setAvatar(reader.result);
        reader.readAsDataURL(file);
        setIsEditing(true); // Passer en mode édition lors du changement d'avatar
    };

    const handleInfoSave = async () => {
        setIsSaving(true);
        try {
            await updateProfile(form, avatarFile);
            await refreshUser();
            setIsEditing(false);
            setAvatarFile(null);
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

                    {/* Glassmorphic Stats Overlay - Hidden on mobile, shown on md+ */}
                    <div className="absolute right-10 bottom-8 hidden md:flex gap-4 z-20">
                        {[
                            { label: 'Bénéficiaires', value: counts.beneficiaires, icon: Users, color: '#3B82F6' },
                            { label: 'Bulletins', value: counts.bulletins, icon: FileText, color: '#10B981' },
                            { label: 'Réclamations', value: counts.reclamations, icon: MessageSquare, color: '#F43F5E' },
                        ].map((stat, i) => (
                            <div
                                key={i}
                                onClick={() => {
                                    if (stat.label === 'Bulletins') navigate('/bulletins');
                                    if (stat.label === 'Réclamations') navigate('/reclamations');
                                    if (stat.label === 'Bénéficiaires') setActiveTab('beneficiaires');
                                }}
                                className="p-4 px-6 rounded-[24px] flex flex-col items-center justify-center min-w-[125px] min-h-[100px] backdrop-blur-2xl bg-white/30 shadow-2xl border border-white/40 hover:translate-y-[-5px] transition-all duration-300 group cursor-pointer"
                            >
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
                    <div className="relative flex flex-col md:flex-row items-center md:items-end gap-8 -mt-16 md:-mt-12">
                        {/* Avatar Section */}
                        <div className="relative z-30 group">
                            <div className="w-40 h-40 md:w-48 md:h-48 rounded-[32px] md:rounded-[40px] border-[6px] md:border-[8px] border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 overflow-hidden shadow-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-[1.02]">
                                {avatar || user.avatar ? (
                                    <img src={avatar || user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                                        <User size={60} md:size={90} strokeWidth={1} className="text-purple-600/20" />
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

                                </div>
                                <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-3">
                                    <div className="flex items-center gap-2">
                                        <span className="h-px w-4 bg-slate-200 dark:bg-slate-700"></span>
                                        <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em] text-slate-900 dark:text-white">Membre {user.role === 'ADMIN' ? 'Administration' : user.role === 'RESPONSABLE_RH' ? 'Direction RH' : 'Adhérent'} CareCover</p>
                                        <span className="h-px w-4 bg-slate-200 dark:bg-slate-700"></span>
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
                    {/* Mobile Stats (Visible only on small screens) */}
                    <div className="md:hidden grid grid-cols-3 gap-3 w-full px-6 pb-6 pt-4">
                        {[
                            { label: 'Bénéf.', value: counts.beneficiaires, color: 'blue', tab: 'beneficiaires' },
                            { label: 'Bull.', value: counts.bulletins, color: 'emerald', path: '/bulletins' },
                            { label: 'Récl.', value: counts.reclamations, color: 'red', path: '/reclamations' },
                        ].map((stat, i) => (
                            <div
                                key={i}
                                onClick={() => {
                                    if (stat.path) navigate(stat.path);
                                    if (stat.tab) setActiveTab(stat.tab);
                                }}
                                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 flex flex-col items-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                <span className="text-xl font-black text-slate-800 dark:text-white leading-tight">{stat.value}</span>
                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">{stat.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- MAIN TABS (Scrollable on mobile) --- */}
            <div className="flex flex-col gap-6">
                <div className="flex gap-2 p-1.5 rounded-2xl w-full md:w-fit bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-white/5 overflow-x-auto no-scrollbar">
                    {[
                        { id: 'beneficiaires', label: 'Bénéficiaires', icon: Users },
                        { id: 'infos', label: 'Informations personnelles', icon: UserPlus },
                        { id: 'securite', label: 'Sécurité', icon: ShieldCheck },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 md:px-6 py-3 rounded-xl font-bold text-xs md:text-sm transition-all whitespace-nowrap ${activeTab === tab.id
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
                        <UserBeneficiarie />
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
                                    { label: 'Matricule', key: 'matricule', icon: Hash, disabled: true },
                                    { label: 'Code CNAM', key: 'code_cnam', icon: CreditCard },
                                    { label: 'Nom', key: 'nom', icon: User },
                                    { label: 'Prénom', key: 'prenom', icon: User },
                                    { label: 'Email', key: 'email', icon: Mail, disabled: true },
                                    { label: 'Téléphone', key: 'telephone', icon: Phone },
                                    { label: 'Ville', key: 'ville', icon: Home },
                                    { label: 'Adresse', key: 'adresse', icon: MapPin },
                                    { label: 'Date de naissance', key: 'ddn', icon: Calendar, type: 'date' }
                                ].map((field) => (
                                    <div key={field.key} className="space-y-2">
                                        <label className="flex items-center gap-2 text-[10px] font-black opacity-40 uppercase tracking-widest text-slate-900 dark:text-white">
                                            <field.icon size={14} /> {field.label}
                                            {field.key === 'code_cnam' && (
                                                <span className=" text-[10px] font-black uppercase tracking-widest text-black-500 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-full opacity-100">(Utilisé dans les bulletins)</span>
                                            )}
                                        </label>
                                        <div className="relative group">
                                            <input
                                                type={field.type || "text"}
                                                disabled={!isEditing || field.disabled}
                                                className={`w-full px-6 py-4 rounded-2xl border transition-all text-sm font-bold outline-none text-slate-800 dark:text-slate-100 ${isEditing && !field.disabled
                                                        ? 'border-purple-300 dark:border-purple-700 bg-purple-50/20 dark:bg-purple-900/10 focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500'
                                                        : 'border-transparent bg-slate-50 dark:bg-slate-800/50 cursor-default'
                                                    }`}
                                                value={form[field.key] ?? (user[field.key] || '')}
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
                                            <div className="relative">
                                                <input
                                                    type={showPwd[field.key] ? "text" : "password"}
                                                    className="w-full px-6 py-4 pr-14 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-gray-400 focus:border-purple-400 dark:focus:border-purple-600 focus:ring-4 focus:ring-purple-500/10 transition-all text-sm font-bold text-slate-800 dark:text-slate-100 outline-none"
                                                    value={pwdForm[field.key]}
                                                    onChange={(e) => setPwdForm({ ...pwdForm, [field.key]: e.target.value })}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => togglePwd(field.key)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-purple-600 transition-colors"
                                                >
                                                    {showPwd[field.key] ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
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
                                    {/*<div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 opacity-50 grayscale">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Double authentification (Bientôt)</span>
                                        </div>
                                        <ChevronRight size={14} className="text-slate-400" />
                                    </div>*/}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
