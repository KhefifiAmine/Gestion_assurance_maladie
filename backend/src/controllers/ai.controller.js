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
    // ❌ aucun fichier
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "Aucun fichier fourni" });
    }

    const filesExist = [];
    for (const file of req.files) {
      // 1. Calculer le hash (depuis le buffer) et vérifier les doublons
      const fileHash = calculateFileHash(file.buffer);
      const existingDoc = await DocumentJustificatif.findOne({
        where: { hash_fichier: fileHash },
      });

      filesExist.push(existingDoc);
    }

    if (filesExist.length === 0) {
      return res.status(400).json({
        message: "Ce document a déjà été soumis dans le système.",
        isDuplicate: true,
        data : file.originalname
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
    Tu agis en tant qu'expert en analyse de bulletins de soins en Tunisie.

    Analyse ce document (image ou PDF) avec une grande précision. 
    Il s'agit principalement d’un bulletin de soins tunisien contenant des informations sur le patient, les actes médicaux et le professionnel de santé.

    ========================
    📌 INSTRUCTIONS GÉNÉRALES
    ========================

    - Extraire uniquement les données visibles dans le document.
    - Ne pas inventer d'informations.
    - Si une donnée est absente → mettre null ou "".
    - Respecter les formats demandés.
    - Un bulletin peut contenir plusieurs actes → utiliser un tableau.

    ========================
    📌 EXTRACTION DES DONNÉES
    ========================

    1. IDENTIFICATION DU DOCUMENT :
    - Déterminer si c’est un bulletin de soins tunisien.
    - Détecter s’il contient des termes médicaux (acte, médecin, cachet, ordonnance, etc.).

    2. INFORMATIONS ADHÉRENT / PATIENT :
    - Nom et prénom (en MAJUSCULES)
    - Matricule (ex: TT-12345)
    - Qualité : Lui-même / Conjoint / Enfant

    3. INFORMATIONS BULLETIN :
    - Numéro du bulletin (N°, Référence, etc.)
    - Code CNAM (si présent)
    - Date de soin principale (C'est la date de la dernière acte figurant sur le bulletin)
    - Soins dans le cadre de :
    - APCI
    - Suivi de la grossesse
    - Autres
    - Date prévue d’accouchement (si mentionnée)

    4. PROFESSIONNEL DE SANTÉ (IMPORTANT) :
    - Identifiant unique (MF)
    - Nom (si présent dans le cachet)
    - Présence de cachet (true/false)
    - Présence de signature (true/false)

    5. ACTES MÉDICAUX (TRÈS IMPORTANT) :
    Pour chaque ligne d’acte extraire :

    - date_acte
    - code_acte
    - description_acte
    - cote
    - numero_dent (si dentaire)
    - montant (honoraires)
    - identifiant_unique_mf
    - cachet_signature_present (true/false)
    - date_cachet_signature (si visible)

    ⚠️ Un bulletin peut contenir plusieurs actes → retourner un tableau "actes"

    6. MONTANT :
    - Extraire le montant total (le plus grand montant ou total du document)

    ========================
    🚨 DÉTECTION DE FRAUDE LOCALE
    ========================

    Analyser le document pour détecter :

    - surcharge ou modification de chiffres
    - incohérence d’alignement
    - différences de police
    - montants incohérents entre actes
    - absence de cachet/signature

    Retourner :
    - suspicion_locale (true/false)
    - zones_modifiees (description technique)

    ========================
    📊 NORMALISATION
    ========================

    - Dates → format YYYY-MM-DD
    - Montants → float
    - Noms → MAJUSCULES
    - Supprimer espaces inutiles

    ========================
    📦 FORMAT JSON OBLIGATOIRE
    ========================

    {
    "est_document_medical": true/false,

    "numero_bulletin": "",
    "code_cnam": "",
    "matricule_adherent": "",
    "nom_prenom_adherent": "",
    "adresse_adherent": "",
    "client": "",

    "nom_prenom_malade": "",
    "qualite_malade": "", //Lui-même / Conjoint / Enfant
    "date_naissance_malade": "",

    "date_soin": "", // format YYYY-MM-DD (date du dernier acte)

    "est_apci": true/false,
    "suivi_grossesse": true/false,
    "date_prevue_accouchement": "",
    "soins_cadre": "", //APCI / Suivi de la grossesse / Autres

    "pharmacie" {
      "identifiant_unique_mf": "",
      "est_cachet": true/false,
      "est_signature": true/false,
      "date": "",
      "montant_pharmacie": 0
    }

    "actes": [
      {
        "date_acte": "",
        "acte": "",
        "cote": null,
        "code_acte": "", //pour le dentaire
        "numero_dent": "", //pour le dentaire
        "honoraires": 0,
        "identifiant_unique_mf": "",
        "est_cachet": true/false,
        "est_signature": true/false,
        "date_cachet_signature": "",
        "type_prestataire_soin": "", //non dentaire ou dentaire
      }
    ],

    "montant_total": 0, //montant total du bulletin

    "confiance_score": 0, //score de confiance de l'IA
    "suspicion_locale": true/false, //suspicion locale de l'IA
    "zones_modifiees": "" //zones modifiées par l'utilisateur
    "champs_manquants": [] //champs manquants par l'IA

    }
    `;

    const parts = [prompt];

    req.files.forEach(file => {
      parts.push(fileToGenerativePart(file.buffer, file.mimetype));
    });
    const result = await model.generateContent(parts);
    const response = await result.response;
    const text = response.text();

    let data;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : text;
      data = JSON.parse(jsonStr);

      console.log(data);

      if (!data.est_document_medical) {
        return res.status(400).json({ message: "Ce document n'est pas un document médical valide." });
      }
    } catch (parseError) {
      console.error("Erreur parsing JSON de l'IA:", text);
      throw new Error("Format de réponse invalide de l'IA.");
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