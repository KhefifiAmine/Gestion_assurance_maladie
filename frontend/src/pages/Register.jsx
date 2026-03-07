import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  User,
  Mail,
  Lock,
  Phone,
  Calendar,
  MapPin,
  Hash,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import ttLogo from '../assets/Tunisie_Telecom.jpg';

// Composant InputField pour une cohérence parfaite et aucun problème de focus
const InputField = ({ label, name, placeholder, icon: Icon, type = "text", error, value, onChange, onBlur, showToggle, onToggle, isVisible, max }) => (
  <div className="space-y-1 w-full">
    <div className="flex justify-between items-center ml-1">
      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</label>
      {error && <span className="text-red-500 text-[10px] font-bold">{error}</span>}
    </div>
    <div className="relative group">
      <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none group-focus-within:text-blue-500 ${error ? 'text-red-400' : 'text-slate-300'}`}>
        <Icon size={16} />
      </div>
      <input
        type="text"
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        max={max}
        className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-2 rounded-xl transition-all outline-none text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-300/60 appearance-none ${error ? "border-red-400 focus:border-red-400" : "border-slate-100 dark:border-slate-800 focus:border-blue-500"
          } ${type === 'date' ? 'cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/50' : ''}`}
        required
      />
      {showToggle && (
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-500 transition-colors"
        >
          {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      )}
    </div>
  </div>
);

const Register = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    matricule: '',
    telephone: '',
    ddn: '',
    adresse: '',
    email: ''
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Date maximale pour la naissance (aujourd'hui)
  const today = new Date().toISOString().split('T')[0];


  const validateField = (name, value) => {
    let error = "";
    switch (name) {
      case 'email':
        if (!/^[a-zA-Z0-9._%+-]+@(tunisietelecom\.tn|gmail\.com)$/.test(value)) error = "Email TT ou Gmail requis";
        break;
      case 'telephone':
        if (!/^\d{8}$/.test(value)) error = "8 chiffres";
        break;
      case 'ddn':
        if (!value) error = "Requis";
        break;
      default:
        if (!value) error = "Requis";
    }
    setErrors(prev => ({ ...prev, [name]: error }));
    return error === "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) validateField(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allValid = Object.keys(formData).every(key => validateField(key, formData[key]));
    if (!allValid || !acceptTerms) {
      showToast(allValid ? "Acceptez les conditions" : "Corrigez les erreurs", "error");
      return;
    }

    try {
      setIsLoading(true);
      await registerUser(formData);
      showToast("Succès ! Redirection...", "success");
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-5 md:p-8 rounded-[2rem] shadow-2xl border border-slate-50 dark:border-slate-700">
      <style>{`
        input[type="date"]::-webkit-calendar-picker-indicator {
          background: transparent;
          bottom: 0;
          color: transparent;
          cursor: pointer;
          height: auto;
          left: 0;
          position: absolute;
          right: 0;
          top: 0;
          width: auto;
        }
      `}</style>
      <div className="text-center mb-5">
        <img src={ttLogo} alt="TT" className="h-10 mx-auto mb-2 object-contain" />
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Créer un compte</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <InputField label="Nom" name="nom" placeholder="Nom" icon={User} error={errors.nom} value={formData.nom} onChange={handleChange} onBlur={() => validateField('nom', formData.nom)} />
          <InputField label="Prénom" name="prenom" placeholder="Prénom" icon={User} error={errors.prenom} value={formData.prenom} onChange={handleChange} onBlur={() => validateField('prenom', formData.prenom)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <InputField label="Matricule" name="matricule" placeholder="N°" icon={Hash} error={errors.matricule} value={formData.matricule} onChange={handleChange} onBlur={() => validateField('matricule', formData.matricule)} />
          <InputField label="Téléphone" name="telephone" placeholder="Tel" icon={Phone} error={errors.telephone} value={formData.telephone} onChange={handleChange} onBlur={() => validateField('telephone', formData.telephone)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Date de Naissance"
            name="ddn"
            type="date"
            icon={Calendar}
            max={today}
            error={errors.ddn}
            value={formData.ddn}
            onChange={handleChange}
            onBlur={() => validateField('ddn', formData.ddn)}
          />
          <InputField label="Ville / Adresse" name="adresse" placeholder="Ville" icon={MapPin} error={errors.adresse} value={formData.adresse} onChange={handleChange} onBlur={() => validateField('adresse', formData.adresse)} />
        </div>

        <InputField label="Email" name="email" placeholder="email@gmail.com" icon={Mail} error={errors.email} value={formData.email} onChange={handleChange} onBlur={() => validateField('email', formData.email)} />


        <label className="flex items-center gap-3 cursor-pointer group px-1">
          <input type="checkbox" checked={acceptTerms} onChange={() => setAcceptTerms(!acceptTerms)} className="w-4 h-4 rounded border-slate-200 text-blue-600 focus:ring-blue-500" />
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">J'accepte les conditions d'utilisation</span>
        </label>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-[#005aab] hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2 group"
        >
          {isLoading ? <Loader2 className="animate-spin" size={18} /> : <span className="uppercase tracking-widest text-xs">Demander l'accès</span>}
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>

        <p className="text-center text-[10px] font-bold text-slate-400">
          DÉJÀ UN COMPTE ? <Link to="/login" className="text-blue-600 hover:underline">SE CONNECTER</Link>
        </p>
      </form>
    </div>
  );
};

export default Register;
