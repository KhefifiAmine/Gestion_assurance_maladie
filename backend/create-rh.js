const { hashPassword } = require('./src/utils/bcrypt');
const { User, sequelize } = require('./models');

async function createRH() {
    try {
        await sequelize.authenticate();
        console.log('Connexion DB réussie.');

        const email = 'rh@tunisietelecom.tn';
        const matricule = 'RH001';
        const passwordPlain = '123456789';

        const existingRH = await User.findOne({ where: { email } });
        if (existingRH) {
            console.log('Un compte RH existe déjà avec cet email.');
            // Mettre à jour le mot de passe au cas où
            const hashedPassword = await hashPassword(passwordPlain);
            await existingRH.update({ mot_de_passe: hashedPassword, statut: 1, role: 'RESPONSABLE_RH' });
            console.log('Mot de passe mis à jour pour ce compte RH.');
            return;
        }

        const hashedPassword = await hashPassword(passwordPlain);
        
        await User.create({
            nom: 'Responsable',
            prenom: 'RH',
            matricule: matricule,
            email: email,
            mot_de_passe: hashedPassword,
            role: 'RESPONSABLE_RH',
            statut: 1 // Compte actif
        });

        console.log(`Compte Responsable RH créé avec succès !`);
        console.log(`Email : ${email}`);
        console.log(`Mot de passe : ${passwordPlain}`);

    } catch (error) {
        console.error('Erreur lors de la création du compte RH :', error);
    } finally {
        await sequelize.close();
    }
}

createRH();
