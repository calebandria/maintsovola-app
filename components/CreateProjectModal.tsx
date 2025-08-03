// CreateProjectModal.tsx – version corrigée
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
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '~/lib/data';
import { v4 as uuidv4 } from 'uuid';
import { CultureData } from '~/types/cultureData';
import { ProjectData } from '~/type/projectInterface';
import { TerrainData } from '~/types/terrainData';
import { Checkbox } from '~/components/ui/Checkbox';

// --- UTILS ---
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

const CreateProjectModal = ({ project, onClose, userProfile }: Props) => {
  // --- STATE ---
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [terrains, setTerrains] = useState<TerrainData[]>([]);
  const [cultures, setCultures] = useState<CultureData[]>([]);
  const [selectedTerrain, setSelectedTerrain] = useState<TerrainData | null>(null);
  const [selectedCultures, setSelectedCultures] = useState<number[]>([]);
  const [image, setImage] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState<boolean>(false);

  // --- SINGLE FETCH ---
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);

      // 1. cultures
      const { data: cultureData } = await supabase.from('culture').select('*');
      setCultures(cultureData ?? []);

      // 2. terrains
      const { data: assigned } = await supabase.from('projet').select('id_terrain');
      const assignedIds = (assigned ?? []).map(p => p.id_terrain).filter(Boolean);

      let terrainQuery = supabase.from('terrain').select('*');

      // en modification on ajoute le terrain actuel
      if (project?.id_terrain) {
        terrainQuery = terrainQuery.or(`id.eq.${project.id_terrain}`);
      }

      // on retire les terrains déjà pris (sauf celui du projet en cours)
      if (assignedIds.length) {
        if (!project?.id_terrain) {
          terrainQuery = terrainQuery.not('id', 'in', `(${assignedIds.join(',')})`);
        } else {
          terrainQuery = terrainQuery.or(
            `id.eq.${project.id_terrain},id.not.in.(${assignedIds.join(',')})`
          );
        }
      }

      const { data: terrainData } = await terrainQuery;
      setTerrains(terrainData ?? []);

      // pré-sélection terrain
      if (project?.id_terrain) {
        const found = terrainData?.find(t => t.id === project.id_terrain);
        setSelectedTerrain(found ?? null);
      }

      // pré-sélection cultures
      if (project?.projet_culture) {
        const ids = project.projet_culture.map(pc => pc.id_culture);
        setSelectedCultures(ids);
      }

      setLoading(false);
    };
    fetchAll();
  }, [project?.id_projet]); // <-- dépendance unique

  // --- HANDLERS ---
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

  // --- PERMISSIONS ---
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
        .filter(c => selectedCultures.includes(c.id))
        .map(c => daysBetween(c.create_at, c.edit_at)),
      0
    ),
    coutTotal: cultures
      .filter(c => selectedCultures.includes(c.id))
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
              .eq('id', project.id_projet);
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
    const payload = {
      titre,
      description,
      id_terrain: selectedTerrain?.id,
      cultures: selectedCultures,
      photos: imageUrl,
      duree_totale: summary.dureeTotale,
      cout_total: summary.coutTotal,
    };

    setLoading(true);
    let error;
    if (project?.id_projet) {
      ({ error } = await supabase.from('projet').update(payload).eq('id', project.id_projet));
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
          className="border border-gray-300 p-3 rounded-lg bg-gray-50 h-24"
          value={description}
          onChangeText={setDescription}
          multiline
        />
      </View>

      {/* Terrain – liste déroulante */}
      <View className="mb-4">
        <Text className="text-lg font-semibold text-gray-700 mb-2">Terrain</Text>
        {terrains.length ? (
          <View className="border border-gray-300 rounded-lg bg-gray-50">
            <Picker
              selectedValue={selectedTerrain?.id ?? ''}
              onValueChange={val =>
                setSelectedTerrain(terrains.find(t => t.id === val) ?? null)
              }
            >
              <Picker.Item label="-- Sélectionner un terrain --" value="" />
              {terrains.map(t => (
                <Picker.Item key={t.id} label={t.nom_terrain} value={t.id} />
              ))}
            </Picker>
          </View>
        ) : (
          <Text className="text-gray-500">Aucun terrain disponible</Text>
        )}
      </View>

      {/* Cultures – check-box */}
      <View className="mb-4">
        <Text className="text-lg font-semibold text-gray-700 mb-2">Cultures</Text>
        {cultures.map(c => (
          <View key={c.id} className="mb-1">
            <Checkbox
              checked={selectedCultures.includes(c.id)}
              onPress={() => toggleCulture(c.id)}
              label={c.nom_culture ?? c.nom_culture}
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

      {/* Résumé */}
      <View className="bg-gray-100 p-4 rounded-lg mb-4">
        <Text className="font-bold text-green-700 mb-2">Résumé du projet</Text>
        <Text>🌱 Cultures sélectionnées : {summary.nbCultures}</Text>
        <Text>⏳ Durée estimée : {summary.dureeTotale} jours</Text>
        <Text>💰 Coût total : {summary.coutTotal.toLocaleString()} Ar</Text>
        {selectedCultures.length > 0 && (
          <View className="mt-2">
            <Text className="font-bold">Détail :</Text>
            {cultures
              .filter(c => selectedCultures.includes(c.id))
              .map(c => (
                <Text key={c.id} className="text-sm">
                  - {c.nom_culture}: {daysBetween(c.create_at, c.edit_at)} j /{' '}
                  {c.cout_ha?.toLocaleString()} Ar
                </Text>
              ))}
          </View>
        )}
      </View>

      {/* Boutons fixes */}
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