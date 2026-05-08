const { BulletinSoin, ActeMedical, User, FraudAlert, sequelize } = require('../../models');
const { Op } = require('sequelize');

class FraudService {

    static scoreFromThreshold(value, warnThreshold, highThreshold) {
        if (value >= highThreshold) return 100;
        if (value >= warnThreshold) return 60;
        return 0;
    }

    static async analyzeSqlRules(bulletin) {
        let sqlRulesScore = 0;
        const reasons = [];
        const metrics = {
            nb_patients_jour: 0,
            repetition_montant: 0,
            frequence_adherent_7j: 0,
            frequence_adherent_30j: 0,
        };

        const depotDay = bulletin.date_depot
            ? String(bulletin.date_depot).slice(0, 10)
            : (bulletin.createdAt ? new Date(bulletin.createdAt).toISOString().slice(0, 10) : null);
        const date30DaysAgo = new Date();
        date30DaysAgo.setDate(date30DaysAgo.getDate() - 30);
        const date7DaysAgo = new Date();
        date7DaysAgo.setDate(date7DaysAgo.getDate() - 7);

        if (depotDay) {
            const uniquePatients = await BulletinSoin.count({
                distinct: true,
                col: 'userId',
                where: { date_depot: depotDay }
            });
            metrics.nb_patients_jour = uniquePatients;
            const doctorFrequencyScore = this.scoreFromThreshold(uniquePatients, 20, 35);
            if (doctorFrequencyScore > 0) {
                sqlRulesScore += doctorFrequencyScore;
                reasons.push(`Frequence medecin elevee (${uniquePatients} patients/jour).`);
            }

            const repeatedAmount = await BulletinSoin.count({
                where: {
                    montant_total: bulletin.montant_total,
                    createdAt: { [Op.gte]: date30DaysAgo }
                }
            });
            metrics.repetition_montant = repeatedAmount;
            const repetitionScore = this.scoreFromThreshold(repeatedAmount, 3, 6);
            if (repetitionScore > 0) {
                sqlRulesScore += repetitionScore;
                reasons.push(`Montants repetes suspects (${repeatedAmount} occurrences sur 30 jours).`);
            }
        }

        const bulletinsWeek = await BulletinSoin.count({
            where: { userId: bulletin.userId, createdAt: { [Op.gte]: date7DaysAgo } },
        });
        metrics.frequence_adherent_7j = bulletinsWeek;
        const adhWeeklyScore = this.scoreFromThreshold(bulletinsWeek, 5, 8);
        if (adhWeeklyScore > 0) {
            sqlRulesScore += adhWeeklyScore;
            reasons.push(`Adherent hyperactif (${bulletinsWeek} bulletins en 7 jours).`);
        }

        const bulletinsMonth = await BulletinSoin.count({
            where: { userId: bulletin.userId, createdAt: { [Op.gte]: date30DaysAgo } },
        });
        metrics.frequence_adherent_30j = bulletinsMonth;

        return {
            score: Math.min(100, Math.round(sqlRulesScore / 3)),
            reasons,
            metrics,
        };
    }

    static async analyzeGlobalAnomaly(bulletin) {
        const refDate = bulletin.date_depot
            ? new Date(bulletin.date_depot)
            : (bulletin.createdAt ? new Date(bulletin.createdAt) : new Date());
        const depotDayStr = bulletin.date_depot
            ? String(bulletin.date_depot).slice(0, 10)
            : refDate.toISOString().slice(0, 10);

        const startMonth = new Date(refDate.getFullYear(), refDate.getMonth(), 1);

        const dayStats = await BulletinSoin.findOne({
            attributes: [
                [sequelize.fn('COUNT', sequelize.col('BulletinSoin.id')), 'nb_actes'],
                [sequelize.fn('SUM', sequelize.col('BulletinSoin.montant_total')), 'montant_total_jour'],
                [sequelize.fn('AVG', sequelize.col('BulletinSoin.montant_total')), 'montant_moyen'],
                [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('BulletinSoin.userId'))), 'nb_patients_jour'],
            ],
            where: { date_depot: depotDayStr },
            raw: true,
        });

        const monthlyFrequency = await BulletinSoin.count({
            where: { createdAt: { [Op.gte]: startMonth } }
        });

        const baselineWhere = bulletin.soins_cadre != null && bulletin.soins_cadre !== ''
            ? { soins_cadre: bulletin.soins_cadre }
            : {};

        const globalBaseline = await BulletinSoin.findOne({
            attributes: [
                [sequelize.fn('AVG', sequelize.col('montant_total')), 'avgMontant'],
                [sequelize.fn('STDDEV_POP', sequelize.col('montant_total')), 'stdMontant'],
            ],
            where: baselineWhere,
            raw: true,
        });

        const features = {
            nb_patients_jour: Number(dayStats?.nb_patients_jour || 0),
            nb_actes: Number(dayStats?.nb_actes || 0),
            montant_total_jour: Number(dayStats?.montant_total_jour || 0),
            montant_moyen: Number(dayStats?.montant_moyen || 0),
            nb_patients_uniques: Number(dayStats?.nb_patients_jour || 0),
            frequence_mensuelle: Number(monthlyFrequency || 0),
        };

        let anomalyScore = 0;
        const reasons = [];
        if (features.nb_patients_jour >= 30) {
            anomalyScore += 35;
            reasons.push(`Anomalie IA: volume patients anormal (${features.nb_patients_jour}/jour).`);
        }
        if (features.frequence_mensuelle >= 120) {
            anomalyScore += 25;
            reasons.push(`Anomalie IA: frequence mensuelle elevee (${features.frequence_mensuelle}/mois).`);
        }

        const avg = Number(globalBaseline?.avgMontant || 0);
        const std = Number(globalBaseline?.stdMontant || 0);
        if (avg > 0 && bulletin.montant_total > avg + (2 * (std || avg * 0.25))) {
            anomalyScore += 40;
            reasons.push('Anomalie IA: montant total tres au-dessus de la distribution habituelle.');
        }

        return { score: Math.min(100, anomalyScore), reasons, features };
    }

    static async calculateFraudScore(bulletinId) {
        const bulletin = await BulletinSoin.findByPk(bulletinId, {
            include: [
                { model: ActeMedical, as: 'actes' }
            ]
        });

        if (!bulletin) return { score: 0, reasons: [], details: null };

        const sqlResult = await this.analyzeSqlRules(bulletin);
        const anomalyResult = await this.analyzeGlobalAnomaly(bulletin);
        const localScore = bulletin.suspicion_locale ? 100 : 0;

        const finalScore = Math.min(
            100,
            Math.round((localScore * 0.2) + (anomalyResult.score * 0.5) + (sqlResult.score * 0.3))
        );

        const reasons = [
            ...sqlResult.reasons,
            ...anomalyResult.reasons,
            ...(bulletin.suspicion_locale ? ['Suspicion locale detectee sur le document.'] : []),
        ];

        await bulletin.update({ fraud_score: finalScore });

        if (finalScore >= 50) {
            await this.createAlert(
                'adherent',
                bulletin.userId,
                finalScore,
                reasons.join(' | ') || 'Suspicion de fraude detectee par le moteur.'
            );
        }

        return {
            score: finalScore,
            reasons,
            details: {
                localScore,
                sqlRulesScore: sqlResult.score,
                anomalyScore: anomalyResult.score,
                sqlMetrics: sqlResult.metrics,
                anomalyFeatures: anomalyResult.features,
            },
        };
    }

    static async createAlert(type, id, score, reason) {
        // Vérifier si une alerte active existe déjà pour éviter les doublons
        const existing = await FraudAlert.findOne({
            where: {
                entity_type: type,
                entity_id: id,
                statut: 'active'
            }
        });

        if (!existing) {
            await FraudAlert.create({
                entity_type: type,
                entity_id: id,
                score,
                reason
            });
        }
    }
}

module.exports = FraudService;
