const express = require("express");
const cors = require("cors");
require("dotenv").config();
const morgan = require("morgan");

const { sequelize } = require("./models");
const authRoutes = require("./src/routes/auth.routes");
const profileRoutes = require("./src/routes/profile.routes");
const userRoutes = require("./src/routes/user.routes");

const app = express();

app.use(cors());
app.use(express.json());

// Middleware morgan pour afficher les requêtes
app.use(morgan(":method :url :status :res[content-length] - :response-time ms"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/users", userRoutes);

// Test DB and sync models
sequelize.authenticate()
  .then(() => {
    console.log("Connexion DB réussie");
    return sequelize.sync({ alter: true }); // Sync tables based on models
  })
  .then(() => {
    console.log("Modèles synchronisés avec la base de données");
  })
  .catch((err) => console.log("Erreur connexion DB:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Serveur lancé sur http://localhost:${PORT}`));
