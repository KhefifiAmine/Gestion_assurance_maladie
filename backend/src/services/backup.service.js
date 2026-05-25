const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { sequelize } = require('../../models');

const BACKUP_DIR = path.join(__dirname, '../../backups');

// Ensure backups directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Generates a standard MySQL-compatible SQL dump of the database.
 * Uses mysqldump if available, otherwise falls back to a pure JS raw SQL generator.
 */
const createDatabaseBackup = async () => {
  const timestamp = new Date().toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '-');
  const dbName = process.env.DB_NAME || 'assurance_db';
  const filename = `backup-${dbName}-${timestamp}.sql`;
  const backupPath = path.join(BACKUP_DIR, filename);

  console.log(`[BackupService] Starting database backup: ${filename}...`);

  try {
    // Attempt native mysqldump
    await runNativeMysqldump(backupPath);
    console.log(`[BackupService] Native mysqldump completed successfully: ${filename}`);
    return { success: true, method: 'native', filename, path: backupPath };
  } catch (error) {
    console.warn(`[BackupService] Native mysqldump failed or is unavailable. Error: ${error.message}. Falling back to pure JS dumper...`);
    
    try {
      // Fallback to pure JS exporter
      await runPureJsDump(backupPath);
      console.log(`[BackupService] Pure JS database dump completed successfully: ${filename}`);
      return { success: true, method: 'js-fallback', filename, path: backupPath };
    } catch (fallbackError) {
      console.error(`[BackupService] Pure JS dumper also failed! Error: ${fallbackError.message}`);
      throw fallbackError;
    }
  }
};

/**
 * Executes the native mysqldump CLI command.
 */
const runNativeMysqldump = (backupPath) => {
  return new Promise((resolve, reject) => {
    const host = process.env.DB_HOST || 'localhost';
    const user = process.env.DB_USER || 'root';
    const password = process.env.DB_PASSWORD || '';
    const database = process.env.DB_NAME || 'assurance_db';
    const port = process.env.DB_port || '3306';

    const passPart = password ? `-p"${password}"` : '';
    const cmd = `mysqldump -h ${host} -P ${port} -u ${user} ${passPart} ${database} --result-file="${backupPath}"`;

    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      }
      resolve();
    });
  });
};

/**
 * High-fidelity pure-JS MySQL exporter using raw queries and Sequelize formatting.
 */
const runPureJsDump = async (backupPath) => {
  const writeStream = fs.createWriteStream(backupPath);

  // Write header and disable foreign key checks for clean loading
  writeStream.write(`-- Hybrid Database Backup SQL Dump\n`);
  writeStream.write(`-- Generated at: ${new Date().toISOString()}\n\n`);
  writeStream.write(`SET FOREIGN_KEY_CHECKS = 0;\n`);
  writeStream.write(`SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";\n`);
  writeStream.write(`SET time_zone = "+00:00";\n\n`);

  // 1. Get all tables in the database
  const [tablesResult] = await sequelize.query("SHOW TABLES");
  const tables = tablesResult.map(row => Object.values(row)[0]);

  for (const tableName of tables) {
    writeStream.write(`-- --------------------------------------------------------\n`);
    writeStream.write(`-- Table structure for table \`${tableName}\`\n`);
    writeStream.write(`-- --------------------------------------------------------\n\n`);

    // Write drop statement
    writeStream.write(`DROP TABLE IF EXISTS \`${tableName}\`;\n`);

    // 2. Get table schema definition
    const [[schemaResult]] = await sequelize.query(`SHOW CREATE TABLE \`${tableName}\``);
    const createTableSql = schemaResult['Create Table'] || schemaResult['Create View'];
    
    writeStream.write(`${createTableSql};\n\n`);

    // 3. Dump data if it's a table (not a view)
    if (createTableSql.includes('CREATE TABLE')) {
      const [rows] = await sequelize.query(`SELECT * FROM \`${tableName}\``);
      
      if (rows.length > 0) {
        writeStream.write(`-- Dumping data for table \`${tableName}\`\n\n`);

        const columns = Object.keys(rows[0]).map(col => `\`${col}\``).join(', ');
        
        // Chunk inserts for efficiency
        const chunkSize = 100;
        for (let i = 0; i < rows.length; i += chunkSize) {
          const chunk = rows.slice(i, i + chunkSize);
          const valuesSql = chunk.map(row => {
            const rowValues = Object.values(row).map(val => sequelize.escape(val)).join(', ');
            return `(${rowValues})`;
          }).join(',\n');

          writeStream.write(`INSERT INTO \`${tableName}\` (${columns}) VALUES \n${valuesSql};\n\n`);
        }
      }
    }
  }

  // Restore checks
  writeStream.write(`SET FOREIGN_KEY_CHECKS = 1;\n`);
  
  // Close the file stream cleanly
  return new Promise((resolve, reject) => {
    writeStream.end();
    writeStream.on('finish', () => resolve());
    writeStream.on('error', (err) => reject(err));
  });
};

/**
 * Lists all database backup files currently stored on disk.
 */
const listBackups = () => {
  if (!fs.existsSync(BACKUP_DIR)) return [];

  const files = fs.readdirSync(BACKUP_DIR);
  return files
    .filter(file => file.endsWith('.sql'))
    .map(file => {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      return {
        filename: file,
        sizeBytes: stats.size,
        createdAt: stats.mtime,
      };
    })
    .sort((a, b) => b.createdAt - a.createdAt); // Newest first
};

/**
 * Safely deletes a database backup file by filename.
 */
const deleteBackup = (filename) => {
  // Prevent directory traversal attacks
  const safeFilename = path.basename(filename);
  const filePath = path.join(BACKUP_DIR, safeFilename);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
};

/**
 * Schedules automatic daily database backups at 2:00 AM.
 */
const scheduleAutoBackups = () => {
  const ONE_DAY = 24 * 60 * 60 * 1000;
  
  const now = new Date();
  const nextBackup = new Date(now);
  nextBackup.setHours(2, 0, 0, 0); // 2:00 AM
  
  if (now.getHours() >= 2) {
    nextBackup.setDate(nextBackup.getDate() + 1);
  }
  
  const delay = nextBackup.getTime() - now.getTime();
  
  console.log(`[BackupScheduler] Next automatic database backup scheduled for ${nextBackup.toLocaleString()} (in ${(delay / 1000 / 60).toFixed(1)} minutes).`);
  
  setTimeout(() => {
    createDatabaseBackup()
      .then(() => console.log('[BackupScheduler] Automatic daily backup completed successfully.'))
      .catch(err => console.error('[BackupScheduler] Error during automatic daily backup:', err));
      
    setInterval(() => {
      createDatabaseBackup()
        .then(() => console.log('[BackupScheduler] Automatic daily backup completed successfully.'))
        .catch(err => console.error('[BackupScheduler] Error during automatic daily backup:', err));
    }, ONE_DAY);
  }, delay);
};

module.exports = {
  createDatabaseBackup,
  listBackups,
  deleteBackup,
  scheduleAutoBackups,
  BACKUP_DIR
};
