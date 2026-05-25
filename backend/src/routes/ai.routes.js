const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { upload, analyzeBulletin } = require('../controllers/ai.controller');
const { aiLimiter } = require('../middleware/rateLimite.middleware');

router.post(
    '/analyze-bulletin',
    verifyToken,
    aiLimiter,
    upload.array('file', 5), // max 5 fichiers
    analyzeBulletin
  );

module.exports = router;
