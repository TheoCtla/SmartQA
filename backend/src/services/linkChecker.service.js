/**
 * Service de vérification des liens HTTP
 * Vérifie si les liens externes sont accessibles
 */
const axios = require("axios");

/**
 * Vérifie si un lien externe fonctionne
 * @param {string} url - URL à vérifier
 * @returns {Promise<{ status: string, httpCode: number|string }>}
 */
async function checkLinkStatus(url) {
    try {
        // Essayer d'abord avec HEAD (plus rapide)
        const response = await axios.head(url, {
            timeout: 5000,
            maxRedirects: 5,
            validateStatus: () => true, // Accepter tous les codes pour les analyser
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        return {
            status: response.status >= 200 && response.status < 400 ? 'ok' : 'broken',
            httpCode: response.status
        };
    } catch (headError) {
        // Si HEAD échoue, essayer avec GET
        try {
            const response = await axios.get(url, {
                timeout: 5000,
                maxRedirects: 5,
                validateStatus: () => true,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            return {
                status: response.status >= 200 && response.status < 400 ? 'ok' : 'broken',
                httpCode: response.status
            };
        } catch (getError) {
            // Timeout ou erreur réseau
            return {
                status: 'error',
                httpCode: getError.code === 'ECONNABORTED' ? 'Timeout' : (getError.code || 'Erreur')
            };
        }
    }
}

/**
 * Vérifie plusieurs liens en parallèle (avec limite de concurrence)
 * @param {Array<{ url: string, pages: string[] }>} links - Liens à vérifier
 * @param {number} concurrency - Nombre de requêtes simultanées (défaut: 5)
 * @returns {Promise<Array>}
 */
async function checkLinksStatus(links, concurrency = 5) {
    const results = [];
    for (let i = 0; i < links.length; i += concurrency) {
        const batch = links.slice(i, i + concurrency);
        const batchResults = await Promise.all(
            batch.map(async (link) => {
                const { status, httpCode } = await checkLinkStatus(link.url);
                return { ...link, httpStatus: status, httpCode };
            })
        );
        results.push(...batchResults);
    }
    return results;
}

module.exports = {
    checkLinkStatus,
    checkLinksStatus
};
