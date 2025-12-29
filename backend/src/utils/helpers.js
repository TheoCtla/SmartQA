/**
 * Fonctions utilitaires pour SmartQA
 * Centralise le traitement de texte, URLs et données
 */

/**
 * Nettoie la réponse JSON de Gemini (supprime les balises markdown)
 * @param {string} text - Texte brut de la réponse Gemini
 * @returns {string} JSON nettoyé
 */
function cleanJsonResponse(text) {
    let cleanedText = text.trim();
    if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText.slice(7);
    }
    if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.slice(3);
    }
    if (cleanedText.endsWith("```")) {
        cleanedText = cleanedText.slice(0, -3);
    }
    return cleanedText.trim();
}

/**
 * Extrait le slug lisible d'une URL
 * @param {string} url - URL complète
 * @returns {{ slug: string, isHomePage: boolean, theme: string }}
 */
function extractSlugFromUrl(url) {
    try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;

        // Si c'est la home page
        if (pathname === '/' || pathname === '') {
            return { slug: '/', isHomePage: true, theme: 'page d\'accueil générale' };
        }

        // Extraire le dernier segment du path
        const segments = pathname.split('/').filter(s => s.length > 0);
        const lastSegment = segments[segments.length - 1] || '';

        // Convertir le slug en thème lisible (lit-coffre → lit coffre)
        const theme = lastSegment.replace(/-/g, ' ').replace(/_/g, ' ');

        return { slug: pathname, isHomePage: false, theme };
    } catch {
        return { slug: '/', isHomePage: true, theme: 'page d\'accueil générale' };
    }
}

/**
 * Normalise une chaîne pour comparaison (lowercase, trim, espaces unifiés)
 * @param {string} str - Chaîne à normaliser
 * @returns {string}
 */
function normalizeString(str) {
    if (!str) return "";
    return str.toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * Normalise un numéro de téléphone (supprime espaces, points, tirets, parenthèses)
 * @param {string} str - Numéro de téléphone
 * @returns {string}
 */
function normalizePhone(str) {
    if (!str) return "";
    return str.replace(/[\s\.\-\(\)]/g, "");
}

/**
 * Déduplique les liens externes et groupe par page/slug
 * @param {Array<{ url: string, texte: string, page: string }>} links - Liens à dédupliquer
 * @returns {Array<{ url: string, texte: string, pages: string[] }>}
 */
function deduplicateLinks(links) {
    const linkMap = new Map();
    for (const link of links) {
        const urlKey = link.url;
        if (!linkMap.has(urlKey)) {
            // Extraire le slug de la page source
            let slug = '/';
            try {
                const pageUrl = new URL(link.page);
                slug = pageUrl.pathname || '/';
            } catch { }
            linkMap.set(urlKey, {
                url: link.url,
                texte: link.texte,
                pages: [slug]
            });
        } else {
            // Ajouter le slug si pas déjà présent
            let slug = '/';
            try {
                const pageUrl = new URL(link.page);
                slug = pageUrl.pathname || '/';
            } catch { }
            const existing = linkMap.get(urlKey);
            if (!existing.pages.includes(slug)) {
                existing.pages.push(slug);
            }
        }
    }
    return Array.from(linkMap.values());
}

module.exports = {
    cleanJsonResponse,
    extractSlugFromUrl,
    normalizeString,
    normalizePhone,
    deduplicateLinks
};

// ============================================
// FONCTIONS V2 - SmartQA V2
// ============================================

/**
 * Classifie le type de page basé sur l'URL
 * @param {string} url - URL de la page
 * @returns {"home"|"interne"|"legal"|"privacy"|"cookies"|"cgu"|"autre"}
 */
function classifyPageType(url) {
    try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname.toLowerCase();

        // Home page
        if (pathname === '/' || pathname === '') {
            return 'home';
        }

        // Pages légales
        if (pathname.includes('mentions-legales') || pathname.includes('mentions_legales') || pathname.includes('legal')) {
            return 'legal';
        }
        if (pathname.includes('politique-de-confidentialite') || pathname.includes('privacy') || pathname.includes('confidentialite')) {
            return 'privacy';
        }
        if (pathname.includes('cookies') || pathname.includes('cookie')) {
            return 'cookies';
        }
        if (pathname.includes('cgu') || pathname.includes('cgv') || pathname.includes('conditions-generales') || pathname.includes('terms')) {
            return 'cgu';
        }

        // Page interne standard
        return 'interne';
    } catch {
        return 'autre';
    }
}

/**
 * Vérifie si une page est de type légal (pour filtrage étape 2)
 * @param {string} pageType - Type de page
 * @returns {boolean}
 */
function isLegalPage(pageType) {
    return ['legal', 'privacy', 'cookies', 'cgu'].includes(pageType);
}

/**
 * Retourne la date actuelle au format ISO
 * @returns {string}
 */
function getCurrentDateISO() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Tente de formater un numéro de téléphone au format international
 * Si français (commence par 0), ajoute +33
 * @param {string} phone - Numéro de téléphone
 * @returns {string}
 */
function normalizePhoneInternational(phone) {
    if (!phone) return "";

    // Nettoyer le numéro
    let cleaned = phone.replace(/[\s\.\-\(\)]/g, "");

    // Si commence par 0 et a 10 chiffres (format français)
    if (cleaned.startsWith('0') && cleaned.length === 10) {
        return '+33' + cleaned.substring(1);
    }

    // Si déjà au format international
    if (cleaned.startsWith('+')) {
        return cleaned;
    }

    return cleaned;
}

/**
 * Classifie le type d'un lien
 * @param {string} href - URL du lien
 * @param {string} baseHostname - Hostname du site audité
 * @returns {"internal"|"external"|"tel"|"mailto"|"maps"|"anchor"|"js_redirect"|"unknown"}
 */
function classifyLinkType(href, baseHostname) {
    if (!href) return 'unknown';

    const hrefLower = href.toLowerCase();

    // Liens spéciaux
    if (hrefLower.startsWith('tel:')) return 'tel';
    if (hrefLower.startsWith('mailto:')) return 'mailto';
    if (hrefLower.startsWith('#')) return 'anchor';
    if (hrefLower.startsWith('javascript:')) return 'js_redirect';

    // Google Maps
    if (hrefLower.includes('google.com/maps') || hrefLower.includes('maps.google') || hrefLower.includes('goo.gl/maps')) {
        return 'maps';
    }

    try {
        const urlObj = new URL(href);
        if (urlObj.hostname === baseHostname || urlObj.hostname === 'www.' + baseHostname || 'www.' + urlObj.hostname === baseHostname) {
            return 'internal';
        }
        return 'external';
    } catch {
        // URL relative = interne
        if (href.startsWith('/') || href.startsWith('./') || href.startsWith('../')) {
            return 'internal';
        }
        return 'unknown';
    }
}

/**
 * Détecte la zone d'un lien (header, footer, main)
 * @param {object} element - Element Cheerio
 * @param {object} $ - Instance Cheerio
 * @returns {"header"|"footer"|"main"}
 */
function detectLinkZone($element, $) {
    // Remonter dans les parents pour trouver header/footer
    let current = $element;
    for (let i = 0; i < 10; i++) {
        const parent = current.parent();
        if (parent.length === 0) break;

        const tagName = parent.prop('tagName')?.toLowerCase();
        const className = (parent.attr('class') || '').toLowerCase();
        const id = (parent.attr('id') || '').toLowerCase();

        if (tagName === 'header' || className.includes('header') || id.includes('header') || className.includes('nav') || tagName === 'nav') {
            return 'header';
        }
        if (tagName === 'footer' || className.includes('footer') || id.includes('footer')) {
            return 'footer';
        }

        current = parent;
    }

    return 'main';
}

// Exporter les nouvelles fonctions V2
module.exports.classifyPageType = classifyPageType;
module.exports.isLegalPage = isLegalPage;
module.exports.getCurrentDateISO = getCurrentDateISO;
module.exports.normalizePhoneInternational = normalizePhoneInternational;
module.exports.classifyLinkType = classifyLinkType;
module.exports.detectLinkZone = detectLinkZone;
