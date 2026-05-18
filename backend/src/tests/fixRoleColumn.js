require('dotenv').config({ path: '../../.env' });
const { sequelize, User } = require('../../models');

async function fix() {
    try {
        console.log("⏳ Étape 1 : Modification de la colonne 'role' dans la table MySQL 'users'...");
        await sequelize.query("ALTER TABLE users MODIFY COLUMN role ENUM('ADMIN', 'ADHERENT', 'RESPONSABLE_RH', 'SUPER_ADMIN') NOT NULL DEFAULT 'ADHERENT';");
        console.log("✅ Colonne 'role' mise à jour avec succès !");

        console.log("⏳ Étape 2 : Mise à jour du rôle de 'superadmin@test.com'...");
        const result = await User.update(
            { role: 'SUPER_ADMIN' },
            { where: { email: 'superadmin@test.com' } }
        );
        console.log(`✅ Mise à jour réussie : ${result[0]} ligne(s) modifiée(s)`);

        console.log("\n====================================================");
        console.log("🎉 CORRECTIF APPLIQUÉ !");
        console.log("Vous pouvez maintenant vous connecter en toute sécurité !");
        console.log("====================================================");
        process.exit(0);
    } catch (e) {
        console.error("❌ Une erreur est survenue pendant la procédure :", e.message);
        process.exit(1);
    }
}

fix();
