// middleware/rateLimit.js
const rateLimit = require('express-rate-limit');

// 1. Limiteur global pour toutes les requêtes (protection générale contre le spam et le flooding)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // 150 requêtes max par IP
  message: {
    message: 'Trop de requêtes. Veuillez patienter 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 2. Limiteur pour l'authentification (brute-force sur login et register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 tentatives max
  message: {
    message: 'Trop de tentatives de connexion ou d\'inscription. Veuillez réessayer dans 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 3. Limiteur pour la réinitialisation de mot de passe (sécurité maximale)
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 tentatives max
  message: {
    message: 'Trop de tentatives de réinitialisation. Réessayez dans 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 4. Limiteur pour l'IA (analyse de bulletin - routes coûteuses)
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 8, // 8 analyses max par IP
  message: {
    message: 'Nombre maximum d\'analyses par IA atteint. Veuillez patienter 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 5. Limiteur pour la création/modification de bulletins
const bulletinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 25, // 25 créations/modifications max par IP
  message: {
    message: 'Trop de soumissions de bulletins de soins. Veuillez patienter 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 6. Limiteur pour les réclamations
const reclamationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // 15 réclamations max par IP
  message: {
    message: 'Trop de réclamations soumises. Veuillez patienter 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 7. Limiteur pour les sauvegardes de base de données (lourd en ressources)
const backupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 actions max par IP
  message: {
    message: 'Trop d\'actions de sauvegarde de la base de données. Veuillez patienter 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  globalLimiter,
  authLimiter,
  passwordResetLimiter,
  aiLimiter,
  bulletinLimiter,
  reclamationLimiter,
  backupLimiter
};