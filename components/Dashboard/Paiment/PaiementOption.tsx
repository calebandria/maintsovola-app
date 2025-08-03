import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Smartphone, AlertCircle } from "lucide-react-native";
import { supabase } from '~/lib/data';
import { UserTelephone } from "@/types/userProfile";
import { useAuth } from "@/contexts/AuthContext";
import useMvola from '../../../hooks/use-mvola';
import Toast from 'react-native-toast-message';

type PaymentMethod = 'mvola' | 'orange' | 'airtel' | null;

interface PaymentOptionsProps {
  investmentId: number | null;
  amount: number;
  onPaymentComplete?: (success: boolean, transactionId?: string) => void;
}

const PaymentOptions: React.FC<PaymentOptionsProps> = ({
  investmentId,
  amount,
  onPaymentComplete
}) => {
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userPhones, setUserPhones] = useState<UserTelephone[]>([]);

  const {
    initiatePayment,
    checkTransactionStatus,
    loading,
    error: mvolaError,
  } = useMvola();

  useEffect(() => {
    if (user) {
      console.log('Fetching user phone numbers for kjhgkjgvkhjvhgvhgv,ghv;ghv:', user.id);
      fetchUserPhoneNumbers();
    }
  }, [user]);
  const fetchUserPhoneNumbers = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('telephone')
        .select('*')
        .eq('id_utilisateur', user.id);

      if (error) throw error;
      setUserPhones((data || []) as UserTelephone[]);
    } catch (err) {
      console.error("Error fetching user phone numbers:", err);
    }
  };

  const handlePaymentMethodChange = (value: string) => {
    const method = value as PaymentMethod;
    setPaymentMethod(method);
    setError(null);
    
    // Pre-fill phone number based on payment method
    if (user && userPhones.length > 0) {
      let matchingPhoneType: string;
      
      switch (method) {
        case 'mvola':
          matchingPhoneType = 'mvola';
          break;
        case 'orange':
          matchingPhoneType = 'orange_money';
          break;
        case 'airtel':
          matchingPhoneType = 'airtel_money';
          break;
        default:
          matchingPhoneType = '';
      }
      
      const matchingPhone = userPhones.find(phone => phone.type === matchingPhoneType);
      if (matchingPhone) {
        setPhoneNumber(matchingPhone.numero);
      }
    }
  };

  const validatePhoneNumber = (number: string): boolean => {
    const regex = /^0[34][0-9]{8}$/; // MVola, Orange Money, or Airtel Money number in Madagascar
    return regex.test(number);
  };

  const handleSubmitPayment = async () => {
    if (!paymentMethod) {
      setError("Veuillez sélectionner une méthode de paiement");
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setError("Veuillez entrer un numéro de téléphone valide (ex: 034XXXXXXX ou 033XXXXXXX)");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      if (paymentMethod === 'mvola') {
        const result = await initiatePayment({
          amount: amount.toString(),
          currency: "MGA",
          description: `Investissement Maintso vola #${investmentId}`,
          customerMsisdn: phoneNumber,
          merchantID: process.env.EXPO_PUBLIC_MERCHANT_ID??'',
          X_Callback_URL: process.env.EXPO_PUBLIC_CALLBACK_URL??'',
        });

        if (!result || result.status !== 200) {
          throw new Error(mvolaError || "Échec de l'initiation du paiement MVola");
        }
        
        const statusResult = await checkTransactionStatus(result.serverCorrelationId);

        if (!statusResult || statusResult.status !== 200) {
          throw new Error("Le paiement n'a pas été confirmé.");
        }

        Toast.show({
          type: 'success',
          text1: 'Paiement effectué avec succès',
          text2: 'Votre investissement a été enregistré et payé',
          position: 'bottom',
        });

        onPaymentComplete?.(true, result.objectReference);
      } else {
        Toast.show({
          type: 'info',
          text1: `Le paiement par ${paymentMethod === 'orange' ? 'Orange Money' : 'Airtel Money'} sera disponible prochainement`,
          text2: "Nous vous notifierons lorsque cette méthode sera disponible",
          position: 'bottom',
        });

        onPaymentComplete?.(true);
      }
    } catch (err) {
      console.error("Payment error:", err);
      const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue lors du traitement du paiement";
      setError(errorMessage);
      
      Toast.show({
        type: 'error',
        text1: 'Échec du paiement',
        text2: errorMessage || "Veuillez réessayer ou choisir une autre méthode de paiement",
        position: 'bottom',
      });
      
      onPaymentComplete?.(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View className="p-4 bg-white">
      {/* Header */}
      <View className="mb-6">
        <Text className="text-lg font-semibold text-gray-900">Choisissez votre méthode de paiement</Text>
        <Text className="text-sm text-gray-500 mt-1">
          Montant à payer: {new Intl.NumberFormat('fr-MG', { 
            style: 'currency', 
            currency: 'MGA' 
          }).format(amount)}
        </Text>
      </View>

      {/* Payment Methods */}
      <View className="flex-row justify-between gap-3 mb-6">
        {/* MVola */}
        <TouchableOpacity 
          onPress={() => handlePaymentMethodChange('mvola')}
          className={`flex-1 items-center justify-center rounded-lg border-2 p-4 
            ${paymentMethod === 'mvola' 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-200 bg-gray-50'}`}
          activeOpacity={0.7}
        >
          <Smartphone size={24} className="text-pink-600 mb-3" />
          <Text className="text-sm font-medium text-gray-900">MVola</Text>
        </TouchableOpacity>
        
        {/* Orange Money */}
        <TouchableOpacity 
          disabled
          className="flex-1 items-center justify-center rounded-lg border-2 border-gray-200 bg-gray-50 p-4 opacity-50"
          activeOpacity={1}
        >
          <Smartphone size={24} className="text-orange-500 mb-3" />
          <Text className="text-sm font-medium text-gray-900">Orange Money</Text>
          <Text className="text-xs text-gray-500 mt-1">Bientôt</Text>
        </TouchableOpacity>
        
        {/* Airtel Money */}
        <TouchableOpacity 
          disabled
          className="flex-1 items-center justify-center rounded-lg border-2 border-gray-200 bg-gray-50 p-4 opacity-50"
          activeOpacity={1}
        >
          <Smartphone size={24} className="text-red-500 mb-3" />
          <Text className="text-sm font-medium text-gray-900">Airtel Money</Text>
          <Text className="text-xs text-gray-500 mt-1">Bientôt</Text>
        </TouchableOpacity>
      </View>

      {paymentMethod && (
        <View className="space-y-4">
          {/* Phone Input */}
          <View className="space-y-2">
            <Text className="text-sm font-medium text-gray-900">Numéro de téléphone</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 text-base bg-white"
              placeholder="034XXXXXXX"
              placeholderTextColor="#9CA3AF"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              editable={!isProcessing}
              keyboardType="phone-pad"
            />
            <Text className="text-xs text-gray-500">
              Entrez le numéro {paymentMethod === 'mvola' ? 'MVola' : 
              paymentMethod === 'orange' ? 'Orange Money' : 'Airtel Money'} associé à votre compte
            </Text>
          </View>

          {/* Error Message */}
          {error && (
            <View className="bg-red-50 p-3 rounded-lg flex-row items-start gap-2">
              <AlertCircle size={20} className="text-red-600 mt-0.5" />
              <Text className="text-sm text-red-600 flex-1">{error}</Text>
            </View>
          )}

          {/* Pay Button */}
          <TouchableOpacity
            className={`w-full py-4 rounded-lg bg-green-500 items-center justify-center
              ${isProcessing ? 'opacity-70' : ''}`}
            onPress={handleSubmitPayment}
            disabled={isProcessing}
            activeOpacity={0.7}
          >
            {isProcessing ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">Payer maintenant</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default PaymentOptions;