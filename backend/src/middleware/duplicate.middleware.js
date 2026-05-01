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

// 📦 Multer upload - Changé de .single('file') à .array('files', 5) pour supporter plusieurs documents
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }
}).array('files', 10); 

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

      // Si aucun fichier n'est fourni, on continue (sauf en POST si requis par la logique métier)
      if (!req.files || req.files.length === 0) {
        // Dans certains cas, on pourrait vouloir forcer au moins un fichier en POST
        // if (req.method === 'POST') return res.status(400).json({ message: "Aucun fichier fourni" });
        return next();
      }

      const filesWithHashes = [];
      const duplicateFiles = [];

      // 🔐 calcul hash pour chaque fichier et vérification des doublons
      for (const file of req.files) {
        const fileHash = calculateFileHash(file.path);
        
        // 🔎 vérifier doublon dans la DB
        const existingDoc = await DocumentJustificatif.findOne({
          where: { hash_fichier: fileHash }
        });

        if (existingDoc) {
          duplicateFiles.push({ name: file.originalname, hash: fileHash, path: file.path });
        } else {
          filesWithHashes.push({ file, hash: fileHash });
        }
      }

      // Si des doublons sont détectés, on supprime TOUS les fichiers téléchargés et on renvoie une erreur
      if (duplicateFiles.length > 0) {
        req.files.forEach(f => {
          if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
        });

        const fileNames = duplicateFiles.map(f => f.name).join(', ');
        return res.status(400).json({
          message: `Doublon détecté pour les fichiers suivants : ${fileNames}`,
          isDuplicate: true,
          duplicateFiles: duplicateFiles.map(f => f.name)
        });
      }

      // 💾 injecter les hashes dans req pour usage après
      req.fileHashes = filesWithHashes.map(f => ({ 
        filename: f.file.filename, 
        hash: f.hash,
        originalname: f.file.originalname 
      }));

      next();
    } catch (error) {
      console.error("Erreur middleware upload:", error);

      if (req.files) {
        req.files.forEach(f => {
          if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
        });
      }

      return res.status(500).json({
        message: "Erreur lors du traitement des fichiers",
        error: error.message
      });
    }
  });
};

module.exports = uploadWithDuplicateCheck;