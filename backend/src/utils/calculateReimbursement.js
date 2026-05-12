const rules = require('./reimbursementRules2026');

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Normalise une chaîne : supprime les accents, met en majuscule, enlève les espaces superflus.
 */
function normalize(str) {
    return String(str || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .trim();
}

/**
 * Applique un taux sur un montant et le plafonne éventuellement.
 */
function applyTaux(montant, taux, plafond = Infinity) {
    return Math.min(montant * taux, plafond);
}

/**
 * Extrait la valeur numérique d'un code composite.
 * Ex: "KC30" → 30  |  "B 50" → 50  |  "R4" → 4
 */
function extractCoeff(code) {
    if (!code) return 0;
    const num = String(code).replace(/[^\d.]/g, '');
    return parseFloat(num) || 0;
}

/**
 * Arrondit à 3 décimales (millimes tunisiens) et s'assure d'être ≥ 0.
 */
function finalize(value, montant) {
    return parseFloat(Math.max(0, Math.min(value, montant)).toFixed(3));
}

// ─────────────────────────────────────────────
// Fonction indépendante : Pharmacie
// ─────────────────────────────────────────────

/**
 * Calcule le remboursement pour un article de pharmacie.
 * Règle 2026 : 90 % du montant, plafonné à 1 000 TND par an.
 *
 * @param {{ montant: number }} pharmacieObj
 * @returns {number} Montant remboursé (arrondi à 3 décimales)
 */
function calculatePharmacieReimbursement(pharmacieObj) {
    const montant = parseFloat(pharmacieObj.montant) || 0;
    const remboursement = applyTaux(montant, rules.pharmacie.taux, rules.pharmacie.plafond_annuel);
    return finalize(remboursement, montant);
}

// ─────────────────────────────────────────────
// Fonction principale : Acte médical
// ─────────────────────────────────────────────

/**
 * Calcule le remboursement pour un acte médical selon le barème 2026.
 *
 * @param {Object} acteObj
 * @param {string}  acteObj.acte               - Nature (catégorie) : "Consultation", "Chirurgie", …
 * @param {string}  acteObj.cote               - Cotation : "C1", "KC", "Clinique", "Monture", …
 * @param {number}  acteObj.honoraires         - Montant payé (TND)
 * @param {string}  [acteObj.code_acte]        - Code numérique optionnel (ex: "KC30", "B50", "R4")
 * @param {number}  [acteObj.nombre_jours]     - Nombre de jours (hospitalisation, cure thermale)
 * @returns {number} Montant remboursé (arrondi à 3 décimales)
 */
function calculateActeReimbursement(acteObj) {
    const montant = parseFloat(acteObj.honoraires) || 0;
    const nature = normalize(acteObj.acte);    // ex: "CONSULTATION"
    const cote = normalize(acteObj.cote);    // ex: "C1", "CLINIQUE", "MONTURE"
    const nbJours = parseInt(acteObj.nombre_jours) || 1;

    let remboursement = 0;

    // ── 1. CONSULTATION / VISITE ─────────────────────────────────────────
    if (nature === 'CONSULTATION') {
        // cote ∈ { C1, C2, C3, V1, V2, V3 }
        const montantFixe = rules.consultations[cote];
        remboursement = montantFixe !== undefined
            ? montantFixe
            : rules.consultations.C1; // fallback généraliste
    }

    // ── 2. ANALYSES ───────────────────────────────────────────────────────
    else if (nature === 'ANALYSES') {
        // Si un code_acte est fourni (ex: "B50"), on calcule par coefficient
        if (acteObj.code_acte) {
            const coeff = extractCoeff(acteObj.code_acte);
            remboursement = coeff * rules.analyses.coefficient_B;
        } else {
            remboursement = applyTaux(montant, rules.analyses.taux);
        }
        remboursement = Math.min(remboursement, rules.analyses.plafond_annuel);
    }

    // ── 3. ACTES MÉDICAUX COURANTS ────────────────────────────────────────
    else if (nature === 'ACTES MEDICAUX COURANTS') {
        // cote ∈ { PC, AM, AMM, AMO, AMY }
        const coeff = rules.actes_medicaux_courants.coefficients[cote];
        if (coeff !== undefined && acteObj.code_acte) {
            remboursement = extractCoeff(acteObj.code_acte) * coeff;
        } else {
            // AM ou cote sans coefficient → taux 80 %
            remboursement = applyTaux(montant, 0.80);
        }
    }

    // ── 4. CHIRURGIE ──────────────────────────────────────────────────────
    else if (nature === 'CHIRURGIE') {
        // cote = "KC" ; code_acte = "KC30" ou "30"
        if (acteObj.code_acte) {
            const coeff = extractCoeff(acteObj.code_acte);
            remboursement = coeff * rules.chirurgie.coefficient_KC;
        } else {
            remboursement = applyTaux(montant, 0.90);
        }
    }

    // ── 5. ANESTHÉSIE ─────────────────────────────────────────────────────
    else if (nature === 'ANESTHESIE') {
        remboursement = applyTaux(
            montant,
            rules.chirurgie.anesthesie.taux,
            rules.chirurgie.anesthesie.plafond_annuel
        );
    }

    // ── 6. SALLE D'OPÉRATION ──────────────────────────────────────────────
    else if (nature === "SALLE D'OPERATION") {
        remboursement = applyTaux(
            montant,
            rules.chirurgie.salle_operation.taux,
            rules.chirurgie.salle_operation.plafond_annuel
        );
    }

    // ── 7. RADIOLOGIE / ÉLECTRORADIOLOGIE ────────────────────────────────
    else if (nature === 'RADIOLOGIE / ELECTRORADIOLOGIE' || nature === 'RADIOLOGIE') {
        remboursement = applyTaux(
            montant,
            rules.radiologie_electroradiologie.taux,
            rules.radiologie_electroradiologie.plafond_annuel
        );
    }

    // ── 8. OPTIQUE ────────────────────────────────────────────────────────
    else if (nature === 'OPTIQUE') {
        if (cote === 'MONTURE') {
            remboursement = applyTaux(montant, rules.optique.monture.taux, rules.optique.monture.plafond_max);
        } else if (cote === 'VERRE') {
            remboursement = applyTaux(montant, rules.optique.verre.taux, rules.optique.verre.plafond_max);
        }
    }

    // ── 9. DENTAIRE ───────────────────────────────────────────────────────
    else if (nature === 'DENTAIRE') {
        if (cote === 'ORTHOPEDIE DENTO FACIALE') {
            // Remboursé à 100 % plafonné à 300 TND/an (max age 18)
            remboursement = Math.min(montant, rules.dentaire.orthopedie_dento_faciale.plafond_annuel);
        } else {
            // Soin Dentaire, Prothèses dentaires, Implants dentaires → 80 % plafond 1 000
            remboursement = applyTaux(
                montant,
                rules.dentaire.soins_protheses_implants.taux,
                rules.dentaire.soins_protheses_implants.plafond_annuel
            );
        }
    }

    // ── 10. HOSPITALISATION ───────────────────────────────────────────────
    else if (nature === 'HOSPITALISATION') {
        if (cote === 'CLINIQUE') {
            remboursement = rules.hospitalisation.clinique.montant_par_jour * nbJours;
        } else if (cote === 'HOPITAL' || cote === 'HÔPITAL') {
            remboursement = rules.hospitalisation.hopital.montant_par_jour * nbJours;
        } else if (cote === 'REANIMATION') {
            remboursement = rules.hospitalisation.reanimation.montant_par_jour * nbJours;
        } else if (cote === 'COUVEUSE') {
            const joursEffectifs = Math.min(nbJours, rules.hospitalisation.couveuse.max_jours);
            remboursement = rules.hospitalisation.couveuse.montant_par_jour * joursEffectifs;
        }
    }

    // ── 11. MATERNITÉ ─────────────────────────────────────────────────────
    else if (nature === 'MATERNITE') {
        if (cote === 'STERILITE') {
            remboursement = rules.maternite.sterilite;
        } else if (cote === 'GEMELLAIRE') {
            remboursement = rules.maternite.gemellaire;
        } else {
            // Accouchement simple (par défaut)
            remboursement = rules.maternite.accouchement_simple;
        }
    }

    // ── 12. DIVERS ────────────────────────────────────────────────────────
    else if (nature === 'DIVERS') {
        if (cote === 'TRANSPORT') {
            remboursement = applyTaux(
                montant,
                rules.divers.transport_malade.taux,
                rules.divers.transport_malade.plafond_max
            );
        } else if (cote === 'CIRCONCISION') {
            remboursement = rules.divers.circoncision;
        } else if (cote === 'CURE THERMALE') {
            const joursEffectifs = Math.min(nbJours, rules.divers.cure_thermale.max_jours);
            remboursement = rules.divers.cure_thermale.montant_par_jour * joursEffectifs;
        }
    }

    // ── 13. TRAITEMENT SPÉCIAL ────────────────────────────────────────────
    else if (nature === 'TRAITEMENT SPECIAL') {
        remboursement = applyTaux(
            montant,
            rules.traitement_special.taux,
            rules.traitement_special.plafond_annuel
        );
    }

    // ── 14. ORTHOPÉDIE / PROTHÈSE ─────────────────────────────────────────
    else if (nature === 'ORTHOPEDIE / PROTHESE') {
        remboursement = applyTaux(
            montant,
            rules.orthopedie_prothese.taux,
            rules.orthopedie_prothese.plafond_annuel
        );
    }

    // ── Sécurité finale ───────────────────────────────────────────────────
    // Le remboursement ne peut jamais dépasser les honoraires réels
    return finalize(remboursement, montant);
}

module.exports = { calculateActeReimbursement, calculatePharmacieReimbursement };