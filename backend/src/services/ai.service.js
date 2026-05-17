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
Tu es un expert certifié en analyse de bulletins de soins tunisiens et en détection de fraude.
On t'a soumis des documents (images ou PDFs) correspondant à un bulletin de soins, ainsi que les données saisies par l'utilisateur.

Données saisies par l'utilisateur :
${JSON.stringify(payload, null, 2)}

Ta mission est de VERIFIER rigoureusement si les données saisies correspondent exactement aux informations VISIBLES sur les documents fournis.
Vérifie en particulier :
1. Les dates (date de soin, dates des actes).
2. Les montants (honoraires des actes, montants des médicaments, montant total).
3. Les informations sur le professionnel de santé et la pharmacie (matricule fiscal, présence du cachet et de la signature).
4. La cohérence médicale (ex: actes saisis correspondant à la spécialité, cohérence entre patient et actes).

Si des différences, des altérations suspectes, ou des incohérences majeures sont détectées, tu dois augmenter le niveau de risque.

Format de réponse obligatoire (JSON unique) :
{
  "niveau_risque": "faible" | "moyen" | "élevé",
  "resultat_analyse": "Description détaillée des résultats de la vérification. Si tout est correct, indique 'Données conformes aux documents'. Sinon, liste précisément les différences et anomalies trouvées."
}
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
