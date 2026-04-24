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
import { getReclamations } from '../../services/reclamationService';
import { getMyBeneficiaries, addBeneficiary, deleteBeneficiary, updateBeneficiary } from '../../services/beneficiaryService';
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
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('beneficiaires');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isFetchingStats, setIsFetchingStats] = useState(true);
    const [counts, setCounts] = useState({ bulletins: 0, reclamations: 0, beneficiaires: 0 });
    const [listBeneficiaires, setListBeneficiaires] = useState([]);
    const [avatar, setAvatar] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [editingBeneficiaryId, setEditingBeneficiaryId] = useState(null);
    const [newBeneficiary, setNewBeneficiary] = useState({ nom: '', prenom: '', relation: 'Conjoint', ddn: '', sexe: 'M' });
    const [isRelationDropdownOpen, setIsRelationDropdownOpen] = useState(false);
    const [documentFile, setDocumentFile] = useState(null);
    const [previewDocument, setPreviewDocument] = useState(null);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
    const fileInputRef = useRef(null);

    const fetchStats = async () => {
        try {
            setIsFetchingStats(true);
            const [bulletins, reclamations, fetchedBeneficiaries] = await Promise.all([
                getMyBulletins(),
                getReclamations(),
                getMyBeneficiaries()
            ]);

            const beneficiariesWithStyle = fetchedBeneficiaries.map(b => ({
                ...b,
                initials: (b.nom[0] + b.prenom[0]).toUpperCase(),
                bg: ['#EC4899', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'][Math.floor(Math.random() * 5)]
            }));

            setCounts({
                bulletins: bulletins.length,
                reclamations: reclamations.length,
                beneficiaires: beneficiariesWithStyle.length
            });
            setListBeneficiaires(beneficiariesWithStyle);
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

    const handleAddBeneficiary = async () => {
        if (!newBeneficiary.nom || !newBeneficiary.prenom || (!documentFile && !editingBeneficiaryId)) {
            showToast("Veuillez remplir tous les champs obligatoires et joindre un document", "error");
            return;
        }
        setIsSaving(true);
        try {
            const formData = new FormData();
            Object.keys(newBeneficiary).forEach(key => {
                if (newBeneficiary[key] !== null && newBeneficiary[key] !== undefined) {
                    formData.append(key, newBeneficiary[key])
                }
            });
            
            if (documentFile) {
                formData.append('document', documentFile);
            }

            if (editingBeneficiaryId) {
                await updateBeneficiary(editingBeneficiaryId, formData);
                showToast("Bénéficiaire mis à jour avec succès", "success");
            } else {
                await addBeneficiary(formData);
                showToast("Bénéficiaire ajouté avec succès (En attente de validation)", "success");
            }
            
            setNewBeneficiary({ nom: '', prenom: '', relation: 'Conjoint', ddn: '', sexe: 'M' });
            setDocumentFile(null);
            setEditingBeneficiaryId(null);
            setIsAddModalOpen(false);
            fetchStats();
        } catch (e) {
            showToast(e.message || "Erreur lors de l'enregistrement", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteBenef = async () => {
        setIsDeleting(true);
        try {
            await deleteBeneficiary(deleteId);
            setDeleteId(null);
            showToast("Bénéficiaire supprimé avec succès", "success");
            fetchStats();
        } catch (e) {
            showToast(e.message || "Erreur lors de la suppression", "error");
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
                            className={`flex items-center gap-2 px-4 md:px-6 py-3 rounded-xl font-bold text-xs md:text-sm transition-all whitespace-nowrap ${
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
                        <div className="space-y-6">
                            {/* View Toggle and Controls */}
                            <div className="flex justify-between items-center">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Mes Bénéficiaires</h3>
                                    <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em]">Visualisez et gérez les membres de votre famille</p>
                                </div>
                                <div className="flex bg-white dark:bg-slate-900 p-1 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5">
                                    <button 
                                        onClick={() => setViewMode('grid')}
                                        className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-purple-600'}`}
                                        title="Vue Grille"
                                    >
                                        <LayoutGrid size={18} />
                                    </button>
                                    <button 
                                        onClick={() => setViewMode('table')}
                                        className={`p-2 rounded-xl transition-all ${viewMode === 'table' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-purple-600'}`}
                                        title="Vue Tableau"
                                    >
                                        <List size={18} />
                                    </button>
                                </div>
                            </div>

                            {isFetchingStats ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} className="h-[250px] rounded-[32px] bg-slate-100 dark:bg-slate-900 animate-pulse border border-slate-200 dark:border-white/5" />
                                    ))}
                                </div>
                            ) : viewMode === 'grid' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <motion.button 
                                        onClick={() => {
                                            setEditingBeneficiaryId(null);
                                            setNewBeneficiary({ nom: '', prenom: '', relation: 'Conjoint', ddn: '', sexe: 'M' });
                                            setDocumentFile(null);
                                            setIsAddModalOpen(true);
                                        }}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="h-full min-h-[250px] p-6 rounded-[32px] border-2 border-dashed border-slate-200 dark:border-slate-700 bg-transparent flex flex-col items-center justify-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-purple-300 dark:hover:border-purple-800 transition-all duration-300 group"
                                    >
                                        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform shadow-sm">
                                            <PlusCircle size={28} />
                                        </div>
                                        <span className="font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest text-[9px] group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Nouveau Bénéficiaire</span>
                                    </motion.button>
                                    
                                    {listBeneficiaires.map((b, i) => (
                                        <motion.div 
                                            key={b.id} 
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="relative p-6 rounded-[32px] shadow-sm border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900 flex flex-col items-center gap-4 hover:shadow-xl transition-all duration-300 group overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-full blur-2xl -mr-10 -mt-10" />
                                            
                                            <div className="absolute top-4 right-4 flex gap-1 z-10 opacity-100 transition-all">
                                                {(b.statut === 'En attente' || b.statut === 'Rejeté') && (
                                                    <button 
                                                        onClick={() => {
                                                            setEditingBeneficiaryId(b.id);
                                                            setNewBeneficiary({
                                                                nom: b.nom,
                                                                prenom: b.prenom,
                                                                relation: b.relation,
                                                                ddn: b.ddn ? b.ddn.split('T')[0] : '',
                                                                sexe: b.sexe
                                                            });
                                                            setDocumentFile(null);
                                                            setIsAddModalOpen(true);
                                                        }}
                                                        className="p-2 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white transition-all shadow-sm"
                                                        title="Modifier"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => { setDeleteId(b.id); setIsDeleting(false); }}
                                                    className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                                    title="Supprimer"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg transform group-hover:rotate-6 transition-transform" style={{ backgroundColor: b.bg }}>
                                                {b.initials}
                                            </div>
                                            <div className="text-center">
                                                <h3 className="font-black text-lg text-slate-900 dark:text-white tracking-tight">{b.nom} {b.prenom}</h3>
                                                <p className="text-[9px] font-black opacity-30 uppercase tracking-[0.2em] text-slate-900 dark:text-white">{b.relation}</p>
                                            </div>
                                            <div className="flex flex-col items-center gap-2 w-full px-2">
                                                <span className="text-[10px] font-bold text-slate-400">{(b.ddn && b.ddn !== '') ? new Date(b.ddn).toLocaleDateString() : 'Date non renseignée'}</span>
                                                <div className="flex gap-2">
                                                    <div className="px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-800 text-[8px] font-black text-slate-500 uppercase tracking-widest border border-slate-100 dark:border-slate-700">
                                                        {b.sexe === 'M' ? 'Masc' : 'Fém'}
                                                    </div>
                                                    <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                                                        b.statut === 'Validé' ? 'text-emerald-500 bg-emerald-50 border-emerald-200' :
                                                        b.statut === 'Rejeté' ? 'text-red-500 bg-red-50 border-red-200' :
                                                        'text-amber-500 bg-amber-50 border-amber-200'
                                                    }`}>
                                                        {b.statut || 'En attente'}
                                                    </div>
                                                </div>
                                                {b.statut === 'Rejeté' && b.motifRefus && (
                                                    <div className="mt-2 w-full p-2.5 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30">
                                                        <p className="text-[8px] font-black uppercase tracking-widest text-red-500 mb-0.5 text-left">Motif de refus</p>
                                                        <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 text-left line-clamp-2 leading-tight">{b.motifRefus}</p>
                                                    </div>
                                                )}
                                            </div>
                                            {b.document && (
                                                <button 
                                                    onClick={() => setPreviewDocument(b.document)} 
                                                    className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-widest py-3 border-t border-slate-100 dark:border-white/5 w-full justify-center transition-all group/btn ${b.document.startsWith('blob:') ? 'text-amber-500 hover:text-amber-600' : 'text-purple-600 hover:text-white bg-transparent hover:bg-purple-600'} rounded-b-[32px]`}
                                                >
                                                    <Eye size={14} className="group-hover/btn:scale-110 transition-transform" /> Aperçu Justificatif
                                                </button>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4 rounded-[32px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 shadow-sm">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b border-slate-50 dark:border-slate-800">
                                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Bénéficiaire</th>
                                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Relation</th>
                                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Date de Naissance</th>
                                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                                {listBeneficiaires.map((b, i) => (
                                                    <motion.tr 
                                                        key={b.id} 
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: i * 0.03 }}
                                                        className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                                                    >
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm" style={{ backgroundColor: b.bg }}>
                                                                    {b.initials}
                                                                </div>
                                                                <span className="font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-tight">{b.nom} {b.prenom}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 px-6 text-xs font-black uppercase tracking-widest opacity-60 text-slate-500">
                                                            {b.relation}
                                                        </td>
                                                        <td className="px-6 py-4 text-xs font-bold text-slate-500">
                                                            {(b.ddn && b.ddn !== '') ? new Date(b.ddn).toLocaleDateString() : 'N/A'}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border inline-flex items-center gap-2 ${
                                                                b.statut === 'Validé' ? 'text-emerald-500 bg-emerald-50 border-emerald-200' :
                                                                b.statut === 'Rejeté' ? 'text-red-500 bg-red-50 border-red-200' :
                                                                'text-amber-500 bg-amber-50 border-amber-200'
                                                            }`}>
                                                                <div className={`w-1.5 h-1.5 rounded-full ${
                                                                    b.statut === 'Validé' ? 'bg-emerald-500' :
                                                                    b.statut === 'Rejeté' ? 'bg-red-500' : 'bg-amber-500'
                                                                }`} />
                                                                {b.statut || 'En attente'}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex justify-end gap-2">
                                                                {(b.statut === 'En attente' || b.statut === 'Rejeté') && (
                                                                    <button 
                                                                        onClick={() => {
                                                                            setEditingBeneficiaryId(b.id);
                                                                            setNewBeneficiary({
                                                                                nom: b.nom,
                                                                                prenom: b.prenom,
                                                                                relation: b.relation,
                                                                                ddn: b.ddn ? b.ddn.split('T')[0] : '',
                                                                                sexe: b.sexe
                                                                            });
                                                                            setDocumentFile(null);
                                                                            setIsAddModalOpen(true);
                                                                        }}
                                                                        className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 hover:bg-purple-600 hover:text-white transition-all shadow-sm"
                                                                        title="Modifier"
                                                                    >
                                                                        <Edit2 size={16} />
                                                                    </button>
                                                                )}
                                                                {b.document && (
                                                                    <button 
                                                                        onClick={() => setPreviewDocument(b.document)}
                                                                        className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 hover:bg-purple-600 hover:text-white transition-all shadow-sm"
                                                                        title="Voir document"
                                                                    >
                                                                        <Eye size={16} />
                                                                    </button>
                                                                )}
                                                                <button 
                                                                    onClick={() => { setDeleteId(b.id); setIsDeleting(false); }}
                                                                    className="p-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                                                    title="Supprimer"
                                                                >
                                                                    <X size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </motion.tr>
                                                ))}
                                                {/* Add button inside table as a row or footer if empty */}
                                                {listBeneficiaires.length === 0 && (
                                                    <tr>
                                                        <td colSpan={5} className="py-20 text-center">
                                                            <button 
                                                                onClick={() => {
                                                                    setEditingBeneficiaryId(null);
                                                                    setNewBeneficiary({ nom: '', prenom: '', relation: 'Conjoint', ddn: '', sexe: 'M' });
                                                                    setDocumentFile(null);
                                                                    setIsAddModalOpen(true);
                                                                }}
                                                                className="px-8 py-4 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 font-black text-slate-400 uppercase tracking-widest text-xs hover:border-purple-500 hover:text-purple-600 transition-all"
                                                            >
                                                                + Ajouter un bénéficiaire
                                                            </button>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="p-4 flex justify-start">
                                        <button 
                                            onClick={() => {
                                                setEditingBeneficiaryId(null);
                                                setNewBeneficiary({ nom: '', prenom: '', relation: 'Conjoint', ddn: '', sexe: 'M' });
                                                setDocumentFile(null);
                                                setIsAddModalOpen(true);
                                            }}
                                            className="px-6 py-3 rounded-2xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 hover:bg-purple-600 hover:text-white font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2"
                                        >
                                            <PlusCircle size={16} /> NOUVEAU BÉNÉFICIAIRE
                                        </button>
                                    </div>
                                </div>
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
                                                <span className="ml-auto text-[8px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-full opacity-100">Utilisé dans les bulletins</span>
                                            )}
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
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                                            {editingBeneficiaryId ? "Modifier le Bénéficiaire" : "Nouveau Bénéficiaire"}
                                        </h3>
                                        <p className="text-xs font-bold opacity-30 uppercase tracking-widest">
                                            {editingBeneficiaryId ? "Mettez à jour les informations du bénéficiaire" : "Enregistrez un membre de votre famille"}
                                        </p>
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

                                    <div className="space-y-2 relative z-50">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Relation</label>
                                        <div 
                                            className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus-within:border-purple-400 outline-none text-sm font-bold flex justify-between items-center cursor-pointer select-none transition-all"
                                            onClick={() => setIsRelationDropdownOpen(!isRelationDropdownOpen)}
                                        >
                                            <span className={newBeneficiary.relation ? "text-slate-900 dark:text-white" : "text-slate-400"}>
                                                {newBeneficiary.relation === 'Conjoint' ? 'Conjoint(e)' : (newBeneficiary.relation || "Sélectionnez une relation")}
                                            </span>
                                            <ChevronDown size={18} className={`text-slate-400 transition-transform ${isRelationDropdownOpen ? 'rotate-180' : ''}`} />
                                        </div>
                                        <AnimatePresence>
                                            {isRelationDropdownOpen && (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="absolute top-[100%] left-0 w-full mt-2 py-2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 flex flex-col overflow-hidden"
                                                >
                                                    {[
                                                        { value: "Conjoint", label: "Conjoint(e)" },
                                                        { value: "Enfant", label: "Enfant" },
                                                    ].map((option) => (
                                                        <button 
                                                            key={option.value}
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                setNewBeneficiary({...newBeneficiary, relation: option.value});
                                                                setIsRelationDropdownOpen(false);
                                                            }}
                                                            className={`px-6 py-4 text-left text-sm font-bold transition-all hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center justify-between ${newBeneficiary.relation === option.value ? 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' : 'text-slate-700 dark:text-slate-300'}`}
                                                        >
                                                            {option.label}
                                                            {newBeneficiary.relation === option.value && <Check size={16} className="text-purple-600" />}
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
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
                                    
                                    <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-white/5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Document justificatif (Image, PDF) {editingBeneficiaryId ? '(Optionnel si déjà fourni)' : '(*)'}
                                        </label>
                                        <div 
                                            onClick={() => fileInputRef.current?.click()}
                                            className={`relative w-full p-6 rounded-[24px] border-2 border-dashed ${documentFile ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/10' : 'border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 bg-slate-50 dark:bg-slate-800/50'} transition-all flex flex-col items-center justify-center gap-2 cursor-pointer group`}
                                        >
                                            <input 
                                                ref={fileInputRef}
                                                type="file" 
                                                accept="image/*,.pdf" 
                                                onChange={e => setDocumentFile(e.target.files[0])} 
                                                className="hidden"
                                            />
                                            {documentFile ? (
                                                <>
                                                    <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600">
                                                        <CheckCircle2 size={24} />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-sm font-black text-slate-900 dark:text-white truncate max-w-[200px]">{documentFile.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cliquez pour modifier</p>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-purple-500 group-hover:bg-purple-50 dark:group-hover:bg-purple-900/20 transition-all shadow-sm">
                                                        <UploadCloud size={24} />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-sm font-black text-slate-600 dark:text-slate-300 transition-colors group-hover:text-purple-600 dark:group-hover:text-purple-400">Cliquez pour ajouter un fichier</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">JPG, PNG ou PDF (Max 5MB)</p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    onClick={handleAddBeneficiary}
                                    disabled={isSaving}
                                    className="w-full py-5 rounded-[24px] bg-purple-600 hover:bg-purple-700 text-white font-black text-sm shadow-xl shadow-purple-500/20 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {isSaving ? "Enregistrement en cours..." : (editingBeneficiaryId ? "Mettre à jour" : "Confirmer l'ajout")}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- DOCUMENT VIEWER SLIDE-OVER --- */}
            <AnimatePresence>
                {previewDocument && (
                    <div className="fixed inset-0 z-[110] flex justify-end overflow-hidden">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setPreviewDocument(null)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-[110]"
                        />
                        <motion.div 
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="relative w-full md:w-[600px] h-full bg-white dark:bg-slate-900 shadow-2xl z-[120] border-l border-slate-100 dark:border-white/5 flex flex-col"
                        >
                            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-2xl bg-purple-100 dark:bg-purple-900/20 text-purple-600">
                                        <FileText size={20} />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-black text-lg text-slate-900 dark:text-white leading-none">Justificatif</h3>
                                        <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest text-slate-900 dark:text-white">Aperçu du document sécurisé</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <a 
                                        href={`http://localhost:5000/${previewDocument}`} 
                                        download
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="px-4 py-2 rounded-2xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 hover:bg-purple-600 hover:text-white transition-all font-black text-xs flex items-center gap-2"
                                    >
                                        <Download size={14} /> TÉLÉCHARGER
                                    </a>
                                    <button onClick={() => setPreviewDocument(null)} className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all">
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 bg-slate-100 dark:bg-[#0B1120] relative p-8 flex items-center justify-center overflow-auto pattern-grid">
                                {previewDocument.toLowerCase().endsWith('.pdf') ? (
                                    <iframe 
                                        src={`http://localhost:5000/${previewDocument}`} 
                                        className="w-full h-full rounded-2xl shadow-sm border border-slate-200 dark:border-white/5 bg-white"
                                        title="Document"
                                    />
                                ) : (
                                    <img 
                                        src={`http://localhost:5000/${previewDocument}`} 
                                        alt="Document Justificatif"
                                        className="max-w-full max-h-full object-contain rounded-2xl shadow-xl border border-slate-200 dark:border-white/5"
                                    />
                                )}
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
