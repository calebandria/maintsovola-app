// contexts/AuthContext.tsx
'use client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, Session, SupabaseClient, User } from '@supabase/supabase-js';
import { router } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';

// Types et interfaces
interface Telephone {
  id_telephone?: number;
  id_utilisateur: string;
  numero: string;
  type: 'principal' | 'whatsapp' | 'mobile_banking' | 'autre';
  est_whatsapp?: boolean;
  est_mobile_banking?: boolean;
  created_at?: string;
  modified_at?: string;
}

interface UserProfile {
  id_utilisateur: string;
  id: string;
  nom: string;
  prenoms?: string;
  email?: string;
  photo_profil?: string;
  photo_couverture?: string;
  telephone?: string;
  adresse?: string;
  bio?: string;
  id_role: number;
  nom_role?: string;
  telephones?: Telephone[];
  created_at?: string;
  modified_at?: string;
}

interface SignUpUserData {
  nom: string;
  prenoms?: string;
  email?: string;
  telephone?: string;
  role?: string;
  is_investor?: boolean;
  is_farming_owner?: boolean;
}

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  error: Error | null;
}

interface AuthContextType extends AuthState {
  // Méthodes d'authentification
  signIn: (identifier: string, password: string) => Promise<void>;
  signUp: (identifier: string, password: string, userData: SignUpUserData) => Promise<User | null>;
  signOut: () => Promise<void>;

  // Méthodes OTP
  verifyOTP: (
    email: string,
    token: string,
    type: 'signup' | 'recovery'
  ) => Promise<{ user: User | null; session: Session | null }>;
  resendOTP: (email: string, type: 'signup' | 'recovery') => Promise<void>;

  // Réinitialisation mot de passe
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;

  // Gestion du profil
  refreshProfile: () => Promise<void>;
  updateProfile: (profileData: Partial<UserProfile>) => Promise<void>;

  // Méthodes utilitaires
  clearError: () => void;
  isValidEmail: (email: string) => boolean;
  isValidPhone: (phone: string) => boolean;
}

// Valeurs par défaut du contexte
const defaultAuthState: AuthState = {
  user: null,
  profile: null,
  loading: true,
  initialized: false,
  error: null,
};

const AuthContext = createContext<AuthContextType>({
  ...defaultAuthState,
  signIn: async () => {},
  signUp: async () => null,
  signOut: async () => {},
  verifyOTP: async () => ({ user: null, session: null }),
  resendOTP: async () => {},
  resetPassword: async () => {},
  updatePassword: async () => {},
  refreshProfile: async () => {},
  updateProfile: async () => {},
  clearError: () => {},
  isValidEmail: () => false,
  isValidPhone: () => false,
});

// Configuration des constantes
const STORAGE_KEYS = {
  USER_SESSION: '@auth:user_session',
  USER_PROFILE: '@auth:user_profile',
} as const;

const ROLE_MAPPING = {
  simple: 1,
  admin: 2,
  superviseur: 3,
  technicien: 4,
} as const;

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // État principal
  const [state, setState] = useState<AuthState>(defaultAuthState);
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

  // Méthodes utilitaires
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const isValidPhone = (phone: string): boolean => {
    const phoneRegex = /^(032|033|034|038)\d{7}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const clearError = () => {
    setState((prev) => ({ ...prev, error: null }));
  };

  const setError = (error: Error | string) => {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    setState((prev) => ({ ...prev, error: errorObj, loading: false }));
    console.error('Auth Error:', errorObj);
  };

  const setLoading = (loading: boolean) => {
    setState((prev) => ({ ...prev, loading }));
  };

  // Fonction pour obtenir l'email à partir du téléphone
  const getEmailFromPhone = async (phone: string): Promise<string | null> => {
    if (!supabase) return null;

    try {
      // Nettoyer le numéro de téléphone
      const cleanPhone = phone.replace(/\s/g, '');
      
      // Rechercher l'utilisateur par numéro de téléphone
      const { data: phoneData, error: phoneError } = await supabase
        .from('telephone')
        .select('id_utilisateur')
        .eq('numero', cleanPhone)
        .single();

      if (phoneError || !phoneData) {
        console.log('Aucun téléphone trouvé pour:', cleanPhone);
        return null;
      }

      // Récupérer l'email de l'utilisateur
      const { data: userData, error: userError } = await supabase
        .from('utilisateur')
        .select('email')
        .eq('id_utilisateur', phoneData.id_utilisateur)
        .single();

      if (userError || !userData?.email) {
        console.log('Aucun email trouvé pour utilisateur:', phoneData.id_utilisateur);
        return null;
      }

      return userData.email;
    } catch (error) {
      console.error("Erreur lors de la récupération de l'email par téléphone:", error);
      return null;
    }
  };

  // Initialisation de Supabase
  useEffect(() => {
    const initSupabase = async () => {
      try {
        const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
        const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
          throw new Error("Variables d'environnement Supabase manquantes");
        }

        const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          auth: {
            storage: AsyncStorage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
          },
        });

        setSupabase(client);
        console.log('✅ Supabase client initialisé');
      } catch (error) {
        console.error("❌ Échec de l'initialisation Supabase:", error);
        setError(error as Error);
      }
    };

    initSupabase();
  }, []);

  // Gestion des changements d'état d'authentification
  useEffect(() => {
    if (!supabase) return;

    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('🔄 Auth state changed:', event, newSession?.user?.id);

      if (!mounted) return;

      try {
        if (newSession?.user) {
          setState((prev) => ({
            ...prev,
            user: newSession.user,
            loading: true,
          }));

          await fetchUserProfile(newSession.user.id);
        } else {
          setState((prev) => ({
            ...prev,
            user: null,
            profile: null,
            loading: false,
          }));

          // Nettoyer le stockage local
          await AsyncStorage.multiRemove([STORAGE_KEYS.USER_SESSION, STORAGE_KEYS.USER_PROFILE]);
        }
      } catch (error) {
        console.error("Erreur lors du changement d'état auth:", error);
        setError(error as Error);
      }
    });

    // Récupérer la session initiale
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) throw error;

        if (session?.user) {
          console.log('📱 Session initiale trouvée:', session.user.id);
          setState((prev) => ({
            ...prev,
            user: session.user,
            loading: true,
          }));

          await fetchUserProfile(session.user.id);
        } else {
          console.log('📱 Aucune session trouvée');
          setState((prev) => ({
            ...prev,
            loading: false,
            initialized: true,
          }));
        }
      } catch (error) {
        console.error("Erreur lors de l'initialisation auth:", error);
        setError(error as Error);
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Récupération du profil utilisateur
  const fetchUserProfile = async (userId: string): Promise<void> => {
    if (!supabase) {
      throw new Error('Client Supabase non initialisé');
    }

    try {
      console.log('👤 Récupération du profil pour:', userId);

      // Récupérer les données utilisateur avec le rôle
      const { data: userData, error: userError } = await supabase
        .from('utilisateur')
        .select(
          `
          *,
          role:id_role(nom_role)
        `
        )
        .eq('id_utilisateur', userId)
        .single();

      if (userError) {
        console.error('Erreur lors de la récupération des données utilisateur:', userError);
        throw userError;
      }

      if (!userData) {
        throw new Error('Données utilisateur introuvables');
      }

      // Récupérer les numéros de téléphone avec les bonnes colonnes
      const { data: telephonesData, error: telephonesError } = await supabase
        .from('telephone')
        .select('id_telephone, id_utilisateur, numero, type, est_whatsapp, est_mobile_banking, created_at, modified_at')
        .eq('id_utilisateur', userId);

      if (telephonesError) {
        console.warn('Erreur lors de la récupération des téléphones:', telephonesError);
      }

      const telephones: Telephone[] = telephonesData
        ? telephonesData.map((tel: any) => ({
            id_telephone: tel.id_telephone,
            id_utilisateur: tel.id_utilisateur,
            numero: tel.numero,
            type: tel.type as Telephone['type'],
            est_whatsapp: tel.est_whatsapp,
            est_mobile_banking: tel.est_mobile_banking,
            created_at: tel.created_at,
            modified_at: tel.modified_at,
          }))
        : [];

      // Construire le profil utilisateur
      const userProfile: UserProfile = {
        id_utilisateur: userData.id_utilisateur,
        id: userData.id_utilisateur,
        nom: userData.nom,
        prenoms: userData.prenoms,
        email: userData.email,
        photo_profil: userData.photo_profil,
        photo_couverture: userData.photo_couverture,
        telephone: telephones.find((t) => t.type === 'principal')?.numero,
        adresse: userData.adresse,
        bio: userData.bio,
        id_role: userData.id_role,
        nom_role: userData.role?.nom_role,
        telephones,
        created_at: userData.created_at,
        modified_at: userData.modified_at,
      };

      // Sauvegarder en cache
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(userProfile));

      setState((prev) => ({
        ...prev,
        profile: userProfile,
        loading: false,
        initialized: true,
      }));

      console.log('✅ Profil utilisateur récupéré avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du profil:', error);
      setError(error as Error);
    }
  };

  // Inscription
  const signUp = async (
    identifier: string,
    password: string,
    userData: SignUpUserData
  ): Promise<User | null> => {
    if (!supabase) {
      throw new Error('Client Supabase non initialisé');
    }

    try {
      setLoading(true);
      clearError();

      const isEmail = isValidEmail(identifier);

      if (!isEmail && !isValidPhone(identifier)) {
        throw new Error("Format d'identifiant invalide (email ou téléphone requis)");
      }

      // Déterminer l'ID du rôle
      const roleId =
        ROLE_MAPPING[userData.role as keyof typeof ROLE_MAPPING] || ROLE_MAPPING.simple;

      // Données d'authentification - store preferences in metadata
      const authOptions = {
        data: {
          nom: userData.nom,
          prenoms: userData.prenoms,
          role: userData.role || 'simple',
          preferences: {
            is_investor: userData.is_investor || false,
            is_farming_owner: userData.is_farming_owner || false,
          },
        },
      };

      // Inscription avec Supabase Auth
      let authResult;
      if (isEmail) {
        authResult = await supabase.auth.signUp({
          email: identifier,
          password,
          options: authOptions,
        });
      } else {
        // For phone registration, we need an email for Supabase Auth
        if (!userData.email) {
          throw new Error("Un email est requis pour l'inscription par téléphone");
        }
        authResult = await supabase.auth.signUp({
          email: userData.email,
          password,
          options: authOptions,
        });
      }

      const { data, error } = authResult;

      if (error) throw error;
      if (!data.user) throw new Error("Échec de la création de l'utilisateur");

      // Insérer dans la table utilisateur
      const { error: dbError } = await supabase.from('utilisateur').insert([
        {
          id_utilisateur: data.user.id,
          email: isEmail ? identifier : userData.email,
          nom: userData.nom,
          prenoms: userData.prenoms || null,
          id_role: roleId,
        },
      ]);

      if (dbError) {
        console.error('Erreur insertion utilisateur:', dbError);
        throw new Error('Erreur lors de la sauvegarde des données utilisateur');
      }

      // Sauvegarder le téléphone si fourni
      const phoneToSave = isEmail ? userData.telephone : identifier;
      if (phoneToSave && isValidPhone(phoneToSave)) {
        const cleanPhone = phoneToSave.replace(/\s/g, '');
        
        const { error: phoneError } = await supabase.from('telephone').insert([
          {
            id_utilisateur: data.user.id,
            numero: cleanPhone,
            type: 'principal',
            est_whatsapp: false,
            est_mobile_banking: false,
          },
        ]);

        if (phoneError) {
          console.warn('Erreur lors de la sauvegarde du téléphone:', phoneError);
          
          // Check if it's an RLS policy error
          if (phoneError.code === '42501') {
            console.error('❌ Erreur RLS: Vérifiez les politiques de sécurité sur la table telephone');
            // You might want to show a user-friendly message here
            Alert.alert(
              'Information',
              'Votre compte a été créé avec succès, mais le numéro de téléphone n\'a pas pu être sauvegardé. Vous pourrez l\'ajouter plus tard dans votre profil.'
            );
          }
          // Ne pas faire échouer l'inscription pour une erreur de téléphone
        } else {
          console.log('✅ Téléphone sauvegardé:', cleanPhone);
        }
      }

      console.log('✅ Inscription réussie pour:', data.user.id);
      return data.user;
    } catch (error) {
      console.error("❌ Erreur lors de l'inscription:", error);
      setError(error as Error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Connexion - Modifiée pour supporter email et téléphone
  const signIn = async (identifier: string, password: string): Promise<void> => {
    if (!supabase) {
      throw new Error('Client Supabase non initialisé');
    }

    try {
      setLoading(true);
      clearError();

      const isEmail = isValidEmail(identifier);
      const isPhone = isValidPhone(identifier);

      if (!isEmail && !isPhone) {
        throw new Error('Veuillez utiliser une adresse email ou un numéro de téléphone valide');
      }

      let emailToUse = identifier;

      // Si c'est un numéro de téléphone, récupérer l'email associé
      if (isPhone) {
        const associatedEmail = await getEmailFromPhone(identifier);
        if (!associatedEmail) {
          throw new Error('Aucun compte trouvé avec ce numéro de téléphone');
        }
        emailToUse = associatedEmail;
      }

      // Connexion avec l'email (soit fourni directement, soit récupéré du téléphone)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password,
      });

      if (error) {
        if (error.message?.includes('Email not confirmed')) {
          throw new Error('Veuillez vérifier votre email avant de vous connecter');
        }
        if (error.message?.includes('Invalid login credentials')) {
          if (isPhone) {
            throw new Error('Numéro de téléphone ou mot de passe incorrect');
          } else {
            throw new Error('Email ou mot de passe incorrect');
          }
        }
        throw error;
      }

      if (!data.user) {
        throw new Error('Échec de la connexion');
      }

      console.log('✅ Connexion réussie pour:', data.user.id);

      // La redirection sera gérée par onAuthStateChange
      Alert.alert('Succès', 'Connexion réussie !');
    } catch (error) {
      console.error('❌ Erreur lors de la connexion:', error);
      setError(error as Error);
      throw error;
    }
  };

  // Déconnexion
  const signOut = async (): Promise<void> => {
    if (!supabase) {
      throw new Error('Client Supabase non initialisé');
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Nettoyer le stockage local
      await AsyncStorage.multiRemove([STORAGE_KEYS.USER_SESSION, STORAGE_KEYS.USER_PROFILE]);

      console.log('✅ Déconnexion réussie');
      Alert.alert('Succès', 'Déconnexion réussie');
    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error);
      setError(error as Error);
      Alert.alert('Erreur', 'Erreur lors de la déconnexion');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Vérification OTP
  const verifyOTP = async (
    email: string,
    token: string,
    type: 'signup' | 'recovery'
  ): Promise<{ user: User | null; session: Session | null }> => {
    if (!supabase) {
      throw new Error('Client Supabase non initialisé');
    }

    try {
      setLoading(true);
      clearError();

      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: type === 'signup' ? 'signup' : 'recovery',
      });

      if (error) {
        if (error.message?.includes('Token has expired')) {
          throw new Error('Le code a expiré. Veuillez en demander un nouveau.');
        }
        if (error.message?.includes('Invalid token')) {
          throw new Error('Code de vérification invalide');
        }
        throw error;
      }

      console.log('✅ Vérification OTP réussie');
      return data;
    } catch (error) {
      console.error('❌ Erreur lors de la vérification OTP:', error);
      setError(error as Error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Renvoyer OTP
  const resendOTP = async (email: string, type: 'signup' | 'recovery'): Promise<void> => {
    if (!supabase) {
      throw new Error('Client Supabase non initialisé');
    }

    try {
      setLoading(true);
      clearError();

      if (type === 'signup') {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: undefined,
        });
        if (error) throw error;
      }

      console.log('✅ Code OTP renvoyé avec succès');
    } catch (error) {
      console.error('❌ Erreur lors du renvoi OTP:', error);
      setError(error as Error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Réinitialisation du mot de passe
  const resetPassword = async (email: string): Promise<void> => {
    if (!supabase) {
      throw new Error('Client Supabase non initialisé');
    }

    try {
      setLoading(true);
      clearError();

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: undefined,
      });

      if (error) throw error;

      console.log('✅ Email de réinitialisation envoyé');
    } catch (error) {
      console.error('❌ Erreur lors de la réinitialisation:', error);
      setError(error as Error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Mise à jour du mot de passe
  const updatePassword = async (password: string): Promise<void> => {
    if (!supabase) {
      throw new Error('Client Supabase non initialisé');
    }

    try {
      setLoading(true);
      clearError();

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      console.log('✅ Mot de passe mis à jour avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du mot de passe:', error);
      setError(error as Error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Actualiser le profil
  const refreshProfile = async (): Promise<void> => {
    if (!state.user || !supabase) return;

    try {
      await fetchUserProfile(state.user.id);
    } catch (error) {
      console.error("Erreur lors de l'actualisation du profil:", error);
      setError(error as Error);
    }
  };

  // Mettre à jour le profil
  const updateProfile = async (profileData: Partial<UserProfile>): Promise<void> => {
    if (!state.user || !supabase) {
      throw new Error('Utilisateur non connecté');
    }

    try {
      setLoading(true);
      clearError();

      const updateData: any = {};
      if (profileData.nom) updateData.nom = profileData.nom;
      if (profileData.prenoms !== undefined) updateData.prenoms = profileData.prenoms;
      if (profileData.email) updateData.email = profileData.email;
      if (profileData.photo_profil !== undefined)
        updateData.photo_profil = profileData.photo_profil;
      if (profileData.photo_couverture !== undefined)
        updateData.photo_couverture = profileData.photo_couverture;
      if (profileData.adresse !== undefined) updateData.adresse = profileData.adresse;
      if (profileData.bio !== undefined) updateData.bio = profileData.bio;

      const { error } = await supabase
        .from('utilisateur')
        .update(updateData)
        .eq('id_utilisateur', state.user.id);

      if (error) throw error;

      // Actualiser le profil après la mise à jour
      await fetchUserProfile(state.user.id);

      console.log('✅ Profil mis à jour avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du profil:', error);
      setError(error as Error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Valeurs du contexte
  const contextValue: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    verifyOTP,
    resendOTP,
    resetPassword,
    updatePassword,
    refreshProfile,
    updateProfile,
    clearError,
    isValidEmail,
    isValidPhone,
  };

  // Ne pas rendre les enfants jusqu'à ce que Supabase soit initialisé
  if (!supabase) {
    return null;
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

// Hook personnalisé pour utiliser le contexte
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

// Hook pour vérifier si l'utilisateur est connecté
export const useRequireAuth = (): AuthContextType => {
  const auth = useAuth();

  useEffect(() => {
    if (auth.initialized && !auth.loading && !auth.user) {
      router.replace('/(auth)/login');
    }
  }, [auth.initialized, auth.loading, auth.user]);

  return auth;
};

// Types exportés pour utilisation externe
export type { AuthContextType, SignUpUserData, Telephone, UserProfile };
