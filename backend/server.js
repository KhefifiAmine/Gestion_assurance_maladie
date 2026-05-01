const express = require("express");
const cors = require("cors");
require("dotenv").config();
const morgan = require("morgan");

const { sequelize } = require("./models");
const authRoutes = require("./src/routes/auth.routes");
const profileRoutes = require("./src/routes/profile.routes");
const userRoutes = require("./src/routes/user.routes");
const resetPasswordRoutes = require("./src/routes/resetPassword.routes");
const bulletinRoutes = require("./src/routes/bulletin.routes");
const reclamationRoutes = require("./src/routes/reclamation.routes");
const aiRoutes = require("./src/routes/ai.routes");
const statsRoutes = require("./src/routes/stats.routes");
const beneficiaryRoutes = require("./src/routes/beneficiary.routes");
const notificationRoutes = require("./src/routes/notification.routes");
const logRoutes = require('./src/routes/logRoutes');
const journalMiddleware = require('./src/middleware/journal.middleware');

const app = express();

const requiredEnvVars = ["JWT_SECRET"];
const missingEnvVars = requiredEnvVars.filter((name) => !process.env[name]);
if (missingEnvVars.length > 0) {
  throw new Error(`Variables d'environnement manquantes: ${missingEnvVars.join(", ")}`);
}

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origine non autorisee par CORS"));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(journalMiddleware);

// Middleware morgan pour afficher les requêtes
app.use(morgan(":method :url :status :res[content-length] - :response-time ms"));

// Routes
app.use("/api/reset-password", resetPasswordRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/users", userRoutes);
app.use("/api/bulletins", bulletinRoutes);
app.use("/api/reclamations", reclamationRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/beneficiaries", beneficiaryRoutes);
app.use("/api/notifications", notificationRoutes);

app.use("/uploads", express.static("uploads"));
app.use('/api/logs', logRoutes);

// Test DB and sync models
sequelize.authenticate()
  .then(() => {
    console.log("Connexion DB réussie");
    return sequelize.sync({ alter: false }); // Changé de true à false pour éviter l'erreur 'Too many keys'
  })
  .then(() => {
    console.log("Modèles synchronisés avec la base de données");
  })
  .catch((err) => console.log("Erreur connexion DB:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Serveur lancé sur http://localhost:${PORT}`));
