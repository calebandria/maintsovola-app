import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ProgressBar } from 'react-native-paper';

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
};

interface PaymentTrackingSectionProps {
  metrics?: {
    totalInvested: number;
    totalPaid: number;
    pendingPayments: number;
    thisMonthPaid: number;
    nextPaymentDue?: {
      amount: number;
      date: string;
      project: string;
    };
  };
}

const PaymentTrackingSection: React.FC<PaymentTrackingSectionProps> = ({
  metrics
}) => {
  const paymentProgress = metrics && metrics.totalInvested > 0
    ? (metrics.totalPaid / metrics.totalInvested) * 100
    : 0;

  return (
    <ScrollView>
      <View className="flex-col gap-3">
        {/* Total Invested View */}
        <View>
          <View className="bg-white p-4 rounded-lg shadow">
            <View className="flex-row justify-between items-center pb-2">
              <Text className="text-sm font-medium">Total Investi</Text>
              <MaterialIcons name="trending-up" size={16} color="#64748b" />
            </View>
            <Text className="text-2xl font-bold">{formatCurrency(metrics?.totalInvested ?? 0)}</Text>
            <View className="mt-2">
              <ProgressBar
                progress={paymentProgress / 100}
                color="#3b82f6"
                className="h-1"
              />
              <Text className="text-xs text-gray-500 mt-1">
                {paymentProgress.toFixed(1)}% payé
              </Text>
            </View>
          </View>
        </View>
        {/* Pending Payments View */}
        <View className="flex-1 min-w-[45%]">
          <View className="bg-white p-4 rounded-lg shadow">
            <View className="flex-row justify-between items-center pb-2">
              <Text className="text-sm font-medium">Paiements en Attente</Text>
              <MaterialCommunityIcons name="clock" size={16} color="#ea580c" />
            </View>
            <Text className="text-2xl font-bold text-orange-600">
              {formatCurrency(metrics?.pendingPayments ?? 0)}
            </Text>
            <View className="mt-2 border border-gray-300 rounded-full px-2 py-1 self-start">
              <Text className="text-xs">
                {(metrics?.pendingPayments ?? 0) > 0 ? 'Action requise' : 'À jour'}
              </Text>
            </View>
          </View>
        </View>
        {/* This Month Paid View */}
        <View className="flex-1 min-w-[45%]">
          <View className="bg-white p-4 rounded-lg shadow">
            <View className="flex-row justify-between items-center pb-2">
              <Text className="text-sm font-medium">Payé ce Mois</Text>
              <MaterialCommunityIcons name="check-circle" size={16} color="#16a34a" />
            </View>
            <Text className="text-2xl font-bold text-green-600">
              {formatCurrency(metrics?.thisMonthPaid ?? 0)}
            </Text>
            <Text className="text-xs text-gray-500 mt-2">
              Mois en cours
            </Text>
          </View>
        </View>
        {/* Next Payment Due View */}
        <View className="flex-1 min-w-[45%]">
          <View className="bg-white p-4 rounded-lg shadow">
            <View className="flex-row justify-between items-center pb-2">
              <Text className="text-sm font-medium">Prochaine Échéance</Text>
              <MaterialCommunityIcons name="alert-circle" size={16} color="#dc2626" />
            </View>
            {metrics?.nextPaymentDue ? (
              <>
                <Text className="text-2xl font-bold">
                  {formatCurrency(metrics.nextPaymentDue.amount)}
                </Text>
                <Text className="text-xs text-gray-500 mt-1">
                  {new Date(metrics.nextPaymentDue.date).toLocaleDateString('fr-FR')}
                </Text>
                <Text className="text-xs text-gray-500">
                  {metrics.nextPaymentDue.project}
                </Text>
              </>
            ) : (
              <Text className="text-sm text-gray-500">
                Aucune échéance
              </Text>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default PaymentTrackingSection;