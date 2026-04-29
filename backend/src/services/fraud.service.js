const { BulletinSoin, ActeMedical, Medecin, User, FraudAlert, sequelize } = require('../../models');
const { Op } = require('sequelize');

class FraudService {
    static normalizeName(value, { removeDoctorTitle = false } = {}) {
        if (!value) return '';
        let normalized = String(value).trim().toUpperCase().replace(/\s+/g, ' ');
        if (removeDoctorTitle) {
            normalized = normalized.replace(/^DR\.?\s+/i, '');
        }
        return normalized;
    }

    static normalizePhone(value) {
        if (!value) return '';
        const digits = String(value).replace(/\D/g, '');
        if (!digits) return '';
        if (digits.startsWith('216') && digits.length >= 11) return `+${digits}`;
        if (digits.length === 8) return `+216${digits}`;
        return digits;
    }

    static normalizeAmount(value) {
        if (value === null || value === undefined || value === '') return 0;
        const amount = Number(String(value).replace(',', '.').replace(/[^\d.-]/g, ''));
        if (Number.isNaN(amount)) return 0;
        return Math.max(0, Number(amount.toFixed(3)));
    }

    static normalizeDate(value) {
        if (!value) return null;
        const raw = String(value).trim();
        const ymd = raw.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
        if (ymd) return `${ymd[1]}-${ymd[2]}-${ymd[3]}`;
        const dmy = raw.match(/^(\d{2})[-/](\d{2})[-/](\d{2}|\d{4})$/);
        if (dmy) {
            const year = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3];
            return `${year}-${dmy[2]}-${dmy[1]}`;
        }
        const date = new Date(raw);
        if (Number.isNaN(date.getTime())) return null;
        return date.toISOString().slice(0, 10);
    }

    static normalizeExtractionData(payload = {}) {
        const normalized = { ...payload };
        normalized.nom_prenom_malade = this.normalizeName(payload.nom_prenom_malade);
        normalized.date_soin = this.normalizeDate(payload.date_soin);
        normalized.montant_total = this.normalizeAmount(payload.montant_total);
        normalized.matricule_adherent = payload.matricule_adherent ? String(payload.matricule_adherent).trim() : '';
        normalized.confiance_score = Number.isFinite(Number(payload.confiance_score)) ? Number(payload.confiance_score) : 100;
        normalized.suspicion_locale = Boolean(payload.suspicion_locale);

        if (payload.medecin) {
            normalized.medecin = {
                ...payload.medecin,
                nom_prenom: this.normalizeName(payload.medecin.nom_prenom, { removeDoctorTitle: true }),
                specialite: this.normalizeName(payload.medecin.specialite),
                telephone: this.normalizePhone(payload.medecin.telephone),
            };
        }

        if (payload.pharmacie) {
            normalized.pharmacie = {
                ...payload.pharmacie,
                nom: this.normalizeName(payload.pharmacie.nom),
                telephone: this.normalizePhone(payload.pharmacie.telephone),
            };
        }

        if (Array.isArray(payload.actes)) {
            normalized.actes = payload.actes.map((acte) => ({
                ...acte,
                code_acte: acte?.code_acte || acte?.code || null,
                honoraires: this.normalizeAmount(acte?.honoraires ?? acte?.montant),
                date_acte: this.normalizeDate(acte?.date_acte || payload.date_soin),
            }));
        }

        return normalized;
    }

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

        const medecinId = bulletin.actes?.[0]?.medecinId || bulletin.actes?.[0]?.medecin?.id_medecin;
        const dateSoin = bulletin.date_soin;
        const date30DaysAgo = new Date();
        date30DaysAgo.setDate(date30DaysAgo.getDate() - 30);
        const date7DaysAgo = new Date();
        date7DaysAgo.setDate(date7DaysAgo.getDate() - 7);

        if (medecinId && dateSoin) {
            const uniquePatients = await BulletinSoin.count({
                distinct: true,
                col: 'userId',
                where: { date_soin: dateSoin },
                include: [{ model: ActeMedical, as: 'actes', attributes: [], where: { medecinId } }],
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
                    createdAt: { [Op.gte]: date30DaysAgo },
                },
                include: [{ model: ActeMedical, as: 'actes', attributes: [], where: { medecinId } }],
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
            medecinId,
        };
    }

    static async analyzeGlobalAnomaly(bulletin) {
        const medecinId = bulletin.actes?.[0]?.medecinId || bulletin.actes?.[0]?.medecin?.id_medecin;
        if (!medecinId) {
            return { score: 0, reasons: [], features: {} };
        }

        const dateSoin = bulletin.date_soin ? new Date(bulletin.date_soin) : new Date();
        const startDay = new Date(dateSoin);
        startDay.setHours(0, 0, 0, 0);
        const endDay = new Date(dateSoin);
        endDay.setHours(23, 59, 59, 999);

        const startMonth = new Date(dateSoin.getFullYear(), dateSoin.getMonth(), 1);

        const dayStats = await BulletinSoin.findOne({
            attributes: [
                [sequelize.fn('COUNT', sequelize.col('BulletinSoin.id')), 'nb_actes'],
                [sequelize.fn('SUM', sequelize.col('BulletinSoin.montant_total')), 'montant_total_jour'],
                [sequelize.fn('AVG', sequelize.col('BulletinSoin.montant_total')), 'montant_moyen'],
                [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('BulletinSoin.userId'))), 'nb_patients_jour'],
            ],
            where: { date_soin: bulletin.date_soin },
            include: [{ model: ActeMedical, as: 'actes', attributes: [], where: { medecinId } }],
            raw: true,
        });

        const monthlyFrequency = await BulletinSoin.count({
            where: { createdAt: { [Op.gte]: startMonth } },
            include: [{ model: ActeMedical, as: 'actes', attributes: [], where: { medecinId } }],
        });

        const globalBaseline = await BulletinSoin.findOne({
            attributes: [
                [sequelize.fn('AVG', sequelize.col('montant_total')), 'avgMontant'],
                [sequelize.fn('STDDEV_POP', sequelize.col('montant_total')), 'stdMontant'],
            ],
            where: { type_dossier: bulletin.type_dossier },
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
                { model: ActeMedical, as: 'actes', include: [{ model: Medecin, as: 'medecin' }] }
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
            if (sqlResult.medecinId) {
                await this.createAlert(
                    'medecin',
                    sqlResult.medecinId,
                    Math.max(50, Math.round((sqlResult.score + anomalyResult.score) / 2)),
                    reasons.join(' | ') || 'Comportement medical anormal detecte.'
                );
            }
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
