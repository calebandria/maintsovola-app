export interface CultureDetail {
  id_projet_culture: any;
  id_projet: any;
  id_culture: any;
  cout_exploitation_previsionnel: any;
  rendement_previsionnel: any;
  cout_exploitation_reel?: any;
  rendement_reel?: any;
  date_debut_previsionnelle?: any;
  date_debut_reelle?: any;
  rendement_financier_previsionnel: any;
  culture: any;
}

export interface FinancialDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  project?: any;
  cultureDetails: CultureDetail[];
  loading: boolean;
}
