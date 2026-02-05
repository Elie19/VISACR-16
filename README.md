# FinanceStart Pro - Solution d'Analyse Financière Prévisionnelle

FinanceStart Pro est une application de gestion financière robuste conçue pour accompagner les entrepreneurs et porteurs de projets dans la structuration de leur plan d'affaires. Spécifiquement optimisée pour la zone **Franc CFA (FCFA)**, cette solution permet de générer des prévisions financières complètes sur une période de 5 ans, conformes aux standards bancaires et aux exigences des investisseurs.

## Objectif du Projet

L'objectif de FinanceStart Pro est de simplifier la phase critique de planification financière en offrant un parcours utilisateur guidé. De la définition des besoins de démarrage à l'analyse de la rentabilité, l'outil transforme des données brutes en indicateurs de performance clairs (SIG, CAF, BFR, Seuil de rentabilité).

## Fonctionnalités Principales

### 1. Gestion des Informations Générales
- Identification du porteur de projet et de la structure juridique.
- Paramétrage du type d'activité (Services, Marchandises ou Mixte).

### 2. Plan d'Investissement (Besoins)
- Saisie détaillée des immobilisations incorporelles et corporelles.
- Gestion automatisée des dotations aux amortissements selon la durée de vie des actifs.
- Prise en compte du stock initial et de la trésorerie de départ.

### 3. Plan de Financement
- Structuration des apports personnels, emprunts bancaires et subventions.
- Calcul de l'équilibre financier entre besoins et ressources de démarrage.

### 4. Analyse des Charges Fixes
- Grille de saisie pluriannuelle (5 ans) pour les frais généraux (loyers, assurances, énergie, etc.).
- Calcul dynamique des totaux annuels.

### 5. Prévisions de Chiffre d'Affaires
- Deux modes de saisie : simplifié (Année 1 + taux de croissance) ou manuel détaillé.
- Gestion de la saisonnalité via une répartition mensuelle pour la première année.
- Paramétrage des délais de paiement clients et fournisseurs pour le calcul du BFR.
- Suivi des frais de personnel et de la rémunération des dirigeants.

### 6. Reporting et Visualisation
- Tableaux de bord interactifs avec graphiques d'évolution (CA, Résultat, CAF).
- Génération d'un dossier complet prêt à l'impression incluant :
  - Page de garde professionnelle.
  - Compte de résultat prévisionnel.
  - Soldes Intermédiaires de Gestion (SIG).
  - Tableau de financement et budget de trésorerie mensuel.

## 🛠 Stack Technique

- **Frontend** : React 19 (Hooks, Context API).
- **Langage** : TypeScript pour une sécurité de typage accrue.
- **Design & UI** : Tailwind CSS pour une interface moderne, responsive et compatible avec le mode sombre.
- **Visualisation** : Recharts pour les graphiques dynamiques.
- **Icônes** : Font Awesome 6.
- **Gestion d'état** : Persistance locale via `localStorage`.

##  Installation et Lancement

### Prérequis
- Node.js (version 18 ou supérieure recommandée)
- Un gestionnaire de paquets (npm, yarn ou pnpm)

### Étapes
1. Cloner le dépôt :
   ```bash
   git clone [url-du-depot]
   ```
2. Installer les dépendances :
   ```bash
   npm install
   ```
3. Lancer l'application en mode développement :
   ```bash
   npm run dev
   ```
4. Accéder à l'application via `http://localhost:5173`.

## Structure du Projet

- `/components` : Composants UI modulaires et formulaires par étape.
- `/constants` : Configuration des clés de calcul et listes de référence.
- `/types` : Définitions des interfaces TypeScript.
- `App.tsx` : Orchestrateur principal de la navigation et de l'état global.

## Bonnes Pratiques d'Utilisation

- **Devise** : Tous les calculs sont effectués en Franc CFA. Les montants saisis doivent être cohérents avec cette unité.
- **Persistance** : Les données sont sauvegardées automatiquement dans votre navigateur. Pensez à exporter votre rapport en PDF pour une conservation externe.
- **Précision** : Les calculs de TVA ne sont pas inclus dans cette version afin de simplifier l'analyse de trésorerie brute, conformément aux pratiques de premier niveau de business plan.

---
© 2024 FinanceStart Pro - Logiciel d'accompagnement à la création d'entreprise.