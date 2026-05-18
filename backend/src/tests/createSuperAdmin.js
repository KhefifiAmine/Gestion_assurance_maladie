require('dotenv').config({ path: '../../.env' });
const { User, Beneficiary } = require('../../models');
const { hashPassword } = require('../utils/bcrypt');

async function createSuperAdmin() {
    try {
        console.log("⏳ Hachage du mot de passe...");
        const defaultPassword = await hashPassword('123456');

        console.log("⏳ Création du compte SUPER_ADMIN...");
        const userSuper = await User.create({
            matricule: 'SUP001',
            nom: 'Super',
            prenom: 'Admin',
            email: 'superadmin@test.com',
            ddn: '1990-01-01',
            sexe: 'M',
            mot_de_passe: defaultPassword,
            role: 'SUPER_ADMIN',
            statut: 1
        });

        await Beneficiary.create({
            nom: 'Super',
            prenom: 'Admin',
            ddn: '1990-01-01',
            relation: 'Titulaire',
            sexe: 'M',
            statut: 'Validé',
            userId: userSuper.id
        });

        console.log("====================================================");
        console.log("✅ COMPTE SUPER_ADMIN CRÉÉ AVEC SUCCÈS !");
        console.log("📧 Email : superadmin@test.com");
        console.log("🔑 Mot de passe : 123456");
        console.log("====================================================");
        process.exit(0);
    } catch (e) {
        console.error("❌ Erreur lors de la création :", e.message);
        process.exit(1);
    }
}

createSuperAdmin();
