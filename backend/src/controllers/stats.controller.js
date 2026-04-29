const { User, BulletinSoin, Reclamation, FraudAlert, Medecin, sequelize } = require('../../models');
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

        // ===== FRAUDE DASHBOARD =====
        const activeAlertsCount = await FraudAlert.count({ where: { statut: 'active' } });
        const highRiskAlertsCount = await FraudAlert.count({ where: { statut: 'active', score: { [Op.gte]: 80 } } });

        const activeAlerts = await FraudAlert.findAll({
            where: { statut: 'active' },
            order: [['createdAt', 'DESC']],
            limit: 10
        });

        const doctorsFraudRaw = await FraudAlert.findAll({
            where: { entity_type: 'medecin' },
            attributes: [
                'entity_id',
                [sequelize.fn('MAX', sequelize.col('score')), 'maxScore'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'alertsCount']
            ],
            group: ['entity_id'],
            order: [[sequelize.literal('maxScore'), 'DESC']],
            limit: 10,
            raw: true
        });

        const doctorIds = doctorsFraudRaw.map((d) => d.entity_id);
        const doctors = doctorIds.length > 0
            ? await Medecin.findAll({ where: { id_medecin: { [Op.in]: doctorIds } }, raw: true })
            : [];
        const doctorsMap = new Map(doctors.map((d) => [d.id_medecin, d]));

        const topSuspectDoctors = doctorsFraudRaw.map((item) => ({
            medecinId: item.entity_id,
            nom: doctorsMap.get(item.entity_id)?.nom_prenom || `Medecin #${item.entity_id}`,
            specialite: doctorsMap.get(item.entity_id)?.specialite || '',
            score: Number(item.maxScore || 0),
            alertsCount: Number(item.alertsCount || 0),
        }));

        const fraudMonthlyTrend = [];
        for (let i = 5; i >= 0; i--) {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
            const avgFraud = await BulletinSoin.findOne({
                attributes: [[sequelize.fn('AVG', sequelize.col('fraud_score')), 'avgFraud']],
                where: { createdAt: { [Op.between]: [startOfMonth, endOfMonth] } },
                raw: true
            });
            const alerts = await FraudAlert.count({
                where: { createdAt: { [Op.between]: [startOfMonth, endOfMonth] } }
            });
            fraudMonthlyTrend.push({
                name: startOfMonth.toLocaleString('fr-FR', { month: 'short' }),
                avgFraudScore: Number(avgFraud?.avgFraud || 0),
                alerts
            });
        }

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
            growth,
            fraud: {
                activeAlertsCount,
                highRiskAlertsCount,
                activeAlerts,
                topSuspectDoctors,
                fraudMonthlyTrend
            }
        });
    } catch (error) {
        console.error('Erreur getAdminStats:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des statistiques.' });
    }
};

module.exports = {
    getAdminStats
};
