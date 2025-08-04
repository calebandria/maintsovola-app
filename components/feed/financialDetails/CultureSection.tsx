import React from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import { CultureDetail } from './types';
import { formatCurrency, calculateRevenue } from './utils';
import MetricCard from './MetricCard';
import ProductionDetails from './ProductionDetails';
import { Ionicons } from '@expo/vector-icons';

interface CultureSectionProps {
  detail: CultureDetail;
  index: number;
  totalCultures: number;
}

const screenWidth = Dimensions.get('window').width;

const CultureSection: React.FC<CultureSectionProps> = ({ detail, index, totalCultures }) => {
  const cultureName = detail.culture?.nom_culture || `Culture ${index + 1}`;
  const prixTonne = detail.culture?.prix_tonne || 0;
  const revenuEstime = calculateRevenue(detail.rendement_previsionnel || 0, prixTonne);
  const benefice = revenuEstime - (detail.cout_exploitation_previsionnel || 0);
  const marginePourcentage = revenuEstime > 0 ? (benefice / revenuEstime) * 100 : 0;

  return (
    <View style={{ width: screenWidth, paddingHorizontal: 16 }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Culture Header */}
        <View className="mb-6 items-center">
          <View className="mb-2 flex-row items-center gap-2">
            {/* <View className="w-4 h-4 mr-3 bg-green-500 rounded-full" /> */}
            <Ionicons name="leaf" size={24} color="#16A34A" />

            <Text className="text-xl font-bold text-gray-900">{cultureName}</Text>
          </View>
          <Text className="text-sm text-gray-500">
            Culture {index + 1} sur {totalCultures}
          </Text>
        </View>

        {/* Main Metrics Cards */}
        <View className="mb-6 gap-4">
          {/* Cost Card */}
          <MetricCard
            type="cost"
            value={formatCurrency(detail.cout_exploitation_previsionnel)}
            label="COÛT D'EXPLOITATION"
            subtitle="Investissement nécessaire"
          />

          {/* Revenue Card */}
          <MetricCard
            type="revenue"
            value={formatCurrency(revenuEstime)}
            label="REVENU ESTIMÉ"
            subtitle="Retour sur investissement"
          />

          {/* Profit Card */}
          <MetricCard
            type="profit"
            value={formatCurrency(benefice)}
            label={benefice >= 0 ? 'BÉNÉFICE PRÉVU' : 'ATTENTION DÉFICIT'}
            percentage={`${marginePourcentage.toFixed(1)}%`}
            profitValue={benefice}
          />
        </View>

        {/* Details Section */}
        <ProductionDetails detail={detail} />
      </ScrollView>
    </View>
  );
};

export default CultureSection;
