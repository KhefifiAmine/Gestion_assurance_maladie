const { GoogleGenerativeAI } = require("@google/generative-ai");
const multer = require("multer");
const crypto = require("crypto");
const { DocumentJustificatif, User, Beneficiary } = require("../../models");
const FraudService = require("../services/fraud.service");

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
      4. Extraie les DÉTAILS MÉDECIN & PHARMACIE & ACTE : Nom, spécialité, adresse, téléphone ET SURTOUT le Matricule Fiscal (MF).
      5. DÉTECTION DE FRAUDE LOCALE : Vérifie si des chiffres ont été surchargés, si la police de caractère change brutalement sur les montants, ou si des éléments sont mal alignés.
      6. VÉRIFICATION MÉDICALE : Analyse si le document contient des termes médicaux (noms de médicaments, diagnostics, actes médicaux, cachet de médecin). 

      Extraie les informations au format JSON uniquement. Si une information est absente, mets une chaîne vide ou null.
      
      Format attendu :
      {
        "est_document_medical": booléen,
        "type_document": "Bulletin de soin, Ordonnance, Facture Pharmacie ou Autre",
        "numero_bulletin": "le numéro du document",
        "code_cnam": "le code CNAM si présent",
        "nom_prenom_malade": "NOM PRENOM (en majuscules)",
        "qualite_malade": "Lui-même, Conjoint ou Enfant",
        "montant_total": montant numérique (ex: 45.600),
        "matricule_adherent": "matricule",
        "date_soin": "YYYY-MM-DD",
        "type_dossier": "Consultation, Pharmacie, Optique, Dentaire ou Analyse",
        
        "medecin": {
          "nom_prenom": "NOM PRENOM",
          "specialite": "SPECIALITE",
          "telephone": "TELEPHONE",
          "matricule_fiscal": "MF"
        },
        
        "pharmacie": {
          "nom": "NOM",
          "matricule_fiscal": "MF",
          "telephone": "TELEPHONE"
        },
        
        "acte": {
          "code": "code",
          "description": "description",
          "montant": "montant"
        },

        "confiance_score": score de 0 à 100,
        "suspicion_locale": booléen (fraude suspectée sur le document physique),
        "zones_modifiees": "description de l'anomalie"
      }
    `;

    const filePart = fileToGenerativePart(req.file.buffer, req.file.mimetype);

    const result = await model.generateContent([prompt, filePart]);
    const response = await result.response;
    const text = response.text();

    let data;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : text;
      data = JSON.parse(jsonStr);

      // --- ETAPE 3: NORMALISATION ---
      data = FraudService.normalizeExtractionData(data);

      const hasPatient = data.nom_prenom_malade && data.nom_prenom_malade.length > 2;

      if (data.est_document_medical && hasPatient && req.userId) {
        try {
          const adherent = await User.findByPk(req.userId);
          const beneficiaries = await Beneficiary.findAll({ where: { userId: req.userId } });

          const patientName = data.nom_prenom_malade.toLowerCase().trim();
          let isFamily = false;
          let matchedBeneficiaryId = null;

          if (adherent) {
            let adherentNames = [
              `${adherent.nom} ${adherent.prenom}`.toLowerCase(),
              `${adherent.prenom} ${adherent.nom}`.toLowerCase()
            ];
            isFamily = adherentNames.some(name => patientName.includes(name) || name.includes(patientName));
          }

          if (!isFamily) {
            for (let b of beneficiaries) {
              let bNames = [`${b.nom} ${b.prenom}`.toLowerCase(), `${b.prenom} ${b.nom}`.toLowerCase()];
              if (bNames.some(name => patientName.includes(name) || name.includes(patientName))) {
                isFamily = true;
                matchedBeneficiaryId = b.id;
                break;
              }
            }
          }

          if (!isFamily) {
            data.alerte_beneficiaire = `Attention : Le patient "${data.nom_prenom_malade}" ne semble pas faire partie de vos bénéficiaires.`;
            data.suspicion_locale = true;
            data.zones_modifiees = (data.zones_modifiees || "") + "\nPatient non reconnu.";
          } else {
            data.beneficiaireId = matchedBeneficiaryId;
          }
        } catch (dbError) {
          console.error("Erreur vérification bénéficiaire:", dbError);
        }
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