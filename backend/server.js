const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const { sequelize } = require("./models");

// Routes
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
const logRoutes = require("./src/routes/logRoutes");
const reimbursementRoutes = require("./src/routes/reimbursement.routes");
const backupRoutes = require("./src/routes/backup.routes");
const { scheduleAutoBackups } = require("./src/services/backup.service");

// Middleware custom
const journalMiddleware = require("./src/middleware/journal.middleware");
const { globalLimiter } = require("./src/middleware/rateLimite.middleware");

const app = express();

/* ========================
   MIDDLEWARES
======================== */
// Activation des en-têtes sécurisés (Clickjacking, XSS mineurs, Sniffing MIME)
// crossOriginResourcePolicy: false permet aux images du dossier upload d'être vues par le front-end React
app.use(helmet({ crossOriginResourcePolicy: false }));
// CORS : autoriser le frontend Vite avec credentials (requis pour les cookies HTTP-Only)
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL
].filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origin (Postman, curl, etc.) et les origins listées
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Origine CORS non autorisée : ' + origin));
    }
  },
  credentials: true  // Indispensable pour les cookies HTTP-Only
}));
app.use(cookieParser()); // Parse les cookies entrants
app.use(express.json());
app.use(journalMiddleware);
app.use(globalLimiter);
app.use(morgan(":method :url :status :res[content-length] - :response-time ms"));

/* ========================
   ROUTES
======================== */
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reset-password", resetPasswordRoutes);
app.use("/api/bulletins", bulletinRoutes);
app.use("/api/reclamations", reclamationRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/beneficiaries", beneficiaryRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/reimbursement", reimbursementRoutes);
app.use("/api/backups", backupRoutes);

app.use("/uploads", express.static("uploads"));

/* ========================
   CHECK ENV VARIABLES
======================== */
const requiredEnvVars = ["JWT_SECRET", "DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"];
const missingEnvVars = requiredEnvVars.filter(v => process.env[v] === undefined);

if (missingEnvVars.length > 0) {
  throw new Error("Variables manquantes: " + missingEnvVars.join(", "));
}

/* ========================
   START SERVER ONLY AFTER DB OK
======================== */
const PORT = process.env.PORT || 5000;

sequelize.authenticate()
  .then(() => {
    console.log("✅ Connexion DB réussie");

    return sequelize.sync({ alter: false });
  })
  .then(() => {
    console.log("✅ Modèles synchronisés");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Serveur lancé sur port ${PORT}`);
      scheduleAutoBackups();
    });
  })
  .catch((err) => {
    console.error("❌ Erreur DB:", err);
  });
