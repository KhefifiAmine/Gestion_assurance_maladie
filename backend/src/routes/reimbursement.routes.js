const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const activeRules = require('../services/reimbursement/reimbursementRules2026');

// Récupérer les règles de remboursement
router.get('/rules', verifyToken, (req, res) => {
    try {
        res.status(200).json(activeRules);
    } catch (e) {
        res.status(500).json({ message: "Erreur lors de la récupération des barèmes.", error: e.message });
    }
});

// Mettre à jour les règles de remboursement (ADMIN et SUPER_ADMIN uniquement)
router.put('/rules', verifyToken, (req, res) => {
    try {
        if (!['ADMIN', 'SUPER_ADMIN'].includes(req.userRole)) {
            return res.status(403).json({ message: "Accès refusé. Vous devez être Administrateur ou Super Administrateur." });
        }

        const { updateRules } = require('../services/reimbursement/reimbursementRules2026');
        const result = updateRules(req.body);

        if (result.success) {
            // Journaliser l'activité de modification des barèmes
            try {
                const { Journal } = require('../../models');
                Journal.create({
                    action: 'Modification des barèmes de remboursement (Plafonds / Tarifs)',
                    userId: req.userId,
                    adresse_ip: req.ip || req.connection?.remoteAddress || '127.0.0.1'
                }).catch(err => console.error("Erreur journalisation modif rules:", err));
            } catch (err) {
                console.error(err);
            }

            res.status(200).json({ message: "Barèmes de remboursement mis à jour avec succès !", rules: result.rules });
        } else {
            res.status(500).json({ message: "Erreur de sauvegarde.", error: result.error });
        }
    } catch (e) {
        res.status(500).json({ message: "Erreur lors de la mise à jour des barèmes.", error: e.message });
    }
});

module.exports = router;
