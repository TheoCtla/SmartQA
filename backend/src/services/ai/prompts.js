// Prompts pour l'analyse IA Gemini
// Fonctions pures retournant les prompts avec les variables injectées

// Prompt pour l'analyse principale (orthographe + extraction nom/téléphone)
function getMainContentPrompt({ texteAnalyse, entreprise, activite }) {
  return `Tu es un expert en révision de contenu web.

TEXTE DE LA LANDING PAGE :
"""
${texteAnalyse}
"""

CONTEXTE :
- Entreprise : ${entreprise}
- Activité : ${activite}

TÂCHES :
1. ORTHOGRAPHE : Identifie les fautes d'orthographe et grammaire.

2. EXTRACTION D'INFORMATIONS :
   - TÉLÉPHONE : Trouve le numéro de téléphone du commerce/entreprise sur la landing page (mentions légales, contact, footer). Retourne-le dans telephone_trouve.
   - NOM : Trouve le nom du propriétaire/gérant/responsable dans les mentions légales ou contact. Ignore les titres (Monsieur, Madame, M., Mme). Retourne-le dans nom_trouve.

RÉPONDS EN JSON :
{
  "orthographe": [{"erreur": "...", "correction": "...", "contexte": "..."}],
  "coherence": {
    "telephone_trouve": "le numéro trouvé ou null si non trouvé",
    "nom_trouve": "le nom trouvé (sans Monsieur/Madame) ou null si non trouvé"
  }
}`;
}

// Prompt pour l'analyse de cohérence d'une page
function getPageCoherencePrompt({ pageUrl, texteAnalyse, entrepriseNom, activite, details, slug, isHomePage, theme }) {
  const detailsContext = details ? `\nDÉTAILS/PROMOS DU SITE : ${details}` : '';

  const pageContext = isHomePage
    ? `Cette page est la PAGE D'ACCUEIL (/) qui doit présenter l'entreprise de manière générale.`
    : `Cette page est "${slug}" et doit parler principalement de "${theme}".`;

  return `CONTEXTE GLOBAL DU SITE :
Entreprise : "${entrepriseNom}"
Activité : "${activite}"${detailsContext}

CONTEXTE DE CETTE PAGE :
URL : ${pageUrl}
${pageContext}

TEXTE DE CETTE PAGE :
"""
${texteAnalyse}
"""

MISSION : Vérifie la COHÉRENCE du contenu de cette page.

RÈGLES DE VÉRIFICATION :
1. Le contenu doit correspondre au contexte global (entreprise "${entrepriseNom}" et activité "${activite}")
2. ${isHomePage
      ? 'La home page peut parler de tous les produits/services de l\'entreprise de manière générale'
      : `Le contenu doit être cohérent avec le thème de la page "${theme}". Si la page parle d'autres produits/thèmes du site, c'est une INCOHÉRENCE.`}
3. Les promos/offres peuvent apparaître sur TOUTES les pages, ce n'est PAS une incohérence
4. Les références à d'autres entreprises ou villes sont suspectes

ÉLÉMENTS À IGNORER (NE PAS signaler) :
- Navigation, footer, header, mentions légales
- Réseaux sociaux, Tarmaac (l'agence web)
- Promos et offres commerciales (OK sur toutes les pages)

RÉPONDS EN JSON :
{
  "coherent": true/false,
  "issues": [
    {"texte": "phrase problématique", "raison": "explication courte"}
  ]
}

Si la page est cohérente, retourne: {"coherent": true, "issues": []}`;
}

// Prompt pour l'analyse des meta tags SEO
function getMetaTagsPrompt({ metasFormatted, entrepriseNom, activite }) {
  return `CONTEXTE GLOBAL :
Entreprise : "${entrepriseNom}"
Activité : "${activite}"

ANALYSE DES META TAGS SEO :
${metasFormatted}

MISSION : Pour chaque page, vérifie si le meta title et la meta description sont en cohérence avec :
1. Le contexte global (entreprise "${entrepriseNom}" et activité "${activite}")
2. Le THÈME SPÉCIFIQUE de la page (basé sur son URL)

CRITÈRES D'ÉVALUATION :
- Le title doit mentionner "${entrepriseNom}" OU l'activité
- Le title doit aussi mentionner le thème de la page si ce n'est pas la home
- La description doit décrire le contenu spécifique de cette page
- Un title/description vide est considéré comme invalide
- La home page peut être générale

EXEMPLES :
- Page /lit-coffre → le title devrait mentionner "lit coffre"
- Page /convertible → le title devrait mentionner "convertible"
- Page / (home) → title général OK

RÉPONDS EN JSON avec un tableau "metas" contenant pour chaque page :
{
  "metas": [
    {
      "url": "l'URL de la page",
      "title": "le title trouvé",
      "description": "la description trouvée", 
      "title_valide": true/false,
      "description_valide": true/false,
      "commentaire": "explication courte si problème détecté"
    }
  ]
}`;
}

// Prompt pour l'analyse des liens externes
function getExternalLinksPrompt({ liensFormatted, entrepriseNom, activite }) {
  return `CONTEXTE :
Entreprise : "${entrepriseNom}"
Activité : "${activite}"

LIENS EXTERNES TROUVÉS :
${liensFormatted || "(aucun)"}

MISSION : Vérifie si les liens externes sont cohérents avec l'entreprise "${entrepriseNom}" et son activité.

RÈGLES D'ÉVALUATION :
- Un lien externe est VALIDE s'il pointe vers un service utile (Google Maps, réseaux sociaux, partenaires liés à l'activité) ET qui est lié à l'entreprise et à sa ville
- Les liens vers tarmaac.io sont TOUJOURS VALIDES (c'est l'agence web qui crée ces landing pages)
- Les liens vers d'autres entreprises ou villes non liées à "${entrepriseNom}" sont suspects

RÉPONDS EN JSON :
{
  "liens_externes": [
    {"url": "l'url", "valide": true/false, "raison": "courte explication"}
  ]
}`;
}

module.exports = {
  getMainContentPrompt,
  getPageCoherencePrompt,
  getMetaTagsPrompt,
  getExternalLinksPrompt
};
