const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { upload, analyzeBulletin, uploadDocumentOnly } = require('../controllers/ai.controller');

// Route pour analyser un bulletin de soins par IA
router.post('/analyze-bulletin', verifyToken, upload.single('file'), analyzeBulletin);

// Route pour uploader un document sans IA
router.post('/upload-document', verifyToken, upload.single('file'), uploadDocumentOnly);

module.exports = router;
