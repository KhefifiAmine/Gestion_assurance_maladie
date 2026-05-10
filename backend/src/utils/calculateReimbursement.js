const rules = require('./reimbursementRules2026');

/**
 * Applique un taux à un montant
 */
const applyTaux = (montant, taux) => montant * taux;

/**
 * Supprime les accents d'une chaîne
 */
function stripAccents(str) {
    return String(str || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Calcule le montant de remboursement pour un acte donné selon le barème 2026.
 * @param {Object} acteObj - L'objet acte provenant de la base de données
 */
function calculateReimbursement(acteObj) {
    let remboursement = 0;
    
    // Extraction et nettoyage des données
    const montant = parseFloat(acteObj.honoraires) || 0;
    const typePrestateur = stripAccents(acteObj.type_prestataire_soin).toUpperCase();
    const libelleActe = stripAccents(acteObj.acte).toUpperCase();
    const cote = stripAccents(acteObj.cote).toUpperCase();
    
    // 1. Logique par type d'acte ou de prestataire
    
    // Cas des Consultations
    if (libelleActe.includes('CONSULTATION') || libelleActe.includes('VISITE')) {
        if (cote.includes('C3') || cote.includes('V3')) {
            remboursement = rules.consultations.C3_V3;
        } else if (cote.includes('C2') || cote.includes('V2')) {
            remboursement = rules.consultations.C2_V2;
        } else {
            remboursement = rules.consultations.C1_V1;
        }
    } 
    
    // Cas de la Pharmacie & Produits Bien-être (Nouveauté 2026)
    else if (libelleActe.includes('PHARMACIE') || libelleActe.includes('MEDICAMENT') || 
             libelleActe.includes('VITAMINE') || libelleActe.includes('HOMEOPATHIE') || libelleActe.includes('COMPLEMENT')) {
        // Vérifier si c'est un produit spécifique (homéopathie, vitamines, etc.)
        if (libelleActe.includes('VITAMINE') || libelleActe.includes('HOMEOPATHIE') || libelleActe.includes('COMPLEMENT')) {
            remboursement = applyTaux(montant, rules.pharmacie.produits_bien_etre.taux);
            // Note: Le plafond est annuel, la vérification du plafond doit se faire en DB
        } else {
            remboursement = applyTaux(montant, rules.pharmacie.taux);
        }
    }

    // Cas des Analyses (Utilisation du coefficient B)
    else if (libelleActe.includes('ANALYSE') || cote.startsWith('B')) {
        if (acteObj.code_acte) {
            // Calcul par coefficient : Valeur B * Coefficient (ex: B 20)
            const coeff = parseFloat(acteObj.code_acte.replace('B', '')) || 0;
            remboursement = coeff * rules.analyses_biologiques.coefficient_B;
        } else {
            // Calcul au taux si pas de code
            remboursement = applyTaux(montant, rules.analyses_biologiques.taux_remboursement);
        }
    }

    // Cas de la Chirurgie (Utilisation du coefficient KC)
    else if (libelleActe.includes('CHIRURGIE') || cote.startsWith('KC')) {
        const hasKC = cote.startsWith('KC') || (acteObj.code_acte && acteObj.code_acte.startsWith('KC'));
        if (hasKC) {
            const code = acteObj.code_acte || cote;
            const coeff = parseFloat(code.replace('KC', '')) || 0;
            remboursement = coeff * rules.chirurgie.coefficient_KC;
        } else {
            // Si pas de KC, on applique un taux par défaut (ex: 90% pour les frais de clinique/chirurgie)
            remboursement = applyTaux(montant, 0.90);
        }
    }

    // Cas du Dentaire
    else if (typePrestateur.includes('DENTAIRE')) {
        if (libelleActe.includes('ODF') || libelleActe.includes('ORTHOPEDIE')) {
            remboursement = Math.min(montant, rules.dentaire.orthopedie_dento_faciale.plafond_annuel);
        } else {
            remboursement = applyTaux(montant, rules.dentaire.soins_protheses_implants.taux);
        }
    }

    // Cas de l'Optique
    else if (libelleActe.includes('OPTIQUE')) {
        if (libelleActe.includes('MONTURE')) {
            remboursement = Math.min(applyTaux(montant, rules.optique.montures.taux), rules.optique.montures.plafond_max);
        } else if (libelleActe.includes('VERRE')) {
            remboursement = Math.min(applyTaux(montant, rules.optique.verres.taux), rules.optique.verres.plafond_max);
        }
    }

    // Cas de l'Hospitalisation
    else if (libelleActe.includes('CLINIQUE') || libelleActe.includes('REANIMATION')) {
        if (libelleActe.includes('REANIMATION')) {
            remboursement = rules.hospitalisation.reanimation;
        } else {
            remboursement = rules.hospitalisation.clinique;
        }
    }

    // Maternité
    else if (libelleActe.includes('ACCOUCHEMENT') || libelleActe.includes('MATERNITE') || libelleActe.includes('STERILITE')) {
        if (libelleActe.includes('STERILITE')) {
            remboursement = rules.maternite.sterilite;
        } else if (libelleActe.includes('GEME')) {
            remboursement = rules.maternite.gemellaire;
        } else {
            remboursement = rules.maternite.accouchement_simple;
        }
    }

    // Sécurité finale : Le remboursement ne peut jamais dépasser les honoraires payés
    // et il ne peut pas être négatif
    remboursement = Math.max(0, Math.min(remboursement, montant));

    return parseFloat(remboursement.toFixed(3)); // Arrondi à 3 décimales (millimes tunisiens)
}

module.exports = { calculateReimbursement };