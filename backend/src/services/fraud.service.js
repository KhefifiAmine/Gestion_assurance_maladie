const { BulletinSoin, ActeMedical, User, FraudAlert, Prestataire, ActePharmacie, Medicament, sequelize } = require('../../models');
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
            duplicates_detected: 0,
            doctor_concentration: 0,
            nomadisme_medical: 0,
            trafic_medicaments: 0
        };

        const date30DaysAgo = new Date();
        date30DaysAgo.setDate(date30DaysAgo.getDate() - 30);
        const date7DaysAgo = new Date();
        date7DaysAgo.setDate(date7DaysAgo.getDate() - 7);

        // 1. Fréquence Adhérent (7j et 30j)
        const bulletinsWeek = await BulletinSoin.count({
            where: { userId: bulletin.userId, createdAt: { [Op.gte]: date7DaysAgo } },
        });
        metrics.frequence_adherent_7j = bulletinsWeek;
        if (bulletinsWeek >= 5) {
            sqlRulesScore += bulletinsWeek >= 8 ? 60 : 30;
            reasons.push(`Activité intense de l'adhérent (${bulletinsWeek} bulletins en 7 jours).`);
        }

        const bulletinsMonth = await BulletinSoin.count({
            where: { userId: bulletin.userId, createdAt: { [Op.gte]: date30DaysAgo } },
        });
        metrics.frequence_adherent_30j = bulletinsMonth;

        // 2. Détection de Doublons (Actes identiques pour le même bénéficiaire)
        if (bulletin.actes && bulletin.actes.length > 0) {
            for (const acte of bulletin.actes) {
                const duplicateCount = await ActeMedical.count({
                    include: [{
                        model: BulletinSoin,
                        where: {
                            beneficiaireId: bulletin.beneficiaireId,
                            id: { [Op.ne]: bulletin.id }
                        }
                    }],
                    where: {
                        date_acte: acte.date_acte,
                        acte: acte.acte,
                        honoraires: acte.honoraires,
                        identifiant_unique_mf: acte.identifiant_unique_mf,
                        statut: { [Op.ne]: 2 } // Non rejeté
                    }
                });

                if (duplicateCount > 0) {
                    metrics.duplicates_detected++;
                    sqlRulesScore += 100;
                    reasons.push(`Acte médical potentiellement déjà soumis le ${acte.date_acte} (Doublon suspect).`);
                    break;
                }
            }
        }

        // 3. Concentration Médecin (Un même médecin pour beaucoup de patients différents)
        const doctorMFs = [...new Set((bulletin.actes || []).map(a => a.identifiant_unique_mf).filter(mf => !!mf))];
        for (const mf of doctorMFs) {
            const uniquePatientsForDoctor = await BulletinSoin.count({
                distinct: true,
                col: 'userId',
                include: [{
                    model: ActeMedical,
                    as: 'actes',
                    where: { identifiant_unique_mf: mf }
                }],
                where: {
                    createdAt: { [Op.gte]: date30DaysAgo }
                }
            });

            metrics.doctor_concentration = Math.max(metrics.doctor_concentration, uniquePatientsForDoctor);
            if (uniquePatientsForDoctor >= 15) {
                sqlRulesScore += uniquePatientsForDoctor >= 30 ? 70 : 40;
                reasons.push(`Médecin (MF: ${mf}) anormalement sollicité (${uniquePatientsForDoctor} adhérents différents en 30j).`);
            }
        }

        // 4. Répétition de montants totaux (Sur 30 jours)
        const repeatedAmount = await BulletinSoin.count({
            where: {
                montant_total: bulletin.montant_total,
                userId: bulletin.userId,
                id: { [Op.ne]: bulletin.id },
                createdAt: { [Op.gte]: date30DaysAgo }
            }
        });
        metrics.repetition_montant = repeatedAmount;
        if (repeatedAmount >= 2) {
            sqlRulesScore += repeatedAmount >= 4 ? 50 : 25;
            reasons.push(`Répétition suspecte du montant total (${bulletin.montant_total} TND) par l'adhérent.`);
        }

        // 5. Nomadisme Médical (Doctor Shopping)
        // Détecte un adhérent qui consulte plusieurs médecins de la même spécialité
        const specialitesActuelles = [...new Set(
            (bulletin.actes || [])
                .map(a => a.prestataire?.specialite)
                .filter(s => !!s)
        )];

        for (const specialite of specialitesActuelles) {
            const matches = await ActeMedical.findAll({
                attributes: ['prestataireId'],
                include: [
                    {
                        model: BulletinSoin,
                        attributes: ['id'],
                        where: {
                            userId: bulletin.userId,
                            createdAt: { [Op.gte]: date30DaysAgo }
                        }
                    },
                    {
                        model: Prestataire,
                        as: 'prestataire',
                        attributes: ['id', 'specialite'],
                        where: { specialite },
                        required: true
                    }
                ]
            });
            const distinctDoctors = new Set(matches.map(m => m.prestataireId).filter(id => id !== null)).size;

            if (distinctDoctors >= 3) {
                const scoreAjout = distinctDoctors >= 5 ? 70 : 40;
                sqlRulesScore += scoreAjout;
                metrics.nomadisme_medical = Math.max(metrics.nomadisme_medical, distinctDoctors);
                reasons.push(`Nomadisme médical détecté : ${distinctDoctors} médecin(s) différent(s) en "${specialite}" consultés en 30 jours.`);
            }
        }

        // 6. Pharmacie de Complaisance / Trafic de médicaments
        // Détecte le rachat précoce ou répétitif de médicaments par un adhérent
        if (bulletin.pharmacie && bulletin.pharmacie.medicaments && bulletin.pharmacie.medicaments.length > 0) {
            for (const med of bulletin.pharmacie.medicaments) {
                // Chercher les achats récents du même médicament par le même adhérent
                const recentPurchases = await Medicament.findAll({
                    include: [
                        {
                            model: ActePharmacie,
                            as: 'pharmacie',
                            include: [
                                {
                                    model: BulletinSoin,
                                    where: {
                                        userId: bulletin.userId,
                                        id: { [Op.ne]: bulletin.id }, // Exclure le bulletin actuel
                                        createdAt: { [Op.gte]: date30DaysAgo }
                                    }
                                }
                            ],
                            required: true
                        }
                    ],
                    where: {
                        nom_medicament: med.nom_medicament
                    }
                });

                if (recentPurchases.length > 0) {
                    let mostRecentDate = null;
                    for (const rp of recentPurchases) {
                        const dateDepot = rp.pharmacie?.BulletinSoin?.createdAt || rp.createdAt;
                        if (!mostRecentDate || dateDepot > mostRecentDate) {
                            mostRecentDate = new Date(dateDepot);
                        }
                    }

                    if (mostRecentDate) {
                        const diffTime = Math.abs(new Date() - mostRecentDate);
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                        // Si racheté à moins de 15 jours d'intervalle
                        if (diffDays <= 15) {
                            const scoreAjout = recentPurchases.length >= 2 ? 80 : 40;
                            sqlRulesScore += scoreAjout;
                            metrics.trafic_medicaments = Math.max(metrics.trafic_medicaments, recentPurchases.length + 1);

                            const msg = recentPurchases.length >= 2
                                ? `Trafic de médicaments suspecté : Le médicament "${med.nom_medicament}" a été acheté ${recentPurchases.length + 1} fois au cours des 30 derniers jours.`
                                : `Cumul suspect de traitement : Le médicament "${med.nom_medicament}" a été racheté seulement ${diffDays} jour(s) après le précédent achat.`;

                            reasons.push(msg);
                        }
                    }
                }
            }
        }

        return {
            score: Math.min(100, sqlRulesScore),
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
            frequence_mensuelle: Number(monthlyFrequency || 0),
            submission_hour: new Date(bulletin.createdAt || Date.now()).getHours()
        };

        let anomalyScore = 0;
        const reasons = [];

        // 1. Volume de patients anormal
        if (features.nb_patients_jour >= 30) {
            anomalyScore += features.nb_patients_jour >= 50 ? 50 : 25;
            reasons.push(`Anomalie IA: volume patients élevé (${features.nb_patients_jour}/jour).`);
        }

        // 2. Fréquence mensuelle élevée
        if (features.frequence_mensuelle >= 150) {
            anomalyScore += 20;
            reasons.push(`Anomalie IA: pic de fréquence mensuelle détecté.`);
        }

        // 3. Heure de soumission suspecte (00h - 05h)
        if (features.submission_hour >= 0 && features.submission_hour <= 5) {
            anomalyScore += 15;
            reasons.push(`Soumission en horaire inhabituel (${features.submission_hour}h).`);
        }

        // 4. Montant Outlier (Z-score > 2.5)
        const avg = Number(globalBaseline?.avgMontant || 0);
        const std = Number(globalBaseline?.stdMontant || 0);
        if (avg > 0 && std > 0) {
            const zScore = (bulletin.montant_total - avg) / std;
            if (zScore > 2.5) {
                anomalyScore += zScore > 4 ? 60 : 35;
                reasons.push(`Anomalie IA: montant total statistiquement hors norme (Z-score: ${zScore.toFixed(2)}).`);
            }
        }

        return { score: Math.min(100, anomalyScore), reasons, features };
    }

    static async calculateFraudScore(bulletinId) {
        const bulletin = await BulletinSoin.findByPk(bulletinId, {
            include: [
                {
                    model: ActeMedical,
                    as: 'actes',
                    include: [{ model: Prestataire, as: 'prestataire', required: false }]
                },
                {
                    model: ActePharmacie,
                    as: 'pharmacie',
                    include: [{ model: Medicament, as: 'medicaments', required: false }]
                }
            ]
        });

        if (!bulletin) return { score: 0, reasons: [], details: null };

        const sqlResult = await this.analyzeSqlRules(bulletin);
        const anomalyResult = await this.analyzeGlobalAnomaly(bulletin);
        const localScore = bulletin.suspicion_locale ? 100 : 0;

        // Si un doublon est détecté, le score est automatiquement de 100
        const finalScore = Math.max(
            sqlResult.metrics.duplicates_detected > 0 ? 100 : 0,
            Math.min(
                100,
                Math.round((localScore * 0.2) + (anomalyResult.score * 0.4) + (sqlResult.score * 0.4))
            )
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
