import React from 'react';
import { FinancialDetailsModal as RefactoredModal } from './feed/financialDetails';
import { AgriculturalProject } from '~/hooks/use-project-data';

// Legacy interface for backward compatibility
interface CultureDetail {
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

interface FinancialDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  project?: AgriculturalProject;
  cultureDetails: CultureDetail[];
  loading: boolean;
}

// Wrapper component for backward compatibility
const FinancialDetailsModal: React.FC<FinancialDetailsModalProps> = (props) => {
  return <RefactoredModal {...props} />;
};

export default FinancialDetailsModal;
