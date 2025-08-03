// app/(auth)/login.tsx - Version améliorée avec gestion d'erreurs et animations fluides
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { Label } from '~/components/ui/Label';
import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useState, useRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const { signIn, loading, resendOTP, isValidEmail, isValidPhone } = useAuth();

  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showResendButton, setShowResendButton] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showResendSuccess, setShowResendSuccess] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const errorShakeAnim = useRef(new Animated.Value(0)).current;
  const resendButtonAnim = useRef(new Animated.Value(0)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;

  // Animation d'entrée
  useState(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  });

  const validateIdentifier = (identifier: string) => {
    return isValidEmail(identifier) || isValidPhone(identifier);
  };

  const getIdentifierType = (identifier: string) => {
    if (isValidEmail(identifier)) return 'email';
    if (isValidPhone(identifier)) return 'phone';
    return null;
  };

  const showErrorWithShake = (errorMessage: string) => {
    setGeneralError(errorMessage);
    
    // Animation de secousse pour indiquer l'erreur
    Animated.sequence([
      Animated.timing(errorShakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(errorShakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(errorShakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(errorShakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Masquer l'erreur après 5 secondes
    setTimeout(() => {
      setGeneralError('');
    }, 5000);
  };

  const animateResendButton = (show: boolean) => {
    setShowResendButton(show);
    Animated.timing(resendButtonAnim, {
      toValue: show ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const animateButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleIdentifierChange = (value: string) => {
    setFormData((prev) => ({ ...prev, identifier: value }));
    setSuccessMessage(''); // Masquer le message de succès
    setShowResendSuccess(false);
    
    if (errors.identifier && value && validateIdentifier(value)) {
      setErrors((prev) => ({ ...prev, identifier: '' }));
    }
  };

  const handlePasswordChange = (value: string) => {
    setFormData((prev) => ({ ...prev, password: value }));
    setSuccessMessage(''); // Masquer le message de succès
    setShowResendSuccess(false);
    
    if (errors.password && value) {
      setErrors((prev) => ({ ...prev, password: '' }));
    }
  };

  const handleLogin = async () => {
    try {
      setErrors({});
      setSuccessMessage('');
      setShowResendSuccess(false);
      animateResendButton(false);
      animateButtonPress();

      const newErrors: { [key: string]: string } = {};

      if (!formData.identifier) {
        newErrors.identifier = "L'email ou le téléphone est obligatoire";
      } else if (!validateIdentifier(formData.identifier)) {
        newErrors.identifier = "Format d'email ou de téléphone invalide";
      }

      if (!formData.password) {
        newErrors.password = 'Le mot de passe est obligatoire';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      await signIn(formData.identifier, formData.password);
    } catch (error: any) {
      console.log('Login error:', error);

      const newErrors: { [key: string]: string } = {};
      
      if (error?.message) {
        if (error.message.includes('Email not confirmed') ||
            error.message.includes('email') ||
            error.message.includes('confirm')) {
          
          const identifierType = getIdentifierType(formData.identifier);
          if (identifierType === 'email') {
            newErrors.identifier = 'Email non confirmé';
            animateResendButton(true);
          } else {
            newErrors.identifier = 'Compte non confirmé. Contactez le support.';
          }
        } else if (error.message.includes('Invalid credentials') || 
                   error.message.includes('credentials') ||
                   error.message.includes('password') ||
                   error.message.includes('User not found')) {
          // Afficher l'erreur sur les deux champs comme Discord
          newErrors.identifier = 'Identifiants ou mot de passe invalide.';
          newErrors.password = 'Identifiants ou mot de passe invalide.';
        } else if (error.message.includes('Network') || 
                   error.message.includes('network')) {
          newErrors.identifier = 'Problème de connexion réseau.';
        } else if (error.message.includes('timeout')) {
          newErrors.identifier = 'Connexion expirée. Réessayez.';
        } else {
          newErrors.identifier = error.message;
        }
      } else {
        newErrors.identifier = 'Une erreur inattendue s\'est produite';
      }

      setErrors(newErrors);
    }
  };

  const handleResendConfirmation = async () => {
    try {
      setErrors({});
      setSuccessMessage('');
      setShowResendSuccess(false);
      
      await resendOTP(formData.identifier, 'signup');
      
      // Afficher le message de succès
      setSuccessMessage('Code de confirmation renvoyé à votre email');
      setShowResendSuccess(true);
      
      // Rediriger automatiquement après 2 secondes
      setTimeout(() => {
        router.push(
          `/(auth)/verify-otp?email=${encodeURIComponent(formData.identifier)}&type=signup`
        );
      }, 2000);
      
    } catch (error: any) {
      console.log('Resend error:', error);
      const newErrors: { [key: string]: string } = {};
      
      if (error?.message) {
        if (error.message.includes('Network') || error.message.includes('network')) {
          newErrors.identifier = 'Problème de connexion réseau.';
        } else if (error.message.includes('rate limit') || error.message.includes('too many')) {
          newErrors.identifier = 'Trop de tentatives. Patientez avant de réessayer.';
        } else {
          newErrors.identifier = error.message;
        }
      } else {
        newErrors.identifier = 'Impossible de renvoyer le code';
      }
      
      setErrors(newErrors);
    }
  };

  const getPlaceholderText = () => {
    return 'votre@email.com ou 03XXXXXXXX';
  };

  const getInputKeyboardType = () => {
    const identifierType = getIdentifierType(formData.identifier);
    if (identifierType === 'phone') return 'phone-pad';
    return 'email-address';
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Background Decorative Elements */}
      <View className="absolute inset-0">
        {/* Top-right corner cluster */}
        <View className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-green-100 opacity-30" />
        <View className="absolute -right-8 -top-8 h-16 w-16 rounded-full bg-green-200 opacity-40" />
        <View className="absolute -top-4 right-4 h-12 w-12 bg-green-300 opacity-25" />
        <View className="absolute right-12 top-8 h-8 w-8 rotate-45 rounded bg-green-400 opacity-35" />
        <View className="absolute -right-4 top-12 h-20 w-6 rotate-12 rounded-lg bg-green-200 opacity-30" />
        <View className="absolute right-8 top-20 h-6 w-6 rounded-full bg-green-500 opacity-20" />

        {/* Rectangle middle-left */}
        <View className="absolute -left-8 top-1/3 h-24 w-16 rotate-12 rounded-lg bg-green-200 opacity-20" />

        {/* Small circle middle-right */}
        <View className="absolute right-8 top-1/2 h-12 w-12 rounded-full bg-green-300 opacity-25" />

        {/* Square bottom-left */}
        <View className="absolute bottom-32 left-4 h-20 w-20 rotate-45 rounded-lg bg-green-100 opacity-30" />

        {/* Rectangle bottom-right */}
        <View className="absolute -bottom-8 -right-4 h-40 w-24 rotate-45 rounded-2xl bg-green-200 opacity-20" />

        {/* Additional small elements */}
        <View className="absolute left-1/3 top-20 h-8 w-8 rounded-full bg-green-400 opacity-15" />
        <View className="absolute bottom-1/4 right-1/4 h-16 w-6 rotate-12 rounded bg-green-300 opacity-20" />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          
          <Animated.View 
            className="relative z-10 flex-1 px-6 pt-8"
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}>
            
            {/* Back Button */}
            <TouchableOpacity onPress={() => router.back()} className="mb-8 w-10">
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>

            {/* Header */}
            <View className="mb-8 items-center">
              <View className="mb-4 flex-row items-center">
                <Text className="ml-3 text-3xl font-bold text-gray-900">Bienvenue !</Text>
              </View>
              <Text className="text-center text-gray-600">Nous sommes ravis de vous revoir !</Text>
            </View>

            {/* Message de succès pour le renvoi de code */}
            {showResendSuccess && successMessage ? (
              <Animated.View
                style={{
                  transform: [{ translateX: errorShakeAnim }],
                }}
                className="mb-4 rounded-lg bg-green-50 border border-green-200 p-4">
                <View className="flex-row items-center">
                  <Ionicons name="checkmark-circle" size={20} color="#059669" />
                  <Text className="ml-2 flex-1 text-sm text-green-700">
                    {successMessage}
                  </Text>
                  <View className="ml-2">
                    <Ionicons name="time" size={16} color="#059669" />
                  </View>
                </View>
                <Text className="mt-1 text-xs text-green-600">
                  Redirection automatique dans 2 secondes...
                </Text>
              </Animated.View>
            ) : null}

            {/* Form */}
            <View style={{ gap: 20 }}>
              {/* Email/Phone Field */}
              <View>
                <Label className="mb-2 text-sm font-semibold text-gray-700">
                  Email ou Téléphone
                </Label>
                <Input
                  value={formData.identifier}
                  onChangeText={handleIdentifierChange}
                  placeholder={getPlaceholderText()}
                  keyboardType={getInputKeyboardType()}
                  autoCapitalize="none"
                  error={!!errors.identifier}
                  onFocus={() => setFocusedInput('identifier')}
                  onBlur={() => setFocusedInput(null)}
                  className={`bg-gray-100 px-4 py-4 text-gray-900 ${
                    errors.identifier
                      ? 'border-red-500'
                      : focusedInput === 'identifier'
                        ? 'border-green-500'
                        : 'border-gray-300'
                  }`}
                  style={{
                    borderRadius: 20,
                    borderWidth: focusedInput === 'identifier' ? 2 : 1,
                  }}
                />
                {errors.identifier && (
                  <View className="mt-1 flex-row items-start">
                    <Ionicons name="alert-circle" size={16} color="#DC2626" style={{ marginTop: 1 }} />
                    <Text className="ml-1 flex-1 text-sm text-red-500 leading-5">{errors.identifier}</Text>
                  </View>
                )}
              </View>

              {/* Password Field */}
              <View>
                <Label className="mb-2 text-sm font-semibold text-gray-700">Mot de passe</Label>
                <View className="relative">
                  <Input
                    value={formData.password}
                    onChangeText={handlePasswordChange}
                    placeholder="••••••••"
                    secureTextEntry={!showPassword}
                    error={!!errors.password}
                    onFocus={() => setFocusedInput('password')}
                    onBlur={() => setFocusedInput(null)}
                    className={`bg-gray-100 px-4 py-4 pr-12 text-gray-900 ${
                      errors.password
                        ? 'border-red-500'
                        : focusedInput === 'password'
                          ? 'border-green-500'
                          : 'border-gray-300'
                    }`}
                    style={{
                      borderRadius: 20,
                      borderWidth: focusedInput === 'password' ? 2 : 1,
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-4">
                    <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#6b7280" />
                  </TouchableOpacity>
                </View>
                {errors.password && (
                  <View className="mt-1 flex-row items-start">
                    <Ionicons name="alert-circle" size={16} color="#DC2626" style={{ marginTop: 1 }} />
                    <Text className="ml-1 flex-1 text-sm text-red-500 leading-5">{errors.password}</Text>
                  </View>
                )}
              </View>

              {/* Links */}
              <View className="space-y-2">
                <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
                  <Text className="text-sm font-medium text-green-600">Mot de passe oublié ?</Text>
                </TouchableOpacity>
              </View>

              {/* Login Button */}
              <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
                <Button
                  onPress={handleLogin}
                  loading={loading}
                  disabled={loading}
                  className={`mt-4 py-5 shadow-lg ${loading ? 'bg-green-400' : 'bg-green-600'}`}
                  style={{
                    borderRadius: 25,
                  }}>
                  <Text className="text-center text-lg font-medium text-white">
                    {loading ? 'Connexion...' : 'Se connecter'}
                  </Text>
                </Button>
              </Animated.View>

              {/* Resend Button avec état de succès */}
              {showResendButton && (
                <Animated.View
                  style={{
                    opacity: resendButtonAnim,
                    transform: [
                      {
                        translateY: resendButtonAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        }),
                      },
                    ],
                  }}>
                  <TouchableOpacity
                    onPress={handleResendConfirmation}
                    disabled={showResendSuccess}
                    className={`mt-2 py-4 shadow-lg ${showResendSuccess ? 'bg-green-600' : 'bg-blue-600'}`}
                    style={{
                      borderRadius: 25,
                    }}>
                    <View className="flex-row items-center justify-center">
                      <Ionicons 
                        name={showResendSuccess ? "checkmark-circle" : "mail"} 
                        size={18} 
                        color="white" 
                      />
                      <Text className="ml-2 text-center text-sm font-medium text-white">
                        {showResendSuccess ? 'Code envoyé !' : 'Renvoyer le code de confirmation'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              )}

              {/* Register Link */}
              <View className="mt-4 items-center">
                <Text className="text-center text-gray-600">
                  Pas encore inscrit ?{' '}
                  <Link href="/(auth)/register" className="font-semibold text-green-600">
                    Créer un compte
                  </Link>
                </Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}