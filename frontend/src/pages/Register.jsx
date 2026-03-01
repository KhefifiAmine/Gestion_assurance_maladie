import React, { useState } from 'react';
import './Auth.css';
import tunisieTelecomImg from '../assets/Tunisie_Telecom.jpg';
import { validateEmail, validatePassword, validatePhone, validateText, validateDate, SuccessModal } from '../utils/authUtils';
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from '../services/api';

const Register = ({ onGoToLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nom: '', matricule: '', prenom: '', telephone: '', ddn: '', adresse: '', email: '', password: '', confirmPassword: ''
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

    const passErr = validatePassword(formData.password);
    if (passErr) newErrors.password = passErr;

    if (formData.password && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas.';
    }

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
      {/* Formulaire d'inscription */}
      <div className="auth-content" style={{ flex: 2 }}>
        <div className="auth-header" style={{ textAlign: 'left', paddingLeft: '20px' }}>
          <h2 style={{ fontSize: '32px' }}>Créer votre compte</h2>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '0 20px' }}>
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
              <input type="text" name="telephone" placeholder="Entrer Téléphone (8 chiffres)" value={formData.telephone} onChange={handleChange} className={errors.telephone ? 'invalid' : ''} required />
              {errors.telephone && <span className="error-message">{errors.telephone}</span>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Date de naissance :</label>
              <input type="date" name="ddn" value={formData.ddn} onChange={handleChange} className={errors.ddn ? 'invalid' : ''} required />
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
          <div className="form-row">
            <div className="form-group">
              <label>Mot de passe :</label>
              <input type="password" name="password" placeholder="Mot de passe" value={formData.password} onChange={handleChange} className={errors.password ? 'invalid' : ''} required />
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>
            <div className="form-group">
              <label>Confirmer Mot de passe :</label>
              <input type="password" name="confirmPassword" placeholder="Confirmer Mot de passe" value={formData.confirmPassword} onChange={handleChange} className={errors.confirmPassword ? 'invalid' : ''} required />
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '40px', marginTop: '20px' }}>
            <button type="submit" className="submit-btn" style={{ width: '250px' }} disabled={isLoading}>
              {isLoading ? 'Envoi...' : 'Demander'}
            </button>
            <Link to="/login">
              <span className="auth-link" style={{ fontSize: '20px' }}>
                Connexion
              </span>
            </Link>
          </div>
        </form>
      </div>

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
