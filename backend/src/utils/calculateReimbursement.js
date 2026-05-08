const rules = require('./reimbursementRules2026');

/**
 * Calcule le montant de remboursement pour un acte donné selon le barème 2026.
 * @param {Object} acte - L'acte médical à calculer
 * @param {string} [acte.type] - Le type d'acte (Consultation, Pharmacie, Analyse, Dentaire, etc.)
 * @param {string} [acte.type_prestataire_soin] - Le type de prestataire (Soin Dentaire ou Non Dentaire)
 * @param {number} [acte.montant] - Le montant engagé (honoraires ou prix)
 * @param {number} [acte.honoraires] - Alias pour montant
 * @param {string} [acte.libelle] - Le libellé spécifique (C1, C2, etc.)
 * @param {string} [acte.acte] - Alias pour libellé
 * @param {Object} [options] - Options supplémentaires (ex: est_couple_TT)
 * @returns {number} Le montant remboursé
 */
function calculateReimbursement(acte, options = {}) {
    const isCoupleTT = options.est_couple_TT || false;
    let remboursement = 0;

    // Si couple TT, le taux est de 100% dans la limite du barème (ou des frais réels)
    const applyTaux = (montant, tauxStandard) => {
        const taux = isCoupleTT ? 1.0 : tauxStandard;
        return montant * taux;
    };

    let type = (acte.type || '').toLowerCase();
    
    // Déduction du type si type_prestataire_soin est présent (nouveau schéma)
    const prestataireSoin = (acte.type_prestataire_soin || '').toLowerCase();
    if (prestataireSoin.includes('dentaire')) {
        type = 'dentaire';
    } else if (prestataireSoin.includes('non dentaire') || !type) {
        type = 'consultation';
    }

    const libelle = (acte.libelle || acte.acte || '').toUpperCase();
    const montant = parseFloat(acte.montant || acte.honoraires || 0);

    switch (type) {
        case 'consultation':
            if (libelle.includes('C1') || libelle.includes('V1')) {
                remboursement = rules.consultations.C1_V1;
            } else if (libelle.includes('C2') || libelle.includes('V2')) {
                remboursement = rules.consultations.C2_V2;
            } else if (libelle.includes('C3') || libelle.includes('V3')) {
                remboursement = rules.consultations.C3_V3;
            } else {
                // Par défaut, on prend C1 ou le montant si inférieur
                remboursement = Math.min(montant, rules.consultations.C1_V1);
            }
            break;

        case 'pharmacie':
            remboursement = applyTaux(montant, rules.pharmacie.taux);
            // Note: Le plafond annuel de 1000 DT doit être géré au niveau du bulletin/prestataire
            break;

        case 'analyse':
            // 80% des frais avec max 800 DT (ou B=0.300)
            const baseAnalyse = applyTaux(montant, rules.analyses.taux);
            remboursement = Math.min(baseAnalyse, rules.analyses.plafond_max);
            break;

        case 'dentaire':
            const baseDentaire = applyTaux(montant, rules.dentaire.taux);
            remboursement = Math.min(baseDentaire, rules.dentaire.plafond_annuel);
            break;

        case 'optique':
            if (libelle.includes('MONTURE')) {
                const base = applyTaux(montant, rules.optique.montures.taux);
                remboursement = Math.min(base, rules.optique.montures.plafond_max);
            } else if (libelle.includes('VERRE')) {
                const base = applyTaux(montant, rules.optique.verres.taux);
                remboursement = Math.min(base, rules.optique.verres.plafond_max);
            }
            break;

        case 'hospitalisation':
            if (libelle.includes('CLINIQUE')) {
                remboursement = rules.hospitalisation.clinique; // souvent par jour
            } else if (libelle.includes('HOPITAL')) {
                remboursement = rules.hospitalisation.hopital;
            } else if (libelle.includes('REANIMATION')) {
                remboursement = rules.hospitalisation.reanimation;
            }
            break;

        default:
            // Pour les autres actes, on applique une logique générique ou on retourne 0
            remboursement = 0;
    }

    // Le remboursement ne peut pas dépasser le montant engagé
    return Math.min(remboursement, montant);
}

module.exports = { calculateReimbursement };
