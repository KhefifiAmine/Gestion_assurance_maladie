// Validation de l'adresse email
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const commonDomains = ['gmail.com', 'yahoo.com', 'yahoo.fr', 'outlook.com', 'hotmail.com'];

  if (!email) return 'Veuillez entrer votre adresse email.';
  if (!email.includes('@')) return "L'adresse email doit contenir un '@'.";
  if (!re.test(email)) return "Format d'email invalide (ex: utilisateur@exemple.com).";

  const domain = email.split('@')[1].toLowerCase();

  if (!commonDomains.includes(domain)) {
    if (domain.includes('gamil')) {
      return `Le domaine "@${domain}" semble être une erreur. Vouliez-vous dire "@gmail.com" ?`;
    }
    if (domain.includes('yaho')) {
      return `Le domaine "@${domain}" semble être une erreur. Vouliez-vous dire "@yahoo.fr" ?`;
    }
    return `Le domaine "@${domain}" n'est pas autorisé. Veuillez utiliser Gmail, Yahoo, Outlook, etc.`;
  }

  return '';
};

// Validation du mot de passe
export const validatePassword = (password) => {
  if (!password) return 'Veuillez entrer votre mot de passe.';
  if (password.length < 6) return 'Le mot de passe doit contenir au moins 6 caractères.';
  return '';
};

// Validation du téléphone
export const validatePhone = (phone) => {
  const re = /^[0-9]{8}$/;
  if (!phone) return 'Veuillez entrer votre numéro de téléphone.';
  if (!re.test(phone)) return 'Le numéro de téléphone doit contenir 8 chiffres.';
  return '';
};

// Validation du texte générique (nom, prénom, etc.)
export const validateText = (text, fieldName) => {
  if (!text || text.trim() === '') return `Veuillez entrer votre ${fieldName}.`;
  if (text.trim().length < 2) return `Le champ ${fieldName} doit contenir au moins 2 caractères.`;
  return '';
};

// Validation de la date
export const validateDate = (date) => {
  if (!date) return 'Veuillez entrer une date.';
  return '';
};

// Modal de succès partagée
export const SuccessModal = ({ message, onClose }) => (
  <div className="success-overlay">
    <div className="success-modal">
      <div className="success-icon">✓</div>
      <h3>Opération réussie</h3>
      <p>{message}</p>
      <button className="close-modal-btn" onClick={onClose}>Fermer</button>
    </div>
  </div>
);
