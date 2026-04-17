const mysql = require('mysql2/promise');
require('dotenv').config();

async function resetAndSeedDatabase() {
    console.log("⏳ Étape 1 : Connexion au serveur MySQL pour réinitialiser la base...");
    try {
        // 1. Drop and Create the DB using core mysql2
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || ''
        });

        const dbName = process.env.DB_NAME || 'assurance_db_v2';
        console.log(`🗑️  Suppression de la base de données '${dbName}' (si elle existe)...`);
        await connection.query(`DROP DATABASE IF EXISTS \`${dbName}\`;`);

        console.log(`✨ Création de la base de données '${dbName}' vierge...`);
        await connection.query(`CREATE DATABASE \`${dbName}\`;`);
        await connection.end();
        console.log("✅ Base de données réinitialisée avec succès !");

        // 2. Load Sequelize models and Force Sync
        console.log("\n⏳ Étape 2 : Création des tables...");
        const { sequelize, User } = require('./models');
        await sequelize.sync({ force: true });
        console.log("✅ Toutes les tables ont été recréées !");

        // 3. Insert Test Users
        console.log("\n⏳ Étape 3 : Création des comptes de test...");
        const { hashPassword } = require('./src/utils/bcrypt');
        const defaultPassword = await hashPassword('123456');

        // Créer l'Admin
        await User.create({
            matricule: 'ADM001',
            nom: 'Admin',
            prenom: 'Test',
            email: 'admin@test.com',
            mot_de_passe: defaultPassword,
            role: 'ADMIN',
            statut: 1
        });

        // Créer le Responsable RH
        await User.create({
            matricule: 'RH001',
            nom: 'Responsable',
            prenom: 'RH',
            email: 'rh@test.com',
            mot_de_passe: defaultPassword,
            role: 'RESPONSABLE_RH',
            statut: 1
        });

        // Créer l'Adhérent
        await User.create({
            matricule: 'ADH001',
            nom: 'Adherent',
            prenom: 'User',
            email: 'user@test.com',
            mot_de_passe: defaultPassword,
            role: 'ADHERENT',
            statut: 1,
            ddn: '1990-01-01',
            telephone: '12345678',
            adresse: '123 Rue de Test',
            ville: 'Ville de Test'
        });

        console.log("✅ Comptes créés avec succès ! Voici les identifiants pour vos tests :");
        console.log("-----------------------------------------");
        console.log("🔑 Mot de passe global pour les 3 comptes : 123456");
        console.log("👨‍💼 Administrateur : admin@test.com");
        console.log("👥 Responsable RH : rh@test.com");
        console.log("👤 Adhérent       : user@test.com");
        console.log("-----------------------------------------");

        console.log("\n🎉 TOUT EST PRET ! Vous pouvez maintenant fermer ce script (s'il ne se ferme pas seul) puis faire : npm run dev");
        process.exit();

    } catch (error) {
        console.error("❌ Une erreur est survenue pendant la procédure :", error);
        process.exit(1);
    }
}

resetAndSeedDatabase();
