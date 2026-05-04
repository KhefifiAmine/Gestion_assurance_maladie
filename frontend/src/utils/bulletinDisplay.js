/**
 * Affichage cohérent des bulletins (liste + détail) aligné sur l'API backend actuelle.
 */

export function formatMontantTnd(value) {
    const n = Number(value);
    if (Number.isNaN(n)) return '0.000';
    return n.toFixed(3);
}

export function formatDateFr(value) {
    if (value == null || value === '') return '—';
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Nom affiché du patient soigné (bénéficiaire ou titulaire). */
export function getPatientDisplayName(bulletin, currentUser = null) {
    if (!bulletin) return '—';
    const ben = bulletin.beneficiaire;
    if (ben && (ben.nom || ben.prenom)) {
        return `${ben.prenom || ''} ${ben.nom || ''}`.trim() || '—';
    }
    const q = (bulletin.qualite_malade || '').toLowerCase();
    if (currentUser && (q.includes('lui') || q.includes('même') || q.includes('meme') || q.includes('titulaire'))) {
        return `${currentUser.prenom || ''} ${currentUser.nom || ''}`.trim() || 'Titulaire';
    }
    return '—';
}

/** Première date de soin déduite des actes / pharmacie (pas de colonne date_soin sur le bulletin). */
export function getDerivedCareDate(bulletin) {
    if (!bulletin) return null;
    const times = [];
    if (Array.isArray(bulletin.actes)) {
        bulletin.actes.forEach((a) => {
            if (a?.date_acte) {
                const t = new Date(a.date_acte).getTime();
                if (!Number.isNaN(t)) times.push(t);
            }
        });
    }
    if (bulletin.pharmacie?.date_achat) {
        const t = new Date(bulletin.pharmacie.date_achat).getTime();
        if (!Number.isNaN(t)) times.push(t);
    }
    if (!times.length) return null;
    return new Date(Math.min(...times));
}

export function bulletinMatchesSearch(bulletin, term, currentUser = null) {
    if (!term) return true;
    const t = term.toLowerCase();
    const patient = getPatientDisplayName(bulletin, currentUser).toLowerCase();
    const adherentName = bulletin.adherent
        ? `${bulletin.adherent.nom || ''} ${bulletin.adherent.prenom || ''}`.toLowerCase()
        : '';
    return (
        (bulletin.numero_bulletin || '').toLowerCase().includes(t) ||
        patient.includes(t) ||
        (bulletin.code_cnam || '').toLowerCase().includes(t) ||
        (bulletin.qualite_malade || '').toLowerCase().includes(t) ||
        adherentName.includes(t) ||
        (bulletin.beneficiaire?.nom || '').toLowerCase().includes(t) ||
        (bulletin.beneficiaire?.prenom || '').toLowerCase().includes(t)
    );
}
