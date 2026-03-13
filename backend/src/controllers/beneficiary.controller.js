const { Beneficiary } = require('../../models');

// Récupérer mes bénéficiaires
const getMyBeneficiaries = async (req, res) => {
    try {
        const beneficiaries = await Beneficiary.findAll({
            where: { userId: req.userId },
            order: [['createdAt', 'ASC']]
        });
        res.status(200).json(beneficiaries);
    } catch (error) {
        console.error('Erreur getMyBeneficiaries:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des bénéficiaires.' });
    }
};

// Ajouter un bénéficiaire
const addBeneficiary = async (req, res) => {
    try {
        const { nom, prenom, relation, ddn, sexe } = req.body;
        
        const newBeneficiary = await Beneficiary.create({
            userId: req.userId,
            nom,
            prenom,
            relation,
            ddn,
            sexe
        });

        res.status(201).json(newBeneficiary);
    } catch (error) {
        console.error('Erreur addBeneficiary:', error);
        res.status(500).json({ message: 'Erreur lors de l\'ajout du bénéficiaire.' });
    }
};

// Supprimer un bénéficiaire
const deleteBeneficiary = async (req, res) => {
    try {
        const { id } = req.params;
        const beneficiary = await Beneficiary.findOne({
            where: { id, userId: req.userId }
        });

        if (!beneficiary) {
            return res.status(404).json({ message: 'Bénéficiaire non trouvé.' });
        }

        await beneficiary.destroy();
        res.status(200).json({ message: 'Bénéficiaire supprimé avec succès.' });
    } catch (error) {
        console.error('Erreur deleteBeneficiary:', error);
        res.status(500).json({ message: 'Erreur lors de la suppression.' });
    }
};

module.exports = {
    getMyBeneficiaries,
    addBeneficiary,
    deleteBeneficiary
};
