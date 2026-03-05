import React, { useState } from 'react';
import './Auth.css';
import { validateEmail, validatePhone, validateText, validateDate, SuccessModal } from '../utils/authUtils';
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun } from 'lucide-react';

const Register = ({ onGoToLogin }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [formData, setFormData] = useState({
    nom: '', matricule: '', prenom: '', telephone: '', ddn: '', adresse: '', email: ''
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successInfo, setSuccessInfo] = useState({ show: false, message: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    const newErrors = {};

    const nomErr = validateText(formData.nom, 'Nom');
    if (nomErr) newErrors.nom = nomErr;

    const matriculeErr = validateText(formData.matricule, 'Matricule');
    if (matriculeErr) newErrors.matricule = matriculeErr;

    const prenomErr = validateText(formData.prenom, 'Prénom');
    if (prenomErr) newErrors.prenom = prenomErr;

    const telErr = validatePhone(formData.telephone);
    if (telErr) newErrors.telephone = telErr;

    const ddnErr = validateDate(formData.ddn);
    if (ddnErr) newErrors.ddn = ddnErr;

    const adresseErr = validateText(formData.adresse, 'Adresse');
    if (adresseErr) newErrors.adresse = adresseErr;

    const emailErr = validateEmail(formData.email);
    if (emailErr) newErrors.email = emailErr;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsLoading(true);
      await registerUser(formData);
      setSuccessInfo({
        show: true,
        message: "Votre demande d'inscription a été enregistrée avec succès. Nos services vérifieront vos informations et vous recevrez une confirmation par mail d'ici 24h.",
      });
    } catch (err) {
      setApiError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="auth-header" style={{ textAlign: 'left', position: 'relative' }}>
        <button
          onClick={toggleTheme}
          style={{
            position: 'absolute',
            top: '0px',
            right: '0px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '5px',
            color: theme === 'dark' ? '#facc15' : '#475569'
          }}
          type="button"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <h2>Créer votre compte</h2>
      </div>
      <form onSubmit={handleSubmit}>
        {apiError && <div className="api-error-banner">{apiError}</div>}
        <div className="form-row">
          <div className="form-group">
            <label>Nom :</label>
            <input type="text" name="nom" placeholder="Entrer votre Nom" value={formData.nom} onChange={handleChange} className={errors.nom ? 'invalid' : ''} required />
            {errors.nom && <span className="error-message">{errors.nom}</span>}
          </div>
          <div className="form-group">
            <label>Matricule :</label>
            <input type="text" name="matricule" placeholder="Entrer votre Matricule" value={formData.matricule} onChange={handleChange} className={errors.matricule ? 'invalid' : ''} required />
            {errors.matricule && <span className="error-message">{errors.matricule}</span>}
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Prénom :</label>
            <input type="text" name="prenom" placeholder="Entrer votre Prénom" value={formData.prenom} onChange={handleChange} className={errors.prenom ? 'invalid' : ''} required />
            {errors.prenom && <span className="error-message">{errors.prenom}</span>}
          </div>
          <div className="form-group">
            <label>Téléphone :</label>
            <input type="text" name="telephone" placeholder="Entrer votre Matricule" value={formData.telephone} onChange={handleChange} className={errors.telephone ? 'invalid' : ''} required />
            {errors.telephone && <span className="error-message">{errors.telephone}</span>}
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Date de naissance :</label>
            <input type="text" name="ddn" placeholder="JJ/MM/AAAA" value={formData.ddn} onChange={handleChange} className={errors.ddn ? 'invalid' : ''} required />
            {errors.ddn && <span className="error-message">{errors.ddn}</span>}
          </div>
          <div className="form-group">
            <label>Adresse :</label>
            <input type="text" name="adresse" placeholder="Entrer votre Adresse" value={formData.adresse} onChange={handleChange} className={errors.adresse ? 'invalid' : ''} required />
            {errors.adresse && <span className="error-message">{errors.adresse}</span>}
          </div>
        </div>
        <div className="form-group">
          <label>Email :</label>
          <input
            type="text"
            name="email"
            placeholder="Entrer votre Email"
            value={formData.email}
            onChange={handleChange}
            className={errors.email ? 'invalid' : ''}
            required
          />
          {errors.email && <span className="error-message">{errors.email}</span>}
        </div>

        <div className="captcha-placeholder">
          <div className="captcha-left">
            <input type="checkbox" />
            <span>Je ne suis pas un robot</span>
          </div>
          <div className="captcha-right">
            <img src="https://www.gstatic.com/recaptcha/api2/logo_48.png" alt="reCAPTCHA" />
            <span>reCAPTCHA<br />Confidentialité - Conditions</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '30px', marginTop: '10px' }}>
          <button type="submit" className="submit-btn" style={{ width: '200px', margin: '0' }} disabled={isLoading}>
            {isLoading ? 'Envoi...' : 'Demander'}
          </button>
          <Link to="/login" style={{ textDecoration: 'underline' }}>
            <span className="auth-link" style={{ fontSize: '20px' }}>Login</span>
          </Link>
        </div>
      </form>

      {successInfo.show && (
        <SuccessModal
          message={successInfo.message}
          onClose={() => { setSuccessInfo({ show: false, message: '' }); navigate('/login'); }}
        />
      )}
    </>
  );
};

export default Register;
