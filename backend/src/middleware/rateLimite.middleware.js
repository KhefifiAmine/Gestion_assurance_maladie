// middleware/rateLimit.js
const rateLimit = require('express-rate-limit');
const { sendRateLimitAlertEmail } = require('../utils/emailService');

// ─── Récupère dynamiquement l'email du Super Admin depuis la base de données ───
const getSuperAdminEmail = async () => {
  try {
    const { User } = require('../../models');
    const superAdmin = await User.findOne({
      where: { role: 'SUPER_ADMIN' },
      attributes: ['email'],
      order: [['createdAt', 'ASC']]
    });
    return superAdmin?.email || null;
  } catch (err) {
    console.error('[RateLimit] Impossible de récupérer l\'email du super admin:', err.message);
    return null;
  }
};

// ─── Fonction utilitaire : crée un handler onLimitReached ────────────────────
const buildHandler = (limiterName) => async (req, res) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'Inconnue';
  const path = req.originalUrl || req.url || '/';

  console.warn(`[RateLimit] Dépassement détecté — Limiteur: ${limiterName} | IP: ${ip} | Route: ${path}`);

  // Envoi de l'alerte email en arrière-plan (non bloquant)
  (async () => {
    try {
      const superAdminEmail = await getSuperAdminEmail();
      if (superAdminEmail) {
        await sendRateLimitAlertEmail(superAdminEmail, ip, limiterName, path);
      } else {
        console.warn('[RateLimit] Aucun Super Admin trouvé pour recevoir l\'alerte.');
      }
    } catch (err) {
      console.error('[RateLimit] Erreur lors de l\'envoi de l\'alerte:', err.message);
    }
  })();

  res.status(429).json({
    message: getMessageForLimiter(limiterName)
  });
};

// ─── Messages d'erreur par limiteur ─────────────────────────────────────────
const getMessageForLimiter = (name) => {
  const messages = {
    'Global': 'Trop de requêtes. Veuillez patienter 15 minutes.',
    'Authentification': 'Trop de tentatives de connexion ou d\'inscription. Veuillez réessayer dans 15 minutes.',
    'Réinitialisation': 'Trop de tentatives de réinitialisation. Réessayez dans 15 minutes.',
    'Analyse IA': 'Nombre maximum d\'analyses par IA atteint. Veuillez patienter 15 minutes.',
    'Bulletin': 'Trop de soumissions de bulletins de soins. Veuillez patienter 15 minutes.',
    'Réclamation': 'Trop de réclamations soumises. Veuillez patienter 15 minutes.',
    'Sauvegarde': 'Trop d\'actions de sauvegarde de la base de données. Veuillez patienter 15 minutes.',
  };
  return messages[name] || 'Trop de requêtes. Veuillez patienter.';
};

// ────────────────────────────────────────────────────────────────────────────
// 1. Limiteur global (protection générale contre le spam et le flooding)
// ────────────────────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 3 * 60 * 1000, // 15 minutes
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  handler: buildHandler('Global'),
});

// ────────────────────────────────────────────────────────────────────────────
// 2. Limiteur pour l'authentification (brute-force sur login et register)
// ────────────────────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: buildHandler('Authentification'),
});

// ────────────────────────────────────────────────────────────────────────────
// 3. Limiteur pour la réinitialisation de mot de passe (sécurité maximale)
// ────────────────────────────────────────────────────────────────────────────
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: buildHandler('Réinitialisation'),
});

// ────────────────────────────────────────────────────────────────────────────
// 4. Limiteur pour l'IA (analyse de bulletin - routes coûteuses)
// ────────────────────────────────────────────────────────────────────────────
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  handler: buildHandler('Analyse IA'),
});

// ────────────────────────────────────────────────────────────────────────────
// 5. Limiteur pour la création/modification de bulletins
// ────────────────────────────────────────────────────────────────────────────
const bulletinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  handler: buildHandler('Bulletin'),
});

// ────────────────────────────────────────────────────────────────────────────
// 6. Limiteur pour les réclamations
// ────────────────────────────────────────────────────────────────────────────
const reclamationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  handler: buildHandler('Réclamation'),
});

// ────────────────────────────────────────────────────────────────────────────
// 7. Limiteur pour les sauvegardes de base de données (lourd en ressources)
// ────────────────────────────────────────────────────────────────────────────
const backupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: buildHandler('Sauvegarde'),
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