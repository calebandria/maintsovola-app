// ProjectModal.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  BackHandler,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/utils/supabase';
import { v4 as uuidv4 } from 'uuid';
import { X } from 'lucide-react-native';
import { CultureData } from '@/types/cultureData';
import { ProjectData } from '@/type/projectInterface';
import { TerrainData } from '@/types/terrainData';
// Composant Checkbox simple pour éviter les dépendances
const Checkbox = ({ checked, onPress, label, containerStyle = "" }: {
  checked: boolean;
  onPress: () => void;
  label: string;
  containerStyle?: string;
}) => (
  <TouchableOpacity 
    onPress={onPress} 
    className={`flex-row items-center ${containerStyle}`}
  >
    <View className={`w-5 h-5 border-2 border-gray-400 rounded mr-3 ${checked ? 'bg-green-500 border-green-500' : 'bg-white'}`}>
      {checked && <Text className="text-white text-center text-xs">✓</Text>}
    </View>
    <Text className="text-gray-700 flex-1">{label}</Text>
  </TouchableOpacity>
);

type CreateModalProps = {
  project?: ProjectData | null;
  onClose: () => void;
  isVisible: boolean;
  userProfile?: { userProfile: string; userName: string };
  isEdit?: boolean;
  onSubmitSuccess?: () => void;
};

// Composant CreateModal pour compatibilité avec votre code existant
export const CreateModal = ({ 
  project, 
  onClose, 
  userProfile 
}: {
  project?: ProjectData | null;
  onClose: () => void;
  userProfile?: { userProfile: string; userName: string };
}) => {
  const isEdit = !!project;
  
  return (
    <CreateProjectModal
      project={project}
      onClose={onClose}
      isVisible={true} // Toujours visible car géré par le parent
      userProfile={userProfile}
      isEdit={isEdit}
      onSubmitSuccess={onClose}
    />
  );
};

type FormData = {
  titre: string;
  description: string;
  photos: string;
  statut?: string;
  surface_ha: number;
  id_terrain: number;
  id_region?: number;
  id_district?: number;
  id_commune?: number;
  cultures: number[];
  id_tantsaha?: string;
  id_technicien?: string;
  id_superviseur?: string;
};

const CreateProjectModal = ({ 
  project, 
  onClose, 
  isVisible, 
  userProfile, 
  isEdit = false,
  onSubmitSuccess 
}: CreateModalProps) => {
  // États du formulaire
  const [formData, setFormData] = useState<FormData>({
    titre: '',
    description: '',
    photos: '',
    surface_ha: 0,
    id_terrain: 0,
    cultures: [],
  });

  // États pour les données de référence
  const [terrains, setTerrains] = useState<TerrainData[]>([]);
  const [cultures, setCultures] = useState<CultureData[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [communes, setCommunes] = useState<any[]>([]);
  const [tantsahas, setTantsahas] = useState<any[]>([]);
  const [techniciens, setTechniciens] = useState<any[]>([]);
  const [superviseurs, setSuperviseurs] = useState<any[]>([]);

  // États UI
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [image, setImage] = useState<string | null>(null);

  // Gestion du bouton retour Android
  useEffect(() => {
    if (!isVisible) return;
    
    const backAction = () => {
      onClose();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [isVisible, onClose]);

  // Initialisation des données
  useEffect(() => {
    if (isVisible) {
      initializeData();
    }
  }, [isVisible, project?.id_projet]);

  // Initialiser le formulaire avec les données du projet en mode édition
  useEffect(() => {
    if (project && isEdit) {
      setFormData({
        titre: project.titre || '',
        description: project.description || '',
        photos: project.photos || '',
        statut: project.statut,
        surface_ha: project.surface_ha || 0,
        id_terrain: project.id_terrain || 0,
        id_region: project.id_region,
        id_district: project.id_district,
        id_commune: project.id_commune,
        cultures: project.projet_culture?.map(pc => pc.id_culture) || [],
        id_tantsaha: project.id_tantsaha,
        id_technicien: project.id_technicien,
        id_superviseur: project.id_superviseur,
      });
      
      if (project.photos) {
        setImage(project.photos);
      }
    } else {
      // Reset form for new project
      setFormData({
        titre: '',
        description: '',
        photos: '',
        surface_ha: 0,
        id_terrain: 0,
        cultures: [],
      });
      setImage(null);
    }
  }, [project, isEdit]);

  const initializeData = async () => {
    setLoading(true);
    try {
      // Charger toutes les données de référence en parallèle
      const [
        culturesRes,
        regionsRes,
        tantsahasRes,
        techniciensRes,
        superviseursRes,
      ] = await Promise.all([
        supabase.from('culture').select('*'),
        supabase.from('region').select('*'),
        supabase.from('profile').select('*').eq('nom_role', 'tantsaha'),
        supabase.from('profile').select('*').eq('nom_role', 'technicien'),
        supabase.from('profile').select('*').eq('nom_role', 'superviseur'),
      ]);

      setCultures(culturesRes.data || []);
      setRegions(regionsRes.data || []);
      setTantsahas(tantsahasRes.data || []);
      setTechniciens(techniciensRes.data || []);
      setSuperviseurs(superviseursRes.data || []);

      // Gérer les terrains selon le mode (création/modification)
      await loadTerrains();
      
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      Alert.alert('Erreur', 'Impossible de charger les données nécessaires');
    } finally {
      setLoading(false);
    }
  };

  // Gérer les terrains selon le mode (création/modification)
  const loadTerrains = async () => {
    try {
      // Récupérer les terrains déjà assignés
      const { data: assignedTerrains } = await supabase
        .from('projet')
        .select('id_terrain')
        .neq('id_terrain', null);

      const assignedIds = (assignedTerrains || [])
        .map(p => p.id_terrain)
        .filter(id => typeof id === 'number');

      let query = supabase.from('terrain').select('*');

      if (isEdit && project?.id_terrain) {
        // Mode modification : inclure le terrain actuel + les non-assignés
        if (assignedIds.length > 0) {
          // Retirer le terrain actuel de la liste des assignés pour le conserver dans les options
          const filteredAssignedIds = assignedIds.filter(id => id !== project.id_terrain);
          if (filteredAssignedIds.length > 0) {
            query = query.or(
              `id_terrain.eq.${project.id_terrain},id_terrain.not.in.(${filteredAssignedIds.join(',')})`
            );
          }
        }
      } else {
        // Mode création : seulement les non-assignés
        if (assignedIds.length > 0) {
          query = query.not('id_terrain', 'in', `(${assignedIds.join(',')})`);
        }
      }

      const { data: terrainsData } = await query;
      setTerrains(terrainsData || []);
      
    } catch (error) {
      console.error('Erreur lors du chargement des terrains:', error);
    }
  };

  const loadDistricts = async (regionId: number) => {
    try {
      const { data } = await supabase
        .from('district')
        .select('*')
        .eq('id_region', regionId);
      setDistricts(data || []);
      setCommunes([]); // Reset communes when region changes
    } catch (error) {
      console.error('Erreur lors du chargement des districts:', error);
    }
  };

  const loadCommunes = async (districtId: number) => {
    try {
      const { data } = await supabase
        .from('commune')
        .select('*')
        .eq('id_district', districtId);
      setCommunes(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des communes:', error);
    }
  };

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleCulture = (cultureId: number) => {
    setFormData(prev => ({
      ...prev,
      cultures: prev.cultures.includes(cultureId)
        ? prev.cultures.filter(id => id !== cultureId)
        : [...prev.cultures, cultureId]
    }));
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        setImage(uri);

        // Upload de l'image
        const response = await fetch(uri);
        const blob = await response.blob();
        const fileName = `projects/${uuidv4()}.jpg`;
        
        const { data, error } = await supabase.storage
          .from('project-images')
          .upload(fileName, blob);

        if (error) {
          console.error('Erreur upload:', error);
          Alert.alert('Erreur', 'Impossible de télécharger l\'image');
          return;
        }

        const { data: publicUrl } = supabase.storage
          .from('project-images')
          .getPublicUrl(fileName);
        
        updateFormData('photos', publicUrl.publicUrl);
      }
    } catch (error) {
      console.error('Erreur sélection image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  const validateForm = (): boolean => {
    if (!formData.titre.trim()) {
      Alert.alert('Erreur', 'Le titre est obligatoire');
      return false;
    }
    if (!formData.description.trim()) {
      Alert.alert('Erreur', 'La description est obligatoire');
      return false;
    }
    if (!formData.id_terrain) {
      Alert.alert('Erreur', 'Veuillez sélectionner un terrain');
      return false;
    }
    if (formData.cultures.length === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner au moins une culture');
      return false;
    }
    if (formData.surface_ha <= 0) {
      Alert.alert('Erreur', 'La surface doit être supérieure à 0');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      if (isEdit && project) {
        await updateProject();
      } else {
        await createProject();
      }
      
      Alert.alert(
        'Succès', 
        isEdit ? 'Projet mis à jour avec succès' : 'Projet créé avec succès',
        [{ text: 'OK', onPress: () => {
          onSubmitSuccess?.();
          onClose();
        }}]
      );
      
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      Alert.alert(
        'Erreur', 
        isEdit ? 'Erreur lors de la mise à jour du projet' : 'Erreur lors de la création du projet'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const createProject = async () => {
    // Insérer le nouveau projet
    const { data: newProject, error: projectError } = await supabase
      .from('projet')
      .insert({
        titre: formData.titre,
        description: formData.description,
        photos: formData.photos,
        statut: 'en attente',
        surface_ha: formData.surface_ha,
        id_terrain: formData.id_terrain,
        id_region: formData.id_region,
        id_district: formData.id_district,
        id_commune: formData.id_commune,
        id_tantsaha: formData.id_tantsaha,
        id_technicien: formData.id_technicien,
        id_superviseur: formData.id_superviseur
      })
      .select()
      .single();

    if (projectError || !newProject) {
      throw projectError;
    }

    // Créer les entrées projet_culture
    await createProjectCultures(newProject.id_projet);
  };

  const updateProject = async () => {
    if (!project?.id_projet) return;

    // Mettre à jour le projet
    const { error: projectError } = await supabase
      .from('projet')
      .update({
        titre: formData.titre,
        description: formData.description,
        photos: formData.photos,
        statut: formData.statut,
        surface_ha: formData.surface_ha,
        id_terrain: formData.id_terrain,
        id_region: formData.id_region,
        id_district: formData.id_district,
        id_commune: formData.id_commune
      })
      .eq('id_projet', project.id_projet);

    if (projectError) {
      throw projectError;
    }

    // Supprimer les anciennes cultures et en créer de nouvelles
    const { error: deleteError } = await supabase
      .from('projet_culture')
      .delete()
      .eq('id_projet', project.id_projet);

    if (deleteError) {
      throw deleteError;
    }

    await createProjectCultures(project.id_projet);
  };

  const createProjectCultures = async (projectId: number) => {
    // Récupérer les détails des cultures pour les calculs financiers
    const { data: culturesData, error: cultureError } = await supabase
      .from('culture')
      .select('*')
      .in('id_culture', formData.cultures);

    if (cultureError) {
      throw cultureError;
    }

    // Créer les entrées projet_culture avec calculs financiers
    const projetCultures = formData.cultures.map((cultureId: number) => {
      const cultureInfo = culturesData?.find((c) => c.id_culture === cultureId);
      
      // Utiliser les noms de champs corrects selon votre base de données
      const coutExploitation = cultureInfo?.cout_exploitation_ha 
        ? cultureInfo.cout_exploitation_ha * formData.surface_ha 
        : 0;
      
      const rendementTonne = cultureInfo?.rendement_ha 
        ? cultureInfo.rendement_ha * formData.surface_ha 
        : 0;
        
      const rendementFinancier = cultureInfo?.prix_tonne && rendementTonne
        ? cultureInfo.prix_tonne * rendementTonne
        : 0;

      return {
        id_projet: projectId,
        id_culture: cultureId,
        cout_exploitation_previsionnel: coutExploitation,
        rendement_previsionnel: rendementTonne,
        rendement_financier_previsionnel: rendementFinancier,
        date_debut_previsionnelle: new Date().toISOString().split('T')[0]
      };
    });

    const { error: insertError } = await supabase
      .from('projet_culture')
      .insert(projetCultures);

    if (insertError) {
      throw insertError;
    }
  };

  // Calculs du résumé - utilisation des noms corrects des champs
  const summary = {
    nbCultures: formData.cultures.length,
    coutTotal: cultures
      .filter(c => formData.cultures.includes(c.id_culture))
      .reduce((acc, c) => acc + ((c.cout_exploitation_ha || 0) * formData.surface_ha), 0),
    rendementTotal: cultures
      .filter(c => formData.cultures.includes(c.id_culture))
      .reduce((acc, c) => acc + ((c.rendement_ha || 0) * formData.surface_ha), 0),
    revenueTotal: cultures
      .filter(c => formData.cultures.includes(c.id_culture))
      .reduce((acc, c) => {
        const rendement = (c.rendement_ha || 0) * formData.surface_ha;
        return acc + (rendement * (c.prix_tonne || 0));
      }, 0),
  };

  if (loading) {
    return (
      <Modal visible={isVisible} transparent animationType="slide">
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white p-8 rounded-lg">
            <ActivityIndicator size="large" color="#009800" />
            <Text className="mt-4 text-center">Chargement...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={isVisible} transparent animationType="slide">
      <View className="flex-1 bg-black/50">
        <View className="flex-1 bg-white mt-16 rounded-t-3xl">
          {/* Header */}
          <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
            <Text className="text-xl font-bold text-gray-800">
              {isEdit ? 'Modifier le projet' : 'Nouveau projet'}
            </Text>
            <TouchableOpacity onPress={onClose} className="p-2">
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
            {/* Titre */}
            <View className="mb-4">
              <Text className="text-lg font-semibold text-gray-700 mb-2">
                Titre *
              </Text>
              <TextInput
                className="border border-gray-300 p-3 rounded-lg bg-gray-50"
                value={formData.titre}
                onChangeText={(text) => updateFormData('titre', text)}
                placeholder="Nom du projet"
              />
            </View>

            {/* Description */}
            <View className="mb-4">
              <Text className="text-lg font-semibold text-gray-700 mb-2">
                Description *
              </Text>
              <TextInput
                className="border border-gray-300 p-3 rounded-lg bg-gray-50 h-24"
                value={formData.description}
                onChangeText={(text) => updateFormData('description', text)}
                placeholder="Description du projet"
                multiline
                textAlignVertical="top"
              />
            </View>

            {/* Surface */}
            <View className="mb-4">
              <Text className="text-lg font-semibold text-gray-700 mb-2">
                Surface (hectares) *
              </Text>
              <TextInput
                className="border border-gray-300 p-3 rounded-lg bg-gray-50"
                value={formData.surface_ha.toString()}
                onChangeText={(text) => updateFormData('surface_ha', parseFloat(text) || 0)}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>

            {/* Terrain */}
            <View className="mb-4">
              <Text className="text-lg font-semibold text-gray-700 mb-2">
                Terrain *
              </Text>
              {terrains.length > 0 ? (
                <View className="border border-gray-300 rounded-lg bg-gray-50">
                  <Picker
                    selectedValue={formData.id_terrain}
                    onValueChange={(value) => updateFormData('id_terrain', value)}
                  >
                    <Picker.Item label="-- Sélectionner un terrain --" value={0} />
                    {terrains.map(terrain => (
                      <Picker.Item 
                        key={terrain.id_terrain} 
                        label={terrain.nom_terrain} 
                        value={terrain.id_terrain} 
                      />
                    ))}
                  </Picker>
                </View>
              ) : (
                <Text className="text-gray-500 p-3 border border-gray-300 rounded-lg bg-gray-50">
                  Aucun terrain disponible
                </Text>
              )}
            </View>

            {/* Région */}
            <View className="mb-4">
              <Text className="text-lg font-semibold text-gray-700 mb-2">Région</Text>
              <View className="border border-gray-300 rounded-lg bg-gray-50">
                <Picker
                  selectedValue={formData.id_region}
                  onValueChange={(value) => {
                    updateFormData('id_region', value);
                    if (value) loadDistricts(value);
                  }}
                >
                  <Picker.Item label="-- Sélectionner une région --" value={undefined} />
                  {regions.map(region => (
                    <Picker.Item 
                      key={region.id_region} 
                      label={region.nom_region} 
                      value={region.id_region} 
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* District */}
            {districts.length > 0 && (
              <View className="mb-4">
                <Text className="text-lg font-semibold text-gray-700 mb-2">District</Text>
                <View className="border border-gray-300 rounded-lg bg-gray-50">
                  <Picker
                    selectedValue={formData.id_district}
                    onValueChange={(value) => {
                      updateFormData('id_district', value);
                      if (value) loadCommunes(value);
                    }}
                  >
                    <Picker.Item label="-- Sélectionner un district --" value={undefined} />
                    {districts.map(district => (
                      <Picker.Item 
                        key={district.id_district} 
                        label={district.nom_district} 
                        value={district.id_district} 
                      />
                    ))}
                  </Picker>
                </View>
              </View>
            )}

            {/* Commune */}
            {communes.length > 0 && (
              <View className="mb-4">
                <Text className="text-lg font-semibold text-gray-700 mb-2">Commune</Text>
                <View className="border border-gray-300 rounded-lg bg-gray-50">
                  <Picker
                    selectedValue={formData.id_commune}
                    onValueChange={(value) => updateFormData('id_commune', value)}
                  >
                    <Picker.Item label="-- Sélectionner une commune --" value={undefined} />
                    {communes.map(commune => (
                      <Picker.Item 
                        key={commune.id_commune} 
                        label={commune.nom_commune} 
                        value={commune.id_commune} 
                      />
                    ))}
                  </Picker>
                </View>
              </View>
            )}

            {/* Cultures */}
            <View className="mb-4">
              <Text className="text-lg font-semibold text-gray-700 mb-2">
                Cultures * ({formData.cultures.length} sélectionnée{formData.cultures.length > 1 ? 's' : ''})
              </Text>
              <View className="border border-gray-300 rounded-lg bg-gray-50 p-3">
                {cultures.map(culture => (
                  <Checkbox
                    key={culture.id_culture}
                    checked={formData.cultures.includes(culture.id_culture)}
                    onPress={() => toggleCulture(culture.id_culture)}
                    label={culture.nom_culture || ''}
                    containerStyle="mb-2"
                  />
                ))}
              </View>
            </View>

            {/* Assignations (pour les rôles appropriés) */}
            {(userProfile?.userProfile === 'superviseur' || userProfile?.userProfile === 'admin') && (
              <>
                {/* Tantsaha */}
                <View className="mb-4">
                  <Text className="text-lg font-semibold text-gray-700 mb-2">Tantsaha</Text>
                  <View className="border border-gray-300 rounded-lg bg-gray-50">
                    <Picker
                      selectedValue={formData.id_tantsaha}
                      onValueChange={(value) => updateFormData('id_tantsaha', value)}
                    >
                      <Picker.Item label="-- Sélectionner un tantsaha --" value={undefined} />
                      {tantsahas.map(tantsaha => (
                        <Picker.Item 
                          key={tantsaha.id} 
                          label={`${tantsaha.nom} ${tantsaha.prenoms}`} 
                          value={tantsaha.id} 
                        />
                      ))}
                    </Picker>
                  </View>
                </View>

                {/* Technicien */}
                <View className="mb-4">
                  <Text className="text-lg font-semibold text-gray-700 mb-2">Technicien</Text>
                  <View className="border border-gray-300 rounded-lg bg-gray-50">
                    <Picker
                      selectedValue={formData.id_technicien}
                      onValueChange={(value) => updateFormData('id_technicien', value)}
                    >
                      <Picker.Item label="-- Sélectionner un technicien --" value={undefined} />
                      {techniciens.map(technicien => (
                        <Picker.Item 
                          key={technicien.id} 
                          label={`${technicien.nom} ${technicien.prenoms}`} 
                          value={technicien.id} 
                        />
                      ))}
                    </Picker>
                  </View>
                </View>

                {/* Superviseur */}
                <View className="mb-4">
                  <Text className="text-lg font-semibold text-gray-700 mb-2">Superviseur</Text>
                  <View className="border border-gray-300 rounded-lg bg-gray-50">
                    <Picker
                      selectedValue={formData.id_superviseur}
                      onValueChange={(value) => updateFormData('id_superviseur', value)}
                    >
                      <Picker.Item label="-- Sélectionner un superviseur --" value={undefined} />
                      {superviseurs.map(superviseur => (
                        <Picker.Item 
                          key={superviseur.id} 
                          label={`${superviseur.nom} ${superviseur.prenoms}`} 
                          value={superviseur.id} 
                        />
                      ))}
                    </Picker>
                  </View>
                </View>
              </>
            )}

            {/* Image */}
            <View className="mb-4">
              <Text className="text-lg font-semibold text-gray-700 mb-2">Image</Text>
              <TouchableOpacity
                onPress={handlePickImage}
                className="bg-green-500 p-3 rounded-lg mb-2"
              >
                <Text className="text-white text-center font-semibold">
                  {image ? 'Changer l\'image' : 'Ajouter une image'}
                </Text>
              </TouchableOpacity>
              {image && (
                <Image
                  source={{ uri: image }}
                  className="w-full h-48 rounded-lg"
                  resizeMode="cover"
                />
              )}
            </View>

            {/* Résumé */}
            {formData.cultures.length > 0 && formData.surface_ha > 0 && (
              <View className="bg-green-50 p-4 rounded-lg mb-6 border border-green-200">
                <Text className="font-bold text-green-700 mb-2 text-lg">
                  📊 Résumé du projet
                </Text>
                <Text className="text-green-600 mb-1">
                  🌱 Cultures: {summary.nbCultures}
                </Text>
                <Text className="text-green-600 mb-1">
                  📏 Surface: {formData.surface_ha} ha
                </Text>
                <Text className="text-green-600 mb-1">
                  💰 Coût total estimé: {summary.coutTotal.toLocaleString()} Ar
                </Text>
                <Text className="text-green-600 mb-1">
                  📈 Rendement estimé: {summary.rendementTotal.toFixed(1)} tonnes
                </Text>
                <Text className="text-green-600">
                  💵 Revenu estimé: {summary.revenueTotal.toLocaleString()} Ar
                </Text>
                <Text className={`font-bold ${(summary.revenueTotal - summary.coutTotal) >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                  📊 Bénéfice estimé: {(summary.revenueTotal - summary.coutTotal).toLocaleString()} Ar
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Footer avec boutons */}
          <View className="p-4 border-t border-gray-200 bg-white">
            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={onClose}
                className="flex-1 bg-gray-500 p-4 rounded-lg"
                disabled={submitting}
              >
                <Text className="text-white text-center font-bold">Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmit}
                className="flex-1 bg-green-600 p-4 rounded-lg"
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white text-center font-bold">
                    {isEdit ? 'Modifier' : 'Créer'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Export du composant modal stylé - compatible avec votre système existant
export const ModalAddStyled = ({ 
  project, 
  onClose, 
  isVisible, 
  userProfile,
  isEdit = false,
  onSubmitSuccess 
}: CreateModalProps) => {
  return (
    <CreateProjectModal
      project={project}
      onClose={onClose}
      isVisible={isVisible}
      userProfile={userProfile}
      isEdit={isEdit}
      onSubmitSuccess={onSubmitSuccess}
    />
  );
};

export default CreateProjectModal;