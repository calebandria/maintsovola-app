// components/InvestmentSummaryCard.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { Landmark, TrendingUp, DollarSign } from 'lucide-react-native';

interface InvestmentSummary {
  totalInvested: number;
  totalProfit: number;
  averageROI: number;
  ongoingProjects: number;
  completedProjects: number;
  projectsByStatusData: {
    name: string;
    value: number;
    color: string;
  }[];
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  valueColor?: string;
}

const StatCard = React.memo(
  ({ icon, label, value, valueColor = 'text-primary' }: StatCardProps) => (
    <View className="border border-gray-300 p-3 rounded-lg">
      <View className="flex-row items-center gap-2 mb-2">
        {icon}
        <Text className="text-gray-500">{label}</Text>
      </View>
      <Text className={`text-xl font-bold ${valueColor}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </Text>
    </View>
  )
);

interface InvestmentSummaryCardProps {
  summary: InvestmentSummary;
}

const chartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
};

export const InvestmentSummaryCard = React.memo(
  ({ summary }: InvestmentSummaryCardProps) => {
    return (
      <View className="mb-6 bg-white rounded-lg p-4 shadow-sm">
        <Text className="text-xl font-bold mb-4 text-gray-800">Résumé des Investissements</Text>

        <View className="flex-col gap-2 mb-4">
          <StatCard
            icon={<Landmark size={18} color="#facc15" />}
            label="Total Investi"
            value={`${summary.totalInvested.toLocaleString()} AR`}
          />
          <StatCard
            icon={<DollarSign size={18} color="#16a34a" />}
            label="Bénéfice Total"
            value={`${summary.totalProfit.toLocaleString()} AR`}
            valueColor="text-green-600"
          />
          <StatCard
            icon={<TrendingUp size={18} color="#2563eb" />}
            label="ROI Moyen"
            value={`${summary.averageROI.toFixed(1)}%`}
            valueColor="text-blue-600"
          />
        </View>

        {summary.projectsByStatusData.length > 0 && (
          <View className="items-center mt-6">
            <Text className="text-gray-500 mb-2">Statut des Projets</Text>
            <PieChart
              data={summary.projectsByStatusData}
              width={300}
              height={150}
              chartConfig={chartConfig}
              accessor="value"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
            <View className="flex-row flex-wrap justify-center space-x-4 mt-2">
              {summary.projectsByStatusData.map((item, index) => (
                <View
                  key={`status-${item.name}-${index}`}
                  className="flex-row items-center mr-2 mb-1"
                >
                  <View className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: item.color }} />
                  <Text className="text-xs text-gray-600">{item.name}: {item.value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  }
);