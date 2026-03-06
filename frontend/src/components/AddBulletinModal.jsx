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
    Info
} from 'lucide-react';

const AddBulletinModal = ({ isOpen, onClose, onSubmit }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        patientName: '',
        careType: 'Consultation',
        careDate: new Date().toISOString().split('T')[0],
        totalExpense: '',
        notes: '',
        files: []
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

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
        setStep(1);
        onClose();
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
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white relative">
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
                                <p className="text-blue-100 text-sm font-medium">Étape {step} sur 2 : {step === 1 ? 'Informations générales' : 'Détails et justificatifs'}</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8">
                        {step === 1 ? (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Patient Name */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                            <User size={16} className="text-blue-500" /> Nom du Patient
                                        </label>
                                        <input 
                                            type="text"
                                            required
                                            placeholder="Ex: Ahmed Mansour"
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium dark:text-white"
                                            value={formData.patientName}
                                            onChange={(e) => setFormData({...formData, patientName: e.target.value})}
                                        />
                                    </div>

                                    {/* Care Date */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                            <Calendar size={16} className="text-blue-500" /> Date de l'acte
                                        </label>
                                        <input 
                                            type="date"
                                            required
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium dark:text-white"
                                            value={formData.careDate}
                                            onChange={(e) => setFormData({...formData, careDate: e.target.value})}
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
                                                onClick={() => setFormData({...formData, careType: type.id})}
                                                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 ${
                                                    formData.careType === type.id
                                                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-600 dark:text-blue-400 shadow-md'
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
                                        disabled={!formData.patientName}
                                        className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
                                    >
                                        Suivant <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                {/* Total Expense */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <DollarSign size={16} className="text-blue-500" /> Montant total dépensé
                                    </label>
                                    <div className="relative">
                                        <input 
                                            type="number"
                                            step="0.100"
                                            required
                                            placeholder="0.000"
                                            className="w-full pl-4 pr-16 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-black text-2xl dark:text-white"
                                            value={formData.totalExpense}
                                            onChange={(e) => setFormData({...formData, totalExpense: e.target.value})}
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-400">TND</div>
                                    </div>
                                </div>

                                {/* File Upload Mock */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <Upload size={16} className="text-blue-500" /> Justificatifs (Ordonnances, factures...)
                                    </label>
                                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer group">
                                        <div className="p-4 bg-white dark:bg-slate-700 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                                            <Upload className="text-blue-500" size={24} />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Cliquez ou glissez vos fichiers ici</p>
                                            <p className="text-xs text-slate-400 mt-1">PNG, JPG ou PDF (Max 5Mo)</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Alert Info */}
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl flex items-start gap-3 border border-blue-100 dark:border-blue-800">
                                    <Info className="text-blue-500 flex-shrink-0 mt-0.5" size={18} />
                                    <p className="text-xs text-blue-700 dark:text-blue-300 font-medium leading-relaxed">
                                        Assurez-vous que tous les documents sont bien lisibles pour un traitement rapide de votre demande de remboursement.
                                    </p>
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
                                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 hover:shadow-xl shadow-blue-200 dark:shadow-none transition-all hover:scale-[1.02] active:scale-95"
                                    >
                                        <CheckCircle2 size={22} />
                                        Envoyer la demande
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
