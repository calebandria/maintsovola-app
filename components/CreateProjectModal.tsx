// CreateProjectModal.tsx – version 100 % fonctionnelle
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
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/utils/supabase';
import { v4 as uuidv4 } from 'uuid';
import { CultureData } from '@/types/cultureData';
import { ProjectData } from '@/type/projectInterface';
import { TerrainData } from '@/types/terrainData';
import { Checkbox } from '@/components/ui/Checkbox';

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
  const [image, setImage] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState<boolean>(false);

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
        .filter(id => typeof id === 'number'); // <— sécurise le type

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
        /* si aucun terrain n’est encore pris on ne filtre rien */
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
      setLoading(false);
    };
    fetchAll();
  }, [project?.id_projet]);

  const toggleCulture = (id: number) =>
    setSelectedCultures(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImage(uri);
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileName = `projects/${uuidv4()}`;
      const { data, error } = await supabase.storage
        .from('project-images')
        .upload(fileName, blob);
      if (!error) {
        const { data: publicUrl } = supabase.storage
          .from('project-images')
          .getPublicUrl(fileName);
        setImageUrl(publicUrl.publicUrl);
      }
    }
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

  const handleSubmit = async () => {
    const culturesToSend = cultures.filter(c => selectedCultures.includes(c.id_culture));

    const payload = {
      titre,
      description,
      id_terrain: selectedTerrain?.id_terrain,
      cultures: culturesToSend,
      photos: imageUrl,
      duree_totale: summary.dureeTotale,
      cout_total: summary.coutTotal,
    };

    setLoading(true);
    let error;
    if (project?.id_projet) {
      ({ error } = await supabase
        .from('projet')
        .update(payload)
        .eq('id_projet', project.id_projet));
    } else {
      ({ error } = await supabase.from('projet').insert([payload]));
    }
    setLoading(false);

    if (!error) {
      Alert.alert('Succès', project ? 'Projet modifié' : 'Projet créé');
      onClose();
    } else {
      Alert.alert('Erreur', 'Impossible d’enregistrer');
    }
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
          <Text className="text-gray-500">Aucun terrain disponible</Text>
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

      {/* Image */}
      <View className="mb-4">
        <Text className="text-lg font-semibold text-gray-700 mb-2">Image</Text>
        <TouchableOpacity
          onPress={handlePickImage}
          className="bg-green-500 p-3 rounded-lg"
        >
          <Text className="text-white text-center font-semibold">
            Choisir une image
          </Text>
        </TouchableOpacity>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            className="w-full h-48 mt-2 rounded-lg"
          />
        ) : null}
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