// Project.tsx
import { Plus, SearchIcon} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useProjects } from '~/hooks/useProject';
import type { ProjectData } from '~/type/projectInterface';
import { ModalAddStyled, ModalDetails } from '~/components/project/Modal';
import { useAuth } from '~/contexts/AuthContext';
import { router } from 'expo-router';

const colorCode = {
    "en attente": "#cbe043",
    "en financement": "#94e043",
    "en cours": "#5de043",
    "terminé": "#2ce026",
  }

/* ---------- Carte projet ---------- */
type ListTerrainProps = { item: ProjectData; selected: string };

const ListTerrain = ({ item, selected }: ListTerrainProps) => {
  const [modalVisible, setModalVisible] = useState(false);

  const visible = useMemo(() => {
    switch (selected) {
      case 'en_attente':
        return item.statut === 'en attente';
      case 'finance':
        return item.statut === 'en financement';
      case 'en_prod':
        return item.statut === 'en cours';
      case 'termine':
        return item.statut === 'terminé';
      case 'valide':
        return item.statut === 'validé';
      default:
        return true;
    }
  }, [item.statut, selected]);

  if (!visible) return null;

  return (
    <>
      <TouchableOpacity
        className="my-2 min-h-24 rounded-lg border border-gray-300 p-3"
        activeOpacity={0.5}
        onPress={() => setModalVisible(true)}
      >
        <View className="flex-row justify-between">
          <View>
            <Text className="text-xl font-bold">{item.titre}</Text>
            <Text className="text-gray-500">
              {item.tantsaha?.nom} {item.tantsaha?.prenoms}
            </Text>
          </View>
          <View className="justify-end">
            <Text className={`rounded-full border border-gray-200 px-2 text-sm`} style={{ backgroundColor: colorCode[item.statut as keyof typeof colorCode] }} >{item.statut}</Text>
          </View>
        </View>
      </TouchableOpacity>

      <ModalDetails
        projectId={item.id_projet}
        isVisible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
};

/* ---------- Barre de filtres ---------- */
type StatusSelectProps = {
  selected: string;
  setSelected: (s: string) => void;
};
const StatusSelect = ({ selected, setSelected }: StatusSelectProps) => {
  const styles = StyleSheet.create({
    scroll: { paddingHorizontal: 10 },
    text: { fontSize: 14, color: '#000' },
    selected: { color: '#009900', fontWeight: 'bold' },
  });

  const filters = [
    { key: 'all', label: 'Tous' },
    { key: 'en_attente', label: 'En attente' },
    { key: 'finance', label: 'En financement' },
    { key: 'en_prod', label: 'En production' },
    { key: 'termine', label: 'Terminés' },
    {key: 'valide', label: 'Validés'}
  ];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
      {filters.map(({ key, label }) => (
        <TouchableOpacity key={key} onPress={() => setSelected(key)} className="mx-2">
          <Text style={[styles.text, selected === key && styles.selected]}>{label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

/* ---------- Écran principal ---------- */
export default function Project({isPass = false}: {isPass: boolean}) {
  if (!isPass) {
    router.replace("/projet")
  }

  const [isSearchFocus, setIsSearchFocus] = useState(false);
  const { projects, loading } = useProjects();
  const [selected, setSelected] = useState('all');
  const [isVisibleAdd, setisVisibleAdd] = useState<boolean>(false)

  // Auth context
  const {user, profile} = useAuth();
  const userProfile = profile?.nom_role?.toLocaleLowerCase() || 'simple';
  const userName = `${profile?.nom} ${profile?.prenoms}`;

  // useEffect(() => {
  //   if (!user || !profile) {
  //     router.replace("/(auth)/login");
  //   }
  // })

  // console.log(projects);

  return (
    <ScrollView className="px-5">
      <View className="mt-4">
        <Text className="text-4xl font-extrabold">Projects</Text>
        <Text className="text-xl text-gray-500">Gérez vos projets agricole ici</Text>
      </View>

      {/* Barre de recherche */}
      <View className="my-5">
        <View
          className={`mt-4 flex-row items-center rounded-lg border p-2 ${
            isSearchFocus ? 'border-2 border-green-700' : 'border-gray-300'
          }`}>
          <SearchIcon size={20} color="#888" />
          <TextInput
            placeholder="Rechercher..."
            className="ml-2 flex-1"
            onFocus={() => setIsSearchFocus(true)}
            onBlur={() => setIsSearchFocus(false)}
          />
        </View>

        <TouchableOpacity 
          className="mt-3 flex flex-row items-center justify-center rounded-lg bg-green-600 py-3"
          onPress={() => setisVisibleAdd(true)}
        >
          <Plus color="#ffffff" />
          <Text className="ml-1 font-semibold text-white">Nouveau projet</Text>
        </TouchableOpacity>

        <ModalAddStyled
          project={projects[0]}
          isVisible={isVisibleAdd}
          onClose={() => setisVisibleAdd(false)}
          userProfile={{userProfile, userName}}
        />
        
      </View>

      {/* Filtres */}
      <StatusSelect selected={selected} setSelected={setSelected} />

      {loading && <ActivityIndicator size={30} color="#009800" className="mt-5" />}

      {/* Liste */}
      <FlatList
        data={projects}
        keyExtractor={(p) => String(p.id_projet)}
        renderItem={({ item }) => <ListTerrain item={item} selected={selected} />}
        scrollEnabled={false}
        className="my-5 rounded-xl border border-gray-300 p-3"
      />
    </ScrollView>
  );
}
