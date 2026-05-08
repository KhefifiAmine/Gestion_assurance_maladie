const { BulletinSoin, ActeMedical, Pharmacie, DocumentJustificatif, Beneficiary, MotifRejet } = require('./models');

async function testQuery() {
    console.log("DB_NAME:", process.env.DB_NAME);
    console.log("DB_USER:", process.env.DB_USER);
    try {

        console.log("Attempting to fetch bulletins...");
        const bulletins = await BulletinSoin.findAll({
            include: [
                { model: ActeMedical, as: 'actes' },
                { model: Pharmacie, as: 'pharmacie' },
                { model: DocumentJustificatif, as: 'documents' },
                { model: Beneficiary, as: 'beneficiaire', attributes: ['id', 'nom', 'prenom', 'relation', 'ddn', 'statut'], required: false },
                { model: MotifRejet, as: 'motifRejet', attributes: ['id', 'libelle', 'description', 'categorie'], required: false }
            ],
            order: [['createdAt', 'DESC']]
        });
        console.log("Success! Found", bulletins.length, "bulletins.");
    } catch (error) {
        console.error("FAILED to fetch bulletins:");
        console.error(error);
    } finally {
        process.exit();
    }
}

testQuery();
