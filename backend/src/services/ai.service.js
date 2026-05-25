const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");

function fileToGenerativePart(filePath, mimeType) {
    return {
        inlineData: {
            data: fs.readFileSync(filePath).toString("base64"),
            mimeType,
        },
    };
}

const verifyBulletinWithAI = async (files, payload) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("Erreur: GEMINI_API_KEY non trouvée dans .env");
            return { niveau_risque: "moyen", resultat_analyse: "Vérification IA non disponible (clé API manquante)." };
        }

        if (!files || files.length === 0) {
            return { niveau_risque: "élevé", resultat_analyse: "Aucun fichier joint pour vérification." };
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

        const prompt = `
            Tu es un expert certifié en :
            - analyse de bulletins de soins tunisiens,
            - détection de fraude documentaire,
            - contrôle de cohérence médicale,
            - audit des remboursements CNAM / assurances santé.

            On t'a soumis :
            1. Des documents médicaux (images ou PDFs) correspondant à un bulletin de soins, ordonnances, factures, feuilles de pharmacie ou justificatifs médicaux.
            2. Les données saisies par l'utilisateur.

            Données saisies par l'utilisateur :
            ${JSON.stringify(payload, null, 2)}

            Ta mission est de VERIFIER rigoureusement si les données saisies correspondent EXACTEMENT aux informations VISIBLES sur les documents fournis.

            Tu dois analyser :

            ========================
            1. Vérification documentaire
            ========================
            - Vérifier que toutes les informations saisies existent réellement sur les documents.
            - Détecter les modifications suspectes :
            - texte modifié,
            - montants altérés,
            - dates incohérentes,
            - polices différentes,
            - zones floues ou masquées,
            - superpositions,
            - coupures d’image,
            - incohérences d’alignement,
            - signatures ou cachets copiés/collés.
            - Vérifier la présence obligatoire :
            - cachet du médecin/pharmacie,
            - signature,
            - matricule fiscal,
            - numéro RPPS / identifiant professionnel si visible.

            ========================
            2. Vérification des dates
            ========================
            - Vérifier :
            - date du soin,
            - dates des actes,
            - dates des ordonnances,
            - dates des factures pharmacie.
            - Détecter :
            - dates impossibles,
            - actes réalisés après émission,
            - incohérences chronologiques,
            - documents expirés,
            - plusieurs actes impossibles le même jour.

            ========================
            3. Vérification des montants
            ========================
            - Vérifier :
            - honoraires des actes,
            - prix des médicaments,
            - total facture,
            - montants remboursables,
            - quantités.
            - Détecter :
            - montants anormalement élevés,
            - doublons de facturation,
            - actes surfacturés,
            - prix incompatibles avec les tarifs habituels,
            - erreurs de calcul,
            - incohérences entre sous-total et total.

            ========================
            4. Vérification médicale
            ========================
            Analyser la cohérence médicale globale :

            - Vérifier si les actes médicaux correspondent à la spécialité du médecin.
            Exemple :
            - un dentiste ne doit pas facturer un acte cardiologique,
            - un pédiatre ne doit pas réaliser un acte gynécologique adulte.

            - Vérifier si les médicaments sont adaptés :
            - à l’âge du patient,
            - au sexe du patient,
            - à la pathologie mentionnée,
            - au dosage,
            - à la forme pharmaceutique.

            Détecter :
            - médicament pédiatrique prescrit à un adulte,
            - traitement adulte prescrit à un nourrisson,
            - dosages dangereux ou incohérents,
            - médicaments incompatibles avec l’âge,
            - médicaments inhabituels pour la maladie déclarée,
            - quantités anormales,
            - traitements contradictoires,
            - actes médicaux inutiles ou incohérents.

            ========================
            5. Détection de fraude avancée
            ========================
            Détecter les signaux de fraude potentiels :
            - documents réutilisés,
            - duplication d’actes,
            - montants artificiellement gonflés,
            - actes fictifs,
            - médicaments excessifs,
            - incohérences entre écriture manuscrite et impression,
            - absence de cachet,
            - signature suspecte,
            - ordonnance falsifiée,
            - même facture utilisée plusieurs fois,
            - informations manquantes volontairement.

            ========================
            6. Score de risque
            ========================
            Attribuer un niveau de risque :
            - "faible"
            - "moyen"
            - "élevé"

            Le niveau doit dépendre :
            - du nombre d’anomalies,
            - de leur gravité,
            - de la probabilité de fraude,
            - du niveau d’incohérence médicale et financière.

            ========================
            7. Format de réponse obligatoire
            ========================

            Réponds UNIQUEMENT avec un JSON valide.

            Format obligatoire :

            {
            "niveau_risque": "faible" | "moyen" | "élevé",
            "confiance_score": number,
            "resultat_analyse": "Analyse détaillée et structurée avec retours à la ligne. (structuré selon le type anomalies_detectees, verifications_valides, et les sections de vérification documentaire, des dates, des montants, médicale, et de fraude avancée)"
            }

            Règles importantes :
            - Ne jamais inventer une information absente du document.
            - Si une donnée est illisible ou absente, le préciser explicitement.
            - Être strict et prudent.
            - En cas de doute sérieux, augmenter le niveau de risque.
            - Si le document semble falsifié, l’indiquer clairement.
        `;

        const parts = [{ text: prompt }];

        files.forEach((file, index) => {
            if (file && file.path && fs.existsSync(file.path) && fs.lstatSync(file.path).isFile()) {
                parts.push({ text: `Document ${index + 1}` });
                parts.push(fileToGenerativePart(file.path, file.mimetype));
            }
        });

        const result = await model.generateContent({
            contents: [{ role: "user", parts }],
        });

        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const data = JSON.parse(jsonMatch[0]);
            return {
                confiance_score: data.confiance_score || 100,
                niveau_risque: data.niveau_risque || "moyen",
                resultat_analyse: data.resultat_analyse || "Analyse IA terminée."
            };
        } else {
            return { niveau_risque: "moyen", resultat_analyse: "Format de réponse de l'IA invalide." };
        }
    } catch (error) {
        console.error("Erreur lors de la vérification IA :", error);
        return { niveau_risque: "moyen", resultat_analyse: "Erreur lors de la vérification avec l'IA." };
    }
};

module.exports = { verifyBulletinWithAI };
