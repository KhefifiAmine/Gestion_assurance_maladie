'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        // 1. Ajouter nom_pharmacie à la table pharmacies
        await queryInterface.addColumn('pharmacies', 'nom_pharmacie', {
            type: Sequelize.STRING,
            allowNull: true,
            after: 'bulletinId',
            comment: 'Nom de la pharmacie mentionné sur le bulletin de soin'
        });

        // 2. Créer la table medicaments
        await queryInterface.createTable('medicaments', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false
            },
            pharmacieId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'pharmacies',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            nom_medicament: {
                type: Sequelize.STRING,
                allowNull: false
            },
            dosage: {
                type: Sequelize.STRING,
                allowNull: true
            },
            quantite: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 1
            },
            prix_unitaire: {
                type: Sequelize.DOUBLE,
                allowNull: false,
                defaultValue: 0.0
            },
            montant_total: {
                type: Sequelize.DOUBLE,
                allowNull: false,
                defaultValue: 0.0
            },
            montant_remboursement: {
                type: Sequelize.DOUBLE,
                allowNull: false,
                defaultValue: 0.0
            },
            est_remboursable: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true
            },
            statut: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
                comment: '0: En attente, 1: Accepté, 2: Rejeté'
            },
            motif_rejet: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
            }
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('medicaments');
        await queryInterface.removeColumn('pharmacies', 'nom_pharmacie');
    }
};
