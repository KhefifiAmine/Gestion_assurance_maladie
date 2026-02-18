
import React, { useState } from 'react';
import './Auth.css';
import tunisieTelecomImg from '../assets/Tunisie_Telecom.jpg';

const SuccessModal = ({ message, onClose }) => (
  <div className="success-overlay">
    <div className="success-modal">
      <div className="success-icon">✓</div>
      <h3>Opération réussie</h3>
      <p>{message}</p>
      <button className="close-modal-btn" onClick={onClose}>Fermer</button>
    </div>
  </div>
);

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // Liste des domaines autorisés strictement selon votre demande
  const commonDomains = ['gmail.com', 'yahoo.com', 'yahoo.fr', 'outlook.com', 'hotmail.com'];
  
  if (!email) return "Veuillez entrer votre adresse email.";
  if (!email.includes('@')) return "L'adresse email doit contenir un '@'.";
  if (!re.test(email)) return "Format d'email invalide (ex: utilisateur@exemple.com).";
  
  const domain = email.split('@')[1].toLowerCase();
  
  // Détection de fautes de frappe spécifiques
  if (!commonDomains.includes(domain)) {
    if ( domain.includes('gamil') ) {
      return `Le domaine "@${domain}" semble être une erreur. Vouliez-vous dire "@gmail.com" ?`;
    }
    if (domain.includes('yaho')) {
      return `Le domaine "@${domain}" semble être une erreur. Vouliez-vous dire "@yahoo.fr" ?`;
    }
    return `Le domaine "@${domain}" n'est pas autorisé. Veuillez utiliser une adresse professionnelle ou un fournisseur reconnu (Gmail, Yahoo, Outlook, etc.).`;
  }
  
  return "";
};

const LoginForm = ({ onToggle, onShowSuccess }) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const error = validateEmail(email);
    if (error) {
      setEmailError(error);
      return;
    }
    setEmailError('');
    onShowSuccess("Bienvenue ! Votre connexion au portail de Gestion d'Assurance Maladie a été établie avec succès.");
  };

  return (
    <div className="auth-container">
      <div className="auth-sidebar">
        <div className="logo-container">
          <div className="logo-circle">
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#00B2FF' }}>TT</span>
          </div>
          <h1 className="brand-name">Tunisie Telecom</h1>
        </div>
        <div className="illustration-container">
          <img 
            src={tunisieTelecomImg} 
            alt="Tunisie Telecom" 
            className="illustration-img"
          />
        </div>
      </div>
      <div className="auth-content">
        <div className="auth-header">
          <h2>Connexion</h2>
          <p>Connectez-vous à votre compte</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Emaill :</label>
            <input 
              type="text" 
              placeholder="Entrer votre Email" 
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError('');
              }}
              className={emailError ? 'invalid' : ''}
              required 
            />
            {emailError && <span className="error-message">{emailError}</span>}
          </div>
          <div className="form-group">
            <label>Mot de passe :</label>
            <input type="password" placeholder="Entrer votre Mot de passe" required />
          </div>
          <button type="submit" className="submit-btn">Se connecter</button>
        </form>
        <div className="auth-footer">
          <span>Vous n'avez un compte? </span>
          <span className="auth-link" onClick={onToggle}>S'inscrire</span>
        </div>
      </div>
    </div>
  );
};

const RegisterForm = ({ onToggle, onShowSuccess }) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const error = validateEmail(email);
    if (error) {
      setEmailError(error);
      return;
    }
    setEmailError('');
    onShowSuccess("Votre demande d'inscription a été enregistrée avec succès. Nos services vérifieront vos informations et vous recevrez une confirmation par mail d'ici 24h.");
  };

  return (
    <div className="auth-container" style={{ width: '1000px' }}>
      <div className="auth-content" style={{ flex: 2 }}>
        <div className="auth-header" style={{ textAlign: 'left', paddingLeft: '20px' }}>
          <h2 style={{ fontSize: '32px' }}>Créer votre compte</h2>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '0 20px' }}>
          <div className="form-row">
            <div className="form-group">
              <label>Nom :</label>
              <input type="text" placeholder="Entrer votre Nom" required />
            </div>
            <div className="form-group">
              <label>Matricule :</label>
              <input type="text" placeholder="Entrer votre Matricule" required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Prénom :</label>
              <input type="text" placeholder="Entrer votre Prénom" required />
            </div>
            <div className="form-group">
              <label>Téléphone :</label>
              <input type="text" placeholder="Entrer votre Matricule" required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Date de naissance :</label>
              <input type="date" placeholder="JJ/MM/AAAA" required />
            </div>
            <div className="form-group">
              <label>Adresse :</label>
              <input type="text" placeholder="Entrer votre Adresse" required />
            </div>
          </div>
          <div className="form-group">
            <label>Email :</label>
            <input 
              type="text" 
              placeholder="Entrer votre Email" 
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError('');
              }}
              className={emailError ? 'invalid' : ''}
              required 
            />
            {emailError && <span className="error-message">{emailError}</span>}
          </div>
          
          

          <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
            <button type="submit" className="submit-btn" style={{ width: '250px' }}>Demander</button>
            <span className="auth-link" style={{ fontSize: '20px' }} onClick={onToggle}>Login</span>
          </div>
        </form>
      </div>
      <div className="auth-sidebar">
        <div className="logo-container">
          <div className="logo-circle">
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#00B2FF' }}>TT</span>
          </div>
          <h1 className="brand-name">Tunisie Telecom</h1>
        </div>
        <div className="illustration-container">
          <img 
            src={tunisieTelecomImg} 
            alt="Register illustration" 
            className="illustration-img"
          />
        </div>
      </div>
    </div>
  );
};

const AuthContainer = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [successInfo, setSuccessInfo] = useState({ show: false, message: '' });

  const handleShowSuccess = (msg) => {
    setSuccessInfo({ show: true, message: msg });
  };

  const handleCloseSuccess = () => {
    setSuccessInfo({ show: false, message: '' });
  };

  return (
    <div style={{ padding: '20px' }}>
      {isLogin ? (
        <LoginForm onToggle={() => setIsLogin(false)} onShowSuccess={handleShowSuccess} />
      ) : (
        <RegisterForm onToggle={() => setIsLogin(true)} onShowSuccess={handleShowSuccess} />
      )}

      {successInfo.show && (
        <SuccessModal 
          message={successInfo.message} 
          onClose={handleCloseSuccess} 
        />
      )}
    </div>
  );
};

export default AuthContainer;
