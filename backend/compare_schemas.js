const { sequelize, User, Beneficiary, BulletinSoin, ActeMedical, Pharmacie, DocumentJustificatif, MotifRejet } = require('./models');

async function compareSchemas() {
    console.log("Starting comparison...");
    const models = [
        { name: 'User', model: User, table: 'users' },
        { name: 'Beneficiary', model: Beneficiary, table: 'beneficiaires' },
        { name: 'BulletinSoin', model: BulletinSoin, table: 'bulletin_soins' },
        { name: 'ActeMedical', model: ActeMedical, table: 'acte_medicaux' },
        { name: 'Pharmacie', model: Pharmacie, table: 'pharmacies' },
        { name: 'DocumentJustificatif', model: DocumentJustificatif, table: 'document_justificatifs' },
        { name: 'MotifRejet', model: MotifRejet, table: 'motifs_rejet' }
    ];

    for (const { name, model, table } of models) {
        console.log(`Checking ${name}...`);
        try {
            const [results] = await sequelize.query(`DESCRIBE \`${table}\`;`);
            const tableColumns = results.map(r => r.Field);
            const modelColumns = Object.keys(model.rawAttributes);

            const missingInTable = modelColumns.filter(c => !tableColumns.includes(c));
            if (missingInTable.length > 0) {
                console.log(`  [!] Missing in ${table}: ${missingInTable.join(', ')}`);
                for (const col of missingInTable) {
                    const attr = model.rawAttributes[col];
                    let sql = `ALTER TABLE \`${table}\` ADD COLUMN \`${col}\` `;
                    
                    const typeName = attr.type.constructor.name;
                    if (typeName === 'STRING') sql += `VARCHAR(${attr.type._length || 255})`;
                    else if (typeName === 'TEXT') sql += `TEXT`;
                    else if (typeName === 'INTEGER') sql += `INT`;
                    else if (typeName === 'DOUBLE') sql += `DOUBLE`;
                    else if (typeName === 'BOOLEAN') sql += `TINYINT(1)`;
                    else if (typeName === 'DATEONLY') sql += `DATE`;
                    else if (typeName === 'DATE') sql += `DATETIME`;
                    else sql += `TEXT`;

                    if (attr.allowNull === false) sql += ` NOT NULL`;
                    if (attr.defaultValue !== undefined) {
                         if (typeof attr.defaultValue === 'boolean') sql += ` DEFAULT ${attr.defaultValue ? 1 : 0}`;
                         else if (typeof attr.defaultValue === 'number') sql += ` DEFAULT ${attr.defaultValue}`;
                         else if (attr.defaultValue === 'NOW') sql += ` DEFAULT CURRENT_TIMESTAMP`;
                    }
                    sql += `;`;
                    console.log(`  SQL: ${sql}`);
                }
            } else {
                console.log(`  [OK] Table ${table} matches.`);
            }
        } catch (err) {
            console.error(`  [ERR] Error checking ${table}:`, err.message);
        }
    }
    console.log("Comparison finished.");
    process.exit();
}

compareSchemas();
