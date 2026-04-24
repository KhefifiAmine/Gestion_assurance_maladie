const axios = require("axios");
const multer = require("multer");
const crypto = require("crypto");
const { DocumentJustificatif, User, Beneficiary } = require("../../models");

// Configuration de multer pour le stockage en mémoire vive (RAM)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === "") {
      return res.status(500).json({ message: "La clé API Gemini n'est pas configurée dans le fichier .env." });
    }

    // 1. Calculer le hash et vérifier les doublons
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

    // 2. Préparation du prompt et de l'image
    const prompt = `
      Tu es un expert en analyse de documents médicaux pour une assurance maladie.
      
      OBJECTIF :
      Classifier et extraire les informations clés du document fourni (image).
      
      ETAPE 1 : CLASSIFICATION
      Détermine si l'image est un document médical (Ordonnance, Facture, Bulletin de soin).
      Si ce n'est pas un document médical ou si c'est juste un logo/image vide, mets est_document_medical à false.
      
      ETAPE 2 : EXTRACTION
      Extrais les champs suivants UNIQUEMENT s'ils sont présents de manière explicite :
      - type_document : "ordonnance", "facture", "bulletin_de_soin"
      - nom_prenom_malade : Nom complet du patient
      - montant_total : Montant numérique (ex: 45.50)
      - date_soin : Format DD/MM/YYYY
      - medecin : { nom_prenom, specialite, telephone }
      
      RÈGLES :
      - Ne jamais inventer d'information.
      - Retourner UNIQUEMENT un objet JSON valide.
      - Si une information est absente, mettre une chaîne vide ou 0.0 pour le montant.
      - Score de confiance entre 0 et 100.

      SORTIE JSON ATTENDUE :
      {
        "est_document_medical": boolean,
        "type_document": "string",
        "nom_prenom_malade": "string",
        "qualite_malade": "Lui_meme",
        "montant_total": number,
        "date_soin": "string",
        "medecin": {
          "nom_prenom": "string",
          "specialite": "string",
          "telephone": "string"
        },
        "confiance_score": number
      }
    `;

    // 3. Appel direct à l'API Gemini via Axios (Version v1beta pour support flash-lite)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`;
    
    const requestBody = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: req.file.mimetype,
                data: req.file.buffer.toString("base64")
              }
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json"
      }
    };

    const response = await axios.post(geminiUrl, requestBody);
    
    if (!response.data || !response.data.candidates || response.data.candidates.length === 0) {
      throw new Error("L'API Gemini n'a pas renvoyé de réponse valide.");
    }

    const text = response.data.candidates[0].content.parts[0].text;

    // 4. Parsing et nettoyage du JSON
    let data;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : text;
      data = JSON.parse(jsonStr);

      const hasPatient = data.nom_prenom_malade && data.nom_prenom_malade.length > 2;
      const hasAmount  = data.montant_total && Number(data.montant_total) > 0;
      const hasDoctor  = data.medecin?.nom_prenom && data.medecin.nom_prenom.length > 2;
      
      if (data.est_document_medical && !hasPatient && !hasAmount && !hasDoctor) {
        data.est_document_medical = false;
      }

      data.hash_fichier = fileHash;
      data.fichierUrl = req.file.originalname;

      // 5. Vérification si le patient appartient à la famille de l'adhérent
      if (data.est_document_medical && hasPatient && req.userId) {
        try {
          const adherent = await User.findByPk(req.userId);
          const beneficiaries = await Beneficiary.findAll({ where: { userId: req.userId } });
          
          const patientName = data.nom_prenom_malade.toLowerCase().trim();
          let isFamily = false;
          let matchedBeneficiaryId = null;

          // 5.1 Check si c'est l'adhérent lui-même
          if (adherent) {
            let adherentNames = [
              `${adherent.nom} ${adherent.prenom}`.toLowerCase(),
              `${adherent.prenom} ${adherent.nom}`.toLowerCase(),
              adherent.nom.toLowerCase()
            ];
            isFamily = adherentNames.some(name => name.length >= 3 && (patientName.includes(name) || name.includes(patientName)));
          }
          
          // 5.2 Check si c'est un bénéficiaire
          if (!isFamily) {
            for (let b of beneficiaries) {
              let bNames = [
                `${b.nom} ${b.prenom}`.toLowerCase(),
                `${b.prenom} ${b.nom}`.toLowerCase(),
                b.nom.toLowerCase()
              ];
              const isBen = bNames.some(name => name.length >= 3 && (patientName.includes(name) || name.includes(patientName)));
              if (isBen) {
                isFamily = true;
                matchedBeneficiaryId = b.id;
                break;
              }
            }
          }

          if (!isFamily) {
            data.alerte_beneficiaire = `Attention : Le patient extrait "${data.nom_prenom_malade}" ne semble pas faire partie de vos bénéficiaires enregistrés.`;
          } else {
            // L'IA renvoie directement l'ID du bénéficiaire (ou null si c'est l'adhérent)
            data.beneficiaireId = matchedBeneficiaryId;
          }
        } catch (dbError) {
          console.error("Erreur lors de la vérification du bénéficiaire:", dbError);
        }
      }
    } catch (parseError) {
      console.error("Erreur parsing JSON Gemini:", text);
      throw new Error("L'IA n'a pas renvoyé un format JSON valide.");
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("Erreur complète IA Gemini:", error.response?.data || error.message);
    res.status(500).json({
      message: "Erreur lors de l'analyse par Gemini",
      error: error.response?.data?.error?.message || error.message,
    });
  }
};

module.exports = {
  upload,
  analyzeBulletin
};
