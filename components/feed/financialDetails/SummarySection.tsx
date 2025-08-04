import React from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CultureDetail } from './types';
import { formatCurrency, calculateRevenue } from './utils';
import MetricCard from './MetricCard';

interface SummarySectionProps {
  cultureDetails: CultureDetail[];
}

const screenWidth = Dimensions.get('window').width;

const SummarySection: React.FC<SummarySectionProps> = ({ cultureDetails }) => {
  const totalCost = cultureDetails.reduce(
    (sum, detail) => sum + (detail.cout_exploitation_previsionnel || 0),
    0
  );
  const totalRevenue = cultureDetails.reduce((sum, detail) => {
    const revenu = calculateRevenue(
      detail.rendement_previsionnel || 0,
      detail.culture?.prix_tonne || 0
    );
    return sum + revenu;
  }, 0);
  const totalProfit = totalRevenue - totalCost;

  return (
    <View style={{ width: screenWidth, paddingHorizontal: 16 }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mb-6 items-center">
          <View className="mb-2 flex-row items-center">
            <Ionicons name="calculator" size={24} color="#16A34A" />
            <Text className="ml-3 text-xl font-bold text-gray-900">Résumé du projet</Text>
          </View>
          <Text className="text-sm text-gray-500">Vue d'ensemble financière</Text>
        </View>

        {/* Summary Cards */}
        <View className="gap-4">
          {/* Total Investment */}
          <View className="rounded-xl bg-blue-50 p-6">
            <View className="mb-2 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="rounded-lg bg-blue-100 p-2">
                  <Ionicons name="wallet" size={24} color="#2563EB" />
                </View>
                <Text className="ml-3 text-lg font-semibold text-blue-800">
                  Investissement total
                </Text>
              </View>
            </View>
            <Text className="text-3xl font-bold text-blue-900">{formatCurrency(totalCost)}</Text>
            <Text className="mt-1 text-sm text-blue-600">
              Somme de tous les coûts d'exploitation
            </Text>
          </View>

          {/* Total Revenue */}
          <View
            className="rounded-xl p-6"
            style={{
              backgroundColor: '#10B981',
              shadowColor: '#10B981',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 12,
              elevation: 8,
            }}>
            <View className="mb-2 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View
                  className="rounded-lg p-2"
                  style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  <Ionicons name="trending-up" size={24} color="#FFFFFF" />
                </View>
                <Text
                  className="ml-3 text-lg font-semibold"
                  style={{
                    color: '#FFFFFF',
                    textShadowColor: 'rgba(0,0,0,0.3)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 3,
                  }}>
                  Revenus estimés
                </Text>
              </View>
            </View>
            <Text
              className="text-3xl font-bold"
              style={{
                color: '#FFFFFF',
                textShadowColor: 'rgba(0,0,0,0.3)',
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 4,
              }}>
              {formatCurrency(totalRevenue)}
            </Text>
            <Text
              className="mt-1 text-sm"
              style={{
                color: 'rgba(255,255,255,0.9)',
                textShadowColor: 'rgba(0,0,0,0.3)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
              }}>
              Recettes prévues de toutes les cultures
            </Text>
          </View>

          {/* Total Profit */}
          <View
            className="rounded-xl p-6"
            style={{
              backgroundColor: '#FFE066',
              shadowColor: '#FFD700',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 4,
            }}>
            <View className="mb-2 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="rounded-lg p-2" style={{ backgroundColor: '#FFF3BF' }}>
                  <Ionicons
                    name={totalProfit >= 0 ? 'trophy' : 'warning'}
                    size={24}
                    color={'#FFD700'}
                  />
                </View>
                <Text
                  className="ml-3 text-lg font-semibold"
                  style={{
                    color: '#7C5E00',
                    textShadowColor: '#FFF',
                    textShadowOffset: { width: 0, height: 2 },
                    textShadowRadius: 3,
                  }}>
                  {totalProfit >= 0 ? 'Bénéfice total' : 'Déficit total'}
                </Text>
              </View>
              <View className="rounded-full px-3 py-1" style={{ backgroundColor: '#FFFF' }}>
                <Text
                  className="text-sm font-bold"
                  style={{
                    color: '#7C5E00',
                    textShadowColor: '#FFF',
                    textShadowOffset: { width: 0, height: 2 },
                    textShadowRadius: 3,
                  }}>
                  {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0'}%
                </Text>
              </View>
            </View>
            <Text
              className="text-4xl font-bold"
              style={{
                color: '#7C5E00',
                textShadowColor: '#FFF',
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 3,
              }}>
              {formatCurrency(totalProfit)}
            </Text>
            <Text
              className="mt-1 text-sm"
              style={{
                color: '#7C5E00',
                textShadowColor: '#FFF',
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 3,
              }}>
              {totalProfit >= 0
                ? 'Excellent retour sur investissement'
                : 'Réviser la stratégie recommandé'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default SummarySection;
