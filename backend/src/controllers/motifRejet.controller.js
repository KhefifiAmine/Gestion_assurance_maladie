const { MotifRejet } = require('../../models');

// GET /api/motifs-rejet — liste tous les motifs actifs
const getAll = async (req, res) => {
    try {
        const includeInactive = req.query.all === 'true' && ['ADMIN', 'RESPONSABLE_RH'].includes(req.userRole);
        const where = includeInactive ? {} : { actif: true };
        const motifs = await MotifRejet.findAll({ where, order: [['categorie', 'ASC'], ['libelle', 'ASC']] });
        res.json(motifs);
    } catch (err) {
        console.error('Erreur getAll MotifRejet:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// POST /api/motifs-rejet — créer un nouveau motif (admin seulement)
const create = async (req, res) => {
    try {
        const { libelle, description, categorie } = req.body;
        if (!libelle) return res.status(400).json({ message: 'Le libellé est requis.' });
        const motif = await MotifRejet.create({ libelle, description, categorie: categorie || 'autre' });
        res.status(201).json(motif);
    } catch (err) {
        console.error('Erreur create MotifRejet:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// PUT /api/motifs-rejet/:id — modifier un motif (admin seulement)
const update = async (req, res) => {
    try {
        const motif = await MotifRejet.findByPk(req.params.id);
        if (!motif) return res.status(404).json({ message: 'Motif introuvable.' });
        const { libelle, description, categorie, actif } = req.body;
        await motif.update({ libelle, description, categorie, actif });
        res.json(motif);
    } catch (err) {
        console.error('Erreur update MotifRejet:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// DELETE /api/motifs-rejet/:id — désactive un motif (soft delete)
const remove = async (req, res) => {
    try {
        const motif = await MotifRejet.findByPk(req.params.id);
        if (!motif) return res.status(404).json({ message: 'Motif introuvable.' });
        await motif.update({ actif: false });
        res.json({ message: 'Motif désactivé avec succès.' });
    } catch (err) {
        console.error('Erreur remove MotifRejet:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

module.exports = { getAll, create, update, remove };
