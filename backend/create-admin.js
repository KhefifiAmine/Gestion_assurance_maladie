const { hashPassword } = require('./src/utils/bcrypt');
const { User, sequelize } = require('./models');

async function createAdmin() {
    try {
        await sequelize.authenticate();
        console.log('Connexion DB réussie.');

        const email = 'admin@tunisietelecom.tn';
        const matricule = 'ADM001';
        const passwordPlain = '123456789';

        const existingAdmin = await User.findOne({ where: { email } });
        if (existingAdmin) {
            console.log('Un compte admin existe déjà avec cet email.');
            // Mettre à jour le mot de passe au cas où
            const hashedPassword = await hashPassword(passwordPlain);
            await existingAdmin.update({ mot_de_passe: hashedPassword, statut: 1, role: 'ADMIN' });
            console.log('Mot de passe mis à jour pour ce compte admin.');
            return;
        }

        const hashedPassword = await hashPassword(passwordPlain);
        
        await User.create({
            nom: 'Admin',
            prenom: 'System',
            matricule: matricule,
            email: email,
            mot_de_passe: hashedPassword,
            role: 'ADMIN',
            statut: 1 // Compte actif
        });

        console.log(`Compte Admin créé avec succès !`);
        console.log(`Email : ${email}`);
        console.log(`Mot de passe : ${passwordPlain}`);

    } catch (error) {
        console.error('Erreur lors de la création du compte admin :', error);
    } finally {
        await sequelize.close();
    }
}

createAdmin();
