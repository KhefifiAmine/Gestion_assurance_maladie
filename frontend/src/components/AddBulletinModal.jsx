import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    FileText,
    Calendar,
    User,
    DollarSign,
    Activity,
    Upload,
    ChevronRight,
    CheckCircle2,
    Info,
    Hash
} from 'lucide-react';
import { createBulletin, analyzeBulletinIA } from '../services/bulletinService';
import { useToast } from '../context/ToastContext';

const AddBulletinModal = ({ isOpen, onClose, onSubmit }) => {
    const { showToast } = useToast();
    const [step, setStep] = useState(1);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [formData, setFormData] = useState({
        numero_bulletin: '',
        code_cnam: '',
        nom_prenom_malade: '',
        qualite_malade: 'Lui-même',
        type_dossier: 'Consultation',
        date_depot: new Date().toISOString().split('T')[0],
        montant_total: '',
        matricule_adherent: '',
        notes: '',
        actes: []
    });

    const careTypes = [
        { id: 'Consultation', label: 'Consultation Médicale', icon: <User size={18} /> },
        { id: 'Pharmacie', label: 'Pharmacie / Médicaments', icon: <Activity size={18} /> },
        { id: 'Optique', label: 'Optique / Lunettes', icon: <ChevronRight size={18} /> },
        { id: 'Dentaire', label: 'Soins Dentaires', icon: <Activity size={18} /> },
        { id: 'Analyse', label: 'Analyses Médicales', icon: <FileText size={18} /> }
    ];

    const handleNext = () => setStep(step + 1);
    const handlePrev = () => setStep(step - 1);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setIsAnalyzing(true);
            showToast("Analyse du document par l'IA en cours...", "info");
            
            const aiData = await analyzeBulletinIA(file);
            
            setFormData(prev => ({
                ...prev,
                numero_bulletin: aiData.numero_bulletin || prev.numero_bulletin,
                code_cnam: aiData.code_cnam || prev.code_cnam,
                nom_prenom_malade: aiData.nom_prenom_malade || prev.nom_prenom_malade,
                qualite_malade: aiData.qualite_malade || prev.qualite_malade,
                montant_total: aiData.montant_total || prev.montant_total,
                date_depot: aiData.date_depot || prev.date_depot,
                type_dossier: aiData.type_dossier || prev.type_dossier,
                matricule_adherent: aiData.matricule_adherent || prev.matricule_adherent
            }));

            showToast(`Analyse terminée ! Score de confiance : ${aiData.confiance_score}%`, "success");
            setStep(3); // Aller directement à l'étape de vérification
        } catch (error) {
            console.error(error);
            showToast(error.message || "Erreur lors de l'analyse du fichier", "error");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createBulletin(formData);
            onSubmit(formData);
            setStep(1);
            onClose();
        } catch (error) {
            console.error(error);
            // On pourrait afficher un toast ici si le onSubmit ne le fait pas déjà
        }
    };

    const backdropVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 }
    };

    const modalVariants = {
        hidden: { opacity: 0, scale: 0.9, y: 20 },
        visible: { opacity: 1, scale: 1, y: 0 }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={backdropVariants}
                    onClick={onClose}
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
                />

                <motion.div
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={modalVariants}
                    className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-700 to-indigo-800 p-8 text-white relative">
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all"
                        >
                            <X size={20} />
                        </button>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                <FileText size={32} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black tracking-tight">Nouveau Bulletin de Soin</h2>
                                <p className="text-purple-100 text-sm font-medium">
                                    {isAnalyzing ? "Analyse IA en cours..." : `Étape ${step} sur 3 : ${step === 1 ? 'Informations générales' : step === 2 ? 'Détails et justificatifs' : 'Vérification finale'}`}
                                </p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8">
                        {step === 1 ? (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Numero Bulletin */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                            <Hash size={16} className="text-purple-500" /> Numéro du Bulletin
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Ex: BS-2024-001"
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium dark:text-white"
                                            value={formData.numero_bulletin}
                                            onChange={(e) => setFormData({ ...formData, numero_bulletin: e.target.value })}
                                        />
                                    </div>

                                    {/* Code CNAM */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                            <Hash size={16} className="text-purple-500" /> Code CNAM
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Code CNAM (Optionnel)"
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all font-bold dark:text-white"
                                            value={formData.code_cnam}
                                            onChange={(e) => setFormData({ ...formData, code_cnam: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Patient Name */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                            <User size={16} className="text-purple-500" /> Nom du Patient
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Ex: Ahmed Mansour"
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium dark:text-white"
                                            value={formData.nom_prenom_malade}
                                            onChange={(e) => setFormData({ ...formData, nom_prenom_malade: e.target.value })}
                                        />
                                    </div>

                                    {/* Qualité Malade */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Qualité du Malade</label>
                                        <select
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium dark:text-white"
                                            value={formData.qualite_malade}
                                            onChange={(e) => setFormData({ ...formData, qualite_malade: e.target.value })}
                                        >
                                            <option value="Lui-même">Lui-même</option>
                                            <option value="Conjoint">Conjoint</option>
                                            <option value="Enfant">Enfant</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Matricule Adhérent */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                            <Hash size={16} className="text-purple-500" /> Matricule Adhérent
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Ex: 12345678"
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium dark:text-white"
                                            value={formData.matricule_adherent}
                                            onChange={(e) => setFormData({ ...formData, matricule_adherent: e.target.value })}
                                        />
                                    </div>

                                    {/* Care Date */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                            <Calendar size={16} className="text-purple-500" /> Date de dépôt
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium dark:text-white"
                                            value={formData.date_depot}
                                            onChange={(e) => setFormData({ ...formData, date_depot: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Care Type */}
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Type de soin</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {careTypes.map((type) => (
                                            <button
                                                key={type.id}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, type_dossier: type.id })}
                                                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 ${formData.type_dossier === type.id
                                                    ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-500 text-purple-600 dark:text-purple-400 shadow-md'
                                                    : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-500 hover:border-slate-200 dark:hover:border-slate-700'
                                                    }`}
                                            >
                                                {type.icon}
                                                <span className="text-[10px] font-black uppercase tracking-widest">{type.id}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={handleNext}
                                        disabled={!formData.nom_prenom_malade || !formData.numero_bulletin}
                                        className="bg-purple-600 hover:bg-purple-700 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all shadow-lg shadow-purple-500/20 active:scale-95 disabled:opacity-50 disabled:scale-100"
                                    >
                                        Suivant <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        ) : step === 2 ? (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                {/* Total Expense */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <DollarSign size={16} className="text-purple-500" /> Montant total dépensé
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.100"
                                            required
                                            placeholder="0.000"
                                            className="w-full pl-4 pr-16 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-black text-2xl dark:text-white"
                                            value={formData.montant_total}
                                            onChange={(e) => setFormData({ ...formData, montant_total: e.target.value })}
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-400">TND</div>
                                    </div>
                                </div>

                                {/* File Upload Mock */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <Upload size={16} className="text-purple-500" /> Justificatifs (Ordonnances, factures...)
                                    </label>
                                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer group relative">
                                        <input 
                                            type="file" 
                                            className="absolute inset-0 opacity-0 cursor-pointer" 
                                            onChange={handleFileUpload}
                                            disabled={isAnalyzing}
                                            accept=".pdf,image/*"
                                        />
                                        <div className="p-4 bg-white dark:bg-slate-700 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                                            <Upload className={`${isAnalyzing ? 'animate-bounce text-purple-500' : 'text-purple-500'}`} size={24} />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                                {isAnalyzing ? "L'IA analyse votre document..." : "Cliquez ou glissez votre bulletin (IA)"}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-1">PNG, JPG ou PDF (Remplissage automatique)</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Alert Info */}
                                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-2xl flex items-start gap-3 border border-purple-100 dark:border-purple-800">
                                    <Info className="text-purple-500 flex-shrink-0 mt-0.5" size={18} />
                                    <p className="text-xs text-purple-700 dark:text-purple-300 font-medium leading-relaxed">
                                        Assurez-vous que tous les documents sont bien lisibles pour un traitement rapide de votre demande de remboursement.
                                    </p>
                                </div>

                                <div className="pt-4 flex items-center justify-between gap-4">
                                    <button
                                        type="button"
                                        onClick={handlePrev}
                                        className="px-6 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-purple-600 transition-all"
                                    >
                                        Retour
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleNext}
                                        disabled={!formData.montant_total}
                                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-lg shadow-purple-500/20 active:scale-95 disabled:opacity-50"
                                    >
                                        Vérifier les données <ChevronRight size={22} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-3xl border border-green-100 dark:border-green-800">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-green-500 rounded-lg text-white">
                                            <CheckCircle2 size={20} />
                                        </div>
                                        <h3 className="text-lg font-bold text-green-900 dark:text-green-100">Vérification de l'analyse</h3>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded-xl border border-green-50 dark:border-green-900/30">
                                            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Bulletin</p>
                                            <p className="font-bold dark:text-white">{formData.numero_bulletin || 'Non détecté'}</p>
                                        </div>
                                        <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded-xl border border-green-50 dark:border-green-900/30">
                                            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Montant</p>
                                            <p className="font-bold text-purple-600 dark:text-purple-400 text-lg">{formData.montant_total} TND</p>
                                        </div>
                                        <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded-xl border border-green-50 dark:border-green-900/30">
                                            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Patient</p>
                                            <p className="font-bold dark:text-white">{formData.nom_prenom_malade}</p>
                                        </div>
                                        <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded-xl border border-green-50 dark:border-green-900/30">
                                            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Matricule</p>
                                            <p className="font-bold dark:text-white">{formData.matricule_adherent}</p>
                                        </div>
                                        <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded-xl border border-green-50 dark:border-green-900/30">
                                            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Date</p>
                                            <p className="font-bold dark:text-white">{formData.date_depot}</p>
                                        </div>
                                        <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded-xl border border-green-50 dark:border-green-900/30">
                                            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Type de soin</p>
                                            <p className="font-bold dark:text-white">{formData.type_dossier}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4 flex items-center gap-2 text-xs text-green-700 dark:text-green-400 font-medium">
                                        <Info size={14} />
                                        <span>Vous pouvez revenir en arrière pour corriger si besoin.</span>
                                    </div>
                                </div>

                                <div className="pt-4 flex items-center justify-between gap-4">
                                    <button
                                        type="button"
                                        onClick={handlePrev}
                                        className="px-6 py-3.5 text-slate-500 font-bold hover:text-slate-700 dark:hover:text-slate-300 transition-all"
                                    >
                                        Retour
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 hover:shadow-xl shadow-green-200 dark:shadow-none transition-all hover:scale-[1.02] active:scale-95"
                                    >
                                        <CheckCircle2 size={22} />
                                        Confirmer et Envoyer
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default AddBulletinModal;
