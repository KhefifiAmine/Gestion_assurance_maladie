const { GoogleGenerativeAI } = require("@google/generative-ai");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configuration de multer pour le stockage temporaire des fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Fonction pour convertir le fichier au format requis par Gemini
function fileToGenerativePart(path, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(path)).toString("base64"),
      mimeType
    },
  };
}

const analyzeBulletin = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Aucun fichier fourni" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    console.log("Utilisation de la clé API (longueur):", apiKey ? apiKey.length : "ABSENTE");
    
    if (!apiKey) {
      return res.status(500).json({ message: "Clé API Gemini non configurée" });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // On essaie gemini-1.5-flash qui est le plus adapté
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `
      Analyse ce bulletin de soins (image ou PDF) et extrais les informations suivantes au format JSON uniquement. 
      Si une information est absente, mets une chaîne vide.
      Le format doit être :
      {
        "numero_bulletin": "le numéro du bulletin ou de facture",
        "code_cnam": "le code CNAM si présent",
        "nom_prenom_malade": "nom et prénom du patient",
        "qualite_malade": "Lui-même, Conjoint ou Enfant (déduis-le si possible)",
        "montant_total": "montant total sous forme de nombre (sans symbole monétaire)",
        "matricule_adherent": "matricule ou numéro d'assuré",
        "date_depot": "date de l'acte au format YYYY-MM-DD",
        "type_dossier": "Consultation, Pharmacie, Optique, Dentaire ou Analyse",
        "confiance_score": "un score de 0 à 100 basé sur la lisibilité des données"
      }
    `;

    const filePart = fileToGenerativePart(
      req.file.path,
      req.file.mimetype
    );

    const result = await model.generateContent([prompt, filePart]);
    const response = await result.response;
    const text = response.text();
    
    // Nettoyer la réponse pour ne garder que le JSON
    let data;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : text;
      data = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Erreur parsing JSON de l'IA:", text);
      throw new Error("L'IA n'a pas renvoyé un format valide. Veuillez réessayer.");
    }

    // Supprimer le fichier temporaire
    fs.unlinkSync(req.file.path);

    res.status(200).json(data);
  } catch (error) {
    console.error("Erreur IA Gemini:", error);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: "Erreur lors de l'analyse du document", error: error.message });
  }
};

module.exports = {
  upload,
  analyzeBulletin
};
