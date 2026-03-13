const mysql = require('mysql2/promise');
require('dotenv').config({ path: './src/.env' });

async function resetDB() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    console.log('Connected to MySQL server.');

    const dbName = process.env.DB_NAME || 'assurance_db';
    
    console.log(`Dropping database ${dbName} if exists...`);
    await connection.query(`DROP DATABASE IF EXISTS \`${dbName}\`;`);
    
    console.log(`Creating database ${dbName}...`);
    await connection.query(`CREATE DATABASE \`${dbName}\`;`);

    console.log('Database reset successfully!');
    await connection.end();
  } catch (error) {
    console.error('Error resetting database:', error);
  }
}

resetDB();
