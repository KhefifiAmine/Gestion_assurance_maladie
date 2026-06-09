const express = require('express');
const router = express.Router();
const { getAllLogs, createLog } = require('../controllers/logController');
const { verifyToken, isSuperAdmin } = require('../middleware/auth.middleware');

router.get('/', verifyToken, isSuperAdmin, getAllLogs);

router.post('/', verifyToken, createLog);

module.exports = router;