import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Keyboard,
} from 'react-native';
import { useRouter } from "expo-router"
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/data';
import {
  User,
  Phone,
  Upload,
  Plus,
  Trash2,
  Settings as SettingsIcon,
  Bell,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

// --- Type Definitions ---
// PhoneType constants that directly map to string values stored in DB and shown in UI
type PhoneType = 'Principal' | 'WhatsApp' | 'MVola' | 'Orange Money' | 'Airtel Money' | 'Autre';

interface UserTelephone {
  id_telephone?: number;
  id_utilisateur: string;
  numero: string;
  type: PhoneType;
  est_whatsapp: boolean;
  est_mobile_banking: boolean;
  created_at?: string;
  modified_at?: string;
}

const PHONE_TYPES = {
  PRINCIPAL: 'Principal' as PhoneType,
  WHATSAPP: 'WhatsApp' as PhoneType,
  MVOLA: 'MVola' as PhoneType,
  ORANGE_MONEY: 'Orange Money' as PhoneType,
  AIRTEL_MONEY: 'Airtel Money' as PhoneType,
  AUTRE: 'Autre' as PhoneType,
};

// Function to determine if a phone type should automatically enable mobile banking flag
const isMobileBankingPhone = (type: PhoneType): boolean => {
  return type === PHONE_TYPES.MVOLA || type === PHONE_TYPES.ORANGE_MONEY || type === PHONE_TYPES.AIRTEL_MONEY;
};

// Function to validate Malagasy phone numbers
const isValidMalagasyPhoneNumber = (phoneNumber: string): boolean => {
  const malagasyPhoneRegex = /^(?:\+261|0)(?:32|33|34|38|39)\d{7}$/;
  return malagasyPhoneRegex.test(phoneNumber.trim());
};

// Function to format phone number for display (remove spaces, keep original format)
const formatPhoneNumber = (phoneNumber: string): string => {
  return phoneNumber.trim().replace(/\s+/g, '');
};


// Simplified Toast/Alert function
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  Alert.alert(
    type === 'success' ? 'Succès' : 'Erreur',
    message,
    [{ text: 'OK' }]
  );
};

// Custom Tab Button Component
const TabButton = ({
  label,
  icon,
  isActive,
  onPress
}: {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={[styles.tabButton, isActive && styles.activeTabButton]}
    onPress={onPress}
  >
    <View style={styles.tabContent}>
      {icon}
      <Text style={[styles.tabText, isActive && styles.activeTabText]}>
        {label}
      </Text>
    </View>
  </TouchableOpacity>
);

// Custom Card Component
const Card = ({
  children,
  title,
  description,
  footer // Added footer prop for consistency with web CardFooter
}: {
  children: React.ReactNode;
  title?: string;
  description?: string;
  footer?: React.ReactNode;
}) => (
  <View style={styles.card}>
    {(title || description) && (
      <View style={styles.cardHeader}>
        {title && <Text style={styles.cardTitle}>{title}</Text>}
        {description && <Text style={styles.cardDescription}>{description}</Text>}
      </View>
    )}
    <View style={styles.cardContent}>
      {children}
    </View>
    {footer && <View style={styles.cardFooter}>{footer}</View>}
  </View>
);

// --- Main Settings Screen Component ---
const SettingsScreen = () => {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth(); // Assume refreshProfile exists in AuthContext
  const [activeTab, setActiveTab] = useState('profile');

  // Function to handle tab change and dismiss keyboard
  const handleTabChange = (tabName: string) => {
    Keyboard.dismiss(); // Dismiss keyboard when switching tabs
    setActiveTab(tabName);
  };

  // States
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [coverImageUri, setCoverImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [nom, setNom] = useState('');
  const [prenoms, setPrenoms] = useState('');
  const [telephones, setTelephones] = useState<UserTelephone[]>([]);
  const [newPhone, setNewPhone] = useState<UserTelephone>({
    numero: '',
    id_utilisateur: '', // Will be updated with user.id before insertion
    type: PHONE_TYPES.PRINCIPAL,
    est_whatsapp: false,
    est_mobile_banking: false,
  });

  // Function to determine automatically if it's Mobile Banking
  const updateMobileBankingFlag = (phoneType: PhoneType, currentPhone: UserTelephone) => {
    const shouldBeMobileBanking = isMobileBankingPhone(phoneType);
    return {
      ...currentPhone,
      type: phoneType,
      est_mobile_banking: shouldBeMobileBanking
    };
  };

  // Function to load phone numbers
  const fetchPhoneNumbers = useCallback(async () => {
    if (!user?.id) {
      console.log('No user ID to fetch phone numbers.');
      return;
    }

    try {
      const { data: allNumeros, error } = await supabase
        .from('telephone')
        .select('*')
        .eq('id_utilisateur', user.id);

      if (error) {
        console.error('Supabase error fetching phones:', error);
        throw error;
      }

      const phones: UserTelephone[] = (allNumeros || []).map((phone: any) => ({
        id_telephone: phone.id_telephone || phone.id, // Handle potential ID column name variations
        id_utilisateur: phone.id_utilisateur,
        numero: phone.numero,
        type: phone.type as PhoneType,
        est_whatsapp: Boolean(phone.est_whatsapp),
        est_mobile_banking: Boolean(phone.est_mobile_banking),
        created_at: phone.created_at,
        modified_at: phone.modified_at || phone.updated_at,
      }));

      setTelephones(phones);
    } catch (err) {
      console.error('Error fetching phone numbers:', err);
      showToast('Erreur lors du chargement des numéros', 'error');
    }
  }, [user?.id]);

  // Function to load profile directly from database (if not provided by context initially)
  const loadProfileFromDatabase = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('utilisateur')
        .select('*')
        .eq('id_utilisateur', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error('Error loading profile from DB:', error);
        throw error;
      }

      if (data) {
        setNom(data.nom || '');
        setPrenoms(data.prenoms || '');
        setProfileImageUri(data.photo_profil || null);
        setCoverImageUri(data.photo_couverture || null);
      }
    } catch (err) {
      console.error('Error fetching profile data:', err);
    }
  }, [user?.id]);

  // Effect for initial data load
  useEffect(() => {
    if (!user?.id) return;

    if (profile) {
      // Use profile from context if available
      setNom(profile.nom || '');
      setPrenoms(profile.prenoms || '');
      setProfileImageUri(profile.photo_profil || null);
      setCoverImageUri(profile.photo_couverture || null);
    } else {
      // Otherwise, fetch from database
      loadProfileFromDatabase();
    }
    fetchPhoneNumbers();
  }, [user?.id, profile, loadProfileFromDatabase, fetchPhoneNumbers]);

  // Function to pick images using Expo ImagePicker
  const pickImage = async (type: 'profile' | 'cover') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'profile' ? [1, 1] : [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        if (type === 'profile') {
          setProfileImageUri(uri);
        } else {
          setCoverImageUri(uri);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showToast('Erreur lors de la sélection d\'image', 'error');
    }
  };

  // Function to test Supabase connection
  const testSupabaseConnection = async () => {
    try {
      console.log('🔍 Testing Supabase connection...');
      // Use a simple select with limit to test connection
      const { error } = await supabase
        .from('utilisateur')
        .select('id_utilisateur')
        .limit(1);
      
      if (error) {
        console.error('❌ Supabase connection test failed:', error);
        return false;
      }
      
      console.log('✅ Supabase connection test successful');
      return true;
    } catch (err) {
      console.error('❌ Network error during Supabase test:', err);
      return false;
    }
  };

  // Function to update profile (text fields and images)
  const updateProfile = async () => {
    if (!user?.id) {
      console.error('No user ID available');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔄 Starting profile update for user:', user.id);
      console.log('📝 Profile data to update:', { nom: nom.trim(), prenoms: prenoms.trim() });

      // Test connection first
      const isConnected = await testSupabaseConnection();
      if (!isConnected) {
        throw new Error('Unable to connect to database. Please check your internet connection.');
      }

      // 1. First, check if user exists in the database
      const { error: checkError } = await supabase
        .from('utilisateur')
        .select('id_utilisateur')
        .eq('id_utilisateur', user.id)
        .single();

      if (checkError && checkError.code === 'PGRST116') {
        // User doesn't exist, create a new record
        console.log('👤 User not found in database, creating new record');
        const { error: insertError } = await supabase
          .from('utilisateur')
          .insert({
            id_utilisateur: user.id,
            nom: nom.trim(),
            prenoms: prenoms.trim(),
            photo_profil: profileImageUri,
            photo_couverture: coverImageUri,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('❌ Error creating user profile:', insertError);
          throw insertError;
        }
        console.log('✅ User profile created successfully');
      } else if (checkError) {
        console.error('❌ Error checking user existence:', checkError);
        throw checkError;
      } else {
        // User exists, update the record
        console.log('👤 User found, updating existing record');
        
        // Update basic text fields first
        const updateData: any = {
          nom: nom.trim(),
          prenoms: prenoms.trim(),
          updated_at: new Date().toISOString()
        };

        // Only include image URLs if they are valid
        if (profileImageUri && (profileImageUri.startsWith('http') || profileImageUri.startsWith('file://'))) {
          updateData.photo_profil = profileImageUri;
        }
        if (coverImageUri && (coverImageUri.startsWith('http') || coverImageUri.startsWith('file://'))) {
          updateData.photo_couverture = coverImageUri;
        }

        const { error: updateError } = await supabase
          .from('utilisateur')
          .update(updateData)
          .eq('id_utilisateur', user.id);

        if (updateError) {
          console.error('❌ Error updating user profile:', updateError);
          throw updateError;
        }
        console.log('✅ User profile updated successfully');
      }

      // Success case - stop loading first, then show success message
      setIsLoading(false);
      showToast('Votre profil a été mis à jour');

      // Refresh the profile data in the AuthContext if such a function exists
      if (refreshProfile) {
        console.log('🔄 Refreshing profile data...');
        await refreshProfile();
      }

    } catch (err: any) {
      console.error('❌ Error updating profile:', err);
      
      // Error case - stop loading first, then show error message
      setIsLoading(false);
      
      let errorMessage = 'Impossible de mettre à jour le profil';
      
      // Handle specific error types
      if (err.message?.includes('Network request failed') || err.message?.includes('Unable to connect to database')) {
        errorMessage = 'Erreur de connexion. Vérifiez votre connexion internet et réessayez.';
      } else if (err.code === '23505') {
        errorMessage = 'Un conflit de données est survenu.';
      } else if (err.message) {
        errorMessage = `Erreur: ${err.message}`;
      }
      
      showToast(errorMessage, 'error');
    }
  };

  // Function to add a new phone number
  const addPhoneNumber = async () => {
    if (!user?.id || !newPhone.numero.trim()) return;

    // Validate phone number format
    const formattedNumber = formatPhoneNumber(newPhone.numero);
    if (!isValidMalagasyPhoneNumber(formattedNumber)) {
      showToast(
        'Format de numéro invalide. Veuillez entrer un numéro malgache valide (ex: 032 12 345 67, +261 32 12 345 67)',
        'error'
      );
      return;
    }

    try {
      const phoneToAdd = {
        id_utilisateur: user.id,
        numero: formattedNumber, // Use formatted number
        type: newPhone.type,
        est_whatsapp: newPhone.est_whatsapp,
        // Ensure est_mobile_banking is correct (either manually set or derived)
        est_mobile_banking: newPhone.est_mobile_banking || isMobileBankingPhone(newPhone.type)
      };

      console.log('📱 Adding phone number:', phoneToAdd);

      const { data, error } = await supabase
        .from('telephone')
        .insert(phoneToAdd)
        .select()
        .single(); // Use .single() to get the inserted row directly

      if (error) {
        console.error('Supabase error adding phone:', error);
        
        // Handle specific RLS (Row Level Security) error
        if (error.code === '42501') {
          throw new Error('Vous n\'avez pas les permissions pour ajouter des numéros de téléphone. Veuillez contacter l\'administrateur.');
        }
        
        throw error;
      }

      if (data) {
        const addedPhone: UserTelephone = {
          id_telephone: data.id_telephone || data.id,
          id_utilisateur: data.id_utilisateur,
          numero: data.numero,
          type: data.type as PhoneType,
          est_whatsapp: Boolean(data.est_whatsapp),
          est_mobile_banking: Boolean(data.est_mobile_banking),
          created_at: data.created_at,
          modified_at: data.modified_at || data.updated_at,
        };

        setTelephones(prev => [addedPhone, ...prev]);

        // Reset the form
        setNewPhone({
          numero: '',
          id_utilisateur: '',
          type: PHONE_TYPES.PRINCIPAL,
          est_whatsapp: false,
          est_mobile_banking: false,
        });

        showToast(
          `Numéro ajouté avec succès${addedPhone.est_mobile_banking ? ' (Mobile Banking activé)' : ''}`
        );
      }
    } catch (err: any) {
      console.error('Error adding phone number:', err);
      let errorMessage = "Impossible d'ajouter le numéro de téléphone";
      
      if (err.code === '42501') {
        errorMessage = 'Permissions insuffisantes. Veuillez contacter l\'administrateur.';
      } else if (err.code === '23505') {
        errorMessage = 'Ce numéro existe déjà.';
      } else if (err.message) {
        errorMessage = `Erreur: ${err.message}`;
      }
      
      showToast(errorMessage, 'error');
    }
  };

  // Function to delete a phone number
  const deletePhoneNumber = async (id: number) => {
    Alert.alert(
      "Confirmation",
      "Êtes-vous sûr de vouloir supprimer ce numéro de téléphone ?",
      [
        {
          text: "Annuler",
          style: "cancel"
        },
        {
          text: "Supprimer",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('telephone')
                .delete()
                .eq('id_telephone', id);

              if (error) throw error;

              setTelephones(telephones.filter(phone => phone.id_telephone !== id));
              showToast("Numéro de téléphone supprimé");
            } catch (err) {
              console.error("Error deleting phone number:", err);
              showToast("Impossible de supprimer le numéro de téléphone", 'error');
            }
          }
        }
      ]
    );
  };

  if (!user) {
    router.replace('/(auth)/login');
  }

  const renderProfileContent = () => (
    <View
      style={styles.tabContentContainer}
    >
      {/* Section Photos de profil */}
      <Card
        title="Votre Photo"
        description="Mettez à jour votre photo de profil et votre photo de couverture."
      >
        <View style={styles.photoSection}>
          {/* Photo de couverture */}
          <View style={styles.coverPhotoContainer}>
            <Text style={styles.label}>Photo de couverture</Text>
            <View style={styles.coverImageWrapper}>
              {coverImageUri ? (
                <Image source={{ uri: coverImageUri }} style={styles.coverImage} />
              ) : (
                <View style={[styles.coverImage, styles.placeholderImage]}>
                  <Text style={styles.placeholderText}>Aucune image</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => pickImage('cover')}
              >
                <Upload size={18} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Photo de profil */}
          <View style={styles.profilePhotoContainer}>
            <Text style={styles.label}>Photo de profil</Text>
            <View style={styles.profilePhotoWrapper}>
              <View style={styles.profileImageContainer}>
                {profileImageUri ? (
                  <Image source={{ uri: profileImageUri }} style={styles.profileImage} />
                ) : (
                  <View style={[styles.profileImage, styles.placeholderImage]}>
                    <User size={24} color="#666" />
                  </View>
                )}
                <TouchableOpacity
                  style={styles.profileUploadButton}
                  onPress={() => pickImage('profile')}
                >
                  <Upload size={14} color="white" />
                </TouchableOpacity>
              </View>
              <View style={styles.imageInfo}>
                <Text style={styles.imageInfoText}>Formats acceptés: JPG, PNG, GIF</Text>
                <Text style={styles.imageInfoText}>Taille maximale: 2Mo</Text>
              </View>
            </View>
          </View>
        </View>
      </Card>

      {/* Section Informations personnelles */}
      <Card
        title="Informations personnelles"
        description="Mettez à jour vos informations personnelles."
        footer={ // Use footer prop for the button
          <TouchableOpacity
            style={[styles.primaryButton, isLoading && styles.disabledButton]}
            onPress={updateProfile}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.primaryButtonText}>Enregistrer les modifications</Text>
            )}
          </TouchableOpacity>
        }
      >
        <View style={styles.formSection}>
          <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nom</Text>            
              <TextInput
                style={styles.input}
                value={nom}
                onChangeText={setNom}
                placeholder="Votre nom"
                defaultValue={profile?.nom || ''}
                returnKeyType="next"
                blurOnSubmit={false}
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Prénoms</Text>
              <TextInput
                style={styles.input}
                value={prenoms}
                onChangeText={setPrenoms}
                placeholder="Vos prénoms"
                defaultValue={profile?.prenoms || ''}
                returnKeyType="done"
              />
            </View>
          </View>
        </View>
      </Card>

      {/* Section Numéros de téléphone */}
      <Card
        title="Numéros de téléphone"
        description="Gérez vos numéros de téléphone pour les communications et les transactions."
      >
        <View style={styles.phoneSection}>
          {/* Liste des téléphones existants */}
          {telephones.length === 0 ? (
            <View style={[styles.phoneItem, { justifyContent: 'center' }]}>
              <Text style={styles.placeholderText}>Aucun numéro de téléphone enregistré</Text>
            </View>
          ) : (
            telephones.map((phone) => (
              <View key={phone.id_telephone} style={styles.phoneItem}>
                <View style={styles.phoneInfo}>
                  <View style={styles.phoneIcon}>
                    <Phone size={18} color="#22c55e" />
                  </View>
                  <View style={styles.phoneDetails}>
                    <Text style={styles.phoneNumber}>{phone.numero}</Text>
                    <View style={styles.phoneTags}>
                      <View style={styles.phoneTag}>
                        <Text style={styles.phoneTagText}>{phone.type}</Text>
                      </View>
                      {phone.est_whatsapp && (
                        <View style={[styles.phoneTag, styles.whatsappTag]}>
                          <Text style={styles.whatsappTagText}>WhatsApp</Text>
                        </View>
                      )}
                      {phone.est_mobile_banking && (
                        <View style={[styles.phoneTag, styles.bankingTag]}>
                          <Text style={styles.bankingTagText}>Mobile Banking</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deletePhoneNumber(phone.id_telephone!)}
                >
                  <Trash2 size={18} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))
          )}

          {/* Formulaire d'ajout */}
          <View style={styles.addPhoneContainer}>
            <Text style={styles.addPhoneTitle}>Ajouter un numéro</Text>

            <View style={styles.inputRow}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Numéro</Text>
                <TextInput
                  style={styles.input}
                  placeholder="032 12 345 67 ou +261 32 12 345 67"
                  value={newPhone.numero}
                  onChangeText={text => setNewPhone({ ...newPhone, numero: text })}
                  keyboardType="phone-pad"
                  returnKeyType="done"
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Type</Text>
                {/* Replaced with simple TouchableOpacity buttons to simulate Picker for clarity */}
                <View style={styles.pickerOptionsContainer}>
                  {Object.values(PHONE_TYPES).map((typeValue) => (
                    <TouchableOpacity
                      key={typeValue}
                      style={[
                        styles.pickerOption,
                        newPhone.type === typeValue && styles.pickerOptionSelected
                      ]}
                      onPress={() => {
                        setNewPhone(updateMobileBankingFlag(typeValue, newPhone));
                      }}
                    >
                      <Text style={[
                        styles.pickerOptionText,
                        newPhone.type === typeValue && styles.pickerOptionTextSelected
                      ]}>
                        {typeValue}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Checkboxes */}
            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setNewPhone({ ...newPhone, est_whatsapp: !newPhone.est_whatsapp })}
              >
                <View style={[
                  styles.checkbox,
                  newPhone.est_whatsapp && styles.checkboxSelected
                ]}>
                  {newPhone.est_whatsapp && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxText}>WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setNewPhone({ ...newPhone, est_mobile_banking: !newPhone.est_mobile_banking })}
                disabled={isMobileBankingPhone(newPhone.type)} // Disable if type automatically sets it
              >
                <View style={[
                  styles.checkbox,
                  (newPhone.est_mobile_banking || isMobileBankingPhone(newPhone.type)) && styles.checkboxSelected,
                  isMobileBankingPhone(newPhone.type) && styles.checkboxDisabled
                ]}>
                  {(newPhone.est_mobile_banking || isMobileBankingPhone(newPhone.type)) &&
                    <Text style={styles.checkmark}>✓</Text>
                  }
                </View>
                <Text style={[
                  styles.checkboxText,
                  isMobileBankingPhone(newPhone.type) && styles.checkboxTextDisabled
                ]}>
                  Mobile Banking {isMobileBankingPhone(newPhone.type) && "(Automatique)"}
                </Text>
              </TouchableOpacity>
            </View>

            {isMobileBankingPhone(newPhone.type) && (
              <View style={styles.infoBox}>
                <Text style={styles.infoBoxText}>
                  Ce type de numéro sera automatiquement marqué comme Mobile Banking
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.primaryButton,
                !newPhone.numero.trim() && styles.disabledButton
              ]}
              onPress={addPhoneNumber}
              disabled={!newPhone.numero.trim()}
            >
              <Plus size={16} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.primaryButtonText}>Ajouter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Card>
    </View>
  );

  const renderAccountContent = () => (
    <View style={styles.tabContentContainer}>
      <Card
        title="Paramètres du compte"
        description="Gérez les paramètres de votre compte et de confidentialité."
      >
        <Text style={styles.comingSoonText}>Cette section sera disponible prochainement.</Text>
      </Card>
    </View>
  );

  const renderNotificationsContent = () => (
    <View style={styles.tabContentContainer}>
      <Card
        title="Préférences de notification"
        description="Personnalisez vos préférences de notification."
      >
        <Text style={styles.comingSoonText}>Cette section sera disponible prochainement.</Text>
      </Card>
    </View>
  );

  return (
    <ScrollView 
      style={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Paramètres du compte</Text>
      </View>

      {/* Tabs */}
      <ScrollView 
        style={styles.tabContainer} 
        horizontal 
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={styles.tabScrollContentContainer}
      >
        <TabButton
          label="Profil"
          icon={<User size={18} color={activeTab === 'profile' ? 'white' : '#666'} />}
          isActive={activeTab === 'profile'}
          onPress={() => handleTabChange('profile')}
        />
        <TabButton
          label="Compte"
          icon={<SettingsIcon size={18} color={activeTab === 'account' ? 'white' : '#666'} />}
          isActive={activeTab === 'account'}
          onPress={() => handleTabChange('account')}
        />
        <TabButton
          label="Notifications"
          icon={<Bell size={18} color={activeTab === 'notifications' ? 'white' : '#666'} />}
          isActive={activeTab === 'notifications'}
          onPress={() => handleTabChange('notifications')}
        />
      </ScrollView>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'profile' && renderProfileContent()}
        {activeTab === 'account' && renderAccountContent()}
        {activeTab === 'notifications' && renderNotificationsContent()}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  tabContainer: {
    backgroundColor: 'white',
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
  },
  tabScrollContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  tabButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  activeTabButton: {
    backgroundColor: '#22c55e',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: 'white',
  },
  content: {
    paddingBottom: 20,
  },
  tabContentContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  cardContent: {
    padding: 20,
  },
  cardFooter: { // Added style for card footer
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    alignItems: 'flex-end',
  },
  photoSection: {
    gap: 24,
  },
  coverPhotoContainer: {
    gap: 8,
  },
  coverImageWrapper: {
    position: 'relative',
    height: 160,
    borderRadius: 8,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#666',
    fontSize: 14,
  },
  uploadButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 40,
    height: 40,
    backgroundColor: '#22c55e',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  profilePhotoContainer: {
    gap: 8,
  },
  profilePhotoWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  profileUploadButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    backgroundColor: '#22c55e',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  imageInfo: {
    flex: 1,    
    justifyContent: 'center',
    marginVertical: "auto",
  },
  imageInfoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  formSection: {
    gap: 16,
  },
  inputRow: {
    flexDirection: width > 600 ? 'row' : 'column',
    gap: 16,
  },
  inputContainer: {
    flex: 1,
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  primaryButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  phoneSection: {
    gap: 16,
  },
  phoneItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#fafafa',
  },
  phoneInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  phoneIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneDetails: {
    flex: 1,
  },
  phoneNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  phoneTags: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  phoneTag: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  phoneTagText: {
    fontSize: 12,
    color: '#666',
  },
  whatsappTag: {
    backgroundColor: '#dcfce7',
  },
  whatsappTagText: {
    color: '#15803d',
  },
  bankingTag: {
    backgroundColor: '#dcfce7',
  },
  bankingTagText: {
    color: '#15803d',
  },
  deleteButton: {
    padding: 8,
  },
  addPhoneContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 16,
    gap: 16,
  },
  addPhoneTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  pickerOptionsContainer: { // New style for the simulated picker options
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    backgroundColor: 'white',
  },
  pickerOptionSelected: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  pickerOptionTextSelected: {
    color: 'white',
  },
  checkboxContainer: {
    gap: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#22c55e',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  checkboxSelected: {
    backgroundColor: '#22c55e',
  },
  checkboxDisabled: {
    backgroundColor: '#f0f0f0',
    borderColor: '#ccc',
  },
  checkmark: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  checkboxTextDisabled: {
    color: '#666',
  },
  infoBox: {
    backgroundColor: '#dcfce7',
    padding: 12,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
  },
  infoBoxText: {
    fontSize: 12,
    color: '#15803d',
  },
  comingSoonText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default SettingsScreen