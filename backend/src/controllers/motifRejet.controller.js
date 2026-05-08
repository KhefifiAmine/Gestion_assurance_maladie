// Liste statique des motifs de rejet
const STATIC_MOTIFS = [
    { id: 1, categorie: 'Documents', libelle: 'Documents illisibles', description: 'Le scan ou la photo du bulletin est flou ou illisible.' },
    { id: 2, categorie: 'Documents', libelle: 'Pièce justificative manquante', description: 'Une facture ou une ordonnance est absente du dossier.' },
    { id: 3, categorie: 'Documents', libelle: 'Non-conformité', description: 'Le document fourni n\'est pas un document original ou certifié.' },
    
    { id: 4, categorie: 'Délais', libelle: 'Dépassement de délai', description: 'Le bulletin a été déposé au-delà du délai réglementaire (90 jours).' },
    
    { id: 5, categorie: 'Médical', libelle: 'Acte non couvert', description: 'Ce type de soin n\'est pas pris en charge par votre contrat actuel.' },
    { id: 6, categorie: 'Médical', libelle: 'Plafond atteint', description: 'Le plafond annuel pour ce type d\'acte a été consommé.' },
    { id: 7, categorie: 'Médical', libelle: 'Absence d\'entente préalable', description: 'Cet acte nécessitait une demande d\'accord préalable avant exécution.' },
    
    { id: 8, categorie: 'Administratif', libelle: 'Erreur de bénéficiaire', description: 'Le nom sur le bulletin ne correspond pas au bénéficiaire déclaré.' },
    { id: 9, categorie: 'Administratif', libelle: 'Doublon de bulletin', description: 'Ce bulletin a déjà été soumis et traité précédemment.' },
    { id: 10, categorie: 'Administratif', libelle: 'Montant incohérent', description: 'Le montant saisi ne correspond pas au total des pièces justificatives.' },
    
    { id: 99, categorie: 'Autre', libelle: 'Autre motif', description: 'Motif spécifique précisé dans le commentaire.' }
];

// GET /api/motifs-rejet — Retourne la liste statique
const getAll = async (req, res) => {
    try {
        // On retourne simplement la liste statique
        res.json(STATIC_MOTIFS);
    } catch (err) {
        console.error('Erreur getAll MotifRejet:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Les autres fonctions sont gardées pour ne pas casser les routes, 
// mais elles ne sont plus utilisées pour la liste dynamique.
const create = async (req, res) => res.status(403).json({ message: 'Fonction désactivée (Liste statique active)' });
const update = async (req, res) => res.status(403).json({ message: 'Fonction désactivée (Liste statique active)' });
const remove = async (req, res) => res.status(403).json({ message: 'Fonction désactivée (Liste statique active)' });

module.exports = { getAll, create, update, remove };
