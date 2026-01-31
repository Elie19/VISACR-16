
import React from 'react';
import { StepId } from './types';

export const STEPS = [
  { id: StepId.WELCOME, label: 'Accueil', icon: '' },
  { id: StepId.INFOS, label: 'Identité', icon: '' },
  { id: StepId.BESOINS, label: 'Besoins', icon: '' },
  { id: StepId.FINANCEMENT, label: 'Financement', icon: '' },
  { id: StepId.CHARGES, label: 'Charges', icon: '' },
  { id: StepId.REVENUE, label: 'Chiffre d’affaires', icon: '' },
  { id: StepId.REPORT, label: 'Rapport', icon: '' },
];

export const LISTE_BESOINS_KEYS = [
  { id: 'frais-etablissement', label: "Frais d'établissement", defaultAmort: 5 },
  { id: 'frais-compteurs', label: "Frais d'ouverture de compteurs", defaultAmort: 5 },
  { id: 'logiciels-formations', label: "Logiciels, formations", defaultAmort: 3 },
  { id: 'droits-entrees', label: "Droits d'entrées", defaultAmort: 5 },
  { id: 'achat-fonds-commerce', label: "Achat fonds de commerce", defaultAmort: 10 },
  { id: 'depot-marque', label: "Dépôt marque, brevet", defaultAmort: 5 },
  { id: 'droit-bail', label: "Droit au bail", defaultAmort: 10 },
  { id: 'caution', label: "Caution / Dépôt de garantie", defaultAmort: 0 },
  { id: 'frais-dossier', label: "Frais de dossier", defaultAmort: 1 },
  { id: 'frais-notaire', label: "Frais de notaire / expert", defaultAmort: 5 },
  { id: 'enseigne-communication', label: "Enseigne & Communication", defaultAmort: 3 },
  { id: 'achat-immobilier', label: "Achat immobilier", defaultAmort: 20 },
  { id: 'travaux-amenagement', label: "Travaux & Aménagements", defaultAmort: 10 },
  { id: 'materiel', label: "Matériel", defaultAmort: 5 },
  { id: 'materiel-bureau', label: "Matériel de bureau", defaultAmort: 5 },
  { id: 'stock', label: "Stock initial", defaultAmort: 0 },
  { id: 'tresorerie-depart', label: "Trésorerie de départ", defaultAmort: 0 },
];

export const LISTE_CHARGES_KEYS = [
  { id: 'assurances', label: 'Assurances' },
  { id: 'telephone', label: 'Téléphone, Internet' },
  { id: 'abonnements', label: 'Autres abonnements' },
  { id: 'carburant', label: 'Carburant, transports' },
  { id: 'deplacement', label: 'Frais de déplacement' },
  { id: 'energie', label: 'Eau, électricité, gaz' },
  { id: 'autorites', label: 'Autorités' },
  { id: 'fournitures', label: 'Fournitures diverses' },
  { id: 'entretien', label: 'Entretien matériel' },
  { id: 'nettoyage', label: 'Nettoyage des locaux' },
  { id: 'publicite', label: 'Budget publicité' },
  { id: 'loyer', label: 'Loyer et charges' },
  { id: 'expert', label: 'Expert comptable' },
  { id: 'bancaires', label: 'Frais bancaires' },
  { id: 'taxes', label: 'Taxes, CFE' },
];
