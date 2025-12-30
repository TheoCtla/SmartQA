/**
 * Controller V2 pour l'audit de sites Webflow
 * Orchestre le flux métier complet avec le pipeline 6 étapes
 */
const { scrapeWebsiteV2 } = require("../services/scraper.v2.service");
const { runFullAnalysisV2 } = require("../services/ai/gemini.v2.service");

// Store pour les connexions SSE actives
const sseClients = new Map();

/**
 * Endpoint SSE pour streamer les logs
 */
function handleAuditLogsSSE(req, res) {
    const clientId = Date.now().toString();

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Envoyer un ping initial
    res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Connexion établie' })}\n\n`);

    sseClients.set(clientId, res);

    req.on('close', () => {
        sseClients.delete(clientId);
    });
}

/**
 * Envoyer un log à tous les clients SSE
 */
function broadcastLog(message, type = 'info') {
    const data = JSON.stringify({ type, message, timestamp: new Date().toISOString() });
    sseClients.forEach((client) => {
        client.write(`data: ${data}\n\n`);
    });
}

/**
 * Handler principal pour l'endpoint POST /audit/v2
 * Orchestre: Validation → Scraping V2 → Analyse IA 6 étapes → Résultats
 */
async function handleAuditV2(req, res) {
    try {
        const {
            url,
            entreprise,
            activite,
            telephone_attendu,
            gerant_attendu,
            ville_attendue,
            adresse_attendue,
            siret_attendu,
            email_attendu,
            domaines_attendus,
            mots_cles_offre,
            details,
            max_pages = 20
        } = req.body;

        if (!url) {
            return res.status(400).json({ error: "L'URL est requise" });
        }
        if (!entreprise) {
            return res.status(400).json({ error: "Le nom de l'entreprise est requis" });
        }
        if (!activite) {
            return res.status(400).json({ error: "L'activité est requise pour l'analyse de cohérence" });
        }

        console.log(`\n${"=".repeat(60)}`);
        console.log(`Démarrage de l'audit V2 pour: ${url}`);
        console.log(`${"=".repeat(60)}`);
        broadcastLog(`Démarrage de l'audit pour: ${url}`, 'start');

        const userContext = {
            url,
            entreprise,
            activite,
            telephone_attendu: telephone_attendu || null,
            gerant_attendu: gerant_attendu || null,
            ville_attendue: ville_attendue || null,
            adresse_attendue: adresse_attendue || null,
            siret_attendu: siret_attendu || null,
            email_attendu: email_attendu || null,
            domaines_attendus: domaines_attendus || [],
            mots_cles_offre: mots_cles_offre || null,
            details: details || null
        };

        console.log("\nPhase 1: Scraping du site...");
        broadcastLog("Phase 1: Scraping du site en cours...", 'scraping');
        const scrapedData = await scrapeWebsiteV2(url, max_pages);
        console.log(`   ✓ ${scrapedData.pages_count} pages scrapées`);
        broadcastLog(`${scrapedData.pages_count} pages scrapées`, 'success');

        console.log("\nPhase 2: Analyse IA complète (6 étapes)");
        broadcastLog("Phase 2: Analyse IA (6 étapes)...", 'analysis');
        const analysisResults = await runFullAnalysisV2(scrapedData, userContext, broadcastLog);

        const result = {
            meta: {
                url_auditee: url,
                entreprise,
                activite,
                pages_analysees: scrapedData.pages_count,
                date_audit: new Date().toISOString()
            },
            etape1_orthographe: analysisResults.etape1,
            etape2_legal: analysisResults.etape2,
            etape3_coherence: analysisResults.etape3,
            etape4_liens: analysisResults.etape4,
            etape5_seo: analysisResults.etape5,
            etape6_synthese: analysisResults.etape6,
            pages_scrapees: scrapedData.pages.map(p => ({
                url: p.page_url,
                type: p.type_page,
                meta_title: p.meta_title,
                meta_description: p.meta_description
            }))
        };

        console.log(`\n${"=".repeat(60)}`);
        console.log(`Audit V2 terminé avec succès!`);
        console.log(`   Décision: ${analysisResults.etape6.decision}`);
        console.log(`${"=".repeat(60)}\n`);
        broadcastLog(`Audit terminé! Décision: ${analysisResults.etape6.decision}`, 'complete');

        res.json(result);

    } catch (error) {
        console.error("❌ Erreur lors de l'audit V2:", error.message);
        broadcastLog(`Erreur: ${error.message}`, 'error');
        res.status(500).json({
            error: "Une erreur est survenue lors de l'analyse",
            details: error.message,
        });
    }
}

module.exports = { handleAuditV2, handleAuditLogsSSE };
