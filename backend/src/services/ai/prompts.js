/**
 * Prompts pour SmartQA - Pipeline 6 étapes
 * Chaque fonction retourne un prompt structuré avec output JSON strict
 */

// ============================================
// PRÉFIXE COMMUN (règles anti-hallucination)
// ============================================

function getCommonPrefix() {
  return `RÈGLES GÉNÉRALES (obligatoires) :
1. Analyse uniquement les données fournies dans ce message.
2. Ne jamais inventer : si une information n'est pas explicitement présente, retourne null ou "a_verifier".
3. Chaque problème doit inclure un extrait exact ("texte") présent dans les données.
4. Si c'est ambigu, utilise type="suspicion" ou statut="a_verifier", jamais une affirmation certaine.
5. Réponds strictement en JSON. Aucun texte en dehors du JSON.

`;
}

// ============================================
// ÉTAPE 1 - Orthographe + Extraction + Cohérence (par page)
// ============================================

function getStep1Prompt({
  currentDateISO,
  entrepriseNom,
  activite,
  telephoneAttendu,
  gerantAttendu,
  pageUrl,
  pageType,
  texteAnalyse,
  telLinks
}) {
  return `${getCommonPrefix()}DATE DE RÉFÉRENCE : ${currentDateISO}

CONTEXTE GLOBAL :
- entreprise_attendue : ${entrepriseNom}
- activite : ${activite}
- telephone_attendu : ${telephoneAttendu || "null"}
- gerant_attendu : ${gerantAttendu || "null"}

CONTEXTE PAGE :
- page_url : ${pageUrl}
- type_page : ${pageType}

DONNÉES SCRAPÉES (incluent potentiellement header/footer) :
texte_page :
"""
${texteAnalyse}
"""

tel_links_extraits :
${JSON.stringify(telLinks || [])}

MISSION :
1. ORTHOGRAPHE : détecter les fautes d'orthographe et de grammaire RÉELLEMENT PRÉSENTES dans le texte.
2. EXTRACTION : trouver les téléphones et le nom du responsable/gérant s'ils sont présents.
3. COHÉRENCE : si les valeurs attendues sont fournies, comparer téléphone_trouve et nom_trouve aux attendus.

RÈGLES ORTHOGRAPHE (TRÈS IMPORTANT) :
- Si une phrase contient plusieurs fautes, regroupe-les en UNE SEULE entrée avec l'extrait fautif complet et sa version corrigée.
- Types d'erreurs : fautes d'orthographe, accords singulier/pluriel, accords masculin/féminin, conjugaisons, accents, homophones, doubles consonnes, oublie de lettres.
- Le champ "erreur" doit être une copie exacte du texte fautif.

🚫 EXCLUSIONS (NE PAS ANALYSER) :
- Avis/témoignages clients.
- Noms propres, marques, termes techniques.

RÈGLES EXTRACTION :
- Téléphone : liste tous les numéros trouvés (texte + tel_links).
- Nom : extraire le nom du propriétaire/gérant/responsable UNIQUEMENT sur les pages légales (mentions légales, politique de confidentialité, CGV, CGU). Sur les autres pages, retourner noms_trouves = [].
- Cohérence : "ok" si identique, "different" si différent, "non_trouve" si non trouvé, "non_verifiable" si attendu = null
- Ne pas extraire les noms de clients d'avis.

RÉPONDS EN JSON :
{
  "page_url": "${pageUrl}",
  "orthographe": [
    {"erreur": "", "correction": "", "contexte": "", "gravite": "mineure|importante"}
  ],
  "extraction": {
    "telephones_trouves": [],
    "noms_trouves": []
  },
  "coherence": {
    "telephone_trouve": null,
    "nom_trouve": null,
    "telephone_statut": "ok|different|non_trouve|non_verifiable",
    "nom_statut": "ok|different|non_trouve|non_verifiable",
    "note": ""
  }
}

Si aucune faute : orthographe = [].`;
}

// ============================================
// ÉTAPE 2 - Conformité pages légales (par page légale uniquement)
// ============================================

function getStep2Prompt({
  currentDateISO,
  entrepriseNom,
  activite,
  gerantAttendu,
  telephoneAttendu,
  adresseAttendue,
  siretAttendu,
  emailAttendu,
  pageUrl,
  legalType,
  texteAnalyse
}) {
  return `${getCommonPrefix()}DATE DE RÉFÉRENCE : ${currentDateISO}

CONTEXTE GLOBAL :
- entreprise_attendue : ${entrepriseNom}
- activite : ${activite}
- gerant_attendu : ${gerantAttendu || "null"}
- telephone_attendu : ${telephoneAttendu || "null"}
- adresse_attendue : ${adresseAttendue || "null"}
- siret_attendu : ${siretAttendu || "null"}
- email_attendu : ${emailAttendu || "null"}

CONTEXTE PAGE :
- page_url : ${pageUrl}
- type_page_legale : ${legalType}

TEXTE PAGE LÉGALE :
"""
${texteAnalyse}
"""

MISSION :
Vérifier si cette page légale est cohérente et complète par rapport aux informations attendues.

À VÉRIFIER :
- Présence d'éléments d'identification (éditeur, contact, etc.)
- Cohérence avec entreprise_attendue
- Cohérence gérant/téléphone/email/siret/adresse si attendus fournis
- Références à d'autres entreprises/villes → suspicion (copier-coller)
- Si la page ne correspond pas à son type → incohérence

RÉPONDS EN JSON :
{
  "page_url": "${pageUrl}",
  "type_page_legale": "${legalType}",
  "conforme": true,
  "issues": [
    {"texte": "", "raison": "", "type": "manquant|copier_coller|incoherent|suspicion", "gravite": "mineure|importante"}
  ]
}

Si aucune anomalie : {"conforme": true, "issues": []}`;
}

// ============================================
// ÉTAPE 3 - Cohérence contenu + Copywriting QA (par page)
// ============================================

function getStep3Prompt({
  currentDateISO,
  entrepriseNom,
  activite,
  detailsContext,
  pageUrl,
  isHomePage,
  theme,
  pageContext,
  texteAnalyse
}) {
  return `${getCommonPrefix()}DATE DE RÉFÉRENCE : ${currentDateISO}

CONTEXTE GLOBAL :
- entreprise : "${entrepriseNom}"
- activite : "${activite}"
- details_contexte : ${detailsContext || "null"}

CONTEXTE PAGE :
- page_url : ${pageUrl}
- type : ${isHomePage ? "home" : "page_interne"}
- theme_attendu_si_interne : ${theme || "null"}
- contexte_additionnel : ${pageContext || "null"}

TEXTE PAGE :
"""
${texteAnalyse}
"""

MISSION :
1. Vérifier la cohérence globale du contenu avec l'entreprise et l'activité
2. Détecter : hors-sujet, copier-coller, villes/entreprises suspectes, contradictions
3. Détecter les promos avec dates (voir RÈGLES PROMOS ci-dessous)
4. QA Copywriting : formulations floues/faibles, promesses vagues, CTA incohérents

RÈGLES HEADER/FOOTER :
- Le header/footer font partie de l'analyse
- MAIS la navigation (liste de pages) n'est PAS une incohérence
- Les infos concrètes (offre, ville, téléphone, CTA) peuvent être signalées si incohérentes

RÈGLES PROMOS ET DATES (TRÈS IMPORTANT) :
- Si une promo mentionne une date de fin AVEC ANNÉE EXPLICITE (ex: "31 décembre 2024", "15/01/2025") :
  → Comparer à la date de référence (${currentDateISO})
  → Si dépassée : type = "promo_expiree", gravité = "importante"
  → Si pas dépassée : pas de problème
  
- Si une promo mentionne une date de fin SANS ANNÉE (ex: "jusqu'au 31 décembre", "valable jusqu'au 15 janvier") :
  → NE JAMAIS utiliser "promo_expiree" (l'année est inconnue)
  → Utiliser type = "promo_date_ambigue"
  → Comparer jour/mois à la date de référence en supposant l'année courante :
    - Si la date n'est pas encore passée cette année : gravité = "mineure" (probablement OK)
    - Si la date est passée cette année : gravité = "importante" (probablement expirée, à vérifier)
  → Ajouter un champ "promo" avec les détails

RÈGLES HORAIRES D'OUVERTURE :
- Si des horaires sont affichés, vérifier qu'ils sont cohérents avec le type d'activité.
- Signaler comme "horaires_suspects" (gravité "importante") si :
  * Horaires impossibles (ex: ouvert de 25h à 30h)
  * Horaires incohérents avec l'activité (ex: magasin physique ouvert 24h/24, ou à des heures de nuits pour des magasins qui ne sont pas habituellement ouvert de nuit)
  * Horaires très inhabituels pour ce type de commerce
- NE PAS signaler si les horaires sont classiques (ex: 9h-12h 14h-19h pour un commerce)

RÉPONDS EN JSON :
{
  "page_url": "${pageUrl}",
  "coherent": true,
  "issues": [
    {
      "texte": "",
      "raison": "",
      "type": "hors_sujet|copier_coller|contradiction|promo_expiree|promo_date_ambigue|horaires_suspects|suspicion",
      "gravite": "mineure|importante",
      "promo": {
        "date_fin_texte": "31 décembre",
        "annee_presente": false,
        "date_fin_interpretee": "2025-12-31"
      }
    }
  ],
  "copywriting_issues": [
    {"texte": "", "raison": "", "suggestion": ""}
  ]
}

NOTES :
- Le champ "promo" est optionnel, uniquement pour les types promo_expiree et promo_date_ambigue
- Si coherent : issues = []. copywriting_issues peut être [] indépendamment.
- Exemple : "Jusqu'au 31 décembre" avec currentDateISO=2025-12-29 → promo_date_ambigue, mineure (pas encore passé)
- Exemple : "Jusqu'au 15 novembre" avec currentDateISO=2025-12-29 → promo_date_ambigue, importante (déjà passé cette année)`;
}

// ============================================
// ÉTAPE 4 - Liens cliquables + Suspicion (par page)
// ============================================

function getStep4Prompt({
  entrepriseNom,
  activite,
  villeAttendue,
  domainesAttendus,
  telephoneAttendu,
  pageUrl,
  liensJSON
}) {
  return `${getCommonPrefix()}CONTEXTE :
- entreprise : "${entrepriseNom}"
- activite : "${activite}"
- ville_attendue : ${villeAttendue || "null"}
- domaines_attendus : ${JSON.stringify(domainesAttendus || [])}
- telephone_attendu : ${telephoneAttendu || "null"}

CONTEXTE PAGE :
- page_url : ${pageUrl}

LIENS EXTRAITS (JSON) :
${liensJSON}

MISSION :
Évaluer chaque lien et signaler les liens suspects.

RÈGLES :
- Les liens tarmaac.io sont toujours valides
- statut = "valide" si cohérent et attendu
- statut = "suspect" si semble incohérent (autre entreprise, autre ville, domaine étrange, tel différent)
- statut = "a_verifier" si impossible de juger avec les infos fournies

CAS SPÉCIAUX :
- Google Maps : si le lien contient une ville/lieu différent de ville_attendue → suspect
- tel: : si différent de telephone_attendu → suspect

RÉPONDS EN JSON :
{
  "page_url": "${pageUrl}",
  "liens": [
    {"url": "", "type": "internal|external|tel|mailto|maps|anchor|js_redirect|unknown", "texte": "", "statut": "valide|suspect|a_verifier", "raison": ""}
  ],
  "resume": {
    "total": 0,
    "valides": 0,
    "suspects": 0,
    "a_verifier": 0
  }
}

Note : Ne modifie jamais les URL.`;
}

// ============================================
// ÉTAPE 5 - Meta SEO (site-wide, un seul appel)
// ============================================

function getStep5Prompt({
  entrepriseNom,
  activite,
  metasJSON
}) {
  return `${getCommonPrefix()}CONTEXTE GLOBAL :
- entreprise : "${entrepriseNom}"
- activite : "${activite}"

META TAGS EXTRAITS (JSON) :
${metasJSON}

MISSION :
Pour chaque page, vérifier si le meta title et la meta description sont cohérents.

CRITÈRES :
- Title vide → invalide
- Description vide → invalide
- Home (/) : title/description peuvent être généraux
- Page interne : title doit refléter le thème si l'URL est explicite
- Longueurs : title < 15 ou > 70 → alerte, description < 50 ou > 170 → alerte
- Doublons exacts → alerte

RÉPONDS EN JSON :
{
  "metas": [
    {
      "url": "",
      "title": "",
      "description": "",
      "title_valide": true,
      "description_valide": true,
      "alertes": [],
      "commentaire": "",
      "suggestion_title": null,
      "suggestion_description": null
    }
  ],
  "doublons": {
    "titles_identiques": [{"title": "", "urls": []}],
    "descriptions_identiques": [{"description": "", "urls": []}]
  }
}`;
}

// ============================================
// ÉTAPE 6 - Synthèse Go/No-Go (site-wide, un seul appel)
// ============================================

function getStep6Prompt({
  entrepriseNom,
  activite,
  baseUrl,
  currentDateISO,
  resultEtape1JSON,
  resultEtape2JSON,
  resultEtape3JSON,
  resultEtape4JSON,
  resultEtape5JSON
}) {
  return `${getCommonPrefix()}CONTEXTE GLOBAL :
- entreprise : "${entrepriseNom}"
- activite : "${activite}"
- url_auditee : "${baseUrl}"
- date_reference : "${currentDateISO}"

RÉSULTATS DES ÉTAPES (JSON) :
etape1 : ${resultEtape1JSON}

etape2 : ${resultEtape2JSON}

etape3 : ${resultEtape3JSON}

etape4 : ${resultEtape4JSON}

etape5 : ${resultEtape5JSON}

MISSION :
Créer un rapport final de QA pour décider si la mise en ligne est possible.

DÉCISION :
- no_go : erreurs bloquantes (mauvais téléphone, pages légales incohérentes, liens critiques suspects)
- go_avec_reserves : erreurs importantes mais non bloquantes
- go : très peu de problèmes

PRIORISATION :
- P0 : bloqueurs (téléphone/CTA erroné, légales incohérentes, metas vides sur home)
- P1 : importants (fautes nombreuses, metas incohérentes, offres expirées)
- P2 : améliorations (optimisations secondaires)

RÉPONDS EN JSON :
{
  "decision": "go|no_go|go_avec_reserves",
  "priorites": {
    "P0": [{"source": "etape_X", "page_url": "", "resume": ""}],
    "P1": [],
    "P2": []
  },
  "resume": "",
  "checklist": ["Verifier le point A", "Verifier le point B"]
}`;
}

module.exports = {
  getCommonPrefix,
  getStep1Prompt,
  getStep2Prompt,
  getStep3Prompt,
  getStep4Prompt,
  getStep5Prompt,
  getStep6Prompt
};
