/**
 * Routes pour l'audit de sites Webflow
 */
const router = require("express").Router();
const { handleAudit } = require("../controllers/audit.controller");
const { handleAuditV2 } = require("../controllers/audit.v2.controller");

// Route V1 (rétrocompatibilité)
router.post("/audit", handleAudit);

// Route V2 (nouveau pipeline 6 étapes)
router.post("/audit/v2", handleAuditV2);

module.exports = router;
