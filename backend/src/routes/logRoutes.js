const express = require('express');
const router = express.Router();
const { getAllLogs, createLog } = require('../controllers/logController');
const { verifyToken, isRH } = require('../middleware/auth.middleware');

router.get('/', verifyToken, isRH, getAllLogs);

router.post('/', verifyToken, createLog);

module.exports = router;