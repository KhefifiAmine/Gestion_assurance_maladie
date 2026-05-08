const { User, BulletinSoin, Reclamation, FraudAlert, sequelize } = require('../../models');
const { Op, QueryTypes } = require('sequelize');

const STATUT_LABELS = { 0: 'En attente', 1: 'En cours', 2: 'Accepté', 3: 'Refusé' };

function buildBiInsights({
    totalBulletins,
    acceptanceRatePct,
    refusalRatePct,
    reclamationRatio,
    avgConfiance,
    suspicionLocalePct,
    totalAcceptedCash,
    totalRemboursements,
}) {
    const insights = [];
    if (totalBulletins > 0 && acceptanceRatePct < 35) {
        insights.push({
            type: 'warning',
            text: `Taux d'acceptation faible (${acceptanceRatePct.toFixed(1)} % des bulletins). Vérifier les motifs de refus et la qualité des dossiers.`,
        });
    }
    if (totalBulletins > 0 && refusalRatePct > 25) {
        insights.push({
            type: 'alert',
            text: `Part élevée de bulletins refusés (${refusalRatePct.toFixed(1)} %). Analyse ciblée recommandée.`,
        });
    }
    if (reclamationRatio > 0.15) {
        insights.push({
            type: 'info',
            text: `Ratio réclamations / bulletins élevé (${(reclamationRatio * 100).toFixed(1)} %). Suivre le traitement du contentieux.`,
        });
    }
    if (avgConfiance != null && avgConfiance < 70) {
        insights.push({
            type: 'info',
            text: `Score de confiance IA moyen bas (${avgConfiance.toFixed(0)} / 100). Contrôles documentaires renforcés possibles.`,
        });
    }
    if (suspicionLocalePct > 10) {
        insights.push({
            type: 'warning',
            text: `${suspicionLocalePct.toFixed(1)} % des bulletins portent une suspicion locale (document).`,
        });
    }
    if (totalRemboursements > 0 && totalAcceptedCash / totalRemboursements < 0.4) {
        insights.push({
            type: 'info',
            text: 'Moins de 40 % du volume déclaré correspond à des dossiers acceptés (montants cumulés).',
        });
    }
    if (insights.length === 0) {
        insights.push({
            type: 'success',
            text: 'Aucun signal critique sur les indicateurs suivis. Continuer la surveillance.',
        });
    }
    return insights.slice(0, 6);
}

const getAdminStats = async (req, res) => {
    try {
        // Total stats
        const totalUsers = await User.count();
        const totalBulletins = await BulletinSoin.count();
        const totalReclamations = await Reclamation.count();
        
        // Financials (sum of montant_total_remboursé by status)
        const totalRemboursements = await BulletinSoin.sum('montant_total_remboursé') || 0; 
        const totalAcceptedCash = await BulletinSoin.sum('montant_total_remboursé', { where: { statut: 2 } }) || 0;
        const totalPendingCash = await BulletinSoin.sum('montant_total_remboursé', { where: { statut: [0, 1] } }) || 0;
        const totalRefusedCash = await BulletinSoin.sum('montant_total_remboursé', { where: { statut: 3 } }) || 0;
        
        // Distribution par cadre de soins (remplace l'ancien type_dossier supprimé du schéma)
        const distributionByType = await BulletinSoin.findAll({
            attributes: [
                'soins_cadre',
                [sequelize.fn('COUNT', sequelize.col('BulletinSoin.id')), 'count'],
                [sequelize.fn('SUM', sequelize.col('montant_total')), 'totalAmount']
            ],
            group: ['soins_cadre']
        });

        const distributionCadreSoins = distributionByType.map((row) => {
            const plain = row.get ? row.get({ plain: true }) : row;
            const label = plain.soins_cadre == null || plain.soins_cadre === ''
                ? 'Non renseigné'
                : String(plain.soins_cadre);
            return {
                label,
                key: plain.soins_cadre ?? '_empty',
                count: Number(plain.count || 0),
                totalAmount: Number(plain.totalAmount || 0),
            };
        });

        // Pipeline décisionnel : volumes par statut
        const pipelineRaw = await BulletinSoin.findAll({
            attributes: [
                'statut',
                [sequelize.fn('COUNT', sequelize.col('BulletinSoin.id')), 'count'],
                [sequelize.fn('SUM', sequelize.col('montant_total')), 'volumeMontant'],
                [sequelize.fn('AVG', sequelize.col('montant_total')), 'panierMoyen'],
            ],
            group: ['statut'],
            raw: true,
        });

        const pipelineByStatus = pipelineRaw.map((r) => ({
            statut: r.statut,
            label: STATUT_LABELS[r.statut] || `Statut ${r.statut}`,
            count: Number(r.count || 0),
            volumeMontant: Number(r.volumeMontant || 0),
            panierMoyen: Number(Number(r.panierMoyen || 0).toFixed(3)),
        }));

        const countByStatut = Object.fromEntries(pipelineByStatus.map((p) => [p.statut, p.count]));
        const acceptedN = countByStatut[2] || 0;
        const refusedN = countByStatut[3] || 0;
        const pendingN = (countByStatut[0] || 0) + (countByStatut[1] || 0);
        const acceptanceRatePct = totalBulletins > 0 ? (100 * acceptedN) / totalBulletins : 0;
        const refusalRatePct = totalBulletins > 0 ? (100 * refusedN) / totalBulletins : 0;
        const pendingRatePct = totalBulletins > 0 ? (100 * pendingN) / totalBulletins : 0;

        // Top adhérents par volume déclaré (BI commercial / risque)
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
        const topUsers = topUserIds.length
            ? await User.findAll({
                where: { id: topUserIds },
                attributes: ['id', 'nom', 'prenom', 'matricule'],
            })
            : [];
        const userMap = new Map(topUsers.map((u) => [u.id, u]));
        const topAdherentsBySpend = topAdherentRows.map((r) => {
            const u = userMap.get(r.userId);
            return {
                userId: r.userId,
                nom: u ? `${u.prenom} ${u.nom}`.trim() : `Utilisateur #${r.userId}`,
                matricule: u?.matricule || null,
                bulletinCount: Number(r.bulletinCount || 0),
                totalMontant: Number(r.totalMontant || 0),
            };
        });

        // Qualité dossiers (scores IA / fraude)
        const avgConfRow = await BulletinSoin.findOne({
            attributes: [[sequelize.fn('AVG', sequelize.col('confiance_score')), 'avgConf']],
            raw: true,
        });
        const avgFraudAll = await BulletinSoin.findOne({
            attributes: [[sequelize.fn('AVG', sequelize.col('fraud_score')), 'avgFraud']],
            raw: true,
        });
        const suspicionLocaleCount = await BulletinSoin.count({ where: { suspicion_locale: true } });
        const avgConfiance = avgConfRow?.avgConf != null ? Number(avgConfRow.avgConf) : null;
        const avgFraudGlobal = avgFraudAll?.avgFraud != null ? Number(avgFraudAll.avgFraud) : 0;
        const suspicionLocalePct = totalBulletins > 0 ? (100 * suspicionLocaleCount) / totalBulletins : 0;

        let avgProcessingHours = null;
        try {
            const [delayRow] = await sequelize.query(
                `SELECT AVG(TIMESTAMPDIFF(HOUR, \`createdAt\`, \`date_traitement\`)) AS avgHours
                 FROM bulletin_soins
                 WHERE \`date_traitement\` IS NOT NULL AND \`statut\` IN (2, 3)`,
                { type: QueryTypes.SELECT }
            );
            if (delayRow && delayRow.avgHours != null) {
                avgProcessingHours = Math.round(Number(delayRow.avgHours) * 10) / 10;
            }
        } catch {
            avgProcessingHours = null;
        }

        const reclamationRatio = totalBulletins > 0 ? totalReclamations / totalBulletins : 0;

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

            const monthBulletinsAcceptes = await BulletinSoin.count({
                where: {
                    createdAt: { [Op.between]: [startOfMonth, endOfMonth] },
                    statut: 2,
                },
            });

            const monthCashAccepte = await BulletinSoin.sum('montant_total', {
                where: {
                    createdAt: { [Op.between]: [startOfMonth, endOfMonth] },
                    statut: 2,
                },
            }) || 0;

            monthlyData.push({
                name: startOfMonth.toLocaleString('fr-FR', { month: 'short' }),
                bulletins: monthBulletins,
                reclamations: monthReclamations,
                cash: monthCash,
                bulletinsAcceptes: monthBulletinsAcceptes,
                cashAccepte: monthCashAccepte,
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

        const adherentsFraudRaw = await FraudAlert.findAll({
            where: { entity_type: 'adherent' },
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

        const topSuspectAdherents = adherentsFraudRaw.map((item) => ({
            adherentId: item.entity_id,
            nom: `Adherent #${item.entity_id}`,
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

        const biInsights = buildBiInsights({
            totalBulletins,
            acceptanceRatePct,
            refusalRatePct,
            reclamationRatio,
            avgConfiance,
            suspicionLocalePct,
            totalAcceptedCash,
            totalRemboursements,
        });

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
                topSuspectAdherents,
                topSuspectDoctors: topSuspectAdherents,
                fraudMonthlyTrend
            },
            bi: {
                pipelineByStatus,
                acceptanceRatePct: Math.round(acceptanceRatePct * 10) / 10,
                refusalRatePct: Math.round(refusalRatePct * 10) / 10,
                pendingRatePct: Math.round(pendingRatePct * 10) / 10,
                distributionCadreSoins,
                topAdherentsBySpend,
                dossierQuality: {
                    avgConfianceScore: avgConfiance != null ? Math.round(avgConfiance * 10) / 10 : null,
                    avgFraudScore: Math.round(avgFraudGlobal * 10) / 10,
                    suspicionLocalePct: Math.round(suspicionLocalePct * 10) / 10,
                },
                reclamationRatio: Math.round(reclamationRatio * 1000) / 1000,
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
