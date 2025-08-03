// CreateProjectModal.tsx – version avec gestion multiple d'images
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
  BackHandler,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { launchImageLibraryAsync } from 'expo-image-picker';
import { supabase } from '@/utils/supabase';
// Remplacer uuid par une fonction simple
const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);
import { CultureData } from '@/types/cultureData';
import { ProjectData } from '@/type/projectInterface';
import { TerrainData } from '@/types/terrainData';
import { Checkbox } from '@/components/ui/Checkbox';
import { MapPlus } from 'lucide-react-native';
import { router } from 'expo-router';

function daysBetween(dateA?: string, dateB?: string): number {
  if (!dateA || !dateB) return 0;
  const dA = new Date(dateA);
  const dB = new Date(dateB);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((dB.getTime() - dA.getTime()) / msPerDay);
}

type Props = {
  project?: ProjectData | null;
  onClose: () => void;
  userProfile?: { userProfile: string; userName: string };
};

interface ImageData {
  uri: string;
  url: string;
  id: string;
  isUploaded: boolean; // Nouveau champ pour tracker si uploadé
}

const CreateProjectModal = ({ project, onClose, userProfile }: Props) => {
  useEffect(() => {
    const backAction = () => {
      onClose();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [onClose]);

  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [terrains, setTerrains] = useState<TerrainData[]>([]);
  const [cultures, setCultures] = useState<CultureData[]>([]);
  const [selectedTerrain, setSelectedTerrain] = useState<TerrainData | null>(null);
  const [selectedCultures, setSelectedCultures] = useState<number[]>([]);
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const { data: cultureData } = await supabase.from('culture').select('*');
      setCultures(cultureData ?? []);

      /* 1. Récupérer les terrains déjà pris */
      const { data: assigned } = await supabase
        .from('projet')
        .select('id_terrain');

      const assignedIds = (assigned ?? [])
        .map(p => p.id_terrain)
        .filter(id => typeof id === 'number');

      /* 2. Construire la clause WHERE */
      let query = supabase.from('terrain').select('*');

      if (project?.id_terrain) {
        /* MODE MODIFICATION : terrain actuel + non-assignés */
        query = query.or(
          `id.eq.${project.id_terrain}${assignedIds.length ? `,id.not.in.(${assignedIds.join(',')})` : ''}`
        );
      } else {
        /* MODE CRÉATION : seulement les non-assignés */
        if (assignedIds.length) {
          query = query.not('id', 'in', `(${assignedIds.join(',')})`);
        }
      }

      const { data: terrainData } = await query;
      setTerrains(terrainData ?? []);
      if (project?.id_terrain) {
        const found = terrainData?.find(t => t.id === project.id_terrain);
        setSelectedTerrain(found ?? null);
      }
      if (project?.projet_culture) {
        const ids = project.projet_culture.map(pc => pc.id_culture);
        setSelectedCultures(ids);
      }

      // Charger les images existantes si en mode modification
      if (project?.photos) {
        const existingImages = project.photos
          .split(',')
          .filter(url => url.trim() !== '')
          .map((url, index) => ({
            uri: url.trim(),
            url: url.trim(),
            id: `existing-${index}`,
            isUploaded: true
          }));
        setImages(existingImages);
      }

      setLoading(false);
    };
    fetchAll();
  }, [project?.id_projet]);

  const toggleCulture = (id: number) =>
    setSelectedCultures(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );

  const handlePickImage = async () => {
    try {
      const result = await launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        const tempId = generateId();
        
        // Ajouter l'image localement SANS upload immédiat
        const tempImage: ImageData = {
          uri: uri,
          url: '',
          id: tempId,
          isUploaded: false
        };
        
        setImages(prev => [...prev, tempImage]);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la sélection de l\'image');
    }
  };

  const handleRemoveImage = (imageId: string) => {
    Alert.alert(
      'Supprimer l\'image',
      'Voulez-vous vraiment supprimer cette image ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            setImages(prev => prev.filter(img => img.id !== imageId));
          }
        }
      ]
    );
  };

  const ownerFullName = project
    ? `${project.tantsaha?.nom ?? ''} ${project.tantsaha?.prenoms ?? ''}`.trim()
    : '';
  const canDelete =
    userProfile?.userProfile === 'simple' &&
    ownerFullName === userProfile?.userName;
  const canEdit =
    userProfile?.userProfile === 'superviseur' ||
    userProfile?.userProfile === 'technicien' ||
    canDelete;

  const summary = {
    nbCultures: selectedCultures.length,
    dureeTotale: Math.max(
      ...cultures
        .filter(c => selectedCultures.includes(c.id_culture))
        .map(c => daysBetween(c.create_at, c.edit_at)),
      0
    ),
    coutTotal: cultures
      .filter(c => selectedCultures.includes(c.id_culture))
      .reduce((acc, c) => acc + (c.cout_ha ?? 0), 0),
  };

  const handleDelete = async () => {
    if (!project?.id_projet) return;
    Alert.alert(
      'Confirmer',
      'Voulez-vous vraiment supprimer ce projet ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            const { error } = await supabase
              .from('projet')
              .delete()
              .eq('id_projet', project.id_projet);
            setLoading(false);
            if (!error) {
              Alert.alert('Succès', 'Projet supprimé');
              onClose();
            } else {
              Alert.alert('Erreur', 'Impossible de supprimer le projet');
            }
          },
        },
      ]
    );
  };

  const uploadImages = async (imagesToUpload: ImageData[]) => {
    const uploadedUrls: string[] = [];
    
    for (const image of imagesToUpload) {
      if (image.isUploaded) {
        // Image déjà uploadée (mode modification)
        uploadedUrls.push(image.url);
      } else {
        // Nouvelle image à uploader
        try {
          const fileName = `project-photos/project-${Date.now()}-${generateId()}.jpg`;
          
          const formData = new FormData();
          formData.append('file', {
            uri: image.uri,
            type: 'image/jpeg',
            name: fileName,
          } as any);

          const { data, error } = await supabase.storage
            .from('project-photos')
            .upload(fileName, formData);

          if (!error) {
            const { data: publicUrl } = supabase.storage
              .from('project-photos')
              .getPublicUrl(fileName);
            uploadedUrls.push(publicUrl.publicUrl);
          } else {
            throw new Error(error.message);
          }
        } catch (uploadError) {
          throw uploadError;
        }
      }
    }
    
    return uploadedUrls;
  };

  const handleSubmit = async () => {
    const culturesToSend = cultures.filter(c => selectedCultures.includes(c.id_culture));
    
    setLoading(true);
    
    try {
      // Upload toutes les nouvelles images
      const imageUrls = await uploadImages(images);
      
      const payload = {
        titre,
        description,
        id_terrain: selectedTerrain?.id_terrain,
        cultures: culturesToSend,
        photos: imageUrls.join(','),
        duree_totale: summary.dureeTotale,
        cout_total: summary.coutTotal,
      };

      let error;
      if (project?.id_projet) {
        ({ error } = await supabase
          .from('projet')
          .update(payload)
          .eq('id_projet', project.id_projet));
      } else {
        ({ error } = await supabase.from('projet').insert([payload]));
      }

      if (!error) {
        Alert.alert('Succès', project ? 'Projet modifié' : 'Projet créé');
        onClose();
      } else {
        Alert.alert('Erreur', 'Impossible d\'enregistrer');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de l\'upload des images');
    }
    
    setLoading(false);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size={30} color="#009800" />
      </View>
    );
  }

  return (
    <ScrollView className="p-4">
      <Text className="text-2xl font-bold text-gray-800 mb-4">
        {project ? 'Modifier le Projet' : 'Nouveau Projet'}
      </Text>

      {/* Titre */}
      <View className="mb-4">
        <Text className="text-lg font-semibold text-gray-700 mb-2">Titre</Text>
        <TextInput
          className="border border-gray-300 p-3 rounded-lg bg-gray-50"
          value={titre}
          onChangeText={setTitre}
        />
      </View>

      {/* Description */}
      <View className="mb-4">
        <Text className="text-lg font-semibold text-gray-700 mb-2">Description</Text>
        <TextInput
          className="border border-gray-300 p-3 rounded-lg bg-gray-50 h-24 items-start"
          value={description}
          onChangeText={setDescription}
          multiline
        />
      </View>

      {/* Terrain */}
      <View className="mb-4">
        <Text className="text-lg font-semibold text-gray-700 mb-2">Terrain</Text>
        {terrains.length ? (
          <View className="border border-gray-300 rounded-lg bg-gray-50">
            <Picker
              selectedValue={selectedTerrain?.id_terrain ?? ''}
              onValueChange={val =>
                setSelectedTerrain(terrains.find(t => t.id_terrain === val) ?? null)
              }
            >
              <Picker.Item label="-- Sélectionner un terrain --" value="" />
              {terrains.map(t => (
                <Picker.Item key={t.id_terrain} label={t.nom_terrain} value={t.id_terrain} />
              ))}
            </Picker>
          </View>
        ) : (
          <View className='flex flex-row w-full justify-between items-center'>
            <Text className="text-gray-500">Aucun terrain disponible</Text>
            <TouchableOpacity
              className='p-2 flex flex-row items-center gap-1 bg-zinc-50 rounded-full shadow active:bg-white active:shadow-none'
              activeOpacity={0.85}
              onPress={()=> {router.replace("/(tabs)/terrain")}}
            >
              <Text className='text-blue-400 font-semibold'>terrain</Text>
              <MapPlus color="#45ba50" height={20}></MapPlus>
            </TouchableOpacity>
            
          </View>
          
        )}
      </View>

      {/* Cultures */}
      <View className="mb-4">
        <Text className="text-lg font-semibold text-gray-700 mb-2">Cultures</Text>
        {cultures.map(c => (
        <View key={c.id_culture} className="mb-1">
          <Checkbox
            checked={selectedCultures.includes(c.id_culture)}
            onPress={() => toggleCulture(c.id_culture)}
            label={c.nom_culture ?? ''}
          />
        </View>
      ))}
      </View>

      {/* Images */}
      <View className="mb-4">
        <Text className="text-lg font-semibold text-gray-700 mb-2">
          Images ({images.length})
        </Text>
        
        {/* Bouton d'ajout d'image */}
        <TouchableOpacity
          onPress={handlePickImage}
          className="bg-green-500 p-3 rounded-lg mb-3"
        >
          <View className="flex-row items-center justify-center">
            <Text className="text-white text-center font-semibold">
              Choisir une image
            </Text>
          </View>
        </TouchableOpacity>

        {/* Grille de prévisualisation des images */}
        {images.length > 0 && (
          <View className="flex-row flex-wrap -mx-1">
            {images.map((image, index) => (
              <View key={image.id} className="w-1/3 px-1 mb-2">
                <View className="relative">
                  <Image
                    source={{ uri: image.uri }}
                    className="w-full h-24 rounded-lg bg-gray-200"
                    resizeMode="cover"
                  />
                  
                  {/* Indicateur pour les nouvelles images */}
                  {!image.isUploaded && (
                    <View className="absolute inset-0 bg-blue/20 rounded-lg flex items-center justify-center">
                      <Text className="text-white text-xs bg-blue-500 px-2 py-1 rounded">NOUVEAU</Text>
                    </View>
                  )}
                  
                  {/* Bouton de suppression */}
                  <TouchableOpacity
                    onPress={() => handleRemoveImage(image.id)}
                    className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 flex items-center justify-center"
                  >
                    <Text className="text-white text-xs font-bold">×</Text>
                  </TouchableOpacity>
                  
                  {/* Numéro de l'image */}
                  <View className="absolute bottom-1 left-1 bg-black/70 rounded px-2 py-1">
                    <Text className="text-white text-xs">{index + 1}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
        
        {/* Message si aucune image */}
        {images.length === 0 && (
          <Text className="text-gray-500 text-center py-4 italic">
            Aucune image ajoutée
          </Text>
        )}
      </View>

      {/* Boutons */}
      <View className="flex-row justify-around mt-6 border-t border-gray-200 pt-4">
        <TouchableOpacity
          onPress={onClose}
          className="bg-gray-500 p-3 rounded-lg flex-1 mr-2"
        >
          <Text className="text-white text-center font-bold">Retour</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSubmit}
          className="bg-green-600 p-3 rounded-lg flex-1 ml-2"
        >
          <Text className="text-white text-center font-bold">
            {project ? 'Sauvegarder' : 'Créer'}
          </Text>
        </TouchableOpacity>

        {canDelete && (
          <TouchableOpacity
            onPress={handleDelete}
            className="bg-red-600 p-3 rounded-lg ml-2"
          >
            <Text className="text-white font-bold">Suppr.</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

export default CreateProjectModal;