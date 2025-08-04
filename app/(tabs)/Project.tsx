// Project.tsx
import { Plus, SearchIcon} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
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

/* ---------- Composant Skeleton Loading ---------- */
const SkeletonBar = ({ width, height = 16, style = {} }: { width: number | string, height?: number, style?: any }) => {
  const animatedValue = new Animated.Value(0);

  // Animation de pulsation
  const startAnimation = () => {
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: false,
      }),
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: false,
      }),
    ]).start(() => startAnimation());
  };

  useEffect(() => {
    startAnimation();
  }, []);

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#e2e8f0', '#cbd5e1'],
  });

  return (
    <Animated.View
      style={[
        {
          height,
          width,
          backgroundColor,
          borderRadius: 4,
        },
        style,
      ]}
    />
  );
};

const ProjectCardSkeleton = () => {
  return (
    <View className="my-2 min-h-24 rounded-lg border border-gray-300 p-3">
      <View className="flex-row justify-between">
        <View className="flex-1">
          {/* Titre du projet skeleton */}
          <SkeletonBar width="70%" height={20} style={{ marginBottom: 8 }} />
          {/* Nom de l'agriculteur skeleton */}
          <SkeletonBar width="50%" height={14} />
        </View>
        <View className="justify-center items-end">
          {/* Badge statut skeleton */}
          <SkeletonBar width={80} height={24} style={{ borderRadius: 12 }} />
        </View>
      </View>
    </View>
  );
};

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
        <View className="flex-row justify-between w-full">
          <View className='w-[70%]'>
            <Text className="text-xl font-bold" numberOfLines={1}>{item.titre}</Text>
            <Text className="text-gray-500" numberOfLines={1}>
              {item.tantsaha?.nom} {item.tantsaha?.prenoms}
            </Text>
          </View>
          <View className="justify-end">
            <Text 
              className={`rounded-full border border-gray-200 px-2 text-sm`} 
              style={{ backgroundColor: colorCode[item.statut as keyof typeof colorCode] }}
            >
              {item.statut}
            </Text>
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
    text: { fontSize: 16, color: '#000' },
    selected: { color: '#009900', fontWeight: 'bold' },
  });

  const filters = [
    { key: 'all', label: 'Tous' },
    { key: 'en_attente', label: 'En attente' },
    { key: 'finance', label: 'En financement' },
    { key: 'en_prod', label: 'En production' },
    { key: 'termine', label: 'Terminés' },
    { key: 'valide', label: 'Validés' }
  ];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
      {filters.map(({ key, label }) => (
        <TouchableOpacity key={key} onPress={() => setSelected(key)} className="mx-2">
          <Text style={[styles.text, selected === key && styles.selected]} className='mb-2'>
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

/* ---------- Skeleton pour la liste complète ---------- */
const ProjectListSkeleton = () => {
  return (
    <View className="my-5 rounded-xl border border-gray-300 p-3">
      {[...Array(4)].map((_, index) => (
        <ProjectCardSkeleton key={index} />
      ))}
    </View>
  );
};

/* ---------- Écran principal ---------- */
export default function Project({isPass = false}: {isPass: boolean}) {
  if (!isPass) {
    router.replace("/projet")
  }

  const [isSearchFocus, setIsSearchFocus] = useState(false);
  const [selected, setSelected] = useState('all');
  const [isVisibleAdd, setisVisibleAdd] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const { projects, loading, refetch } = useProjects();

  // Auth context
  const {user, profile} = useAuth();
  const userProfile = profile?.nom_role?.toLocaleLowerCase() || 'simple';
  const userName = `${profile?.nom} ${profile?.prenoms}`;

  useEffect(() => {
    if (!user) {
      router.replace("/(auth)/login");
    }
  })

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Fonction pour filtrer les projets par recherche
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) {
      return projects; // Si pas de recherche, retourner tous les projets
    }

    const query = searchQuery.toLowerCase().trim();
    
    return projects.filter((project) => {
      // Recherche dans le titre du projet
      const titleMatch = project.titre?.toLowerCase().includes(query);
      
      // Recherche dans le nom et prénom du tantsaha
      const nomMatch = project.tantsaha?.nom?.toLowerCase().includes(query);
      const prenomMatch = project.tantsaha?.prenoms?.toLowerCase().includes(query);
      
      // Recherche dans le nom complet (nom + prénom)
      const fullNameMatch = `${project.tantsaha?.nom} ${project.tantsaha?.prenoms}`
        .toLowerCase()
        .includes(query);
      
      // Retourner true si au moins une correspondance est trouvée
      return titleMatch || nomMatch || prenomMatch || fullNameMatch;
    });
  }, [projects, searchQuery]);

  return (
    <ScrollView className="px-5">
      <View className="mt-4">
        <Text className="text-4xl font-extrabold">Projets</Text>
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
            placeholder="Rechercher par titre ou nom d'agriculteur..."
            className="ml-2 flex-1"
            onFocus={() => setIsSearchFocus(true)}
            onBlur={() => setIsSearchFocus(false)}
            onChangeText={setSearchQuery}
            value={searchQuery}
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
          isVisible={isVisibleAdd}
          onClose={() => setisVisibleAdd(false)}
          userProfile={{userProfile, userName}}
        />
      </View>

      {/* Filtres */}
      <StatusSelect selected={selected} setSelected={setSelected} />

      {/* Affichage conditionnel : skeleton loading ou liste des projets */}
      {loading ? (
        <ProjectListSkeleton />
      ) : (
        <FlatList
          data={filteredProjects}
          keyExtractor={(p) => String(p.id_projet)}
          renderItem={({ item }) => <ListTerrain item={item} selected={selected} />}
          scrollEnabled={false}
          className="my-5 rounded-xl border border-gray-300 p-3"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#009800']} // Android
              tintColor="#009800"  // iOS
            />
          }
          ListEmptyComponent={() => (
            <View className="p-8 items-center">
              <Text className="text-gray-500 text-center text-lg">
                {searchQuery.trim() ? 'Aucun projet correspondant à votre recherche' : 'Aucun projet trouvé'}
              </Text>
              <View className='flex flex-row items-center'>
                <Text className="text-gray-300 text-center mt-2">
                  {searchQuery.trim() ? 'Essayez une autre recherche ou créez un nouveau projet...' : 'Créez des projets...'}
                </Text>
                <TouchableOpacity 
                  className="flex flex-row items-center justify-center rounded-full p-2"
                  onPress={() => setisVisibleAdd(true)}
                >
                  <Plus color="#47a13d" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </ScrollView>
  );
}