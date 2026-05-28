const { Journal } = require('../../models');

/**
 * Middleware pour enregistrer automatiquement les actions des utilisateurs dans le journal.
 * Il capture les méthodes de modification (POST, PUT, DELETE, PATCH).
 */
const journalMiddleware = async (req, res, next) => {
    // On n'enregistre que les actions de modification et non les simples consultations (GET)
    // Sauf cas particuliers si nécessaire.
    const trackedMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];

    if (trackedMethods.includes(req.method)) {
        // On écoute la fin de la réponse pour s'assurer que l'action a réussi
        res.on('finish', async () => {
            // On n'enregistre que si la requête a réussi (codes 2xx)
            if (res.statusCode >= 200 && res.statusCode < 305) {
                try {
                    // L'ID de l'utilisateur est injecté par le middleware d'authentification (verifyToken)
                    const userId = req.userId;
                    
                    if (userId) {
                        // On nettoie l'URL pour remplacer les IDs variables (ex: /12) par /:id
                        // Cela permet de faire correspondre l'action avec l'ACTION_MAP du frontend
                        const cleanPath = req.originalUrl.split('?')[0].replace(/\/\d+/g, '/:id');
                        const actionLabel = `${req.method} sur ${cleanPath}`;

                        // On évite d'enregistrer les logs eux-mêmes ou les stats
                        if (!cleanPath.includes('/api/logs') && !cleanPath.includes('/api/stats')) {

                            // ── Capture ancienneValeur / nouvelleValeur ──────────────────────────
                            // Si le contrôleur a attaché explicitement l'ancienne valeur via req._ancienneValeur
                            let ancienneValeur = req._ancienneValeur || null;
                            let nouvelleValeur = null;

                            if (req.body && Object.keys(req.body).length > 0) {
                                // Exclure les champs sensibles et internes
                                const EXCLUDED = ['mot_de_passe', 'password', 'newPassword', 'oldPassword',
                                                  'token', '_ancienneValeur', 'resetPasswordCode'];
                                const bodyFiltered = Object.entries(req.body)
                                    .filter(([k]) => !EXCLUDED.includes(k))
                                    .reduce((acc, [k, v]) => {
                                        // On évite de créer un énorme objet en tronquant 
                                        // les très longues chaînes et les gros tableaux dès maintenant
                                        if (typeof v === 'string' && v.length > 150) {
                                            acc[k] = v.substring(0, 150) + '... [TRONQUÉ]';
                                        } else if (Array.isArray(v) && v.length > 5) {
                                            acc[k] = `[Tableau de ${v.length} éléments]`;
                                        } else {
                                            acc[k] = v;
                                        }
                                        return acc;
                                    }, {});

                                if (Object.keys(bodyFiltered).length > 0) {
                                    nouvelleValeur = JSON.stringify(bodyFiltered);
                                }
                            }

                            // Sérialiser ancienneValeur si c'est un objet
                            if (ancienneValeur && typeof ancienneValeur === 'object') {
                                ancienneValeur = JSON.stringify(ancienneValeur);
                            }

                            await Journal.create({
                                action: actionLabel,
                                userId: userId,
                                adresse_ip: req.ip || req.connection?.remoteAddress || '127.0.0.1',
                                ancienneValeur: ancienneValeur
                                    ? String(ancienneValeur).substring(0, 500)
                                    : null,
                                nouvelleValeur: nouvelleValeur
                                    ? String(nouvelleValeur).substring(0, 500)
                                    : null,
                                dateAction: new Date()
                            });
                        }
                    }
                } catch (error) {
                    console.error('Erreur lors de l\'enregistrement automatique du journal:', error);
                }
            }
        });
    }

    next();
};

module.exports = journalMiddleware;
