import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency, formatWeight } from './utils';
import { CultureDetail } from './types';

interface ProductionDetailsProps {
  detail: CultureDetail;
}

const ProductionDetails: React.FC<ProductionDetailsProps> = ({ detail }) => {
  const prixTonne = detail.culture?.prix_tonne || 0;

  return (
    <View className="mb-6 rounded-xl border border-gray-200 bg-white p-6">
      <Text className="mb-4 text-lg font-semibold text-gray-800">Détails de production</Text>

      <View className="space-y-4">
        {/* Production Row */}
        <View className="flex-row items-center justify-between border-b border-gray-100 pb-3">
          <View className="flex-row items-center">
            <View className="rounded-lg bg-lime-100 p-2">
              <Ionicons name="leaf" size={20} color="#65A30D" />
            </View>
            <Text className="ml-3 text-base text-gray-700">Rendement prévu</Text>
          </View>
          <Text className="text-base font-semibold text-gray-900">
            {formatWeight(detail.rendement_previsionnel)}
          </Text>
        </View>

        {/* Price Row */}
        <View className="flex-row items-center justify-between border-b border-gray-100 pb-3">
          <View className="flex-row items-center">
            <View className="rounded-lg bg-purple-100 p-2">
              <Ionicons name="pricetag" size={20} color="#7C3AED" />
            </View>
            <Text className="ml-3 text-base text-gray-700">Prix par tonne</Text>
          </View>
          <Text className="text-base font-semibold text-gray-900">{formatCurrency(prixTonne)}</Text>
        </View>

        {/* ROI Row */}
        <View className="flex-row items-center justify-between pb-3">
          <View className="flex-row items-center">
            <View className="rounded-lg bg-cyan-100 p-2">
              <Ionicons name="analytics" size={20} color="#0891B2" />
            </View>
            <Text className="ml-3 text-base text-gray-700">Rentabilité</Text>
          </View>
          <Text className="text-base font-semibold text-cyan-600">
            {formatCurrency(detail.rendement_financier_previsionnel)}
          </Text>
        </View>

        {/* Date Row */}
        {detail.date_debut_previsionnelle && (
          <View className="rounded-lg bg-gray-50 p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons name="calendar" size={20} color="#6B7280" />
                <Text className="ml-3 text-base text-gray-700">Début prévu</Text>
              </View>
              <Text className="text-base font-medium text-gray-800">
                {new Date(detail.date_debut_previsionnelle).toLocaleDateString('fr-FR')}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

export default ProductionDetails;
