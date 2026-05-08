const { sequelize } = require('./models');

async function fixSchema() {
    try {
        console.log("Adding missing column 'est_signe_adherent' to 'bulletin_soins'...");
        await sequelize.query("ALTER TABLE `bulletin_soins` ADD COLUMN IF NOT EXISTS `est_signe_adherent` TINYINT(1) NOT NULL DEFAULT 0;");
        console.log("Column added (or already existed)!");
        
        console.log("Verifying table structure...");
        const [results] = await sequelize.query("DESCRIBE `bulletin_soins`;");
        console.log(results.map(r => r.Field).join(', '));
        
    } catch (error) {
        console.error("FAILED to fix schema:");
        console.error(error);
    } finally {
        process.exit();
    }
}

fixSchema();
