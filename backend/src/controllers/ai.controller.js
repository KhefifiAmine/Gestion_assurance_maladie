const { GoogleGenerativeAI } = require("@google/generative-ai");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { DocumentJustificatif } = require("../../models");

// Configuration de multer pour le stockage temporaire des fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Fonction pour convertir le fichier au format requis par Gemini
function fileToGenerativePart(path, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(path)).toString("base64"),
      mimeType,
    },
  };
}

// Fonction pour calculer le hash d'un fichier
function calculateFileHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash("sha256");
  hashSum.update(fileBuffer);
  return hashSum.digest("hex");
}

const analyzeBulletin = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Aucun fichier fourni" });
    }

    // 1. Calculer le hash et vérifier les doublons
    const fileHash = calculateFileHash(req.file.path);
    const existingDoc = await DocumentJustificatif.findOne({
      where: { hash_fichier: fileHash },
    });

    if (existingDoc) {
      fs.unlinkSync(req.file.path); // Supprimer le fichier car c'est un doublon
      return res.status(400).json({
        message: "Ce document a déjà été soumis dans le système.",
        isDuplicate: true,
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: "Clé API Gemini non configurée" });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      Tu agis en tant qu'expert en analyse de documents médicaux (Tunisie). 
      Analyse ce document (image ou PDF) très attentivement. Il peut s'agir d'un bulletin de soins (BS), d'une ordonnance, d'une facture de pharmacie, ou d'un acte médical.
      
      Instructions d'extraction :
      1. Extraie le MONTANT TOTAL : Cherche "Total", "Net à payer", "Total TTC", "Somme de", ou le montant le plus élevé en bas du document. 
      2. Extraie le NUMÉRO : Cherche "N°", "Fiche n°", "Référence", ou le numéro de bulletin de soins.
      3. Extraie le PATIENT : Nom et prénom figurant après "Patient", "Bénéficiaire" ou "Nom".
      4. Extraie le MATRICULE : Matricule de l'assuré (souvent format XX-XXXXX).
      5. Extraie les DÉTAILS MÉDECIN & PHARMACIE : Nom, spécialité, adresse et téléphone (souvent dans l'en-tête ou le tampon).
      6. DÉTECTION DE FRAUDE : Vérifie si des chiffres ont été surchargés, si la police de caractère change brutalement sur les montants, ou si des éléments sont mal alignés.
      7. VÉRIFICATION MÉDICALE : Analyse si le document contient des termes médicaux (noms de médicaments, diagnostics, actes médicaux, cachet de médecin, entête d'hôpital). Si ce n'est PAS un document médical (ex: facture d'hôtel, selfie, photo de nourriture, document administratif non lié à la santé), mets est_document_medical à false.

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
        "date_soin": "date de l'acte au format YYYY-MM-DD",
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

        "confiance_score": score de 0 à 100,
        "est_suspect": booléen (fraude suspectée),
        "zones_modifiees": "description technique de l'anomalie si est_suspect est true, sinon vide"
      }
    `;

    const filePart = fileToGenerativePart(req.file.path, req.file.mimetype);

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
      data.fichierUrl = req.file.filename; // Re-ajouter le nom du fichier pour le frontend
    } catch (parseError) {
      console.error("Erreur parsing JSON de l'IA:", text);
      throw new Error(
        "L'IA n'a pas renvoyé un format valide. Veuillez réessayer."
      );
    }

    // On ne supprime plus le fichier car on veut le garder comme justificatif final
    // fs.unlinkSync(req.file.path);

    res.status(200).json(data);
  } catch (error) {
    console.error("Erreur IA Gemini:", error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res
      .status(500)
      .json({
        message: "Erreur lors de l'analyse du document",
        error: error.message,
      });
  }
};

const uploadDocumentOnly = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Aucun fichier fourni" });
    }

    const fileHash = calculateFileHash(req.file.path);
    const existingDoc = await DocumentJustificatif.findOne({
      where: { hash_fichier: fileHash },
    });

    if (existingDoc) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        message: "Ce document a déjà été soumis dans le système.",
        isDuplicate: true,
      });
    }

    res.status(200).json({
      fichierUrl: req.file.filename,
      hash_fichier: fileHash,
      message: "Document uploadé avec succès"
    });
  } catch (error) {
    console.error("Erreur upload:", error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ 
      message: "Erreur lors de l'upload du document", 
      error: error.message 
    });
  }
};

module.exports = {
  upload,
  analyzeBulletin,
  uploadDocumentOnly
};