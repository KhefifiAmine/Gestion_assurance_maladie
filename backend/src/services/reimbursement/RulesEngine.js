const rules = require('../../utils/reimbursementRules2026');

class RulesEngine {
    /**
     * Calcule le remboursement théorique d'un acte (sans plafond de consommation)
     */
    static calculateTheoreticalActe(acte) {
        const type = acte.acte;
        const cote = acte.cote;
        const honoraires = Number(acte.honoraires);

        // 1. Consultations
        if (type === 'Consultation') {
            return rules.consultations[cote];
        }

        // 2. Analyses (Coefficient B)
        if (type === 'Analyses') {
            return Math.min(honoraires * rules.analyses.taux, honoraires);
        }

        // 3. Actes médicaux courants -------------------------
        if (type === 'Actes médicaux courants') {
            return Math.min(honoraires * rules.actes_medicaux_courants.coefficients[cote], honoraires);
        }

        // 4. Chirurgie (Coefficient KC)
        if (type === 'Chirurgie') {
            return Math.min(honoraires * rules.chirurgie.taux, honoraires);
        }

        // 5. Radiologie
        if (type === 'Radiologie / Électroradiologie') {
            return Math.min(honoraires * rules.radiologie_electroradiologie.taux, honoraires);
        }

        // 6. Dentaire
        if (type === 'Dentaire') {
            if (cote === 'Orthopedie Dento Faciale') {
                // Le plafond est annuel, calculé plus tard dans le service
                return honoraires; // On retourne les honoraires, le service limitera par le plafond
            }
            return Math.min(honoraires * rules.dentaire.soins_protheses_implants.taux, honoraires);
        }

        // 7. Optique
        if (type === 'Optique') {
            if (cote === 'Monture') {
                return Math.min(honoraires * rules.optique.monture.taux, rules.optique.monture.plafond_max);
            }
            if (cote === 'Verre') {
                return Math.min(honoraires * rules.optique.verre.taux, rules.optique.verre.plafond_max);
            }
        }

        // 8. Hospitalisation
        if (type === 'Hospitalisation') {
            const nbJour = Number(acte.nb_jour || 1);
            if (cote === 'Clinique') return Math.min(rules.hospitalisation.clinique.montant_par_jour * nbJour, honoraires);
            if (cote === 'Hôpital') return Math.min(rules.hospitalisation.hopital.montant_par_jour * nbJour, honoraires);
            if (cote === 'Réanimation') return Math.min(rules.hospitalisation.reanimation.montant_par_jour * nbJour, honoraires);
            if (cote === 'Couveuse') {
                const days = Math.min(nbJour, rules.hospitalisation.couveuse.max_jours);
                return Math.min(days * rules.hospitalisation.couveuse.montant_par_jour, honoraires);
            }
            if (cote === 'Usage unique medical') return Math.min(rules.hospitalisation.usage_unique_medical.montant, honoraires);
        }

        // 9. Maternité
        if (type === 'Maternité') {
            if (cote === 'Accouchement simple') return rules.maternite.accouchement_simple;
            if (cote === 'Gémellaire') return rules.maternite.gemellaire;
            if (cote === 'Stérilité') return rules.maternite.sterilite;
        }

        // 10. Anesthésie / Salle d'op
        if (type === 'Anesthésie') return honoraires * rules.anesthesie.taux;
        if (type === 'Salle d’opération') return honoraires * rules.salle_operation.taux;

        // 11. Divers
        if (type === 'Divers') {
            if (cote === 'Transport Maladie') return Math.min(honoraires * rules.divers.transport_malade.taux, rules.divers.transport_malade.plafond_max);
            if (cote === 'Circoncision') return rules.divers.circoncision;
            if (cote === 'Cure thermale') {
                const nbJour = Math.min(Number(acte.nb_jour || 1), rules.divers.cure_thermale.max_jours);
                return Math.min(nbJour * rules.divers.cure_thermale.montant_par_jour, honoraires);
            }
        }

        // 12. Autres
        if (type === 'Traitement Spécial') return honoraires * rules.traitement_special.taux;
        if (type === 'Orthopédie / Prothèse') return honoraires * rules.orthopedie_prothese.taux;

        return 0;
    }

    /**
     * Calcule le remboursement théorique de la pharmacie
     */
    static calculateTheoreticalPharmacie(montant) {
        return Number(montant) * rules.pharmacie.taux;
    }

    /**
     * Détermine la catégorie de plafond pour un acte
     */
    static getPlafondCategory(acte) {
        const type = acte.acte;
        const cote = acte.cote;

        if (type === 'Pharmacie') return 'PHARMACIE';
        if (type === 'Analyses') return 'ANALYSES';
        if (type === 'Chirurgie') return 'CHIRURGIE';
        if (type === 'Dentaire') {
            if (cote === 'Orthopedie Dento Faciale') return 'DENTAIRE_ODF';
            return 'DENTAIRE';
        }
        if (type === 'Optique') {
            if (cote === 'Monture') return 'OPTIQUE_MONTURE';
            return 'OPTIQUE_VERRE';
        }
        if (type === 'Anesthésie') return 'ANESTHESIE';
        if (type === 'Salle d’opération') return 'SALLE_OPERATION';
        if (type === 'Radiologie / Électroradiologie') return 'RADIOLOGIE';
        if (type === 'Traitement Spécial') return 'TRAITEMENT_SPECIAL';
        if (type === 'Orthopédie / Prothèse') return 'ORTHOPEDIE';

        return 'AUTRES';
    }

    /**
     * Récupère le plafond annuel pour une catégorie
     */
    static getPlafondValue(categorie) {
        if (categorie === 'PHARMACIE') return rules.pharmacie.plafond_annuel;
        if (categorie === 'ANALYSES') return rules.analyses.plafond_annuel;
        if (categorie === 'CHIRURGIE') return rules.chirurgie.plafond_annuel;
        if (categorie === 'ANESTHESIE') return rules.anesthesie.plafond_annuel;
        if (categorie === 'SALLE_OPERATION') return rules.salle_operation.plafond_annuel;
        if (categorie === 'RADIOLOGIE') return rules.radiologie_electroradiologie.plafond_annuel;
        if (categorie === 'TRAITEMENT_SPECIAL') return rules.traitement_special.plafond_annuel;
        if (categorie === 'ORTHOPEDIE') return rules.orthopedie_prothese.plafond_annuel;
        if (categorie === 'DENTAIRE') return rules.dentaire.soins_protheses_implants.plafond_annuel;
        if (categorie === 'DENTAIRE_ODF') return rules.dentaire.orthopedie_dento_faciale.plafond_annuel;
        if (categorie === 'MATERNITE') return rules.maternite.plafond_annuel;
        
        return Infinity; // Pas de plafond spécifique pour les autres
    }

    static getGlobalPlafond() {
        return rules.plafond_annuel_global_par_prestataire;
    }
}

module.exports = RulesEngine;
