const express = require('express');
const router = express.Router();
const { getAllLogs, createLog } = require('../controllers/logController');
const { verifyToken, isAdminOrRH } = require('../middleware/auth.middleware');

router.get('/', verifyToken, isAdminOrRH, getAllLogs);

router.post('/', verifyToken, createLog);

module.exports = router;