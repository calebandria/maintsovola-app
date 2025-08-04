export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return '0 Ar';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'MGA',
    minimumFractionDigits: 0,
  })
    .format(amount)
    .replace('MGA', 'Ar');
};

export const formatWeight = (weight: number | null | undefined): string => {
  if (weight === null || weight === undefined) return '0 kg';
  if (weight >= 1000) {
    return `${(weight / 1000).toFixed(1)} t`;
  }
  return `${weight} kg`;
};

export const calculateRevenue = (rendement: number, prixTonne: number) => {
  return rendement * prixTonne;
};
