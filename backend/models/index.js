const sequelize = require('../src/config/db');
const User = require('./User');

// Vous pouvez ajouter des associations ici si besoin
// ex: User.hasMany(Bulletin)

module.exports = {
    sequelize,
    User
};
