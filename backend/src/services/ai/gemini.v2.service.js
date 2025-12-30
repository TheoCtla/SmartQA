/**
 * Service Gemini V2 pour SmartQA
 * Orchestration des 6 étapes d'analyse IA
 */
const { genAI } = require("../../config/gemini.config");
const { cleanJsonResponse, getCurrentDateISO, isLegalPage, extractSlugFromUrl } = require("../../utils/helpers");
const {
    getStep1Prompt,
    getStep2Prompt,
    getStep3Prompt,
    getStep4Prompt,
    getStep5Prompt,
    getStep6Prompt
} = require("./prompts.v2");

// ============================================
// ÉTAPE 1 - Orthographe + Extraction + Cohérence (par page)
// ============================================

async function analyzeStep1(pageData, context) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = getStep1Prompt({
        currentDateISO: getCurrentDateISO(),
        entrepriseNom: context.entreprise,
        activite: context.activite,
        telephoneAttendu: context.telephone_attendu,
        gerantAttendu: context.gerant_attendu,
        pageUrl: pageData.page_url,
        pageType: pageData.type_page,
        texteAnalyse: pageData.texte_nettoye?.substring(0, 80000) || "",
        telLinks: pageData.tel_links || []
    });

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const parsed = JSON.parse(cleanJsonResponse(response.text()));

        // Nettoyer les faux positifs d'orthographe (erreur === correction)
        if (parsed.orthographe && Array.isArray(parsed.orthographe)) {
            parsed.orthographe = parsed.orthographe.filter(item => {
                // Normalisation Unicode NFC + suppression caractères invisibles
                const normalize = (str) => (str || "")
                    .normalize("NFC")
                    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, " ")
                    .replace(/\s+/g, " ")
                    .trim()
                    .toLowerCase();

                const erreur = normalize(item.erreur);
                const correction = normalize(item.correction);
                return erreur !== correction && erreur.length > 0;
            });
        }

        return parsed;
    } catch (error) {
        console.error(`Erreur Step1 pour ${pageData.page_url}:`, error.message);
        return {
            page_url: pageData.page_url,
            orthographe: [],
            extraction: { telephones_trouves: [], noms_trouves: [] },
            coherence: { telephone_statut: "non_verifiable", nom_statut: "non_verifiable" }
        };
    }
}

// ============================================
// ÉTAPE 2 - Conformité pages légales (par page légale)
// ============================================

async function analyzeStep2(pageData, context) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = getStep2Prompt({
        currentDateISO: getCurrentDateISO(),
        entrepriseNom: context.entreprise,
        activite: context.activite,
        gerantAttendu: context.gerant_attendu,
        telephoneAttendu: context.telephone_attendu,
        adresseAttendue: context.adresse_attendue,
        siretAttendu: context.siret_attendu,
        emailAttendu: context.email_attendu,
        pageUrl: pageData.page_url,
        legalType: pageData.type_page,
        texteAnalyse: pageData.texte_nettoye?.substring(0, 50000) || ""
    });

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return JSON.parse(cleanJsonResponse(response.text()));
    } catch (error) {
        console.error(`Erreur Step2 pour ${pageData.page_url}:`, error.message);
        return {
            page_url: pageData.page_url,
            type_page_legale: pageData.type_page,
            conforme: true,
            issues: []
        };
    }
}

// ============================================
// ÉTAPE 3 - Cohérence contenu + Copywriting (par page)
// ============================================

async function analyzeStep3(pageData, context) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const { isHomePage, theme } = extractSlugFromUrl(pageData.page_url);

    const prompt = getStep3Prompt({
        currentDateISO: getCurrentDateISO(),
        entrepriseNom: context.entreprise,
        activite: context.activite,
        detailsContext: context.details,
        pageUrl: pageData.page_url,
        isHomePage,
        theme: isHomePage ? null : theme,
        pageContext: isHomePage ? "Page d'accueil générale" : `Page thématique : ${theme}`,
        texteAnalyse: pageData.texte_nettoye?.substring(0, 50000) || ""
    });

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return JSON.parse(cleanJsonResponse(response.text()));
    } catch (error) {
        console.error(`Erreur Step3 pour ${pageData.page_url}:`, error.message);
        return {
            page_url: pageData.page_url,
            coherent: true,
            issues: [],
            copywriting_issues: []
        };
    }
}

// ============================================
// ÉTAPE 4 - Liens cliquables + Suspicion (par page)
// ============================================

async function analyzeStep4(pageData, context) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Limiter le nombre de liens pour éviter de surcharger le prompt
    const liensLimites = (pageData.liens || []).slice(0, 50);

    const prompt = getStep4Prompt({
        entrepriseNom: context.entreprise,
        activite: context.activite,
        villeAttendue: context.ville_attendue,
        domainesAttendus: context.domaines_attendus,
        telephoneAttendu: context.telephone_attendu,
        pageUrl: pageData.page_url,
        liensJSON: JSON.stringify(liensLimites, null, 2)
    });

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return JSON.parse(cleanJsonResponse(response.text()));
    } catch (error) {
        console.error(`Erreur Step4 pour ${pageData.page_url}:`, error.message);
        return {
            page_url: pageData.page_url,
            liens: [],
            resume: { total: 0, valides: 0, suspects: 0, a_verifier: 0 }
        };
    }
}

// ============================================
// ÉTAPE 5 - Meta SEO (site-wide, un seul appel)
// ============================================

async function analyzeStep5(allMetas, context) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = getStep5Prompt({
        entrepriseNom: context.entreprise,
        activite: context.activite,
        metasJSON: JSON.stringify(allMetas, null, 2)
    });

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return JSON.parse(cleanJsonResponse(response.text()));
    } catch (error) {
        console.error("Erreur Step5:", error.message);
        return {
            metas: [],
            doublons: { titles_identiques: [], descriptions_identiques: [] }
        };
    }
}

// ============================================
// ÉTAPE 6 - Synthèse Go/No-Go (site-wide, un seul appel)
// ============================================

async function analyzeStep6(allResults, context) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = getStep6Prompt({
        entrepriseNom: context.entreprise,
        activite: context.activite,
        baseUrl: context.url,
        currentDateISO: getCurrentDateISO(),
        resultEtape1JSON: JSON.stringify(allResults.etape1, null, 2),
        resultEtape2JSON: JSON.stringify(allResults.etape2, null, 2),
        resultEtape3JSON: JSON.stringify(allResults.etape3, null, 2),
        resultEtape4JSON: JSON.stringify(allResults.etape4, null, 2),
        resultEtape5JSON: JSON.stringify(allResults.etape5, null, 2)
    });

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return JSON.parse(cleanJsonResponse(response.text()));
    } catch (error) {
        console.error("Erreur Step6:", error.message);
        return {
            decision: "go_avec_reserves",
            priorites: { P0: [], P1: [], P2: [] },
            resume: "Erreur lors de la génération du rapport",
            checklist: []
        };
    }
}

// ============================================
// ORCHESTRATION COMPLÈTE
// ============================================

async function runFullAnalysisV2(scrapedData, userContext) {
    console.log("🤖 Démarrage de l'analyse IA V2...");
    console.log(`   Entreprise: ${userContext.entreprise}`);
    console.log(`   Activité: ${userContext.activite}`);
    console.log(`   Pages à analyser: ${scrapedData.pages.length}`);

    const results = {
        etape1: [],
        etape2: [],
        etape3: [],
        etape4: [],
        etape5: null,
        etape6: null
    };

    // ===== ÉTAPES 1-4 : Par page =====
    for (const page of scrapedData.pages) {
        console.log(`\n📄 Analyse de: ${page.page_url}`);

        // Étape 1 : Orthographe + Extraction (toutes les pages)
        console.log("   → Étape 1: Orthographe + Extraction...");
        const step1Result = await analyzeStep1(page, userContext);
        results.etape1.push(step1Result);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Étape 2 : Conformité légale (pages légales uniquement)
        if (isLegalPage(page.type_page)) {
            console.log("   → Étape 2: Conformité légale...");
            const step2Result = await analyzeStep2(page, userContext);
            results.etape2.push(step2Result);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Étape 3 : Cohérence + Copywriting (pages de contenu, pas légales)
        if (!isLegalPage(page.type_page)) {
            console.log("   → Étape 3: Cohérence + Copywriting...");
            const step3Result = await analyzeStep3(page, userContext);
            results.etape3.push(step3Result);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Étape 4 : Liens (toutes les pages)
        console.log("   → Étape 4: Analyse des liens...");
        const step4Result = await analyzeStep4(page, userContext);
        results.etape4.push(step4Result);

        // Pause entre les pages pour éviter le rate limiting
        console.log("   ⏳ Pause anti rate-limit (2s)...");
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // ===== ÉTAPE 5 : Meta SEO (site-wide) =====
    console.log("\n📊 Étape 5: Analyse Meta SEO (site-wide)...");
    await new Promise(resolve => setTimeout(resolve, 1000)); // Délai avant étape 5
    results.etape5 = await analyzeStep5(scrapedData.all_metas, userContext);

    // ===== ÉTAPE 6 : Synthèse Go/No-Go =====
    console.log("\n🎯 Étape 6: Synthèse Go/No-Go...");
    await new Promise(resolve => setTimeout(resolve, 1000)); // Délai avant étape 6
    results.etape6 = await analyzeStep6(results, userContext);

    console.log("\n✅ Analyse V2 terminée!");
    console.log(`   Décision: ${results.etape6.decision}`);

    return results;
}

module.exports = {
    analyzeStep1,
    analyzeStep2,
    analyzeStep3,
    analyzeStep4,
    analyzeStep5,
    analyzeStep6,
    runFullAnalysisV2
};
