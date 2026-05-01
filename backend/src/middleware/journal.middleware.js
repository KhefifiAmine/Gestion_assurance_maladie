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
            if (res.statusCode >= 200 && res.statusCode < 300) {
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
                            await Journal.create({
                                action: actionLabel,
                                userId: userId,
                                adresse_ip: req.ip || req.connection.remoteAddress || '127.0.0.1'
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
