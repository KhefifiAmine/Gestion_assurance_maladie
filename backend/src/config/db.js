const { Sequelize } = require("sequelize");
require("dotenv").config(); // charge le .env

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    logging: false,
    define: {
      timestamps: true,
    },
  }
);

module.exports = sequelize;
