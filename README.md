# SmartQA

**SmartQA** est un outil d'audit automatisé de sites web (spécialisé Webflow) utilisant l'intelligence artificielle pour détecter les erreurs et incohérences avant la mise en ligne.

## Fonctionnalités

-  **Orthographe & Grammaire** - Détection automatique des fautes
-  **Cohérence des informations** - Vérification téléphone, nom du gérant, adresse
-  **Pages légales** - Audit des mentions légales et politique de confidentialité
-  **Analyse des liens** - Détection des liens suspects ou cassés
-  **SEO** - Vérification des meta titles et descriptions
-  **Synthèse Go/No-Go** - Décision finale avec priorisation P0/P1/P2

## Stack technique

| Composant | Technologie             |
| --------- | ----------------------- |
| Frontend  | React + Vite            |
| Backend   | Node.js + Express       |
| IA        | Google Gemini 2.0 Flash |
| Scraping  | Cheerio + Axios         |

## Installation

### Prérequis

-  Node.js 18+
-  Clé API Google Gemini ([obtenir ici](https://aistudio.google.com/apikey))

### Setup

```bash
# Cloner le repo
git clone https://github.com/TheoCtla/SmartQA.git
cd SmartQA

# Installer les dépendances
cd backend && npm install
cd ../frontend && npm install

# Configurer la clé API
cp backend/.env.example backend/.env
# Éditer backend/.env avec votre clé GEMINI_API_KEY
```

## Démarrage

```bash
# Méthode simple (lance frontend + backend)
./start_project.sh

# Ou manuellement
cd backend && npm run dev    # Port 3001
cd frontend && npm run dev   # Port 5173
```

Ouvrir http://localhost:5173

## Utilisation

1. Entrer l'URL du site à auditer
2. Renseigner les informations de l'entreprise (nom, activité, téléphone...)
3. Lancer l'audit
4. Consulter les résultats par onglet (Synthèse, Orthographe, Légal, Cohérence, Liens, SEO)

## Structure du projet

```
SmartQA/
├── backend/
│   ├── src/
│   │   ├── config/         # Configuration Gemini
│   │   ├── controllers/    # Contrôleurs API
│   │   ├── routes/         # Routes Express
│   │   ├── services/
│   │   │   ├── ai/         # Prompts et service Gemini
│   │   │   └── scraper.v2.service.js
│   │   └── utils/          # Helpers
│   └── .env                # Variables d'environnement
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── AuditForm/  # Formulaire d'audit
│       │   └── DashboardV2/ # Dashboard résultats
│       └── App.jsx
└── start_project.sh        # Script de lancement
```

## Pipeline d'analyse IA (6 étapes)

| Étape | Nom         | Description                                       |
| ----- | ----------- | ------------------------------------------------- |
| 1     | Orthographe | Détection fautes + extraction téléphones/noms     |
| 2     | Légal       | Conformité pages mentions légales/confidentialité |
| 3     | Cohérence   | Vérification contenu vs activité + copywriting    |
| 4     | Liens       | Analyse des liens suspects                        |
| 5     | SEO         | Audit meta tags et doublons                       |
| 6     | Synthèse    | Décision Go/No-Go avec priorisation               |

## Variables d'environnement

```env
GEMINI_API_KEY=AIzaSy...    # Clé API Google Gemini (obligatoire)
PORT=3001                    # Port du backend (optionnel)
```

## Licence

Projet interne [Tarmaac](https://tarmaac.io)
