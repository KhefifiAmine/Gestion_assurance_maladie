const { GoogleGenerativeAI } = require("@google/generative-ai");
const multer = require("multer");
const crypto = require("crypto");
const { DocumentJustificatif } = require("../../models");

// Configuration de multer pour le stockage en mémoire vive (RAM)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Fonction pour convertir le buffer au format requis par Gemini
function fileToGenerativePart(buffer, mimeType) {
  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType,
    },
  };
}

// Fonction pour calculer le hash d'un buffer
function calculateFileHash(buffer) {
  const hashSum = crypto.createHash("sha256");
  hashSum.update(buffer);
  return hashSum.digest("hex");
}

const analyzeBulletin = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Aucun fichier fourni" });
    }

    // 1. Calculer le hash (depuis le buffer) et vérifier les doublons
    const fileHash = calculateFileHash(req.file.buffer);
    const existingDoc = await DocumentJustificatif.findOne({
      where: { hash_fichier: fileHash },
    });

    if (existingDoc) {
      return res.status(400).json({
        message: "Ce document a déjà été soumis dans le système.",
        isDuplicate: true,
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("Erreur: GEMINI_API_KEY non trouvée dans .env");
      return res.status(500).json({ message: "Clé API Gemini non configurée" });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const prompt = `
      Tu agis en tant qu'expert en analyse de documents médicaux (Tunisie). 
      Analyse ce document (image ou PDF) très attentivement. Il peut s'agir d'un bulletin de soins (BS), d'une ordonnance, d'une facture de pharmacie, ou d'un acte médical.
      
      Instructions d'extraction :
      1. Extraie le MONTANT TOTAL : Cherche "Total", "Net à payer", "Total TTC", "Somme de", ou le montant le plus élevé en bas du document. 
      2. Extraie le NUMÉRO : Cherche "N°", "Fiche n°", "Référence", ou le numéro de bulletin de soins.
      3. Extraie le PATIENT : Nom et prénom figurant après "Patient", "Bénéficiaire" ou "Nom".
      4. Extraie les DÉTAILS MÉDECIN & PHARMACIE & ACTE : Nom, spécialité, adresse et téléphone (souvent dans l'en-tête ou le tampon).
      5. DÉTECTION DE FRAUDE : Vérifie si des chiffres ont été surchargés, si la police de caractère change brutalement sur les montants, ou si des éléments sont mal alignés.
      6. VÉRIFICATION MÉDICALE : Analyse si le document contient des termes médicaux ou est que un fichier tunisien (noms de médicaments, diagnostics, actes médicaux, cachet de médecin, entête d'hôpital). Si ce n'est PAS un document médical (ex: facture d'hôtel, selfie, photo de nourriture, document administratif non lié à la santé), mets est_document_medical à false.

      Extraie les informations au format JSON uniquement. Si une information est absente, mets une chaîne vide ou null.
      
      Format attendu :
      {
        "est_document_medical": booléen (obligatoire, true si c'est un document médical valide),
        "type_document": "Bulletin de soin, Ordonnance, Facture Pharmacie ou Autre",
        "numero_bulletin": "le numéro du document ou de facture",
        "code_cnam": "le code CNAM si présent",
        "nom_prenom_malade": "nom et prénom du patient",
        "qualite_malade": "Lui-même, Conjoint ou Enfant (déduire de la relation si possible)",
        "montant_total": montant numérique (ex: 45.600),
        "matricule_adherent": "matricule (ex: TT-12345)",
        "date_soin": "date de l'acte au format DD-MM-YYYY",
        "type_dossier": "Consultation, Pharmacie, Optique, Dentaire ou Analyse (déduire selon le contenu)",
        
        "medecin": {
          "nom_prenom": "Nom du médecin",
          "specialite": "Spécialité du médecin",
          "telephone": "Téléphone"
        },
        
        "pharmacie": {
          "nom": "Nom de la pharmacie",
          "adresse": "Adresse",
          "telephone": "Téléphone"
        },

        
        "acte": {
          "code": "code de l'acte",
          "description": "description de l'acte",
          "montant": "montant de l'acte"
        },

        "confiance_score": score de 0 à 100,
        "est_suspect": booléen (fraude suspectée),
        "zones_modifiees": "description technique de l'anomalie si est_suspect est true, sinon vide"
      }
    `;

    const filePart = fileToGenerativePart(req.file.buffer, req.file.mimetype);

    const result = await model.generateContent([prompt, filePart]);
    const response = await result.response;
    const text = response.text();

    // Nettoyer la réponse pour ne garder que le JSON
    let data;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : text;
      data = JSON.parse(jsonStr);
      // Ajouter le hash aux données retournées pour le frontend
      data.hash_fichier = fileHash;
      data.fichierUrl = req.file.originalname; // On utilise le nom d'origine car pas de fichier sur disque
    } catch (parseError) {
      console.error("Erreur parsing JSON de l'IA:", text);
      throw new Error(
        "L'IA n'a pas renvoyé un format valide. Veuillez réessayer."
      );
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("Erreur IA Gemini:", error);
    res
      .status(500)
      .json({
        message: "Erreur lors de l'analyse du document",
        error: error.message,
      });
  }
};

module.exports = {
  upload,
  analyzeBulletin
};