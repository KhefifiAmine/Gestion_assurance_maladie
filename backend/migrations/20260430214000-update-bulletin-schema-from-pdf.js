'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('bulletin_soins', 'est_apci', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    await queryInterface.addColumn('bulletin_soins', 'suivi_grossesse', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    await queryInterface.addColumn('bulletin_soins', 'date_prevue_accouchement', {
      type: Sequelize.DATEONLY,
      allowNull: true
    });
    await queryInterface.addColumn('bulletin_soins', 'soins_cadre', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('acte_medicaux', 'identifiant_unique_mf', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('acte_medicaux', 'cachet_signature_present', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    await queryInterface.addColumn('acte_medicaux', 'date_cachet_signature', {
      type: Sequelize.DATEONLY,
      allowNull: true
    });

    await queryInterface.addColumn('soin_dentaires', 'cachet_signature_present', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    await queryInterface.addColumn('soin_dentaires', 'date_cachet_signature', {
      type: Sequelize.DATEONLY,
      allowNull: true
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('soin_dentaires', 'date_cachet_signature');
    await queryInterface.removeColumn('soin_dentaires', 'cachet_signature_present');

    await queryInterface.removeColumn('acte_medicaux', 'date_cachet_signature');
    await queryInterface.removeColumn('acte_medicaux', 'cachet_signature_present');
    await queryInterface.removeColumn('acte_medicaux', 'identifiant_unique_mf');

    await queryInterface.removeColumn('bulletin_soins', 'soins_cadre');
    await queryInterface.removeColumn('bulletin_soins', 'date_prevue_accouchement');
    await queryInterface.removeColumn('bulletin_soins', 'suivi_grossesse');
    await queryInterface.removeColumn('bulletin_soins', 'est_apci');
  }
};
