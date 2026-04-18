const { User, BulletinSoin, Reclamation, sequelize } = require('../../models');
const { Op } = require('sequelize');

const getAdminStats = async (req, res) => {
    try {
        // Total stats
        const totalUsers = await User.count();
        const totalBulletins = await BulletinSoin.count();
        const totalReclamations = await Reclamation.count();
        
        // Financials (sum of montant_total by status)
        const totalRemboursements = await BulletinSoin.sum('montant_total') || 0; 
        const totalAcceptedCash = await BulletinSoin.sum('montant_total', { where: { statut: 2 } }) || 0;
        const totalPendingCash = await BulletinSoin.sum('montant_total', { where: { statut: [0, 1] } }) || 0;
        const totalRefusedCash = await BulletinSoin.sum('montant_total', { where: { statut: 3 } }) || 0;
        
        // Distribution by type (for Pie chart) with amounts
        const distributionByType = await BulletinSoin.findAll({
            attributes: [
                'type_dossier',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
                [sequelize.fn('SUM', sequelize.col('montant_total')), 'totalAmount']
            ],
            group: ['type_dossier']
        });

        // Reclamations by status
        const reclamationsByStatus = {
            ouvertes: await Reclamation.count({ where: { statut: 'Ouverte' } }),
            enCours: await Reclamation.count({ where: { statut: 'En cours' } }),
            traitees: await Reclamation.count({ where: { statut: 'Traitée' } }),
            cloturees: await Reclamation.count({ where: { statut: 'Clôturée' } })
        };

        // Monthly data for chart (last 6 months)
        const monthlyData = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
            
            const monthBulletins = await BulletinSoin.count({
                where: {
                    createdAt: { [Op.between]: [startOfMonth, endOfMonth] }
                }
            });
            
            const monthReclamations = await Reclamation.count({
                where: {
                    createdAt: { [Op.between]: [startOfMonth, endOfMonth] }
                }
            });
            
            const monthCash = await BulletinSoin.sum('montant_total', {
                where: {
                    createdAt: { [Op.between]: [startOfMonth, endOfMonth] }
                }
            }) || 0;

            monthlyData.push({
                name: startOfMonth.toLocaleString('fr-FR', { month: 'short' }),
                bulletins: monthBulletins,
                reclamations: monthReclamations,
                cash: monthCash
            });
        }

        // Calculate growth (Current month vs Previous month)
        const currentMonth = monthlyData[5];
        const previousMonth = monthlyData[4];
        
        const calculateGrowth = (curr, prev) => {
            if (!prev || prev === 0) return curr > 0 ? '+100%' : '0%';
            const growth = ((curr - prev) / prev) * 100;
            return (growth >= 0 ? '+' : '') + growth.toFixed(1) + '%';
        };

        const growth = {
            bulletins: calculateGrowth(currentMonth.bulletins, previousMonth.bulletins),
            reclamations: calculateGrowth(currentMonth.reclamations, previousMonth.reclamations),
            cash: calculateGrowth(currentMonth.cash, previousMonth.cash)
        };

        res.status(200).json({
            totalUsers,
            totalBulletins,
            totalReclamations,
            totalRemboursements,
            totalAcceptedCash,
            totalPendingCash,
            totalRefusedCash,
            reclamationsByStatus,
            distributionByType,
            monthlyData,
            growth
        });
    } catch (error) {
        console.error('Erreur getAdminStats:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des statistiques.' });
    }
};

module.exports = {
    getAdminStats
};
