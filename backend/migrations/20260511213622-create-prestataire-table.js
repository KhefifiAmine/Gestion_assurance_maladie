'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('prestataires', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      identifiant_unique_mf: {
        type: Sequelize.STRING,
        allowNull: true
      },
      nom: {
        type: Sequelize.STRING,
        allowNull: true
      },
      telephone: {
        type: Sequelize.STRING,
        allowNull: true
      },
      adresse: {
        type: Sequelize.STRING,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('prestataires');
  }
};
