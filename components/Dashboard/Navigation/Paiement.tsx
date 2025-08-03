import React from 'react';
import { View, Text, ActivityIndicator, ScrollView } from 'react-native';
import { usePaymentData } from '~/hooks/useUserInvestissement';
import { useAuth } from '~/contexts/AuthContext';
import PaymentTrackingSection from '~/components/Dashboard/Paiment/PaimentAnalysis';
import PaymentHistory from '../Paiment/PaimentHistory';


const Paiement = () => {
  const { user } = useAuth();
  console.log('user eeeeeejblskdbsqlkjd',user)
  const USER_ID = user?.id ?? '';
  // console.log('USER_ID kjdsqkjdsqkdjsqbdlksjbsqlkj:', USER_ID);

  const { metrics, loading } = usePaymentData(USER_ID);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        {/* <>Chargement des paiements...</Text> */}
      </View>
    );
  }

  return (
    <ScrollView className="p-4 space-y-4 bg-gray-100">
      <View>
        <Text className="text-lg font-semibold my-4">Suivi des Paiements</Text>
        <PaymentTrackingSection metrics={metrics} />
      </View>
      {/* Payment history */}
      <View>
        <Text className="text-lg font-semibold my-4">Historique détaillé des paiements</Text>
        <PaymentHistory userId={USER_ID}/>
      </View>
    </ScrollView>
  );
};

export default Paiement;