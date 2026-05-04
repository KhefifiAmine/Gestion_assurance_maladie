'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('acte_medicaux', 'medecinId');
    await queryInterface.removeColumn('acte_medicaux', 'type');

    await queryInterface.removeColumn('pharmacies', 'date_achat');
    await queryInterface.removeColumn('pharmacies', 'adresse');
    await queryInterface.removeColumn('pharmacies', 'telephone');

    await queryInterface.dropTable('soin_dentaires');
    await queryInterface.dropTable('medecins');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.createTable('medecins', {
      id_medecin: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      nom_prenom: {
        type: Sequelize.STRING,
        allowNull: false
      },
      specialite: {
        type: Sequelize.STRING,
        allowNull: true
      },
      telephone: {
        type: Sequelize.STRING,
        allowNull: true
      },
      matricule_fiscal: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    await queryInterface.createTable('soin_dentaires', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      num_dent: {
        type: Sequelize.STRING,
        allowNull: true
      },
      code_acte: {
        type: Sequelize.STRING,
        allowNull: true
      },
      honoraires: {
        type: Sequelize.DOUBLE,
        allowNull: false,
        defaultValue: 0
      },
      identifiant_unique: {
        type: Sequelize.STRING,
        allowNull: true
      },
      cachet_signature_present: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      date_cachet_signature: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      date_acte: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      acte: {
        type: Sequelize.STRING,
        allowNull: true
      },
      cote: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      bulletinId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'bulletin_soins',
          key: 'id'
        }
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    await queryInterface.addColumn('pharmacies', 'telephone', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('pharmacies', 'adresse', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('pharmacies', 'date_achat', {
      type: Sequelize.DATEONLY,
      allowNull: true
    });

    await queryInterface.addColumn('acte_medicaux', 'type', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('acte_medicaux', 'medecinId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'medecins',
        key: 'id_medecin'
      }
    });
  }
};
