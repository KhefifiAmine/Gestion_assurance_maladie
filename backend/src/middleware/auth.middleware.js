const jwt = require('jsonwebtoken');
const { User } = require('../../models');
const JWT_SECRET = process.env.JWT_SECRET;

const verifyToken = async (req, res, next) => {
    // 1. Priorité au cookie HTTP-Only (sécurisé)
    // 2. Fallback sur l'en-tête Authorization (Postman / API externe)
    let token = req.cookies?.token || null;

    if (!token) {
        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
    }

    if (!token) {
        console.warn(`[AUTH] Tentative d'accès sans token sur ${req.originalUrl}. Cookies présents: ${Object.keys(req.cookies || {}).join(', ')}`);
        return res.status(403).json({ message: 'Aucun token fourni!' });
    }

    try {
        if (!JWT_SECRET) {
            return res.status(500).json({ message: 'Configuration serveur invalide (JWT_SECRET manquant).' });
        }
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Fetch user to check status
        const user = await User.findByPk(decoded.id);
        
        if (!user) {
            return res.status(401).json({ message: 'Utilisateur non trouvé!' });
        }

        if (user.statut !== 1) {
            let statusDetail = 'votre compte n\'est pas actif.';
            if (user.statut === 3) statusDetail = 'votre compte a été bloqué.';
            if (user.statut === 2) statusDetail = 'votre compte a été refusé.';
            if (user.statut === 0) statusDetail = 'votre compte est en attente d\'activation.';
            
            return res.status(401).json({ 
                message: `Accès refusé : ${statusDetail}`, 
                status: user.statut,
                isBlocked: true // Helper flag for frontend
            });
        }

        req.userId = decoded.id;
        req.userRole = decoded.role;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Non autorisé! Token invalide ou expiré.' });
    }
};

const isAdmin = (req, res, next) => {
    if (req.userRole !== 'ADMIN' && req.userRole !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Nécessite le rôle d\'Administrateur!' });
    }
    next();
};

const isRH = (req, res, next) => {
    if (req.userRole !== 'RESPONSABLE_RH' && req.userRole !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Nécessite le rôle de Responsable RH!' });
    }
    next();
};

const isAdminOrRH = (req, res, next) => {
    if (!['ADMIN', 'RESPONSABLE_RH', 'SUPER_ADMIN'].includes(req.userRole)) {
        return res.status(403).json({ message: 'Nécessite le rôle d\'Administrateur ou Responsable RH!' });
    }
    next();
};

const isSuperAdmin = (req, res, next) => {
    if (req.userRole !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Nécessite le rôle de Super Administrateur!' });
    }
    next();
};

module.exports = {
    verifyToken,
    isAdmin,
    isRH,
    isAdminOrRH,
    isSuperAdmin
};
