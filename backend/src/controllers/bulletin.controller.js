const { BulletinSoin, ActeMedical, Pharmacie, SoinDentaire, User } = require('../../models');

const createBulletin = async (req, res) => {
    try {
        const {
            numero_bulletin,
            code_cnam,
            nom_prenom_malade,
            montant_total,
            type_dossier,
            matricule_adherent,
            qualite_malade,
            actes,
            pharmacie,
            soinDentaire
        } = req.body;

        const userId = req.userId; // From verifyToken middleware

        const bulletin = await BulletinSoin.create({
            numero_bulletin,
            code_cnam,
            nom_prenom_malade,
            montant_total,
            type_dossier,
            matricule_adherent,
            qualite_malade,
            userId
        });

        if (actes && actes.length > 0) {
            await Promise.all(actes.map(acte => ActeMedical.create({ ...acte, bulletinId: bulletin.id })));
        }

        if (pharmacie) {
            await Pharmacie.create({ ...pharmacie, bulletinId: bulletin.id });
        }

        if (soinDentaire) {
            await SoinDentaire.create({ ...soinDentaire, bulletinId: bulletin.id });
        }

        res.status(201).json({ message: 'Bulletin créé avec succès', bulletin });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de la création du bulletin', error: error.message });
    }
};

const getMyBulletins = async (req, res) => {
    try {
        const userId = req.userId;
        const bulletins = await BulletinSoin.findAll({
            where: { userId },
            include: [
                { model: ActeMedical, as: 'actes' },
                { model: Pharmacie, as: 'pharmacie' },
                { model: SoinDentaire, as: 'soinDentaire' }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(bulletins);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des bulletins', error: error.message });
    }
};

const getAllBulletins = async (req, res) => {
    try {
        const bulletins = await BulletinSoin.findAll({
            include: [
                { model: User, as: 'adherent', attributes: ['nom', 'prenom', 'email'] },
                { model: ActeMedical, as: 'actes' },
                { model: Pharmacie, as: 'pharmacie' },
                { model: SoinDentaire, as: 'soinDentaire' }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(bulletins);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération de tous les bulletins', error: error.message });
    }
};

const updateBulletinStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { statut } = req.body;
        const adminId = req.userId;

        const bulletin = await BulletinSoin.findByPk(id);
        if (!bulletin) {
            return res.status(404).json({ message: 'Bulletin non trouvé' });
        }

        bulletin.statut = statut;
        bulletin.adminId = adminId;
        bulletin.date_traitement = new Date();
        await bulletin.save();

        res.status(200).json({ message: 'Statut du bulletin mis à jour', bulletin });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la mise à jour du statut', error: error.message });
    }
};

module.exports = {
    createBulletin,
    getMyBulletins,
    getAllBulletins,
    updateBulletinStatus
};
