const { sequelize } = require('./models');

async function applyFixes() {
    try {
        console.log("Applying schema fixes...");
        
        console.log("Updating 'beneficiaires'...");
        await sequelize.query("ALTER TABLE `beneficiaires` ADD COLUMN IF NOT EXISTS `handicape` TINYINT(1) DEFAULT 0;");
        await sequelize.query("ALTER TABLE `beneficiaires` ADD COLUMN IF NOT EXISTS `etudiant` TINYINT(1) DEFAULT 0;");
        await sequelize.query("ALTER TABLE `beneficiaires` ADD COLUMN IF NOT EXISTS `chomage` TINYINT(1) DEFAULT 0;");
        await sequelize.query("ALTER TABLE `beneficiaires` ADD COLUMN IF NOT EXISTS `celibataire` TINYINT(1) DEFAULT 0;");
        
        console.log("Updating 'acte_medicaux'...");
        await sequelize.query("ALTER TABLE `acte_medicaux` ADD COLUMN IF NOT EXISTS `type_prestataire_soin` VARCHAR(255);");
        
        console.log("All fixes applied successfully!");
    } catch (error) {
        console.error("FAILED to apply fixes:");
        console.error(error);
    } finally {
        process.exit();
    }
}

applyFixes();
