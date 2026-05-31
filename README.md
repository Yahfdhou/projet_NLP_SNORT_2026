# Frontend SNORT NLP Dashboard

Interface web moderne pour piloter un backend NLP orienté cybersécurité SNORT.
Le dashboard permet de:

- Générer des règles SNORT à partir d'une requête en langage naturel.
- Classifier une requête (type/famille d'attaque, bénin/malveillant).
- Récupérer des documents pertinents (RAG / retrieval).
- Visualiser les statistiques du corpus avec des graphes modernes.
- Importer des fichiers PDF et afficher les visualisations t-SNE/clustering.

## 1) Objectif Du Projet

Ce projet sert d'interface front-end pour un backend API (FastAPI ou équivalent) exposant des endpoints de génération, classification, récupération et statistiques.

L'application a été pensée pour:

- Offrir une expérience claire pour les démonstrations techniques.
- Centraliser toutes les opérations SNORT NLP dans une seule UI.
- Mettre en avant les indicateurs de qualité (validation syntaxique, risque de faux positifs, couverture, etc.).

## 2) Technologies Utilisées

- Framework: Vue 3 (SFC + script setup)
- Langage: TypeScript
- Build tool: Vite
- Style: Tailwind CSS v4
- Icônes: Lucide Vue
- Notifications: vue-sonner
- Outils qualité: vue-tsc

## 3) Structure Fonctionnelle

Le dashboard est organisé en sections principales:

- Barre de contrôle: saisie de requête, choix architecture, top-k, actions generate/classify/retrieve/stats.
- Résultat de génération: règle produite, labels, explication, validation et risques.
- Classification + récupération: résultat de classification + documents pertinents.
- Statistiques du corpus: overview + distributions en cartes et graphes modernes.
- Import PDF + visualisation: upload PDF, suivi d'état, affichage t-SNE et clustering.
- Cas de démonstration: exemples prêts à charger depuis le backend.

## 4) Endpoints Backend Intégrés

Base URL configurable par variable d'environnement:

- `VITE_SNORT_API_BASE_URL`
- valeur par défaut: `http://127.0.0.1:8000`

Endpoints consommés côté frontend:

- `POST /api/v1/classify`
- `POST /api/v1/generate`
- `POST /api/v1/retrieve`
- `GET /api/v1/stats`
- `GET /api/v1/stats/overview`
- `GET /api/v1/stats/distributions`
- `GET /api/v1/stats/brief`
- `GET /api/v1/demo_cases`
- `POST /api/v1/add_pdf`
- `GET /api/v1/visualization/tsne`
- `GET /api/v1/visualization/clustering?n_clusters=6`

## 5) Design Moderne Et Animations

Le design a été construit pour un rendu moderne, lisible et vivant:

- Direction visuelle claire: fond multi-gradients, panneaux arrondis, contraste doux.
- Hiérarchie visuelle: cards KPI, sections thématiques, badges de statut.
- Couleurs fonctionnelles: cyan (action), emerald (succès), amber (alerte), violet (contexte).
- Typographie UI soignée avec espacement généreux et lecture rapide.
- Micro-interactions: transitions hover/focus, élévation des cartes, feedback instantané boutons.
- Animations utiles: transitions d'état, mise en avant des sections actives et graphes de distribution.

## 6) Comment Lancer Le Projet

### Prérequis

- Node.js 18+ (recommandé 20+)
- npm
- Backend API actif (local ou distant)

### Installation

```bash
npm install
```

### Configuration Environnement

Créer un fichier `.env` à la racine si nécessaire:

```env
VITE_SNORT_API_BASE_URL=http://127.0.0.1:8000
```

### Mode Développement

```bash
npm run dev
```

Accès par défaut: `http://localhost:5173`

### Build Production

```bash
npm run build
```

### Preview Production

```bash
npm run preview
```

## 7) Scripts Disponibles

- `npm run dev`: démarre Vite en mode développement.
- `npm run build`: vérifie TypeScript puis génère le build production.
- `npm run preview`: sert le build localement pour validation.

## 8) Flux D'Utilisation Recommandé

1. Vérifier la connexion backend (état en haut du dashboard).
2. Saisir une requête sécurité et sélectionner une architecture.
3. Lancer `Générer`, puis consulter validation et risque FP.
4. Utiliser `Classifier` et `Récupérer` pour analyse détaillée.
5. Ouvrir la section `Statistiques` pour les graphes du corpus.
6. Importer un PDF pour enrichir le corpus et rafraîchir les visuels.

## 9) Résultat Attendu

Une application front-end moderne et opérationnelle, dédiée à l'aide à la génération de règles SNORT avec appui NLP/RAG, indicateurs détaillés et visualisations prêtes pour démonstration technique.
