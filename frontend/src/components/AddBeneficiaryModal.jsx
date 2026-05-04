import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Edit2, UserPlus, Sparkles, Info, ChevronDown, CheckCircle, XCircle, User, Eye,
    Heart, Check, Calendar, ShieldCheck, FileText, Camera, UploadCloud, Loader2, CheckCircle2
} from 'lucide-react';

const AddBeneficiaryModal = ({
    isOpen,
    onClose,
    editingBeneficiaryId,
    documentPreviewUrl,
    newBeneficiary,
    setNewBeneficiary,
    isRulesOpen,
    setIsRulesOpen,
    calculateAge,
    isRelationDropdownOpen,
    setIsRelationDropdownOpen,
    avezConjoint,
    currentUser,
    documentFile,
    setDocumentFile,
    fileInputRef,
    handleAddBeneficiary,
    isSaving
}) => {
    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
                    />
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 30 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className={`relative w-full ${documentPreviewUrl ? 'max-w-6xl' : 'max-w-2xl'} bg-white dark:bg-slate-900 rounded-[48px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-white/10 overflow-hidden`}
                    >
                        {/* Header Section */}
                        <div className="relative bg-gradient-to-r from-purple-600 to-indigo-600 p-10 overflow-hidden">
                            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-purple-400/20 rounded-full blur-2xl" />

                            <div className="relative flex justify-between items-start">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 rounded-[24px] bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center text-white shadow-inner">
                                        {editingBeneficiaryId ? <Edit2 size={28} /> : <UserPlus size={28} />}
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-3xl font-black text-white tracking-tight leading-tight">
                                            {editingBeneficiaryId ? "Modifier le membre" : "Nouveau bénéficiaire"}
                                        </h3>
                                        <div className="flex items-center gap-2 text-purple-100 text-[11px] font-bold uppercase tracking-[0.2em] opacity-90">
                                            <Sparkles size={14} className="animate-pulse" />
                                            <span>Gestion de votre cercle familial</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all active:scale-90"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col lg:flex-row h-full">
                            {/* Form Section */}
                            <div className={`flex-1 p-8 lg:p-10 space-y-10 max-h-[70vh] overflow-y-auto custom-scrollbar`}>

                                {/* Eligibility Alerts */}
                                <AnimatePresence mode="wait">
                                    {newBeneficiary.relation === 'Enfant' && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0, y: -20 }}
                                            animate={{ opacity: 1, height: 'auto', y: 0 }}
                                            exit={{ opacity: 0, height: 0, y: -20 }}
                                            className="space-y-4"
                                        >
                                            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-[28px] overflow-hidden transition-all duration-300">
                                                <button
                                                    onClick={(e) => { e.preventDefault(); setIsRulesOpen(!isRulesOpen); }}
                                                    className="w-full p-5 flex items-center justify-between gap-4 text-left transition-colors hover:bg-indigo-100/50 dark:hover:bg-indigo-900/40"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                                                            <Info size={20} />
                                                        </div>
                                                        <h4 className="text-xs font-black uppercase tracking-widest text-indigo-700 dark:text-indigo-300">Règles d'éligibilité</h4>
                                                    </div>
                                                    <ChevronDown size={18} className={`text-indigo-400 transition-transform duration-300 ${isRulesOpen ? 'rotate-180' : ''}`} />
                                                </button>
                                                <AnimatePresence>
                                                    {isRulesOpen && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.3, ease: "easeInOut" }}
                                                        >
                                                            <div className="px-5 pb-5 pt-0 md:pl-[76px]">
                                                                <p className="text-[11px] font-medium text-indigo-600/80 dark:text-indigo-400/80 leading-relaxed">
                                                                    Un enfant est considéré à charge s’il a moins de 20 ans, ou jusqu’à 26 ans s’il poursuit des études ou une formation non rémunérée ou de sexe féminin au chômage et célibataire (tout âge confondu). Les personnes en situation de handicap sont prises en charge sans limite d’âge.
                                                                </p>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            {newBeneficiary.ddn && (
                                                <div className={`p-5 rounded-[28px] flex gap-4 transition-colors duration-500 ${calculateAge(newBeneficiary.ddn) < 20 ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800' :
                                                        calculateAge(newBeneficiary.ddn) < 26 ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800' :
                                                            'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800'
                                                    } border`}>
                                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${calculateAge(newBeneficiary.ddn) < 20 ? 'bg-emerald-100 dark:bg-emerald-800 text-emerald-600' :
                                                            calculateAge(newBeneficiary.ddn) < 26 ? 'bg-amber-100 dark:bg-amber-800 text-amber-600' :
                                                                'bg-rose-100 dark:bg-rose-800 text-rose-600'
                                                        }`}>
                                                        {calculateAge(newBeneficiary.ddn) < 26 ? <CheckCircle size={20} /> : <XCircle size={20} />}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h4 className={`text-xs font-black uppercase tracking-widest ${calculateAge(newBeneficiary.ddn) < 20 ? 'text-emerald-700' :
                                                                calculateAge(newBeneficiary.ddn) < 26 ? 'text-amber-700' :
                                                                    'text-rose-700'
                                                            }`}>Âge calculé : {calculateAge(newBeneficiary.ddn)} ans</h4>
                                                        <p className="text-[11px] font-medium opacity-80 leading-relaxed">
                                                            {calculateAge(newBeneficiary.ddn) < 20 ? "Éligibilité validée par l'âge." :
                                                                calculateAge(newBeneficiary.ddn) < 26 ? "Justificatif d'études ou de handicap requis." :
                                                                    "Conditions spécifiques (Handicap ou Chômage/Célibat) requises."}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                                    {/* Section: Identité */}
                                    <div className="space-y-6 md:col-span-2">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                                <User size={16} />
                                            </div>
                                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Identité & Sexe</h4>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">Nom</label>
                                                <input
                                                    type="text"
                                                    placeholder="Ex: Ben Salah"
                                                    className="w-full px-6 py-4 rounded-[20px] bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none text-sm font-bold transition-all"
                                                    value={newBeneficiary.nom}
                                                    onChange={e => setNewBeneficiary({ ...newBeneficiary, nom: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">Prénom</label>
                                                <input
                                                    type="text"
                                                    placeholder="Ex: Ahmed"
                                                    className="w-full px-6 py-4 rounded-[20px] bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none text-sm font-bold transition-all"
                                                    value={newBeneficiary.prenom}
                                                    onChange={e => setNewBeneficiary({ ...newBeneficiary, prenom: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">Sexe</label>
                                            <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-[22px] gap-1">
                                                {['M', 'F'].map(s => {
                                                    const isLocked = newBeneficiary.relation === 'Conjoint';
                                                    const active = newBeneficiary.sexe === s;
                                                    return (
                                                        <button
                                                            key={s}
                                                            disabled={isLocked}
                                                            onClick={() => !isLocked && setNewBeneficiary({ ...newBeneficiary, sexe: s })}
                                                            className={`flex-1 py-3 px-4 rounded-[18px] text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${active
                                                                    ? 'bg-white dark:bg-slate-700 text-purple-600 shadow-sm border border-slate-200 dark:border-slate-600 scale-[1.02]'
                                                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                                                } ${isLocked ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                                                        >
                                                            <div className={`w-2 h-2 rounded-full ${active ? 'bg-purple-500' : 'bg-slate-300'}`} />
                                                            {s === 'M' ? 'Masculin' : 'Féminin'}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section: Relation & Date */}
                                    <div className="space-y-6 md:col-span-2">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                                <Heart size={16} />
                                            </div>
                                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Relation & Naissance</h4>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-3 relative">
                                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">Relation</label>
                                                <div
                                                    className="w-full px-6 py-4 rounded-[20px] bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus-within:border-purple-500 outline-none text-sm font-bold flex justify-between items-center cursor-pointer select-none transition-all group"
                                                    onClick={() => setIsRelationDropdownOpen(!isRelationDropdownOpen)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-2 h-2 rounded-full ${newBeneficiary.relation ? 'bg-purple-500' : 'bg-slate-300'}`} />
                                                        <span className={newBeneficiary.relation ? "text-slate-900 dark:text-white" : "text-slate-400"}>
                                                            {newBeneficiary.relation === 'Enfant' ? 'Enfant' : (newBeneficiary.relation === 'Conjoint' ? 'Conjoint(e)' : "Sélectionnez...")}
                                                        </span>
                                                    </div>
                                                    <ChevronDown size={18} className={`text-slate-400 group-hover:text-purple-500 transition-transform ${isRelationDropdownOpen ? 'rotate-180' : ''}`} />
                                                </div>

                                                <AnimatePresence>
                                                    {isRelationDropdownOpen && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                            className="absolute bottom-full left-0 w-full mb-3 py-3 bg-white dark:bg-slate-800 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 dark:border-slate-700 z-[60] overflow-hidden"
                                                        >
                                                            {[
                                                                { value: "Enfant", label: "Enfant", icon: "👶" },
                                                                { value: "Conjoint", label: "Conjoint(e)", icon: "💍" },
                                                            ].map((option) => (
                                                                <button
                                                                    key={option.value}
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        let autoSexe = newBeneficiary.sexe;
                                                                        if (option.value === 'Conjoint' && currentUser?.sexe) {
                                                                            autoSexe = currentUser.sexe === 'M' ? 'F' : 'M';
                                                                        }
                                                                        setNewBeneficiary({ ...newBeneficiary, relation: option.value, sexe: autoSexe });
                                                                        setIsRelationDropdownOpen(false);
                                                                    }}
                                                                    className={`w-full px-6 py-4 text-left text-sm font-bold transition-all hover:bg-purple-50 dark:hover:bg-purple-900/10 flex items-center justify-between ${newBeneficiary.relation === option.value ? 'text-purple-600 bg-purple-50 dark:bg-purple-900/10' : 'text-slate-700 dark:text-slate-300'}`}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="text-lg">{option.icon}</span>
                                                                        {option.label}
                                                                    </div>
                                                                    {newBeneficiary.relation === option.value && <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center"><Check size={12} className="text-white" /></div>}
                                                                </button>
                                                            ))}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                {!editingBeneficiaryId && avezConjoint && newBeneficiary.relation === 'Conjoint' && (
                                                    <div className="flex items-center gap-2 mt-2 px-2 text-rose-500">
                                                        <XCircle size={14} />
                                                        <span className="text-[10px] font-black uppercase tracking-tight">Un conjoint est déjà enregistré</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">Date de naissance</label>
                                                <div className="relative group">
                                                    <input
                                                        type="date"
                                                        className="w-full px-6 py-4 rounded-[20px] bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-purple-500 outline-none text-sm font-bold transition-all"
                                                        value={newBeneficiary.ddn}
                                                        onChange={e => setNewBeneficiary({ ...newBeneficiary, ddn: e.target.value })}
                                                    />
                                                    <Calendar className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 pointer-events-none transition-colors" size={18} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section: Éligibilité Enfant */}
                                    <AnimatePresence>
                                        {newBeneficiary.relation === 'Enfant' && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 20 }}
                                                className="space-y-6 md:col-span-2"
                                            >
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                                        <ShieldCheck size={16} />
                                                    </div>
                                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Conditions Particulières</h4>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    {[
                                                        { key: 'handicape', label: 'Handicapé', icon: '♿' },
                                                        { key: 'etudiant', label: 'Étudiant (-26 ans)', icon: '🎓' },
                                                        { key: 'chomage', label: 'Au chômage', icon: '💼' },
                                                        { key: 'celibataire', label: 'Célibataire', icon: '👤' },
                                                    ].map(item => (
                                                        <button
                                                            key={item.key}
                                                            onClick={() => setNewBeneficiary({ ...newBeneficiary, [item.key]: !newBeneficiary[item.key] })}
                                                            className={`p-5 rounded-[24px] border-2 flex items-center gap-4 transition-all ${newBeneficiary[item.key]
                                                                    ? 'bg-purple-600 border-purple-600 text-white shadow-[0_10px_20px_-5px_rgba(124,58,237,0.3)]'
                                                                    : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-purple-200'
                                                                }`}
                                                        >
                                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 ${newBeneficiary[item.key] ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700'
                                                                }`}>
                                                                {item.icon}
                                                            </div>
                                                            <div className="flex-1 text-left">
                                                                <span className="text-xs font-black uppercase tracking-tight block leading-none mb-1">{item.label}</span>
                                                                <span className={`text-[9px] font-bold uppercase tracking-widest opacity-60 ${newBeneficiary[item.key] ? 'text-white' : 'text-slate-400'}`}>
                                                                    {newBeneficiary[item.key] ? 'Activé' : 'Désactivé'}
                                                                </span>
                                                            </div>
                                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${newBeneficiary[item.key] ? 'bg-white border-white' : 'border-slate-200 dark:border-slate-600'
                                                                }`}>
                                                                {newBeneficiary[item.key] && <Check size={12} className="text-purple-600" strokeWidth={4} />}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Section: Justificatif */}
                                    <div className="space-y-6 md:col-span-2">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                                <FileText size={16} />
                                            </div>
                                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Document Justificatif</h4>
                                        </div>

                                        <div className="relative">
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*,.pdf"
                                                onChange={e => setDocumentFile(e.target.files[0])}
                                                className="hidden"
                                            />

                                            {(documentFile || (editingBeneficiaryId && documentPreviewUrl)) ? (
                                                <div className="group relative overflow-hidden p-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-[32px] transition-all hover:bg-white dark:hover:bg-slate-800 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none">
                                                    <div className="flex items-center justify-between relative z-10">
                                                        <div className="flex items-center gap-5 overflow-hidden">
                                                            <div className="w-16 h-16 rounded-[20px] bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 shrink-0">
                                                                {documentFile?.type === 'application/pdf' ? <FileText size={32} /> : <Camera size={32} />}
                                                            </div>
                                                            <div className="overflow-hidden space-y-1">
                                                                <p className="text-sm font-black text-slate-900 dark:text-white truncate">
                                                                    {documentFile ? documentFile.name : "Justificatif déjà enregistré"}
                                                                </p>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-lg">Prêt</span>
                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                                        {(documentFile?.size / 1024 / 1024).toFixed(2)} MB
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                type="button"
                                                                onClick={() => fileInputRef.current?.click()}
                                                                className="p-4 rounded-2xl bg-white dark:bg-slate-700 text-slate-400 hover:text-purple-600 hover:shadow-lg transition-all active:scale-90 border border-slate-100 dark:border-slate-600"
                                                            >
                                                                <Edit2 size={20} />
                                                            </button>
                                                            {documentFile && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setDocumentFile(null)}
                                                                    className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/10 text-rose-500 hover:bg-rose-500 hover:text-white hover:shadow-lg transition-all active:scale-90"
                                                                >
                                                                    <X size={20} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-600/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
                                                </div>
                                            ) : (
                                                <div
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="group relative w-full py-16 rounded-[40px] border-4 border-dashed border-slate-100 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-500 bg-slate-50 dark:bg-slate-800/30 transition-all cursor-pointer flex flex-col items-center gap-6 overflow-hidden"
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-indigo-500/0 group-hover:from-purple-500/5 group-hover:to-indigo-500/5 transition-colors duration-500" />

                                                    <div className="w-20 h-20 rounded-[28px] bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-purple-600 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-xl shadow-slate-200/50 dark:shadow-none relative z-10 border border-slate-50 dark:border-slate-700">
                                                        <UploadCloud size={36} strokeWidth={1.5} />
                                                    </div>

                                                    <div className="text-center relative z-10 space-y-2">
                                                        <p className="text-lg font-black text-slate-700 dark:text-slate-200 group-hover:text-purple-600 transition-colors">Déposez votre justificatif ici</p>
                                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-8">
                                                            Fiche d'état civil, carte d'étudiant ou certificat médical (JPG, PNG, PDF)
                                                        </p>
                                                    </div>

                                                    <div className="px-6 py-2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 group-hover:bg-purple-600 group-hover:text-white text-[10px] font-black uppercase tracking-widest transition-all relative z-10">
                                                        Parcourir les fichiers
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        onClick={handleAddBeneficiary}
                                        disabled={isSaving}
                                        className="w-full relative group overflow-hidden py-6 rounded-[32px] bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-sm uppercase tracking-[0.2em] shadow-[0_20px_40px_-10px_rgba(124,58,237,0.4)] hover:shadow-[0_25px_50px_-12px_rgba(124,58,237,0.5)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale"
                                    >
                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                        <div className="relative flex items-center justify-center gap-3">
                                            {isSaving ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    <span>Traitement en cours...</span>
                                                </>
                                            ) : (
                                                <>
                                                    {editingBeneficiaryId ? <CheckCircle2 size={20} /> : <PlusCircle size={20} />}
                                                    <span>{editingBeneficiaryId ? "Mettre à jour le profil" : "Finaliser l'inscription"}</span>
                                                </>
                                            )}
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Preview Section (Sticky on the right for large screens) */}
                            {documentPreviewUrl && (
                                <div className="hidden lg:flex w-[450px] bg-slate-50 dark:bg-slate-950/50 p-10 flex-col gap-8 border-l border-slate-100 dark:border-white/5 relative">
                                    <div className="absolute top-0 right-0 p-10 opacity-5">
                                        <FileText size={120} />
                                    </div>

                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-8">
                                            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-purple-600 shadow-sm border border-slate-100 dark:border-slate-700">
                                                <Eye size={20} />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Aperçu en direct</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Vérification de lisibilité</p>
                                            </div>
                                        </div>

                                        <div className="w-full aspect-[3/4] rounded-[40px] overflow-hidden border-8 border-white dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl relative group">
                                            {documentPreviewUrl.toLowerCase().includes('pdf') || (documentFile && documentFile.type === 'application/pdf') ? (
                                                <iframe src={documentPreviewUrl} className="w-full h-full border-none" title="Preview" />
                                            ) : (
                                                <img src={documentPreviewUrl} alt="Preview" className="w-full h-full object-contain" />
                                            )}

                                            <div className="absolute inset-0 bg-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </AnimatePresence>,
        document.body
    );
};

export default AddBeneficiaryModal;
