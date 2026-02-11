
import React from 'react';
import { StepId, Currency } from './types';

export const STEPS = [
  { id: StepId.WELCOME, label: 'Accueil', icon: 'fa-house' },
  { id: StepId.INFOS, label: 'Identité', icon: 'fa-user-tie' },
  { id: StepId.BESOINS, label: 'Besoins', icon: 'fa-list-check' },
  { id: StepId.FINANCEMENT, label: 'Financement', icon: 'fa-hand-holding-dollar' },
  { id: StepId.CHARGES, label: 'Charges', icon: 'fa-file-invoice-dollar' },
  { id: StepId.REVENUE, label: 'Chiffre d’affaires', icon: 'fa-arrow-up-right-dots' },
  { id: StepId.REPORT, label: 'Rapport', icon: 'fa-file-contract' },
];

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'XOF', name: 'Franc CFA (BCEAO)', symbol: 'FCFA', decimals: 0, locale: 'fr-SN' },
  { code: 'XAF', name: 'Franc CFA (BEAC)', symbol: 'FCFA', decimals: 0, locale: 'fr-CM' },
  { code: 'EUR', name: 'Euro', symbol: '€', decimals: 2, locale: 'fr-FR' },
  { code: 'USD', name: 'Dollar américain', symbol: '$', decimals: 2, locale: 'en-US' },
  { code: 'MAD', name: 'Dirham marocain', symbol: 'DH', decimals: 2, locale: 'ar-MA' },
  { code: 'GNF', name: 'Franc guinéen', symbol: 'FG', decimals: 0, locale: 'fr-GN' },
  { code: 'CAD', name: 'Dollar canadien', symbol: 'C$', decimals: 2, locale: 'fr-CA' },
];

/**
 * Formate un montant selon les standards de la devise sélectionnée
 */
export const formatCurrency = (amount: number, currency: Currency): string => {
  return new Intl.NumberFormat(currency.locale, {
    minimumFractionDigits: currency.decimals,
    maximumFractionDigits: currency.decimals,
  }).format(amount);
};

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
