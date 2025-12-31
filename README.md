# SmartQA

<div align="center">

![SmartQA](https://img.shields.io/badge/SmartQA-v1.0.0-blue?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Gemini](https://img.shields.io/badge/Gemini_2.0_Flash-AI-4285F4?style=for-the-badge&logo=google&logoColor=white)

**Outil d'audit automatisé de sites web utilisant l'IA pour détecter les erreurs et incohérences avant la mise en ligne.**

[Installation](#installation) • [Utilisation](#utilisation) • [Architecture](#architecture) • [API](#api)

</div>

---

## Table des matières

-  [Présentation](#présentation)
-  [Fonctionnalités](#fonctionnalités)
-  [Stack technique](#stack-technique)
-  [Installation](#installation)
-  [Utilisation](#utilisation)
-  [Architecture](#architecture)
-  [API](#api)
-  [Configuration](#configuration)
-  [Pipeline d'analyse IA](#pipeline-danalyse-ia)
-  [Contribution](#contribution)

---

## Présentation

**SmartQA** est un outil de contrôle qualité intelligent conçu pour automatiser l'audit de sites web avant leur mise en production. Spécialisé pour les sites Webflow, il combine scraping intelligent et analyse par IA (Google Gemini 2.0 Flash) pour fournir un rapport détaillé couvrant :

-  La qualité rédactionnelle (orthographe, grammaire)
-  La cohérence des informations (coordonnées, noms, adresses)
-  La conformité légale (mentions légales, RGPD)
-  La santé des liens (détection des liens cassés)
-  L'optimisation SEO (meta tags, descriptions)
-  Une synthèse Go/No-Go avec priorisation des corrections

---

## Fonctionnalités

| Catégorie                      | Description                                                     |
| ------------------------------ | --------------------------------------------------------------- |
| **Orthographe & Grammaire**    | Détection automatique des fautes avec suggestions de correction |
| **Cohérence des informations** | Vérification des téléphones, noms, adresses, SIRET, emails      |
| **Conformité légale**          | Audit des mentions légales et politique de confidentialité      |
| **Analyse des liens**          | Détection des liens cassés (HTTP 404/500) et liens suspects     |
| **SEO**                        | Vérification des meta titles, descriptions et doublons          |
| **Synthèse Go/No-Go**          | Décision finale avec priorisation P0/P1/P2                      |
| **Logs temps réel**            | Streaming SSE des étapes d'audit en direct                      |

---

## Stack technique

### Backend

| Technologie               | Version | Usage                       |
| ------------------------- | ------- | --------------------------- |
| **Node.js**               | 18+     | Runtime JavaScript          |
| **Express**               | 4.x     | Framework web API REST      |
| **@google/generative-ai** | 0.21+   | SDK Google Gemini pour l'IA |
| **Cheerio**               | 1.x     | Parsing HTML / Scraping     |
| **Axios**                 | 1.x     | Client HTTP                 |

### Frontend

| Technologie | Version | Usage                   |
| ----------- | ------- | ----------------------- |
| **React**   | 19.x    | Framework UI            |
| **Vite**    | 7.x     | Build tool & dev server |
| **Axios**   | 1.x     | Requêtes API            |

---

## Installation

### Prérequis

-  **Node.js 18+** ([télécharger](https://nodejs.org/))
-  **Clé API Google Gemini** ([obtenir ici](https://aistudio.google.com/apikey))

### Installation rapide

```bash
# 1. Cloner le repository
git clone https://github.com/TheoCtla/SmartQA.git
cd SmartQA

# 2. Installer les dépendances
cd backend && npm install
cd ../frontend && npm install
cd ..

# 3. Configurer l'environnement
cp backend/.env.example backend/.env
```

Éditer `backend/.env` avec votre clé API :

```env
GEMINI_API_KEY=AIzaSy...votre_clé_ici
```

---

## Utilisation

### Démarrage rapide

```bash
# Méthode recommandée (lance frontend + backend)
./start_project.sh
```

### Démarrage manuel

```bash
# Terminal 1 - Backend (port 3001)
cd backend && npm run dev

# Terminal 2 - Frontend (port 5173)
cd frontend && npm run dev
```

### Accès

| Service          | URL                          |
| ---------------- | ---------------------------- |
| **Frontend**     | http://localhost:5173        |
| **Backend API**  | http://localhost:3001        |
| **Health Check** | http://localhost:3001/health |

### Workflow d'audit

1. **Saisir l'URL** du site à auditer
2. **Renseigner les informations** de l'entreprise :
   -  Nom de l'entreprise (obligatoire)
   -  Activité (obligatoire)
   -  Téléphone, email, adresse (optionnels - pour vérification de cohérence)
3. **Lancer l'audit** et suivre les logs en temps réel
4. **Consulter les résultats** par onglet :
   -  Synthèse (Go/No-Go)
   -  Orthographe
   -  Légal
   -  Cohérence
   -  Liens
   -  SEO

---

## Architecture

```
SmartQA/
├── backend/
│   ├── src/
│   │   ├── config/                    # Configuration Gemini
│   │   │   └── gemini.config.js
│   │   ├── controllers/               # Logique métier
│   │   │   └── audit.v2.controller.js # Orchestration audit + SSE
│   │   ├── routes/                    # Endpoints API
│   │   │   └── audit.routes.js
│   │   ├── services/
│   │   │   ├── ai/                    # Couche IA
│   │   │   │   ├── gemini.v2.service.js   # Appels Gemini
│   │   │   │   └── prompts.v2.js          # Prompts IA
│   │   │   ├── scraper.v2.service.js      # Scraping site
│   │   │   └── linkChecker.service.js     # Vérification liens HTTP
│   │   ├── utils/                     # Utilitaires
│   │   └── server.js                  # Point d'entrée
│   ├── .env                           # Variables d'environnement
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuditForm/             # Formulaire de saisie
│   │   │   ├── DashboardV2/           # Dashboard résultats
│   │   │   └── Loading/               # Écran de chargement + logs
│   │   ├── App.jsx                    # Composant racine
│   │   ├── index.css                  # Styles globaux
│   │   └── main.jsx                   # Point d'entrée React
│   ├── index.html
│   └── package.json
│
└── start_project.sh                   # Script de lancement
```

---

## API

### Endpoints

| Méthode | Endpoint      | Description                    |
| ------- | ------------- | ------------------------------ |
| `POST`  | `/audit/v2`   | Lancer un audit complet        |
| `GET`   | `/audit/logs` | Stream SSE des logs temps réel |
| `GET`   | `/health`     | Health check                   |

### POST /audit/v2

**Requête :**

```json
{
   "url": "https://example.com",
   "entreprise": "Ma Société",
   "activite": "Développement web",
   "telephone_attendu": "01 23 45 67 89",
   "gerant_attendu": "Jean Dupont",
   "email_attendu": "contact@example.com",
   "adresse_attendue": "123 rue de Paris",
   "ville_attendue": "Paris",
   "siret_attendu": "123 456 789 00012",
   "domaines_attendus": ["@example.com"],
   "mots_cles_offre": "design, création, UX",
   "max_pages": 20
}
```

**Réponse :**

```json
{
  "meta": {
    "url_auditee": "https://example.com",
    "entreprise": "Ma Société",
    "activite": "Développement web",
    "pages_analysees": 15,
    "date_audit": "2024-12-31T09:00:00.000Z"
  },
  "etape1_orthographe": { ... },
  "etape2_legal": { ... },
  "etape3_coherence": { ... },
  "etape4_liens": { ... },
  "etape5_seo": { ... },
  "etape6_synthese": {
    "decision": "GO",
    "corrections_p0": [],
    "corrections_p1": [...],
    "corrections_p2": [...]
  },
  "pages_scrapees": [...]
}
```

---

## Configuration

### Variables d'environnement

| Variable         | Obligatoire | Défaut | Description             |
| ---------------- | ----------- | ------ | ----------------------- |
| `GEMINI_API_KEY` | Oui         | -      | Clé API Google Gemini   |
| `PORT`           | Non         | `3001` | Port du serveur backend |

### Fichier .env.example

```env
# Clé API Google Gemini (obligatoire)
# Obtenir sur : https://aistudio.google.com/apikey
GEMINI_API_KEY=AIzaSy...

# Port du backend (optionnel)
PORT=3001
```

---

## Pipeline d'analyse IA

L'audit se déroule en **6 étapes séquentielles** traitées par Gemini 2.0 Flash :

| #   | Étape           | Description                                   | Output                                     |
| --- | --------------- | --------------------------------------------- | ------------------------------------------ |
| 1   | **Orthographe** | Détection fautes + extraction téléphones/noms | Liste d'erreurs avec localisation          |
| 2   | **Légal**       | Conformité mentions légales & confidentialité | Score de conformité RGPD                   |
| 3   | **Cohérence**   | Contenu vs activité + qualité copywriting     | Incohérences détectées                     |
| 4   | **Liens**       | Analyse liens suspects + vérification HTTP    | Liens cassés, domaines suspects            |
| 5   | **SEO**         | Audit meta tags, doublons, cohérence          | Optimisations recommandées                 |
| 6   | **Synthèse**    | Décision Go/No-Go + priorisation              | P0 (bloquant), P1 (important), P2 (mineur) |

### Priorisation des corrections

-  **P0** : Corrections bloquantes (empêche la mise en ligne)
-  **P1** : Corrections importantes (à faire avant mise en ligne)
-  **P2** : Corrections mineures (peuvent attendre)

---

## Logs temps réel (SSE)

SmartQA utilise **Server-Sent Events** pour streamer les logs d'audit en direct :

```javascript
// Connexion au stream
const eventSource = new EventSource("http://localhost:3001/audit/logs");

eventSource.onmessage = (event) => {
   const log = JSON.parse(event.data);
   console.log(`[${log.type}] ${log.message}`);
};
```

Types de logs : `connected`, `scraping`, `analysis`, `success`, `error`, `complete`

---

## Scripts disponibles

### Backend

```bash
npm start     # Production
npm run dev   # Développement (hot reload)
```

### Frontend

```bash
npm run dev      # Serveur de développement
npm run build    # Build production
npm run preview  # Prévisualisation build
npm run lint     # Vérification ESLint
```

---

## Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/amazing-feature`)
3. Commit les changements (`git commit -m 'Add amazing feature'`)
4. Push la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

---

## Licence

Réalisé par Théo Catala lors d'un projet interne pour [Tarmaac](https://tarmaac.io) - 2025
