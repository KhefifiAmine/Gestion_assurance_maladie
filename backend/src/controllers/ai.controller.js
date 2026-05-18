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

      if (existingDoc) {
        filesExist.push({ name: file.originalname, hash: fileHash, path: file.path });
      }
    }

    if (filesExist.length > 0) {
      const fileNames = filesExist.map(f => f.name).join(', ');
      return res.status(400).json({
        message: `Doublon détecté pour les fichiers suivants : ${fileNames}`,
        isDuplicate: true,
        duplicateFiles: filesExist.map(f => f.name)
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
      Tu es un expert certifié en analyse de bulletins de soins tunisiens, 
      spécialisé dans la détection de fraude documentaire et la vérification de conformité.

      Tu analyses entre 1 et 10 documents (images ou PDFs) transmis simultanément.
      ⚠️ IMPORTANT :
          Même si plusieurs fichiers sont fournis, tu dois TOUJOURS produire UN SEUL ET UNIQUE OBJET JSON GLOBAL.
          Il est STRICTEMENT INTERDIT de retourner :
          - un tableau JSON
          - plusieurs objets JSON
          - une structure du type "documents": []


      Tous les fichiers doivent être fusionnés dans une structure unique :
        - fusionner tous les actes dans un seul tableau "actes"
        - fusionner tous les médicaments dans "pharmacie.medicaments"
        - calculer un seul "montant_total" global
        - fusionner toutes les anomalies dans "resultat_analyse"
        - fusionner tous les champs manquants dans "champs_manquants"


      ========================
      📌 RÈGLES FONDAMENTALES
      ========================

      1. N'extraire que les données VISIBLES dans le document.
      2. Ne jamais inventer, compléter ou déduire une donnée absente.
      3. Champ absent String -> "", Numbre -> 0, Booleen -> null.
      4. Si un document est illisible :
      - continuer l'analyse des autres fichiers
      - ajouter dans "resultat_analyse"
      - diminuer "confiance_score"
      5. Si le document n'est pas un bulletin de soins, renvoyer : { "est_document_medical": "false" }
      6. Formats obligatoires : dates → YYYY-MM-DD | montants → float | noms → MAJUSCULES sans accents superflus.

      ========================
      📌 TYPES DE FICHIERS ACCEPTÉS
      ========================

      - Images : JPG, PNG, TIFF (résolution minimum recommandée : 150 DPI)
      - Documents : PDF (texte natif ou scanné)
      - En cas de document dégradé : signaler dans "champs_manquants" et poursuivre l'extraction partielle.

      ========================
      📌 EXTRACTION DES DONNÉES
      ========================

      --- A. IDENTIFICATION DU DOCUMENT ---
      - Confirmer qu'il s'agit d'un bulletin de soins tunisien (présence de : cachet, actes, matricule CNAM).
      - Détecter les termes clés : acte, médecin, cachet, ordonnance, CNAM, APCI.

      --- B. INFORMATIONS ADHÉRENT / PATIENT ---
      - Nom et prénom : MAJUSCULES
      - Matricule : format attendu XX-NNNNN (ex : TT-12345) — signaler si format inhabituel
      - Qualité : enum strict → "Titulaire" | "Conjoint" | "Enfant"

      --- C. INFORMATIONS BULLETIN ---
      - Numéro du bulletin
      - Code CNAM (si présent)
      - Date de soin : DATE DU DERNIER ACTE figurant sur le bulletin
      - Cadre de soins (un seul) : "APCI" | "Suivi de la grossesse" | "Autres"
      - Date prévue d'accouchement (uniquement si suivi de grossesse)

      --- D. PROFESSIONNEL DE SANTÉ ---
      - Identifiant MF (matricule fiscal)
      - Nom issu du cachet
      - Présence cachet : true/false
      - Présence signature : true/false
      ⚠️ L'absence de cachet ET de signature est un signal de fraude fort.

      --- E. ACTES MÉDICAUX ---
      Pour chaque ligne d'acte, extraire :

      - date_acte
      - acte : valeur issue de ACTE_STRUCTURE (voir section JSON)
      - cote : valeur de cote associée à l'acte
      - code_acte : uniquement pour les actes dentaires
      - numero_dent : uniquement pour les actes dentaires (ex : "14", "36")
      - honoraires : montant float, null si absent
      - identifiant_unique_mf : MF du prestataire
      - est_cachet / est_signature : true/false
      - date_cachet_signature : si distincte de date_acte
      - prestataire_detecté : true/false
      - prestataire : { nom, telephone, adresse, identifiant_unique_mf, specialité, gsm }

      ⚠️ Plusieurs actes possibles par bulletin → tableau "actes" obligatoire, même pour 1 seul acte.

      --- F. PHARMACIE ---
      Détecter si des informations pharmacie est detecté :
      - Si oui : renseigner le bloc "pharmacie" complet
      - Pour chaque médicament : nom, dosage, quantité, prix unitaire, montant total
      - Et les information de pharmacie dans le objet JSON

      --- G. MONTANT ---
      - montant_total = somme de tous les honoraires des actes et medicaments(pharmacie)
      - Si un total imprimé est visible ET diffère du calcul → signaler en "resultat_analyse"

      ========================
      🚨 DÉTECTION DE FRAUDE
      ========================

      Analyser systématiquement :

      FRAUDE DOCUMENTAIRE :
      □ Surcharge ou rature de chiffres ou dates
      □ Changement de police ou taille de caractères mid-document
      □ Désalignement de texte sur lignes préimprimées
      □ Incohérence entre date d'acte et date de cachet
      □ Montant total ≠ somme des actes

      FRAUDE MÉTIER :
      □ Acte incompatible avec la spécialité du prestataire
      □ Plusieurs actes le même jour pour le même patient par le même prestataire (doublon)
      □ Qualité "Enfant" avec date de naissance > 26 ans
      □ Matricule adhérent invalide (format non conforme)

      Retourner :
      - suspicion_locale : true/false
      - niveau_risque : "faible" | "moyen" | "élevé"
      - resultat_analyse : "Un message clair et bien structuré (en utilisant des sauts de lignes, des puces `-` et des emojis) décrivant le bilan de l'analyse, les anomalies ou la conformité du bulletin."

      ========================
      📊 NORMALISATION
      ========================

      - Dates → YYYY-MM-DD
      - Montants → float (ex : 45.500 → 45.5)
      - Noms → MAJUSCULES, espaces normalisés
      - Numéros de téléphone → format +216 XX XXX XXX si détecté

      ========================
      📦 FORMAT JSON OBLIGATOIRE
      ========================

      const ACTE_STRUCTURE = {  //le structure est comme ca acte[cote]
        "Consultation": ["C1", "C2", "C3", "V1", "V2", "V3"],
        "Analyses": ["B"],
        "Actes médicaux courants": ["PC", "AMM", "AMO", "AMY"],
        "Chirurgie": ["KC"],
        "Radiologie / Électroradiologie": ["R", "REK"],
        "Optique": ["Monture", "Verre"],
        "Dentaire": ["Soin dentaire", "Orthopedie Dento Faciale", "Prothèses dentaires", "Implants dentaires"],
        "Hospitalisation": ["Clinique", "Hôpital", "Réanimation", "Couveuse", "Usage unique medical"],
        "Maternité": ["Accouchement simple", "Gémellaire", "Stérilité"],
        "Divers": ["Transport Maladie", "Circoncision", "Cure thermale"],
        "Traitement Spécial": ["Traitement spécial"],
        "Orthopédie / Prothèse": ["Orthopédie", "Prothèse"],
        "Salle d’opération": ["SO"],
        "Anesthésie": ["ANE"]
      };

      // Réponse ne retourne pas un tableau retourner un seul objet json pour tous les documents comme le structure au dessus
      { 
      "est_document_medical": true,

      "numero_bulletin": ",
      "code_cnam": "",
      "matricule_adherent": "",               // format XX-NNNNN
      "nom_prenom_adherent": "",
      "adresse_adherent": "",
      "client": "",

      "nom_prenom_malade": "",
      "qualite_malade": "",                   // "Titulaire" | "Conjoint" | "Enfant"
      "date_naissance_malade": "",

      "date_soin": "", // mentioné dans le resultat_analyse si la date de soin est dépassé de plus de 60 jours dans le passé.
      "est_apci": "",
      "suivi_grossesse": "",
      "date_prevue_accouchement": "",         // Uniquement si suivi_grossesse = true
      "soins_cadre": "",                      // "APCI" | "Suivi de la grossesse" | "Autres"

      "pharmacie_detecte": false,               // ⚠️ Corrigé : "detecté" → "detecte" (ASCII safe)
      "pharmacie": {
        "identifiant_unique_mf": "",
        "est_cachet": false,
        "est_signature": false,
        "date": "",
        "montant_pharmacie": 0, // Récupérer le montant depuis la section pharmacie ou calculer le total des médicaments
        "prestataire": { 
                "identifiant_unique_mf": '',
                "nom": '',
                "telephone": '',
                "adresse": '',
                "specialité": '',
                "gsm": '',
            },
        "medicaments": [
          {
            "nom_medicament": "",
            "dosage": "",
            "quantite": 0,
            "prix_unitaire": 0,
            "montant_total": 0
          }
        ]
      },

      "actes": [
        {
          "date_acte": "",
          "acte": "",                         // Valeur de ACTE_STRUCTURE (clé)
          "cote": "",                         // Valeur de ACTE_STRUCTURE[cote] (valeur dans le tableau)
          "code_acte": "",                    // Dentaire uniquement
          "numero_dent": 0,                  // Dentaire uniquement
          "honoraires": 0,
          "identifiant_unique_mf": "",
          "est_cachet": false,
          "est_signature": false,
          "date_cachet_signature": "",
          "nb_jour": 0,           // Hospitalisation (tous les codes, couveuse : max 15 jours) et Divers (code cure thermale uniquement : max 21 jours) : calcul du montant limité au maximum autorisé
          "prestataire": {
            "identifiant_unique_mf": "",
            "nom": "",
            "telephone": "",
            "adresse": "",
            "specialité": "",
            "gsm": "",
          }
        }
      ],

      "est_signe_adherent": false,

      "montant_total": 0,                    // Calculé = somme des honoraires et pharmacie

      "confiance_score": 100,                  // Float 0 à 100

      "suspicion_locale": false,
      "niveau_risque": "faible",                    // ⬅ NOUVEAU : "faible" | "moyen" | "élevé"
      "resultat_analyse": "",
      "champs_manquants": []
      }
    `;

    const parts = [
      { text: prompt }
    ];

    req.files.forEach((file, index) => {
      parts.push({
        text: `Document ${index + 1}` // 👈 important pour forcer séparation
      });

      parts.push(fileToGenerativePart(file.buffer, file.mimetype));
    });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: parts,
        },
      ],
    });

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