const express = require('express');
const router = express.Router();
const { getAdminStats } = require('../controllers/stats.controller');
const { verifyToken, isAdminOrRH } = require('../middleware/auth.middleware');

router.get('/admin', verifyToken, isAdminOrRH, getAdminStats);

module.exports = router;
