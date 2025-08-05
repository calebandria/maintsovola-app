// app/(auth)/reset-password.tsx
import { Ionicons } from '@expo/vector-icons';
import { createClient } from '@supabase/supabase-js';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Logo } from '../../components/Logo';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';

// Interface pour les critères de validation
interface PasswordCriteria {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

export default function ResetPasswordScreen() {
  const { email, token } = useLocalSearchParams<{
    email: string;
    token: string;
  }>();

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordCriteria, setPasswordCriteria] = useState<PasswordCriteria>({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  const validatePasswordCriteria = (password: string): PasswordCriteria => {
    return {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };
  };

  const isPasswordRobust = (criteria: PasswordCriteria): boolean => {
    return Object.values(criteria).every(Boolean);
  };

  const handlePasswordChange = (value: string) => {
    setFormData((prev) => ({ ...prev, password: value }));

    const criteria = validatePasswordCriteria(value);
    setPasswordCriteria(criteria);

    // Supprimer l'erreur en temps réel si le mot de passe devient valide
    if (errors.password && value && isPasswordRobust(criteria)) {
      setErrors((prev) => ({ ...prev, password: '' }));
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setFormData((prev) => ({ ...prev, confirmPassword: value }));

    // Supprimer l'erreur en temps réel si la confirmation correspond
    if (errors.confirmPassword && value && value === formData.password) {
      setErrors((prev) => ({ ...prev, confirmPassword: '' }));
    }
  };

  const handleResetPassword = async () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.password) {
      newErrors.password = 'Le mot de passe est obligatoire';
    } else if (!isPasswordRobust(passwordCriteria)) {
      newErrors.password = 'Le mot de passe ne respecte pas tous les critères de sécurité';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'La confirmation du mot de passe est obligatoire';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
      const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

      const { error } = await supabase.auth.updateUser({
        password: formData.password,
      });

      if (error) throw error;

      Alert.alert('Mot de passe réinitialisé !', 'Votre mot de passe a été modifié avec succès.', [
        {
          text: 'OK',
          onPress: () => router.replace('/(auth)/login'),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de réinitialiser le mot de passe');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!email || !token) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white px-6">
        <Text className="mb-4 text-center text-red-500">
          Informations manquantes pour la réinitialisation
        </Text>
        <Button onPress={() => router.replace('/(auth)/forgot-password')}>
          Retour à la récupération
        </Button>
      </SafeAreaView>
    );
  }

  const CriteriaItem = ({ met, text }: { met: boolean; text: string }) => (
    <View className="mb-1 flex-row items-center">
      <Ionicons
        name={met ? 'checkmark-circle' : 'close-circle'}
        size={16}
        color={met ? '#10B981' : '#EF4444'}
      />
      <Text className={`ml-2 text-sm ${met ? 'text-green-600' : 'text-red-500'}`}>{text}</Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View className="flex-1 justify-center px-6 py-12">
            {/* Header */}
            <View className="mb-8 items-center">
              <Logo size="lg" />
            </View>

            <View className="rounded-lg border border-gray-200 bg-white p-6">
              <Text className="mb-2 text-center text-2xl font-bold text-gray-900">
                Nouveau mot de passe
              </Text>

              <Text className="mb-6 text-center text-gray-600">
                Créez un nouveau mot de passe sécurisé pour votre compte
              </Text>

              <View style={{ gap: 24 }}>
                <View>
                  <Label>
                    Nouveau mot de passe <Text className="text-red-500">*</Text>
                  </Label>
                  <View className="relative">
                    <Input
                      value={formData.password}
                      onChangeText={handlePasswordChange}
                      placeholder="********"
                      secureTextEntry={!showPassword}
                      error={!!errors.password}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3">
                      <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                  {errors.password && (
                    <Text className="mt-1 text-sm text-red-500">{errors.password}</Text>
                  )}

                  {/* Critères de sécurité */}
                  {formData.password && (
                    <View className="mt-3 rounded-lg bg-gray-50 p-3">
                      <Text className="mb-2 text-sm font-medium text-gray-700">
                        Critères de sécurité :
                      </Text>
                      <CriteriaItem met={passwordCriteria.minLength} text="Au moins 8 caractères" />
                      <CriteriaItem
                        met={passwordCriteria.hasUppercase}
                        text="Une lettre majuscule"
                      />
                      <CriteriaItem
                        met={passwordCriteria.hasLowercase}
                        text="Une lettre minuscule"
                      />
                      <CriteriaItem met={passwordCriteria.hasNumber} text="Un chiffre" />
                      <CriteriaItem
                        met={passwordCriteria.hasSpecialChar}
                        text="Un caractère spécial (!@#$%^&*)"
                      />
                    </View>
                  )}
                </View>

                <View>
                  <Label>
                    Confirmer le mot de passe <Text className="text-red-500">*</Text>
                  </Label>
                  <View className="relative">
                    <Input
                      value={formData.confirmPassword}
                      onChangeText={handleConfirmPasswordChange}
                      placeholder="********"
                      secureTextEntry={!showConfirmPassword}
                      error={!!errors.confirmPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3">
                      <Ionicons
                        name={showConfirmPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color="#6B7280"
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.confirmPassword && (
                    <Text className="mt-1 text-sm text-red-500">{errors.confirmPassword}</Text>
                  )}
                </View>

                <Button
                  onPress={handleResetPassword}
                  loading={isSubmitting}
                  disabled={!isPasswordRobust(passwordCriteria)}>
                  {isSubmitting ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
                </Button>

                <View className="items-center pt-4">
                  <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                    <Text className="text-sm text-gray-600">
                      Retour à la <Text className="font-medium text-green-600">connexion</Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
