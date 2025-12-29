TAPE 1 : INITIALISATION ET STRUCTURE (FRONTEND)
Objectif : Mettre en place l'environnement de développement et la structure de base.

Création du projet Vite : Dans ton terminal, lance : npm create vite@latest frontend -- --template react.

Nettoyage : Supprime les fichiers inutiles (App.css par défaut, les logos, etc.) pour partir sur une base propre.

Installation des dépendances :

axios (pour communiquer avec le futur backend).

Une bibliothèque de style (optionnel) ou prépare ton fichier index.css.

ÉTAPE 2 : DÉVELOPPEMENT DE L'INTERFACE (UI)
Objectif : Créer le formulaire de saisie et les zones d'affichage.

Composant Formulaire :

Créer un état (useState) pour gérer les 5 champs : URL, Prénom, Nom, Téléphone, Activité.

Implémenter la validation de base (ex: vérifier que l'URL commence par http/https).

Composant de Chargement (Loading) :

Créer un état loading pour afficher un message d'attente (indispensable car l'IA prendra 2 à 5 secondes pour répondre).

Composant Résultats (Dashboard) :

Prévoir trois sections d'affichage :

Alertes Linguistiques (Orthographe/Grammaire).

Alertes de Cohérence (Erreurs sur les infos client).

Liste des Liens (Une liste d'URLs cliquables).

ÉTAPE 3 : LOGIQUE DU BACKEND (NODE.JS)
Objectif : Créer l'API qui fait le "sale boulot".

Initialisation du serveur : Créer un dossier backend, faire npm init et installer express, cors, dotenv.

Scraper (Cheerio) :

Créer une route POST /audit.

Utiliser axios pour récupérer le code source de l'URL reçue.

Utiliser cheerio pour extraire tout le texte des balises textuelles et tous les attributs href des liens.

Intégration Gemini :

Installer @google/generative-ai.

Créer un "Prompt" précis qui donne le contexte (l'activité du client) et le texte du site à l'IA.

Demander un retour au format JSON strict.

ÉTAPE 4 : CONNEXION ET TESTS FINAUX
Objectif : Faire parler le Frontend avec le Backend.

Appel API : Connecter le bouton "Lancer l'audit" de React à la route de ton serveur Node.

Traitement des données : Mapper la réponse JSON de Gemini pour l'afficher proprement dans tes composants de résultats.

Test de cohérence : Tester avec un site Webflow réel et vérifier que les liens s'affichent correctement.
