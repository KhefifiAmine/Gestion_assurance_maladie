const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { upload, analyzeBulletin } = require('../controllers/ai.controller');

// Route pour analyser un bulletin de soins par IA
router.post('/analyze-bulletin', verifyToken, upload.single('file'), analyzeBulletin);

module.exports = router;
