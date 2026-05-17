const express = require('express');
const router = express.Router();
const statsController = require('../controllers/stats.controller');
const { verifyToken, isAdminOrRH } = require('../middleware/auth.middleware');

router.get('/admin', verifyToken, isAdminOrRH, statsController.getAdminStats);

module.exports = router;
