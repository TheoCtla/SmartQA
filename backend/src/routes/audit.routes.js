/**
 * Routes pour l'audit de sites Webflow
 */
const router = require("express").Router();
const { handleAuditV2, handleAuditLogsSSE } = require("../controllers/audit.v2.controller");

// Route principale (V2)
router.post("/audit", handleAuditV2);
router.post("/audit/v2", handleAuditV2);

// Route SSE pour les logs en temps réel
router.get("/audit/logs", handleAuditLogsSSE);

module.exports = router;
