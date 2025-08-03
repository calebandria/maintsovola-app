import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Image,
  Modal,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SubNavTabs from '../SubNavTabs';
import { getProjectById } from '~/services/feeds.service';

export default function GaleryDetailModal({
  projectId,
  defaultTab = 'Photos',
  visible = true,
  onClose,
  photos: propPhotos,
}: {
  projectId: string;
  defaultTab?: 'Photos' | 'Carte';
  visible?: boolean;
  onClose?: () => void;
  photos?: string[];
}) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [photos, setPhotos] = useState<string[]>(propPhotos || []);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const { width: screenWidth } = Dimensions.get('window');
  const handleTabChange = (tab: string) => {
    if (tab === 'Photos' || tab === 'Carte') {
      setActiveTab(tab);
    }
  };

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: any[] }) => {
    if (viewableItems.length > 0) {
      setCurrentPhotoIndex(viewableItems[0].index || 0);
    }
  }, []);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  });

  const renderPhotoItem = useCallback(
    ({ item, index }: { item: string; index: number }) => {
      return (
        <View style={{ width: screenWidth - 32 }} className="px-2">
          <Image
            source={{ uri: item }}
            className="h-80 w-full rounded-lg"
            style={{ resizeMode: 'cover' }}
          />
        </View>
      );
    },
    [screenWidth]
  );

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    // Si des photos sont passées en props, les utiliser directement
    if (propPhotos && propPhotos.length > 0) {
      setPhotos(propPhotos);
      return;
    }

    // Sinon, faire un appel API pour récupérer les photos
    const fetchPhotos = async () => {
      try {
        const project = await getProjectById(projectId);
        if (!project) {
          console.error('Project not found');
          setPhotos([]);
          return;
        }

        // Gérer les différents formats de photos
        let projectPhotos: string[] = [];
        if (project.photos) {
          if (Array.isArray(project.photos)) {
            // Si c'est déjà un tableau de strings
            projectPhotos = project.photos.filter(
              (photo) => typeof photo === 'string' && photo.length > 0
            );
          } else if (typeof project.photos === 'string') {
            // Si c'est une string JSON ou une seule URL
            try {
              const parsed = JSON.parse(project.photos);
              if (Array.isArray(parsed)) {
                projectPhotos = parsed.filter(
                  (photo) => typeof photo === 'string' && photo.length > 0
                );
              }
            } catch {
              // Si ce n'est pas du JSON valide, traiter comme une seule URL
              if (project.photos.length > 0) {
                projectPhotos = [project.photos];
              }
            }
          }
        }

        setPhotos(projectPhotos);
        console.log('Photos loaded in GaleryDetailModal:', projectPhotos.length, projectPhotos);
      } catch (error) {
        console.error('Error fetching photos:', error);
        setPhotos([]);
      }
    };

    if (!propPhotos || propPhotos.length === 0) {
      fetchPhotos();
    }
  }, [projectId, propPhotos]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-gray-200 p-4">
          <Text className="text-lg font-bold">Galerie du projet {projectId}</Text>
          {onClose && (
            <TouchableOpacity onPress={onClose} className="p-2">
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
          <Text className="mb-4 text-gray-600">
            Naviguer entre les photos et la carte du projet
          </Text>
          <SubNavTabs activeTab={activeTab} tabs={['Photos', 'Carte']} onChange={handleTabChange} />

          {activeTab === 'Photos' && (
            <View className="mt-4">
              {photos.length > 0 ? (
                <View>
                  {/* Carrousel de photos */}
                  <View style={{ height: 320 }}>
                    <FlatList
                      data={photos}
                      renderItem={renderPhotoItem}
                      keyExtractor={(item, index) => index.toString()}
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      onViewableItemsChanged={onViewableItemsChanged}
                      viewabilityConfig={viewabilityConfig.current}
                      contentContainerStyle={{ paddingHorizontal: 16 }}
                    />
                  </View>

                  {/* Indicateurs de pagination */}
                  {photos.length > 1 && (
                    <View className="mt-4 flex-row justify-center">
                      {photos.map((_, index) => (
                        <View
                          key={index}
                          style={{ marginHorizontal: 4 }}
                          className={`h-2 w-2 rounded-full ${
                            index === currentPhotoIndex ? 'bg-green-600' : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </View>
                  )}

                  {/* Compteur de photos */}
                  {photos.length > 1 && (
                    <View className="mt-2 items-center">
                      <Text className="text-sm text-gray-500">
                        {currentPhotoIndex + 1} / {photos.length}
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <View className="items-center justify-center py-8">
                  <Ionicons name="image-outline" size={48} color="#9CA3AF" />
                  <Text className="mt-2 text-gray-500">Aucune photo disponible</Text>
                </View>
              )}
            </View>
          )}

          {activeTab === 'Carte' && (
            <View className="mt-4">
              {/* Composant pour afficher la carte du projet */}
              <View className="items-center justify-center rounded-lg bg-gray-100 py-8">
                <Ionicons name="map-outline" size={48} color="#9CA3AF" />
                <Text className="mt-2 text-gray-500">Carte du projet {projectId}</Text>
                <Text className="text-sm text-gray-400">Fonctionnalité à venir</Text>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
