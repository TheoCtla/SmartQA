# Contexte du Projet SmartQA

## 1. Vision Globale

SmartQA est une application d'audit automatisé destinée principalement aux sites Webflow.
Son objectif est d'analyser rapidement un site web pour détecter :

- Les fautes d'orthographe et de grammaire.
- La conformité des pages légales (Mentions légales, Confidentialité, etc.).
- La cohérence du contenu et du copywriting par rapport à l'activité de l'entreprise.
- Les liens cassés ou suspects (mauvaise ville, mauvais téléphone).
- Les problèmes SEO de base (Meta titles/descriptions).

L'outil génère un rapport de synthèse "Go / No Go" pour aider à la décision de mise en ligne.

## 2. Stack Technique

### Frontend

- **Framework** : React 19
- **Build Tool** : Vite
- **HTTP Client** : Axios
- **Langage** : JavaScript (ES Modules)
- **Styles** : CSS Vanilla

### Backend

- **Runtime** : Node.js
- **Framework** : Express
- **AI SDK** : @google/generative-ai (Google Gemini)
- **Scraping** : Cheerio, Axios
- **Utils** : Cors, Dotenv

### Infrastructure (Supposée/Cible)

- **Déploiement** : Render (mentionné dans la demande)

## 3. Flux de Données

1. **Initiation** : L'utilisateur remplit le formulaire d'audit sur le Frontend (URL, nom entreprise, activité, etc.).
2. **Requête API** : Le Frontend envoie une requête `POST /api/audit` au Backend.
3. **Connexion SSE** : En parallèle, le Frontend écoute les événements Server-Sent Events (SSE) pour les logs temps réel (`/api/audit/stream`).
4. **Scraping** : Le Backend (via `scraper.service.js`) scrappé les pages du site cible (limité à 20 pages par défaut).
5. **Analyse IA (Pipeline)** : `audit.controller.js` orchestre l'analyse via `gemini.service.js` en 6 étapes :
   - **Étape 1** : Orthographe & Extraction (par page).
   - **Étape 2** : Conformité Légale (pages légales uniquement).
   - **Étape 3** : Cohérence & Copywriting (pages contenu).
   - **Étape 4** : Analyse des Liens (toutes pages).
   - **Étape 5** : Analyse SEO (Global).
   - **Étape 6** : Synthèse & Décision (Global).
6. **Streaming & Réponse** :
   - Chaque étape envoie des logs d'avancement au Frontend via SSE.
   - Une fois terminé, le Backend renvoie le JSON complet des résultats.
7. **Affichage** : Le Frontend affiche le Dashboard avec les résultats (Synthèse, Orthographe, Légal, etc.).

## 4. Ajouts & Modifications Récents (Secret Additions)

### Intelligence Artificielle (Modèle & Coût)

- **Modèle Actif** : Passage de `gemini-flash-latest` à **`gemini-2.5-flash-lite`** pour optimiser les performances/coûts.
- **Suivi des Tokens** : Intégration d'un système de tracking précis dans `gemini.service.js`.
   - **Pré-vol** : Estimation du coût (prompt tokens) avant envoi.
   - **Réel** : Récupération des `usageMetadata` (prompt + candidats = total) après génération.
   - **Logs** : Affichage dans la console serveur ET envoi au Frontend via SSE (type `token_usage`).

### Fiabilité & Stabilité

- **Frontend (Fix React)** : Correction du bug "Objects are not valid as a React child" dans `Dashboard.jsx`. Le rendu de la checklist est maintenant sécurisé pour gérer les objets complexes retournés accidentellement par l'IA.
- **Backend (Prompt Engineering)** : Durcissement du prompt de l'Étape 6 (`prompts.js`) pour forcer le champ `checklist` à être un tableau de chaînes de caractères strict (`["item1", "item2"]`), réduisant les risques d'hallucination de format.
