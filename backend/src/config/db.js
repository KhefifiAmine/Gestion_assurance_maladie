const { Sequelize } = require("sequelize");
const path = require('path');
// require("dotenv").config(); // Déjà chargé dans server.js

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: false,
    define: {
      timestamps: true,
    },
  }
);

module.exports = sequelize;
