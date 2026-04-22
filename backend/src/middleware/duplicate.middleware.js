const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { DocumentJustificatif } = require('../../models');

// 📁 Config stockage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// 📦 Multer upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }
}).single('file'); // ⚠️ adapte 'file' au nom de ton champ

// 🔐 Hash
function calculateFileHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash("sha256");
  hashSum.update(fileBuffer);
  return hashSum.digest("hex");
}

// 🚀 Middleware fusionné
const uploadWithDuplicateCheck = async (req, res, next) => {
  upload(req, res, async (err) => {
    try {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      if (!req.file) {
        if (req.method === 'POST') {
          return res.status(400).json({ message: "Aucun fichier fourni" });
        }
        return next();
      }

      // 🔐 calcul hash
      const fileHash = calculateFileHash(req.file.path);

      // 🔎 vérifier doublon
      const existingDoc = await DocumentJustificatif.findOne({
        where: { hash_fichier: fileHash }
      });

      if (existingDoc) {
        fs.unlinkSync(req.file.path); // supprimer fichier
        return res.status(400).json({
          message: "Ce document a déjà été soumis (doublon détecté).",
          isDuplicate: true
        });
      }

      // 💾 injecter dans req pour usage après
      req.fileHash = fileHash;

      next();
    } catch (error) {
      console.error("Erreur middleware upload:", error);

      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      return res.status(500).json({
        message: "Erreur lors du traitement du fichier",
        error: error.message
      });
    }
  });
};

module.exports = uploadWithDuplicateCheck;