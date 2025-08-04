// app/(auth)/register.tsx - Multi-step form avec style login
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { Label } from '~/components/ui/Label';
import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useState, useRef } from 'react';
import {
  Alert,
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

interface PasswordCriteria {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const [formData, setFormData] = useState({
    nom: '',
    prenoms: '',
    email: '',
    telephone: '',
    password: '',
    confirmPassword: '',
    isInvestor: false,
    isFarmingOwner: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [passwordCriteria, setPasswordCriteria] = useState<PasswordCriteria>({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const stepTransitionAnim = useRef(new Animated.Value(0)).current;

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

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^(032|033|034|038)\d{7}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

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

  const validateCurrentStep = () => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.nom.trim()) {
        newErrors.nom = 'Le nom est obligatoire';
      }
      if (!formData.prenoms.trim()) {
        newErrors.prenoms = 'Le prénom est obligatoire';
      }
    }

    if (currentStep === 2) {
      if (!formData.email.trim()) {
        newErrors.email = "L'email est obligatoire";
      } else if (!validateEmail(formData.email)) {
        newErrors.email = "Format d'email invalide";
      }

      if (formData.telephone) {
        const cleanPhone = formData.telephone.replace(/\s/g, '');
        if (!validatePhone(cleanPhone)) {
          newErrors.telephone = 'Format de téléphone invalide';
        }
      }
    }

    if (currentStep === 3) {
      if (!formData.password) {
        newErrors.password = 'Le mot de passe est obligatoire';
      } else if (!isPasswordRobust(passwordCriteria)) {
        newErrors.password = 'Le mot de passe ne respecte pas tous les critères';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
      }
    }

    return newErrors;
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

  const animateStepTransition = () => {
    Animated.sequence([
      Animated.timing(stepTransitionAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(stepTransitionAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleNext = () => {
    const stepErrors = validateCurrentStep();
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    setErrors({});
    animateStepTransition();
    
    setTimeout(() => {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      }
    }, 200);
  };

  const handlePrevious = () => {
    animateStepTransition();
    setTimeout(() => {
      if (currentStep > 1) {
        setCurrentStep(currentStep - 1);
      }
    }, 200);
  };

  const handleSubmit = async () => {
    const formErrors = validateCurrentStep();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    animateButtonPress();

    try {
      const userData = {
        nom: formData.nom,
        prenoms: formData.prenoms,
        email: formData.email,
        telephone: formData.telephone || undefined,
        is_investor: formData.isInvestor,
        is_farming_owner: formData.isFarmingOwner,
        role: 'simple',
      };

      const user = await signUp(formData.email, formData.password, userData);

      if (user) {
        Alert.alert(
          'Inscription réussie !',
          'Un code de vérification a été envoyé à votre email.',
          [
            {
              text: 'OK',
              onPress: () =>
                router.push({
                  pathname: '/(auth)/verify-otp',
                  params: {
                    email: formData.email,
                    type: 'signup',
                  },
                }),
            },
          ]
        );
      }
    } catch (error: any) {
      const newErrors: Record<string, string> = {};
      
      if (error?.message) {
        if (error.message.includes('email') && error.message.includes('already')) {
          newErrors.email = 'Cet email est déjà utilisé.';
        } else if (error.message.includes('Network') || error.message.includes('network')) {
          newErrors.email = 'Problème de connexion réseau.';
        } else {
          newErrors.email = error.message;
        }
      } else {
        newErrors.email = "Une erreur est survenue lors de l'inscription";
      }
      
      setErrors(newErrors);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Validation en temps réel
    if (field === 'nom' && value.trim() && errors.nom) {
      setErrors((prev) => ({ ...prev, nom: '' }));
    }

    if (field === 'prenoms' && value.trim() && errors.prenoms) {
      setErrors((prev) => ({ ...prev, prenoms: '' }));
    }

    if (field === 'email') {
      if (value && validateEmail(value) && errors.email) {
        setErrors((prev) => ({ ...prev, email: '' }));
      }
    }

    if (field === 'telephone') {
      if (value) {
        const cleanPhone = value.replace(/\s/g, '');
        if (validatePhone(cleanPhone) && errors.telephone) {
          setErrors((prev) => ({ ...prev, telephone: '' }));
        }
      } else {
        if (errors.telephone) {
          setErrors((prev) => ({ ...prev, telephone: '' }));
        }
      }
    }

    if (field === 'password') {
      const criteria = validatePasswordCriteria(value);
      setPasswordCriteria(criteria);

      if (value && isPasswordRobust(criteria) && errors.password) {
        setErrors((prev) => ({ ...prev, password: '' }));
      }
    }

    if (field === 'confirmPassword') {
      if (value && value === formData.password && errors.confirmPassword) {
        setErrors((prev) => ({ ...prev, confirmPassword: '' }));
      }
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Informations personnelles';
      case 2: return 'Coordonnées';
      case 3: return 'Sécurité';
      default: return 'Inscription';
    }
  };

  const getStepSubtitle = () => {
    switch (currentStep) {
      case 1: return 'Commençons par vos informations de base';
      case 2: return 'Comment pouvons-nous vous contacter ?';
      case 3: return 'Sécurisez votre compte';
      default: return '';
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={{ gap: 20 }}>
            {/* Nom */}
            <View>
              <Label className="mb-2 text-sm font-semibold text-gray-700">
                Nom
              </Label>
              <Input
                value={formData.nom}
                onChangeText={(value) => updateFormData('nom', value)}
                placeholder="Votre nom"
                error={!!errors.nom}
                onFocus={() => setFocusedInput('nom')}
                onBlur={() => setFocusedInput(null)}
                className={`bg-gray-100 px-4 py-4 text-gray-900 ${
                  errors.nom
                    ? 'border-red-500'
                    : focusedInput === 'nom'
                      ? 'border-green-500'
                      : 'border-gray-300'
                }`}
                style={{
                  borderRadius: 20,
                  borderWidth: focusedInput === 'nom' ? 2 : 1,
                }}
              />
              {errors.nom && (
                <View className="mt-1 flex-row items-start">
                  <Ionicons name="alert-circle" size={16} color="#DC2626" style={{ marginTop: 1 }} />
                  <Text className="ml-1 flex-1 text-sm text-red-500 leading-5">{errors.nom}</Text>
                </View>
              )}
            </View>

            {/* Prénoms */}
            <View>
              <Label className="mb-2 text-sm font-semibold text-gray-700">
                Prénoms
              </Label>
              <Input
                value={formData.prenoms}
                onChangeText={(value) => updateFormData('prenoms', value)}
                placeholder="Vos prénoms"
                error={!!errors.prenoms}
                onFocus={() => setFocusedInput('prenoms')}
                onBlur={() => setFocusedInput(null)}
                className={`bg-gray-100 px-4 py-4 text-gray-900 ${
                  errors.prenoms
                    ? 'border-red-500'
                    : focusedInput === 'prenoms'
                      ? 'border-green-500'
                      : 'border-gray-300'
                }`}
                style={{
                  borderRadius: 20,
                  borderWidth: focusedInput === 'prenoms' ? 2 : 1,
                }}
              />
              {errors.prenoms && (
                <View className="mt-1 flex-row items-start">
                  <Ionicons name="alert-circle" size={16} color="#DC2626" style={{ marginTop: 1 }} />
                  <Text className="ml-1 flex-1 text-sm text-red-500 leading-5">{errors.prenoms}</Text>
                </View>
              )}
            </View>
          </View>
        );

      case 2:
        return (
          <View style={{ gap: 20 }}>
            {/* Email */}
            <View>
              <Label className="mb-2 text-sm font-semibold text-gray-700">
                Email
              </Label>
              <Input
                value={formData.email}
                onChangeText={(value) => updateFormData('email', value)}
                placeholder="votre@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                error={!!errors.email}
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)}
                className={`bg-gray-100 px-4 py-4 text-gray-900 ${
                  errors.email
                    ? 'border-red-500'
                    : focusedInput === 'email'
                      ? 'border-green-500'
                      : 'border-gray-300'
                }`}
                style={{
                  borderRadius: 20,
                  borderWidth: focusedInput === 'email' ? 2 : 1,
                }}
              />
              {errors.email && (
                <View className="mt-1 flex-row items-start">
                  <Ionicons name="alert-circle" size={16} color="#DC2626" style={{ marginTop: 1 }} />
                  <Text className="ml-1 flex-1 text-sm text-red-500 leading-5">{errors.email}</Text>
                </View>
              )}
            </View>

            {/* Téléphone */}
            <View>
              <Label className="mb-2 text-sm font-semibold text-gray-700">
                Téléphone (optionnel)
              </Label>
              <Input
                value={formData.telephone}
                onChangeText={(value) => updateFormData('telephone', value)}
                placeholder="032XXXXXXXX"
                keyboardType="phone-pad"
                error={!!errors.telephone}
                onFocus={() => setFocusedInput('telephone')}
                onBlur={() => setFocusedInput(null)}
                className={`bg-gray-100 px-4 py-4 text-gray-900 ${
                  errors.telephone
                    ? 'border-red-500'
                    : focusedInput === 'telephone'
                      ? 'border-green-500'
                      : 'border-gray-300'
                }`}
                style={{
                  borderRadius: 20,
                  borderWidth: focusedInput === 'telephone' ? 2 : 1,
                }}
              />
              {errors.telephone && (
                <View className="mt-1 flex-row items-start">
                  <Ionicons name="alert-circle" size={16} color="#DC2626" style={{ marginTop: 1 }} />
                  <Text className="ml-1 flex-1 text-sm text-red-500 leading-5">{errors.telephone}</Text>
                </View>
              )}
            </View>
          </View>
        );

      case 3:
        return (
          <View style={{ gap: 20 }}>
            {/* Mot de passe */}
            <View>
              <Label className="mb-2 text-sm font-semibold text-gray-700">Mot de passe</Label>
              <View className="relative">
                <Input
                  value={formData.password}
                  onChangeText={(value) => updateFormData('password', value)}
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
              
              {/* Critères du mot de passe */}
              {formData.password && (
                <View className="mt-2 space-y-1">
                  <Text className="text-xs text-gray-600">Votre mot de passe doit contenir :</Text>
                  {Object.entries({
                    'Au moins 8 caractères': passwordCriteria.minLength,
                    'Une majuscule': passwordCriteria.hasUppercase,
                    'Une minuscule': passwordCriteria.hasLowercase,
                    'Un chiffre': passwordCriteria.hasNumber,
                    'Un caractère spécial': passwordCriteria.hasSpecialChar,
                  }).map(([label, isValid]) => (
                    <View key={label} className="flex-row items-center">
                      <Ionicons 
                        name={isValid ? 'checkmark-circle' : 'close-circle'} 
                        size={12} 
                        color={isValid ? '#059669' : '#DC2626'} 
                      />
                      <Text className={`ml-1 text-xs ${isValid ? 'text-green-600' : 'text-red-500'}`}>
                        {label}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Confirmer mot de passe */}
            <View>
              <Label className="mb-2 text-sm font-semibold text-gray-700">Confirmer mot de passe</Label>
              <View className="relative">
                <Input
                  value={formData.confirmPassword}
                  onChangeText={(value) => updateFormData('confirmPassword', value)}
                  placeholder="••••••••"
                  secureTextEntry={!showConfirmPassword}
                  error={!!errors.confirmPassword}
                  onFocus={() => setFocusedInput('confirmPassword')}
                  onBlur={() => setFocusedInput(null)}
                  className={`bg-gray-100 px-4 py-4 pr-12 text-gray-900 ${
                    errors.confirmPassword
                      ? 'border-red-500'
                      : focusedInput === 'confirmPassword'
                        ? 'border-green-500'
                        : 'border-gray-300'
                  }`}
                  style={{
                    borderRadius: 20,
                    borderWidth: focusedInput === 'confirmPassword' ? 2 : 1,
                  }}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-4">
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color="#6b7280"
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && (
                <View className="mt-1 flex-row items-start">
                  <Ionicons name="alert-circle" size={16} color="#DC2626" style={{ marginTop: 1 }} />
                  <Text className="ml-1 flex-1 text-sm text-red-500 leading-5">{errors.confirmPassword}</Text>
                </View>
              )}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Background Decorative Elements - Identique au login */}
      <View className="absolute inset-0">
        <View className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-green-100 opacity-30" />
        <View className="absolute -right-8 -top-8 h-16 w-16 rounded-full bg-green-200 opacity-40" />
        <View className="absolute -top-4 right-4 h-12 w-12 bg-green-300 opacity-25" />
        <View className="absolute right-12 top-8 h-8 w-8 rotate-45 rounded bg-green-400 opacity-35" />
        <View className="absolute -right-4 top-12 h-20 w-6 rotate-12 rounded-lg bg-green-200 opacity-30" />
        <View className="absolute right-8 top-20 h-6 w-6 rounded-full bg-green-500 opacity-20" />
        <View className="absolute -left-8 top-1/3 h-24 w-16 rotate-12 rounded-lg bg-green-200 opacity-20" />
        <View className="absolute right-8 top-1/2 h-12 w-12 rounded-full bg-green-300 opacity-25" />
        <View className="absolute bottom-32 left-4 h-20 w-20 rotate-45 rounded-lg bg-green-100 opacity-30" />
        <View className="absolute -bottom-8 -right-4 h-40 w-24 rotate-45 rounded-2xl bg-green-200 opacity-20" />
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
            <TouchableOpacity 
              onPress={currentStep === 1 ? () => router.back() : handlePrevious} 
              className="mb-8 w-10">
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>



            {/* Header */}
            <View className="mb-8 items-center">
              <View className="mb-4 flex-row items-center">
                <Text className="ml-3 text-3xl font-bold text-gray-900">{getStepTitle()}</Text>
              </View>
              <Text className="text-center text-gray-600">{getStepSubtitle()}</Text>
            </View>

            {/* Form Content */}
            <Animated.View
              style={{
                opacity: stepTransitionAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0.7],
                }),
              }}>
              {renderStep()}
            </Animated.View>

            {/* Navigation Buttons */}
            <View className="mt-8">
              {currentStep < totalSteps ? (
                <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
                  <Button
                    onPress={handleNext}
                    className="py-5 shadow-lg bg-green-600"
                    style={{ borderRadius: 25 }}>
                    <Text className="text-center text-lg font-medium text-white">
                      Continuer
                    </Text>
                  </Button>
                </Animated.View>
              ) : (
                <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
                  <Button
                    onPress={handleSubmit}
                    loading={isSubmitting}
                    disabled={isSubmitting}
                    className={`py-5 shadow-lg ${isSubmitting ? 'bg-green-400' : 'bg-green-600'}`}
                    style={{ borderRadius: 25 }}>
                    <Text className="text-center text-lg font-medium text-white">
                      {isSubmitting ? 'Inscription...' : 'Créer un compte'}
                    </Text>
                  </Button>
                </Animated.View>
              )}

              {/* Login Link */}
              <View className="mt-8 items-center">
                <Text className="text-center text-gray-600">
                  Déjà un compte ?{' '}
                  <Link href="/(auth)/login" className="font-semibold text-green-600">
                    Se connecter
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