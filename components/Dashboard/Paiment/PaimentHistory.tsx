import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '~/lib/data';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Modal from 'react-native-modal';
import PaymentOptions from './PaiementOption';
import { Pressable } from 'react-native';

// Helper for currency formatting
const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

interface Payment {
  id_paiement: number;
  reference_transaction: string;
  methode_paiement: string;
  montant: number;
  statut: string;
  date_paiement: string;
  id_investissement?: number | null;
  projet?: {
    id_projet: number;
    titre: string;
  };
}

interface PendingPayment {
  id_investissement: number;
  id_projet: number;
  montant: number;
  date_investissement: string;
  projet?: {
    id_projet: number;
    titre: string;
  };
}

interface PaymentHistoryProps {
  userId: string;
}

const PaymentHistory: React.FC<PaymentHistoryProps> = ({ userId }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  useEffect(() => {
    const fetchPayments = async () => {
      if (!userId) return;

      try {
        setLoading(true);

        // Fetch user investments
        const { data: userInvestments, error: investmentsError } = await supabase
          .from('investissement')
          .select('id_investissement, id_projet, montant, date_decision_investir, statut_paiement, projet:id_projet(id_projet, titre)')
          .eq('id_investisseur', userId);

        if (investmentsError) throw investmentsError;

        if (!userInvestments || userInvestments.length === 0) {
          setPayments([]);
          setPendingPayments([]);
          setLoading(false);
          return;
        }

        // Pending investments
        const pendingInvestments = userInvestments
          .filter(inv => inv.statut_paiement !== 'payé')
          .map(inv => ({
            id_investissement: inv.id_investissement,
            id_projet: inv.id_projet,
            montant: inv.montant,
            date_investissement: inv.date_decision_investir,
            projet: Array.isArray(inv.projet) ? inv.projet[0] : inv.projet
          }));

        // Fetch payment history
        const { data: paymentHistory, error: paymentHistoryError } = await supabase
          .from('historique_paiement_invest')
          .select('*, investissement:id_investissement(id_projet)')
          .eq('numero_telephone', userId);

        if (paymentHistoryError) throw paymentHistoryError;

        // Format payments
        const formattedPayments = (paymentHistory || []).map((payment) => {
          const investment = userInvestments.find(
            inv => inv.id_investissement === payment.id_investissement
          );
          return {
            id_paiement: payment.id_paiement,
            reference_transaction: payment.reference_transaction,
            methode_paiement: payment.methode_paiement,
            montant: payment.montant,
            statut: payment.statut,
            date_paiement: payment.date_paiement,
            id_investissement: payment.id_investissement,
            projet: investment && (Array.isArray(investment.projet) ? investment.projet[0] : investment.projet)
          };
        });

        setPayments(formattedPayments);
        setPendingPayments(pendingInvestments);
      } catch (error) {
        console.error('Erreur lors de la récupération des paiements:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [userId, paymentDialogOpen]);

  const handlePayNow = (payment: PendingPayment) => {
    setSelectedPayment(payment);
    setPaymentDialogOpen(true);
  };

  const handlePaymentComplete = (success: boolean) => {
    if (success) {
      // Optionally show a toast here
    }
    setPaymentDialogOpen(false);
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'effectué':
        return 'bg-green-500';
      case 'En attente':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="px-4 py-6" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Pending Payments Section */}
        {pendingPayments.length > 0 && (
          <View className="mb-8">
            <Text className="text-xl font-bold mb-4 text-gray-800">Paiements en attente</Text>
            <View className="bg-white rounded-xl shadow-sm overflow-hidden">
              {pendingPayments.map((payment) => (
                <View 
                  key={payment.id_investissement} 
                  className="p-4 border-b border-gray-100 last:border-b-0"
                >
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-gray-500">Projet</Text>
                    <Text className="font-medium text-gray-800">
                      {payment.projet ? payment.projet.titre : 'Non spécifié'}
                    </Text>
                  </View>
                  
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-gray-500">Date</Text>
                    <Text className="text-gray-800">
                      {payment.date_investissement
                        ? format(new Date(payment.date_investissement), 'dd MMM yyyy', { locale: fr })
                        : '-'}
                    </Text>
                  </View>
                  
                  <View className="flex-row justify-between mb-3">
                    <Text className="text-gray-500">Montant</Text>
                    <Text className="font-semibold text-gray-800">
                      {formatCurrency(payment.montant)}
                    </Text>
                  </View>
                  
                  <View className="flex-row justify-between items-center">
                    <View className="bg-yellow-100 px-3 py-1 rounded-full">
                      <Text className="text-yellow-800 text-xs font-medium">En attente</Text>
                    </View>
                    
                    <TouchableOpacity
                      className="bg-green-600 px-4 py-2 rounded-lg"
                      onPress={() => handlePayNow(payment)}
                    >
                      <Text className="text-white font-medium">Payer maintenant</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Payment History Section */}
        <View>
          <Text className="text-xl font-bold mb-4 text-gray-800">Historique des paiements</Text>
          
          {payments.length === 0 ? (
            <View className="bg-white rounded-xl p-8 items-center justify-center">
              <Text className="text-gray-500 text-center">
                Aucun paiement effectué pour le moment
              </Text>
            </View>
          ) : (
            <View className="bg-white rounded-xl shadow-sm overflow-hidden">
              {payments.map((payment) => (
                <View 
                  key={payment.id_paiement} 
                  className="p-4 border-b border-gray-100 last:border-b-0"
                >
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-gray-500">Projet</Text>
                    <Text className="font-medium text-gray-800 text-right">
                      {payment.projet ? payment.projet.titre : 'Non spécifié'}
                    </Text>
                  </View>
                  
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-gray-500">Date</Text>
                    <Text className="text-gray-800">
                      {format(new Date(payment.date_paiement), 'dd MMM yyyy', { locale: fr })}
                    </Text>
                  </View>
                  
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-gray-500">Référence</Text>
                    <Text className="text-blue-600 font-mono">
                      {payment.reference_transaction?.substring(0, 8)}...
                    </Text>
                  </View>
                  
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-gray-500">Méthode</Text>
                    <Text className="text-gray-800">
                      {payment.methode_paiement}
                    </Text>
                  </View>
                  
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-gray-500">Montant</Text>
                    <Text className="font-semibold text-gray-800">
                      {formatCurrency(payment.montant)}
                    </Text>
                  </View>
                  
                  <View className="flex-row justify-between items-center">
                    <Text className="text-gray-500">Statut</Text>
                    <View className={`${getStatusBadgeStyle(payment.statut)} px-3 py-1 rounded-full`}>
                      <Text className="text-white text-xs font-medium">{payment.statut}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Payment Modal */}
      <Modal 
        isVisible={paymentDialogOpen} 
        onBackdropPress={() => setPaymentDialogOpen(false)}
        backdropOpacity={0.5}
        animationIn="fadeIn"
        animationOut="fadeOut"
      >
        <View className="bg-white p-6 rounded-xl m-4">
          <TouchableOpacity
              className="absolute top-4 right-4"
              onPress={() => setPaymentDialogOpen(false)}
            >
              <Text className="text-gray-400 text-lg font-bold bg-green-100 rounded-full px-2">x</Text>
            </TouchableOpacity>
          <Text className="text-xl font-bold mb-4 text-gray-800">
            Effectuer le paiement
          </Text>

          
          {selectedPayment && (
              <View className="mt-4">
                <Text className="text-gray-500 mb-2">Choisissez un mode de paiement:</Text>
                {/* Payment options components */}
                <PaymentOptions
                  investmentId={selectedPayment.id_investissement}
                  amount={selectedPayment.montant}
                  onPaymentComplete={handlePaymentComplete}
                />
              </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

export default PaymentHistory;