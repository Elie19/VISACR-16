
export enum ActivityType {
  SERVICES = 'services',
  MARCHANDISES = 'marchandises',
  MIXTE = 'mixte'
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
  locale: string;
}

export interface GeneralInfo {
  prenomNom: string;
  intituleProjet: string;
  statutJuridique: string;
  activiteType: ActivityType;
  telephone: string;
  email: string;
  ville: string;
  descriptionProjet: string;
}

export interface BesoinItem {
  montant: number;
  details: string;
  amortissement: number;
}

export interface Besoins {
  [key: string]: BesoinItem;
}

export interface FinancingSource {
  id: string;
  label: string;
  montant: number;
  taux?: number;
  duree?: number;
}

export interface ChargeAnnee {
  [key: string]: number; // key format: chargeId-anneeIndex (e.g. loyer-0)
}

export interface Product {
  id: string;
  nom: string;
  prixVente: number;
  coutRevient: number;
}

export interface RevenueState {
  caMode: 'mode1' | 'mode2';
  caMensuel: number[]; // Months 1-12 of Year 1
  tauxCroissance: number[]; // Year 1->2, 2->3, etc.
  caManuel: number[][]; // [year][month]
  tauxCoutMarchandises: number;
  joursClients: number;
  joursFournisseurs: number;
  salairesEmp: number[]; // 5 years
  remunDir: number[]; // 5 years
  accre: boolean;
  produits: Product[];
}

export interface AppState {
  generalInfo: GeneralInfo;
  currency: Currency;
  besoins: Besoins;
  financements: FinancingSource[];
  charges: ChargeAnnee;
  revenue: RevenueState;
}

export enum StepId {
  WELCOME = 'welcome',
  INFOS = 'infos',
  BESOINS = 'besoins',
  FINANCEMENT = 'financement',
  CHARGES = 'charges',
  REVENUE = 'revenue',
  REPORT = 'report'
}
