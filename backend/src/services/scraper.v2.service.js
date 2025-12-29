/**
 * Scraper V2 pour SmartQA
 * Extraction enrichie : classification des pages, liens typés, tel/mailto, metas
 */
const axios = require("axios");
const cheerio = require("cheerio");
const { classifyPageType, classifyLinkType, detectLinkZone } = require("../utils/helpers");

/**
 * Scrape une seule page et retourne le HTML brut
 * @param {string} url - URL de la page à scraper
 * @returns {Promise<string>} HTML brut
 */
async function fetchPage(url) {
    const response = await axios.get(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        timeout: 15000,
    });
    return response.data;
}

/**
 * Extrait le contenu enrichi d'une page HTML pour V2
 * @param {string} html - Contenu HTML de la page
 * @param {string} pageUrl - URL de la page
 * @param {string} baseHostname - Hostname du site principal
 * @returns {object} Données extraites enrichies
 */
function extractPageContentV2(html, pageUrl, baseHostname) {
    const $ = cheerio.load(html);

    // ===== META TAGS =====
    const metaTitle = $("title").text().trim() || null;
    const metaDescription = $('meta[name="description"]').attr("content")?.trim() || null;

    // ===== LIENS TEL: =====
    const telLinks = [];
    $('a[href^="tel:"]').each((_, el) => {
        const href = $(el).attr("href");
        const texte = $(el).text().trim();
        const numero = href.replace("tel:", "").trim();
        telLinks.push({ numero, texte, href });
    });

    // ===== LIENS MAILTO: =====
    const mailtoLinks = [];
    $('a[href^="mailto:"]').each((_, el) => {
        const href = $(el).attr("href");
        const texte = $(el).text().trim();
        const email = href.replace("mailto:", "").split("?")[0].trim();
        mailtoLinks.push({ email, texte, href });
    });

    // ===== TOUS LES LIENS (typés) =====
    const liens = [];
    $("a[href]").each((_, el) => {
        const $el = $(el);
        const href = $el.attr("href");
        if (!href) return;

        // Ignorer les ancres vides
        if (href === "#" || href === "") return;

        const texte = $el.text().trim() || $el.attr("title") || "";
        const type = classifyLinkType(href, baseHostname);
        const foundIn = detectLinkZone($el, $);

        // Résoudre l'URL absolue pour les liens internes/externes
        let absoluteUrl = href;
        try {
            if (!href.startsWith("tel:") && !href.startsWith("mailto:") && !href.startsWith("#") && !href.startsWith("javascript:")) {
                absoluteUrl = new URL(href, pageUrl).href;
            }
        } catch {
            absoluteUrl = href;
        }

        liens.push({
            url: absoluteUrl,
            type,
            texte: texte.substring(0, 100), // Limiter la longueur
            found_in: foundIn
        });
    });

    // ===== EXTRACTION DU TEXTE =====
    // Supprimer les éléments non pertinents pour le texte
    $("script, style, noscript, iframe, svg").remove();

    // Texte des balises importantes
    const textSelectors = [
        "h1", "h2", "h3", "h4", "h5", "h6",
        "p", "span", "li", "a", "button", "label",
        "td", "th", "caption", "figcaption", "blockquote",
        "article", "section", "div"
    ];

    const textes = [];
    textSelectors.forEach((selector) => {
        $(selector).each((_, element) => {
            const text = $(element).text().trim();
            if (text && text.length > 3) {
                textes.push(text);
            }
        });
    });

    // Texte nettoyé et dédupliqué
    const texteUnique = [...new Set(textes)];
    const texteNettoye = texteUnique.join("\n").replace(/\s+/g, " ").trim();

    // ===== LIENS INTERNES POUR LE CRAWL =====
    const internalLinks = [];
    liens.filter(l => l.type === "internal").forEach(l => {
        try {
            const urlObj = new URL(l.url);
            urlObj.hash = "";
            internalLinks.push(urlObj.href);
        } catch {
            // Ignorer
        }
    });

    return {
        meta_title: metaTitle,
        meta_description: metaDescription,
        tel_links: telLinks,
        mailto_links: mailtoLinks,
        liens: liens,
        texte_nettoye: texteNettoye,
        html_brut: html,
        internal_links: [...new Set(internalLinks)]
    };
}

/**
 * Crawle un site complet et retourne les données enrichies par page
 * @param {string} startUrl - URL de départ
 * @param {number} maxPages - Nombre maximum de pages à crawler
 * @returns {Promise<object>} Données du site
 */
async function scrapeWebsiteV2(startUrl, maxPages = 20) {
    const visited = new Set();
    const toVisit = [startUrl];
    const pages = [];

    // Extraire le hostname de base
    let baseHostname;
    try {
        baseHostname = new URL(startUrl).hostname;
    } catch {
        throw new Error("URL de départ invalide");
    }

    console.log(`🕷️  Crawling V2 du site (max ${maxPages} pages)...`);

    while (toVisit.length > 0 && visited.size < maxPages) {
        const url = toVisit.shift();

        // Éviter de revisiter
        if (visited.has(url)) continue;
        visited.add(url);

        try {
            console.log(`   Page ${visited.size}/${maxPages}: ${url}`);

            // Récupérer le HTML
            const html = await fetchPage(url);

            // Extraire le contenu enrichi
            const extracted = extractPageContentV2(html, url, baseHostname);

            // Classifier le type de page
            const pageType = classifyPageType(url);

            // Ajouter les données de la page
            pages.push({
                page_url: url,
                type_page: pageType,
                meta_title: extracted.meta_title,
                meta_description: extracted.meta_description,
                texte_nettoye: extracted.texte_nettoye,
                html_brut: extracted.html_brut,
                tel_links: extracted.tel_links,
                mailto_links: extracted.mailto_links,
                liens: extracted.liens
            });

            // Ajouter les liens internes non visités à la file
            extracted.internal_links.forEach(link => {
                if (!visited.has(link) && !toVisit.includes(link)) {
                    toVisit.push(link);
                }
            });

        } catch (error) {
            console.log(`   ⚠️  Erreur sur ${url}: ${error.message}`);
        }

        // Petite pause pour ne pas surcharger le serveur
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`✅ Crawling V2 terminé: ${visited.size} pages analysées`);

    // Préparer les données agrégées
    const allMetas = pages.map(p => ({
        url: p.page_url,
        title: p.meta_title,
        description: p.meta_description
    }));

    const allLiens = pages.flatMap(p =>
        p.liens.map(l => ({ ...l, page_url: p.page_url }))
    );

    return {
        base_url: startUrl,
        base_hostname: baseHostname,
        pages_count: pages.length,
        pages: pages,
        all_metas: allMetas,
        all_liens: allLiens
    };
}

module.exports = {
    fetchPage,
    extractPageContentV2,
    scrapeWebsiteV2
};
