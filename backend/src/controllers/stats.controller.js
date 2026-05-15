const { User, BulletinSoin, Reclamation, FraudAlert, ActeMedical, sequelize } = require('../../models');
const { Op, QueryTypes } = require('sequelize');

const STATUT_LABELS = { 0: 'En attente', 1: 'En cours', 2: 'Traité' };

function buildBiInsights({
    totalBulletins,
    acceptanceRatePct,
    refusalRatePct,
    reclamationRatio,
    avgConfiance,
    suspicionLocalePct,
    totalAcceptedCash,
    totalDeclaredCash,
}) {
    const insights = [];
    if (totalBulletins > 0 && acceptanceRatePct < 40) {
        insights.push({
            type: 'warning',
            text: `Taux d'acceptation faible (${acceptanceRatePct.toFixed(1)} % des dossiers). Vérifier la qualité des justificatifs.`,
        });
    }
    if (totalDeclaredCash > 0 && totalAcceptedCash / totalDeclaredCash < 0.3) {
        insights.push({
            type: 'alert',
            text: `Le taux de remboursement financier est bas (${((totalAcceptedCash/totalDeclaredCash)*100).toFixed(1)}%). Beaucoup d'actes sont hors plafonds.`,
        });
    }
    if (reclamationRatio > 0.10) {
        insights.push({
            type: 'info',
            text: `Ratio réclamations élevé (${(reclamationRatio * 100).toFixed(1)} %). Possible mécontentement sur les délais ou montants.`,
        });
    }
    if (avgConfiance != null && avgConfiance < 70) {
        insights.push({
            type: 'info',
            text: `Score de confiance IA moyen bas (${avgConfiance.toFixed(0)} / 100). Risque de fraude accru.`,
        });
    }
    if (suspicionLocalePct > 15) {
        insights.push({
            type: 'warning',
            text: `${suspicionLocalePct.toFixed(1)} % de suspicions sur l'intégrité des documents physiques.`,
        });
    }
    if (insights.length === 0) {
        insights.push({
            type: 'success',
            text: 'Indicateurs au vert. Le flux de traitement est nominal.',
        });
    }
    return insights.slice(0, 6);
}

const getAdminStats = async (req, res) => {
    try {
        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

        // 1. Volumes globaux
        const totalUsers = await User.count();
        const totalBulletins = await BulletinSoin.count();
        const totalReclamations = await Reclamation.count();
        
        // 2. Financier
        const totalDeclaredCash = await BulletinSoin.sum('montant_total') || 0;
        const totalAcceptedCash = await BulletinSoin.sum('montant_total_remboursé') || 0; 
        const totalRefusedCash = await BulletinSoin.sum('montant_total', { where: { statut: 2 } }) - 
                                  await BulletinSoin.sum('montant_total_remboursé', { where: { statut: 2 } }) || 0;
        
        // 3. Distribution par Cadre de Soins
        const distributionByType = await BulletinSoin.findAll({
            attributes: [
                'soins_cadre',
                [sequelize.fn('COUNT', sequelize.col('BulletinSoin.id')), 'count'],
                [sequelize.fn('SUM', sequelize.col('montant_total')), 'totalAmount']
            ],
            group: ['soins_cadre'],
            raw: true
        });

        const distributionCadreSoins = distributionByType.map((plain) => ({
            label: plain.soins_cadre || 'Standard',
            key: plain.soins_cadre || '_empty',
            count: Number(plain.count || 0),
            totalAmount: Number(plain.totalAmount || 0),
        }));

        // 4. Pipeline par statut
        const pipelineRaw = await BulletinSoin.findAll({
            attributes: [
                'statut',
                [sequelize.fn('COUNT', sequelize.col('BulletinSoin.id')), 'count'],
                [sequelize.fn('SUM', sequelize.col('montant_total')), 'volumeMontant'],
            ],
            group: ['statut'],
            raw: true,
        });

        const pipelineByStatus = pipelineRaw.map((r) => ({
            statut: r.statut,
            label: STATUT_LABELS[r.statut] || `Autre`,
            count: Number(r.count || 0),
            volumeMontant: Number(r.volumeMontant || 0),
        }));

        const countByStatut = Object.fromEntries(pipelineByStatus.map((p) => [p.statut, p.count]));
        const acceptedN = countByStatut[2] || 0;
        const pendingN = (countByStatut[0] || 0) + (countByStatut[1] || 0);
        
        const acceptanceRatePct = totalBulletins > 0 ? (100 * acceptedN) / totalBulletins : 0;
        const pendingRatePct = totalBulletins > 0 ? (100 * pendingN) / totalBulletins : 0;

        // 5. Top Adhérents
        const topAdherentRows = await BulletinSoin.findAll({
            attributes: [
                'userId',
                [sequelize.fn('COUNT', sequelize.col('BulletinSoin.id')), 'bulletinCount'],
                [sequelize.fn('SUM', sequelize.col('montant_total')), 'totalMontant'],
            ],
            group: ['userId'],
            order: [[sequelize.literal('SUM(`montant_total`)'), 'DESC']],
            limit: 5,
            raw: true,
        });
        const topUserIds = topAdherentRows.map((r) => r.userId).filter(Boolean);
        const topUsers = await User.findAll({
            where: { id: topUserIds },
            attributes: ['id', 'nom', 'prenom', 'matricule'],
        });
        const userMap = new Map(topUsers.map((u) => [u.id, u]));
        const topAdherentsBySpend = topAdherentRows.map((r) => {
            const u = userMap.get(r.userId);
            return {
                nom: u ? `${u.prenom} ${u.nom}` : `ID: ${r.userId}`,
                matricule: u?.matricule,
                count: Number(r.bulletinCount),
                total: Number(r.totalMontant),
            };
        });

        // 6. Qualité et IA
        const qualityStats = await BulletinSoin.findOne({
            attributes: [
                [sequelize.fn('AVG', sequelize.col('confiance_score')), 'avgConf'],
                [sequelize.fn('AVG', sequelize.col('fraud_score')), 'avgFraud'],
                [sequelize.fn('SUM', sequelize.literal('CASE WHEN suspicion_locale = 1 THEN 1 ELSE 0 END')), 'suspicionCount']
            ],
            raw: true
        });
        const avgConfiance = Number(qualityStats?.avgConf || 0);
        const avgFraudGlobal = Number(qualityStats?.avgFraud || 0);
        const suspicionLocalePct = totalBulletins > 0 ? (100 * Number(qualityStats?.suspicionCount || 0)) / totalBulletins : 0;

        // 7. Délai de traitement (Heures)
        let avgProcessingHours = null;
        try {
            const [delayRow] = await sequelize.query(
                `SELECT AVG(TIMESTAMPDIFF(HOUR, \`createdAt\`, \`date_validation\`)) AS avgHours
                 FROM bulletin_soins
                 WHERE \`date_validation\` IS NOT NULL AND \`statut\` = 2`,
                { type: QueryTypes.SELECT }
            );
            avgProcessingHours = delayRow?.avgHours ? Math.round(Number(delayRow.avgHours) * 10) / 10 : 0;
        } catch { avgProcessingHours = 0; }

        // 8. Réclamations
        const reclamationsByStatus = {
            ouvertes: await Reclamation.count({ where: { statut: 'Ouverte' } }),
            enCours: await Reclamation.count({ where: { statut: 'En cours' } }),
            traitees: await Reclamation.count({ where: { statut: 'Traitée' } }),
        };

        // 9. Données mensuelles optimisées (Une seule requête groupée)
        const monthlyRaw = await BulletinSoin.findAll({
            attributes: [
                [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m'), 'month'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
                [sequelize.fn('SUM', sequelize.col('montant_total')), 'total'],
                [sequelize.fn('SUM', sequelize.col('montant_total_remboursé')), 'remboursé']
            ],
            where: { createdAt: { [Op.gte]: sixMonthsAgo } },
            group: [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m')],
            order: [[sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m'), 'ASC']],
            raw: true
        });

        const monthlyData = monthlyRaw.map(m => ({
            name: m.month,
            bulletins: Number(m.count),
            cash: Number(m.total),
            remboursé: Number(m.remboursé)
        }));

        // 10. Fraude & Suspicion Médecins
        const activeAlerts = await FraudAlert.findAll({
            where: { statut: 'active' },
            order: [['createdAt', 'DESC']],
            limit: 5
        });

        // Top Médecins suspects (Calculé via ActeMedical MF)
        const topSuspectDoctorsRaw = await ActeMedical.findAll({
            attributes: [
                'identifiant_unique_mf',
                [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('bulletinId'))), 'bulletinCount'],
                [sequelize.fn('SUM', sequelize.col('honoraires')), 'totalHonoraires']
            ],
            where: { identifiant_unique_mf: { [Op.ne]: null } },
            group: ['identifiant_unique_mf'],
            order: [[sequelize.literal('bulletinCount'), 'DESC']],
            limit: 5,
            raw: true
        });

        const topSuspectDoctors = topSuspectDoctorsRaw.map(d => ({
            mf: d.identifiant_unique_mf,
            count: Number(d.bulletinCount),
            total: Number(d.totalHonoraires)
        }));

        const biInsights = buildBiInsights({
            totalBulletins,
            acceptanceRatePct,
            refusalRatePct: 100 - acceptanceRatePct,
            reclamationRatio: totalReclamations / (totalBulletins || 1),
            avgConfiance,
            suspicionLocalePct,
            totalAcceptedCash,
            totalDeclaredCash,
        });

        res.status(200).json({
            totalUsers,
            totalBulletins,
            totalReclamations,
            totalDeclaredCash,
            totalAcceptedCash,
            totalRefusedCash,
            reclamationsByStatus,
            monthlyData,
            fraud: {
                activeAlertsCount: await FraudAlert.count({ where: { statut: 'active' } }),
                activeAlerts,
                topSuspectDoctors
            },
            bi: {
                pipelineByStatus,
                acceptanceRatePct: Math.round(acceptanceRatePct * 10) / 10,
                distributionCadreSoins,
                topAdherentsBySpend,
                dossierQuality: {
                    avgConfianceScore: Math.round(avgConfiance * 10) / 10,
                    avgFraudScore: Math.round(avgFraudGlobal * 10) / 10,
                    suspicionLocalePct: Math.round(suspicionLocalePct * 10) / 10,
                },
                avgProcessingHours,
                insights: biInsights,
            },
        });
    } catch (error) {
        console.error('Erreur getAdminStats:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des statistiques.' });
    }
};

module.exports = {
    getAdminStats
};
