/**
 * Service Gemini pour les analyses IA
 * Centralise tous les appels à l'API Google Gemini
 */
const { genAI } = require("../../config/gemini.config");
const { cleanJsonResponse, extractSlugFromUrl, normalizeString, normalizePhone } = require("../../utils/helpers");
const {
    getMainContentPrompt,
    getPageCoherencePrompt,
    getMetaTagsPrompt,
    getExternalLinksPrompt
} = require("./prompts");

/**
 * ÉTAPE 1 : Analyse principale (orthographe, extraction téléphone/nom)
 */
async function analyzeMainContent({ texte, nomComplet, telephone, activite, entreprise }) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const texteAnalyse = texte.substring(0, 100000);

    const prompt = getMainContentPrompt({ texteAnalyse, entreprise, activite });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(cleanJsonResponse(response.text()));
}

/**
 * ÉTAPE 2 : Analyse de cohérence page par page
 */
async function analyzePageCoherence(textesParPage, entrepriseNom, activite, details) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const results = [];

    // Analyser chaque page individuellement
    for (const page of textesParPage) {
        const { slug, isHomePage, theme } = extractSlugFromUrl(page.url);
        const texteAnalyse = page.texte.substring(0, 30000);

        // Skip si le texte est trop court
        if (texteAnalyse.length < 50) continue;

        const prompt = getPageCoherencePrompt({
            pageUrl: page.url,
            texteAnalyse,
            entrepriseNom,
            activite,
            details,
            slug,
            isHomePage,
            theme
        });

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const analysis = JSON.parse(cleanJsonResponse(response.text()));

            results.push({
                url: page.url,
                slug,
                theme: isHomePage ? 'Page d\'accueil' : theme,
                coherent: analysis.coherent,
                issues: analysis.issues || []
            });
        } catch (error) {
            console.error(`Erreur analyse page ${page.url}:`, error.message);
            results.push({
                url: page.url,
                slug,
                theme: isHomePage ? 'Page d\'accueil' : theme,
                coherent: true,
                issues: []
            });
        }

        // Petite pause entre les appels API
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    return results;
}

/**
 * ÉTAPE 5 : Analyse des meta tags (title et description) avec slug
 */
async function analyzeMetaTags(metasParPage, entrepriseNom, activite) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Formater les metas pour le prompt avec extraction du slug
    const metasFormatted = metasParPage.map((m, i) => {
        const { slug, isHomePage, theme } = extractSlugFromUrl(m.url);
        const pageContext = isHomePage
            ? "Page d'accueil (générale)"
            : `Page "${theme}"`;
        return `Page ${i + 1}: ${m.url}
  - Thème attendu: ${pageContext}
  - Title: ${m.title || "(vide)"}
  - Description: ${m.description || "(vide)"}`;
    }).join("\n\n");

    const prompt = getMetaTagsPrompt({ metasFormatted, entrepriseNom, activite });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(cleanJsonResponse(response.text()));
}

/**
 * ÉTAPE 6 : Analyse des liens externes
 */
async function analyzeExternalLinks(liensExternes, entrepriseNom, activite) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const liensFormatted = liensExternes.slice(0, 30).map(l =>
        `URL: ${l.url} (texte: "${l.texte}")`
    ).join("\n");

    const prompt = getExternalLinksPrompt({ liensFormatted, entrepriseNom, activite });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(cleanJsonResponse(response.text()));
}

/**
 * Analyse complète avec contexte utilisateur
 * Orchestre toutes les étapes de l'analyse IA
 */
async function analyzeWithGemini({ texte, texteContenu, textesParPage, metasParPage, liensExternes, nomComplet, telephone, activite, entreprise, details }) {
    console.log(`   Texte total: ${texte.length} caractères`);
    console.log(`   Texte contenu (sans pages légales): ${texteContenu?.length || 0} caractères`);
    console.log(`   Entreprise: ${entreprise}`);
    console.log(`   Activité: ${activite}`);
    if (details) console.log(`   Détails: ${details.substring(0, 50)}...`);

    try {
        // ÉTAPE 1 : Analyse principale (orthographe + extraction tél/nom)
        console.log("   Étape 1: Analyse principale...");
        const mainAnalysis = await analyzeMainContent({ texte, nomComplet, telephone, activite, entreprise });

        // ÉTAPE 2 : Analyse de cohérence page par page
        console.log("   Étape 2: Analyse de cohérence par page...");
        let pagesCoherence = [];
        if (textesParPage && textesParPage.length > 0) {
            // Filtrer les pages légales
            const pagesLegales = ["mentions-legales", "politique-de-confidentialite", "cgv", "cgu", "privacy", "legal", "terms"];
            const pagesAAnalyser = textesParPage.filter(page => {
                const urlLower = page.url.toLowerCase();
                return !pagesLegales.some(p => urlLower.includes(p));
            });
            pagesCoherence = await analyzePageCoherence(pagesAAnalyser, entreprise, activite, details);
        }

        // ÉTAPE 3 : Localiser chaque erreur d'orthographe sur sa page
        console.log("   Étape 3: Localisation des erreurs par page...");
        const orthographeAvecPages = (mainAnalysis.orthographe || []).map(erreur => {
            let pageUrl = "Page non identifiée";
            if (textesParPage && erreur.contexte) {
                for (const page of textesParPage) {
                    if (page.texte.toLowerCase().includes(erreur.contexte.toLowerCase().substring(0, 30)) ||
                        page.texte.toLowerCase().includes(erreur.erreur.toLowerCase())) {
                        pageUrl = page.url;
                        break;
                    }
                }
            }
            return { ...erreur, page: pageUrl };
        });

        // ÉTAPE 4 : Comparaison NOM et TÉLÉPHONE dans le code (pas par Gemini)
        console.log("   Étape 4: Comparaison nom/téléphone dans le code...");
        const coherence = mainAnalysis.coherence || {};

        // Comparaison du nom (case-insensitive)
        const nomSaisi = normalizeString(nomComplet);
        const nomTrouve = normalizeString(coherence.nom_trouve);
        const nomValide = nomSaisi && nomTrouve && nomTrouve.includes(nomSaisi);

        // Comparaison du téléphone (ignorer formatage)
        const telSaisi = normalizePhone(telephone);
        const telTrouve = normalizePhone(coherence.telephone_trouve);
        const telValide = telSaisi && telTrouve && telTrouve.includes(telSaisi);

        // Construire la cohérence finale avec comparaison code
        const coherenceFinale = {
            telephone_valide: telValide,
            telephone_message: coherence.telephone_trouve || "Non trouvé sur la landing page",
            nom_valide: nomValide,
            nom_message: coherence.nom_trouve || "Non trouvé sur la landing page"
        };

        // ÉTAPE 5 : Analyse des meta tags
        console.log("   Étape 5: Analyse des meta tags SEO...");
        let metasAnalysis = { metas: [] };
        if (metasParPage && metasParPage.length > 0) {
            metasAnalysis = await analyzeMetaTags(metasParPage, entreprise, activite);
        }

        // ÉTAPE 6 : Analyse des liens externes
        console.log("   Étape 6: Analyse des liens externes...");
        let liensExternesAnalysis = { liens_externes: [] };
        if (liensExternes && liensExternes.length > 0) {
            liensExternesAnalysis = await analyzeExternalLinks(liensExternes, entreprise, activite);
        }

        // Combiner les résultats
        return {
            orthographe: orthographeAvecPages,
            coherence: coherenceFinale,
            pagesCoherence: pagesCoherence,
            metas: metasAnalysis.metas || [],
            liensExternesAnalysis: liensExternesAnalysis
        };

    } catch (error) {
        console.error("Erreur Gemini:", error);
        return {
            orthographe: [],
            coherence: {
                telephone_valide: false,
                nom_valide: false,
            },
            pagesCoherence: []
        };
    }
}

module.exports = {
    analyzeWithGemini,
    analyzeMainContent,
    analyzePageCoherence,
    analyzeMetaTags,
    analyzeExternalLinks
};
