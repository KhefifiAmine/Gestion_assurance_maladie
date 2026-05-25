const path = require('path');
const fs = require('fs');
const backupService = require('../services/backup.service');

/**
 * Triggers a manual database backup (hybrid native/JS fallback).
 */
const triggerManualBackup = async (req, res) => {
  try {
    const result = await backupService.createDatabaseBackup();
    return res.status(200).json({
      success: true,
      message: 'Sauvegarde de la base de données créée avec succès.',
      data: {
        filename: result.filename,
        method: result.method
      }
    });
  } catch (error) {
    console.error('[BackupController] Error during manual backup:', error);
    return res.status(500).json({
      success: false,
      message: 'Échec de la sauvegarde de la base de données.',
      error: error.message
    });
  }
};

/**
 * Lists all database backup files stored in the backups folder.
 */
const getAllBackups = async (req, res) => {
  try {
    const backups = backupService.listBackups();
    return res.status(200).json({
      success: true,
      data: backups
    });
  } catch (error) {
    console.error('[BackupController] Error listing backups:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des sauvegardes.'
    });
  }
};

/**
 * Downloads a specific database backup file by its filename.
 */
const downloadBackupFile = async (req, res) => {
  const { filename } = req.params;

  try {
    // Prevent directory traversal attacks
    const safeFilename = path.basename(filename);
    const filePath = path.join(backupService.BACKUP_DIR, safeFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Fichier de sauvegarde introuvable.'
      });
    }

    return res.download(filePath, safeFilename);
  } catch (error) {
    console.error('[BackupController] Error downloading backup:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du téléchargement du fichier.'
    });
  }
};

/**
 * Deletes a specific database backup file by its filename.
 */
const deleteBackupFile = async (req, res) => {
  const { filename } = req.params;

  try {
    const deleted = backupService.deleteBackup(filename);
    
    if (deleted) {
      return res.status(200).json({
        success: true,
        message: 'Fichier de sauvegarde supprimé avec succès.'
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'Fichier de sauvegarde introuvable ou déjà supprimé.'
      });
    }
  } catch (error) {
    console.error('[BackupController] Error deleting backup:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la sauvegarde.'
    });
  }
};

module.exports = {
  triggerManualBackup,
  getAllBackups,
  downloadBackupFile,
  deleteBackupFile
};
