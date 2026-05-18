require('dotenv').config({ path: '../../.env' });
const { User } = require('../../models');

async function check() {
    try {
        const users = await User.findAll({ attributes: ['id', 'email', 'role', 'statut'] });
        console.log('\n=========================================');
        console.log('UTILISATEURS DANS LA BASE DE DONNÉES :');
        console.log('=========================================');
        users.forEach(u => {
            console.log(`ID: ${u.id} | Email: ${u.email} | Role: ${u.role} | Statut: ${u.statut}`);
        });
        console.log('=========================================\n');
        process.exit(0);
    } catch (e) {
        console.error('Erreur:', e);
        process.exit(1);
    }
}

check();
