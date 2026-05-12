'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('acte_medicaux', 'prestataireId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'prestataires',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('acte_medicaux', 'prestataireId');
  }
};
