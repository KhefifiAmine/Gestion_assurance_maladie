const express = require('express');
const router = express.Router();
const { réinitialisationMotDePass, verifierCode, resetMotDePass } = require('../controllers/resetPassword.controller');
const { passwordResetLimiter } = require('../middleware/rateLimite.middleware');


router.post('/forgot-password', passwordResetLimiter, réinitialisationMotDePass); //passwordResetLimiter
router.post('/verify-reset-code', verifierCode);
router.post('/reset-password', resetMotDePass);



module.exports = router;