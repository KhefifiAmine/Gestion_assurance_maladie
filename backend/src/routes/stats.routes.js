const express = require('express');
const router = express.Router();
const { getAdminStats } = require('../controllers/stats.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

router.get('/admin', verifyToken, isAdmin, getAdminStats);

module.exports = router;
