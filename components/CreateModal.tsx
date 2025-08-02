import { Picker } from "@react-native-picker/picker";
import { useEffect, useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native"
import { ProjectData } from "~/type/projectInterface";
import { CultureData } from "~/types/cultureData";
import { TerrainData } from "~/types/Terrain";
import { supabase } from "~/utils/supabase";
import { Checkbox } from "./ui/Checkbox";
import { ProjectDetails } from "~/hooks/useProject";


type Props = {
  project?: ProjectData | null;
  onClose: () => void;
  userProfile?: { userProfile: string; userName: string };
};
export const CreateModal = ({ project, onClose, userProfile }: Props) => {
    const [titre, setTitre] = useState<string>(project?.titre ?? "");
    const [description, setDescription] = useState<string>(project?.description ?? "");
    const [terrains, setTerrains] = useState<TerrainData[]>([]);
    const [cultures, setCultures] = useState<CultureData[]>([]);
    const [selectedCultures, setSelectedCultures] = useState<number[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState('');

    const fetchCultures = async (): Promise<CultureData[]> => {
    const { data } = await supabase.from('culture').select('*');
    return data ?? [];
  };

  const fetchAssignedTerrains = async (): Promise<number[]> => {
    const { data } = await supabase.from('projet').select('id_terrain');
    return (data ?? [])
      .map(p => p.id_terrain)
      .filter(id => typeof id === 'number');
  };

  const fetchAvailableTerrains = async (assignedIds: number[]): Promise<TerrainData[]> => {
    let query = supabase.from('terrain').select('*');

    if (project?.id_terrain) {
      // MODE MODIFICATION : terrain actuel + non-assignés
      query = query.or(
        `id.eq.${project.id_terrain}${assignedIds.length ? `,id.not.in.(${assignedIds.join(',')})` : ''}`
      );
    } else {
      // MODE CRÉATION : seulement les non-assignés
      if (assignedIds.length) {
        query = query.not('id', 'in', `(${assignedIds.join(',')})`);
      }
    }

    const { data } = await query;
    return data ?? [];
  };

  const initializeData = async () => {
    setLoading(true);
    try {
      // Récupération des données
      const [culturesData, assignedIds] = await Promise.all([
        fetchCultures(),
        fetchAssignedTerrains()
      ]);
      
      const terrainsData = await fetchAvailableTerrains(assignedIds);

      // Mise à jour des états
      setCultures(culturesData);
      setTerrains(terrainsData);

      // Initialisation si projet existant
      if (project) {
        setTitre(project.titre || '');
        setDescription(project.description || '');
        setImageUrl(project.photos || '');

        if (project.id_terrain) {
          const found = terrainsData.find(t => t.id_terrain === project.id_terrain);
          setSelectedTerrain(found ?? null);
        }

        if (project.projet_culture) {
          const ids = project.projet_culture.map(pc => pc.id_culture);
          setSelectedCultures(ids);
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
    } finally {
      setLoading(false);
    }
  };

  const [selectedTerrain, setSelectedTerrain] = useState<TerrainData | null>(null);
  
  useEffect(() => {
    initializeData();
  }, [project?.id_projet]);

    const toggleCulture = (id: number) =>{
      setSelectedCultures(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
      console.log(selectedCultures)
    }
      


    return (
    <ScrollView className="transition-colors duration-150">
        <Text className="text-2xl font-bold text-gray-800 mb-4">
            {project ? 'Modifier le Projet' : 'Nouveau Projet'}
        </Text>

        <View className="mb-4">
            <Text className="text-lg font-semibold text-gray-700 mb-2">Titre</Text>
            <TextInput
            className="border border-gray-300 p-3 rounded-lg bg-gray-50 focus:border-green-500"
            value={titre}
            onChangeText={setTitre}
            />
        </View>

        {/* Description */}
        <View className="mb-4">
            <Text className="text-lg font-semibold text-gray-700 mb-2">Description</Text>
            <TextInput
                className="border border-gray-300 p-3 rounded-lg bg-gray-50 h-24 focus:border-green-500"
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

        <View className="mb-4">
            <Text className="text-lg font-semibold text-gray-700 mb-2">Cultures</Text>
            {cultures.map(c => (
            <View key={c.id} className="mb-1">
                <Checkbox
                checked={selectedCultures.includes(c.id)}
                onPress={() => toggleCulture(c.id)}
                label={c.nom_culture ?? ''}
                />
            </View>
            ))}
        </View>

        <View className="flex-row justify-around mt-6 border-t border-gray-200 pt-4">
            <TouchableOpacity
            onPress={onClose}
            className="bg-gray-500 p-3 rounded-lg flex-1 mr-2"
            >
            <Text className="text-white text-center font-bold">Retour</Text>
            </TouchableOpacity>
        </View>
    </ScrollView>
    )
}