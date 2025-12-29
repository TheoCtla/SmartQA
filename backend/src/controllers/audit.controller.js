/**
 * Controller pour l'audit de sites Webflow
 * Orchestre le flux métier complet
 */
const { scrapeWebsite } = require("../services/scraper.service");
const { analyzeWithGemini } = require("../services/ai/gemini.service");
const { checkLinksStatus } = require("../services/linkChecker.service");
const { deduplicateLinks } = require("../utils/helpers");

/**
 * Handler principal pour l'endpoint POST /audit
 * Orchestre: Validation → Scraping → Analyse IA → Vérification liens → Fusion résultats
 */
async function handleAudit(req, res) {
    try {
        const { url, nomComplet, telephone, activite, entreprise, details } = req.body;

        // Validation des champs requis
        if (!url) {
            return res.status(400).json({ error: "L'URL est requise" });
        }
        if (!activite) {
            return res.status(400).json({ error: "L'activité est requise" });
        }
        if (!entreprise) {
            return res.status(400).json({ error: "Le nom de l'entreprise est requis" });
        }

        console.log(`Démarrage de l'audit pour: ${url}`);

        // Étape 1: Scraping du site
        console.log("Scraping du contenu...");
        const { texte, texteContenu, textesParPage, metasParPage, liensExternes, liens } = await scrapeWebsite(url);

        // Dédupliquer les liens externes et grouper par page/slug
        const liensExternesDedupliques = deduplicateLinks(liensExternes);

        // Étape 2: Analyse avec Gemini
        console.log("Analyse IA en cours...");
        const analysis = await analyzeWithGemini({
            texte,
            texteContenu,
            textesParPage,
            metasParPage,
            liensExternes: liensExternesDedupliques,
            nomComplet,
            telephone,
            activite,
            entreprise,
            details,
        });

        // Étape 3: Vérification HTTP des liens externes
        console.log("Vérification des liens cassés...");
        const liensAvecStatus = await checkLinksStatus(liensExternesDedupliques);

        // Merger Gemini + HTTP status + pages
        const liensAnalyses = (analysis.liensExternesAnalysis?.liens_externes || []).map(lien => {
            const original = liensAvecStatus.find(l => l.url === lien.url);
            return {
                ...lien,
                pages: original?.pages || ['/'],
                httpStatus: original?.httpStatus || 'ok',
                httpCode: original?.httpCode || 200
            };
        });

        // Ajouter les liens cassés qui ne sont pas dans l'analyse Gemini
        const liensGeminiUrls = new Set(liensAnalyses.map(l => l.url));
        const liensCassesManquants = liensAvecStatus
            .filter(l => !liensGeminiUrls.has(l.url) && (l.httpStatus === 'broken' || l.httpStatus === 'error'))
            .map(l => ({
                url: l.url,
                valide: false,
                raison: `Lien cassé (${l.httpCode})`,
                pages: l.pages,
                httpStatus: l.httpStatus,
                httpCode: l.httpCode
            }));

        // Réponse finale
        const result = {
            orthographe: analysis.orthographe || [],
            coherence: analysis.coherence || {},
            pagesCoherence: analysis.pagesCoherence || [],
            metas: analysis.metas || [],
            liensExternesAnalysis: { liens_externes: [...liensAnalyses, ...liensCassesManquants] },
            liens: liens,
        };

        console.log("Audit terminé avec succès");
        res.json(result);

    } catch (error) {
        console.error("Erreur lors de l'audit:", error.message);
        res.status(500).json({
            error: "Une erreur est survenue lors de l'analyse",
            details: error.message,
        });
    }
}

module.exports = { handleAudit };
