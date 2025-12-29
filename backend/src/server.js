/**
 * SmartQA Backend Server
 * Point d'entrée de l'application - Configuration et démarrage
 */
require("dotenv").config();
const express = require("express");
const cors = require("cors");

// Import des routes
const auditRoutes = require("./routes/audit.routes");

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use(auditRoutes);

// Route de santé
app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`Serveur SmartQA démarré sur http://localhost:${PORT}`);
});
