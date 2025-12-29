const axios = require("axios");
const cheerio = require("cheerio");

/**
 * Extrait le texte et les liens d'une page HTML
 */
function extractContentFromHtml(html, baseUrl) {
    const $ = cheerio.load(html);
    const baseUrlObj = new URL(baseUrl);



    // Extraire les liens externes
    const liensExternes = [];
    $("a[href]").each((_, element) => {
        const href = $(element).attr("href");
        const texte = $(element).text().trim();
        if (href && !href.startsWith("#") && !href.startsWith("javascript:") && !href.startsWith("mailto:") && !href.startsWith("tel:")) {
            try {
                const absoluteUrl = new URL(href, baseUrl);
                // Lien externe = hostname différent
                if (absoluteUrl.hostname !== baseUrlObj.hostname) {
                    liensExternes.push({ url: absoluteUrl.href, texte: texte || absoluteUrl.hostname });
                }
            } catch {
                // Ignorer les URLs invalides
            }
        }
    });

    // Supprimer uniquement les éléments non pertinents (garder footer pour mentions légales)
    $("script, style, noscript, iframe, svg").remove();

    // Extraire le texte des balises importantes
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

    // Extraire tous les liens internes
    const liens = [];
    $("a[href]").each((_, element) => {
        const href = $(element).attr("href");
        if (href && !href.startsWith("#") && !href.startsWith("javascript:") && !href.startsWith("mailto:") && !href.startsWith("tel:")) {
            try {
                const absoluteUrl = new URL(href, baseUrl);
                if (absoluteUrl.hostname === baseUrlObj.hostname) {
                    absoluteUrl.hash = "";
                    liens.push(absoluteUrl.href);
                }
            } catch {
                // Ignorer les URLs invalides
            }
        }
    });

    // Extraire le meta title et description
    const metaTitle = $("title").text().trim() || null;
    const metaDescription = $('meta[name="description"]').attr("content")?.trim() || null;

    return {
        textes: [...new Set(textes)],
        liens: [...new Set(liens)],

        liensExternes: [...new Set(liensExternes.map(l => JSON.stringify(l)))].map(l => JSON.parse(l)),
        metaTitle,
        metaDescription
    };
}

/**
 * Scrape une seule page
 */
async function scrapePage(url) {
    const response = await axios.get(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        timeout: 10000,
    });
    return response.data;
}

/**
 * Crawle tout un site web et extrait le contenu de toutes les pages
 * @param {string} startUrl - URL de départ
 * @param {number} maxPages - Nombre maximum de pages à crawler (défaut: 20)
 * @returns {Promise<{texte: string, liens: string[]}>}
 */
async function scrapeWebsite(startUrl, maxPages = 20) {
    const visited = new Set();
    const toVisit = [startUrl];
    const allTextes = [];
    const contentTextes = [];
    const allLiens = [];
    const textesParPage = [];
    const metasParPage = [];

    const allLiensExternes = [];

    // Pages à exclure de l'analyse hors sujet
    const pagesLegales = ["mentions-legales", "politique-de-confidentialite", "cgv", "cgu", "privacy", "legal", "terms"];

    console.log(`🕷️  Crawling du site (max ${maxPages} pages)...`);

    while (toVisit.length > 0 && visited.size < maxPages) {
        const url = toVisit.shift();

        // Éviter de revisiter
        if (visited.has(url)) continue;
        visited.add(url);

        try {
            console.log(`   Page ${visited.size}/${maxPages}: ${url}`);
            const html = await scrapePage(url);
            const { textes, liens, medias, liensExternes, metaTitle, metaDescription } = extractContentFromHtml(html, url);

            allTextes.push(...textes);

            // Stocker le texte avec l'URL de la page
            const textePageComplet = textes.join(" ");
            textesParPage.push({
                url: url,
                texte: textePageComplet
            });



            // Stocker les liens externes
            liensExternes.forEach(l => allLiensExternes.push({ ...l, page: url }));

            // Stocker les meta tags
            metasParPage.push({
                url: url,
                title: metaTitle,
                description: metaDescription
            });

            // Vérifier si c'est une page légale
            const isLegalPage = pagesLegales.some(p => url.toLowerCase().includes(p));
            if (!isLegalPage) {
                contentTextes.push(...textes);
            }

            // Ajouter les liens internes non visités à la file
            liens.forEach(lien => {
                if (!visited.has(lien) && !toVisit.includes(lien)) {
                    toVisit.push(lien);
                }
                allLiens.push(lien);
            });

        } catch (error) {
            console.log(`   ⚠️  Erreur sur ${url}: ${error.message}`);
        }

        // Petite pause pour ne pas surcharger le serveur
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`✅ Crawling terminé: ${visited.size} pages analysées`);

    // Dédupliquer et nettoyer
    const texteUnique = [...new Set(allTextes)];
    const texte = texteUnique.join("\n").replace(/\s+/g, " ").trim();

    const contentUnique = [...new Set(contentTextes)];
    const texteContenu = contentUnique.join("\n").replace(/\s+/g, " ").trim();

    const liensUniques = [...new Set(allLiens)];

    return {
        texte,
        texteContenu,
        textesParPage,
        metasParPage,

        liensExternes: allLiensExternes,
        liens: liensUniques,
    };
}

module.exports = { scrapeWebsite };
