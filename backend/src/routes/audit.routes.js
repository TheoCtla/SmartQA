/**
 * Routes pour l'audit de sites Webflow
 */
const router = require("express").Router();
const { handleAudit } = require("../controllers/audit.controller");

// Route principale d'audit
router.post("/audit", handleAudit);

module.exports = router;
