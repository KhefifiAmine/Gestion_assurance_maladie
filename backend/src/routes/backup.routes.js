const express = require('express');
const router = express.Router();
const { verifyToken, isSuperAdmin } = require('../middleware/auth.middleware');
const { backupLimiter } = require('../middleware/rateLimite.middleware');
const backupController = require('../controllers/backup.controller');

// All backup routes require authentication and Admin role
router.use(verifyToken);
router.use(isSuperAdmin);

// Trigger a new database backup
router.post('/', backupLimiter, backupController.triggerManualBackup);

// List all database backups on disk
router.get('/', backupController.getAllBackups);

// Download a specific backup file
router.get('/:filename', backupController.downloadBackupFile);

// Delete a specific backup file
router.delete('/:filename', backupController.deleteBackupFile);

module.exports = router;
