/**
 * Routes pour l'audit de sites Webflow
 */
const router = require("express").Router();
const { handleAudit, handleAuditLogsSSE } = require("../controllers/audit.controller");

// Route principale
router.post("/audit", handleAudit);

// Route SSE pour les logs en temps réel
router.get("/audit/logs", handleAuditLogsSSE);

module.exports = router;
