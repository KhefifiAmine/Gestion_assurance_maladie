const express = require("express");
const cors = require("cors");
require("dotenv").config();
const morgan = require("morgan");

const { sequelize } = require("./models");
const authRoutes = require("./routes/auth.routes");

const app = express();

app.use(cors());
app.use(express.json());

// Middleware morgan pour afficher les requêtes
app.use(morgan(":method :url :status :res[content-length] - :response-time ms"));

// Routes
app.use("/api/auth", authRoutes);

// Test DB
sequelize.authenticate()
  .then(() => console.log("Connexion DB réussie"))
  .catch((err) => console.log("Erreur connexion DB:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Serveur lancé sur http://localhost:${PORT}`));
