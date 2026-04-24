const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("ERREUR : GEMINI_API_KEY non trouvée dans le fichier .env");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    // Note: listModels n'est pas directement sur genAI dans toutes les versions, 
    // on va tester une génération simple sur le modèle de base
    console.log("Tentative de connexion avec la clé :", apiKey.substring(0, 5) + "...");
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Test");
    const response = await result.response;
    console.log("Succès ! Le modèle gemini-1.5-flash est accessible.");
  } catch (error) {
    console.error("Échec avec gemini-1.5-flash :", error.message);
    
    console.log("\n--- Tentative avec gemini-pro (Texte uniquement) ---");
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent("Test");
      console.log("Succès ! Le modèle gemini-pro est accessible.");
    } catch (e) {
      console.error("Échec avec gemini-pro :", e.message);
    }
  }
}

listModels();
