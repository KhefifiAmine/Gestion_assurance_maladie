const { Op } = require('sequelize');
const { User, Beneficiary } = require('../../models');


function stripAccents(str) {
    return String(str || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

function compactLabel(s) {
    return stripAccents(String(s || '').trim())
        .toUpperCase()
        .replace(/\s+/g, ' ');
}

function sameDateOnly(a, b) {
    if (a == null || b == null || a === '' || b === '') return true;
    return String(a).slice(0, 10) === String(b).slice(0, 10);
}

function namesMatchDocument(docNomPrenom, nom, prenom) {
    const doc = compactLabel(docNomPrenom);
    if (!doc) return false;
    const n1 = compactLabel(`${nom} ${prenom}`);
    const n2 = compactLabel(`${prenom} ${nom}`);
    return doc === n1 || doc === n2;
}

/** @returns {'LUI_MEME'|'CONJOINT'|'ENFANT'|null} */
function parseQualiteMalade(raw) {
    if (raw == null || raw === '') return null;
    const s = stripAccents(String(raw).trim().toLowerCase())
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ');
    if (/(^| )(lui|soi)[ -]meme($| )|adherent|titulaire|moi/.test(s)) return 'LUI_MEME';
    if (/conjoint|epoux|epouse|couple/.test(s)) return 'CONJOINT';
    if (/enfant|fils|fille/.test(s)) return 'ENFANT';
    return null;
}

/**
 * Vérifie le patient (titulaire ou bénéficiaire) et retourne beneficiaireId + libellé qualite_malade stockable.
 * @returns {Promise<{ beneficiaireId: number|null, qualite_malade: string } | { error: { status: number, message: string } }>}
 */
async function resolvePatientForBulletin(userId, body) {
    const kind = parseQualiteMalade(body.qualite_malade);
    if (!kind) {
        return { error: { status: 400, message: 'qualite_malade invalide. Indiquez : Lui-même, Conjoint ou Enfant.' } };
    }

    const nomDoc = body.nom_prenom_malade || body.nom_prenom_adherent || '';
    if (!String(nomDoc).trim()) {
        return { error: { status: 400, message: 'Le nom et prénom du patient (nom_prenom_malade) sont obligatoires pour valider le bulletin.' } };
    }

    const matriculeDoc = (body.matricule_adherent || '').trim();
    const adherent = await User.findByPk(userId);
    if (!adherent) {
        return { error: { status: 404, message: 'Adhérent introuvable.' } };
    }

    if (kind === 'LUI_MEME') {
        if (matriculeDoc && adherent.matricule && compactLabel(matriculeDoc) !== compactLabel(adherent.matricule)) {
            return { error: { status: 400, message: 'Le matricule sur le document ne correspond pas à votre profil.' } };
        }
        if (!namesMatchDocument(nomDoc, adherent.nom, adherent.prenom)) {
            return { error: { status: 400, message: 'Le nom sur le document ne correspond pas au titulaire du compte.' } };
        }
        if (body.beneficiaireId != null && body.beneficiaireId !== '' && Number(body.beneficiaireId) !== 0) {
            return { error: { status: 400, message: 'Pour un soin « Lui-même », ne renseignez pas beneficiaireId.' } };
        }
        return { beneficiaireId: null, qualite_malade: 'Lui-même' };
    }

    const relation = kind === 'CONJOINT' ? 'Conjoint' : 'Enfant';
    const beneficiaries = await Beneficiary.findAll({
        where: {
            userId,
            relation,
            statut: { [Op.in]: ['Validé', 'En attente'] }
        }
    });

    if (beneficiaries.length === 0) {
        return { error: { status: 400, message: `Aucun ${relation.toLowerCase()} enregistré sur votre compte (ou non validé).` } };
    }

    const nameMatches = beneficiaries.filter((b) => namesMatchDocument(nomDoc, b.nom, b.prenom));
    if (nameMatches.length === 0) {
        return { error: { status: 400, message: 'Le nom sur le document ne correspond à aucun bénéficiaire enregistré pour cette qualité.' } };
    }

    const ddnDoc = body.date_naissance_malade;
    let match;
    if (nameMatches.length === 1) {
        [match] = nameMatches;
    } else if (ddnDoc) {
        match = nameMatches.find((b) => sameDateOnly(ddnDoc, b.ddn));
        if (!match) {
            return { error: { status: 400, message: 'Plusieurs bénéficiaires ont ce nom : la date de naissance sur le document ne correspond à aucun profil.' } };
        }
    } else {
        return { error: { status: 400, message: 'Plusieurs bénéficiaires partagent ce nom : renseignez date_naissance_malade pour identifier le patient.' } };
    }

    if (!sameDateOnly(ddnDoc, match.ddn)) {
        return { error: { status: 400, message: 'La date de naissance du patient sur le document ne correspond pas au bénéficiaire en base.' } };
    }

    if (body.beneficiaireId != null && body.beneficiaireId !== '' && Number(body.beneficiaireId) !== match.id) {
        return { error: { status: 400, message: 'beneficiaireId ne correspond pas au patient identifié sur le document.' } };
    }

    return { beneficiaireId: match.id, qualite_malade: relation };
}

module.exports = {
  resolvePatientForBulletin
};