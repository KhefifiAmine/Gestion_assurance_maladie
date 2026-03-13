require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log("CLÉ ABSENTE");
    return;
  }
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const models = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-pro", "gemini-flash-latest"];
  
  for (const m of models) {
    try {
      console.log(`Test du modèle : ${m}`);
      const model = genAI.getGenerativeModel({ model: m });
      const result = await model.generateContent("Test");
      console.log(`SUCCÈS avec ${m}`);
      process.exit(0);
    } catch (e) {
      console.log(`ÉCHEC avec ${m}: ${e.message}`);
    }
  }
}

testModels();
