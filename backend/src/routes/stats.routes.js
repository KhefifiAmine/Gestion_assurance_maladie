const express = require('express');
const router = express.Router();
const { getAdminStats } = require('../controllers/stats.controller');
const { verifyToken, isSuperAdmin } = require('../middleware/auth.middleware');

router.get('/admin', verifyToken, isSuperAdmin, getAdminStats);

module.exports = router;