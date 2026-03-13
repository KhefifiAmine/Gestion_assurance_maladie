const sequelize = require('./backend/src/config/db');
async function show() {
  const [results] = await sequelize.query("SHOW CREATE TABLE users;");
  console.log(results[0]['Create Table']);
  const [results2] = await sequelize.query("SHOW CREATE TABLE bulletin_soins;");
  console.log(results2[0]['Create Table']);
  process.exit(0);
}
show();
