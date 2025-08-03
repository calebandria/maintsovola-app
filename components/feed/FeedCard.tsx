import { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  Pressable,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons, Feather, FontAwesome5 } from '@expo/vector-icons';
import { AgriculturalProject } from '~/hooks/use-project-data';
import { useProjectInteractions } from '~/hooks/use-project-interactions';
import CommentsSection from '../CommentsSection';
import FinancialDetailsModal from '../FinancialDetailsModal';
import InvestmentModal from '../InvestmentModal';
import { useAuth } from '~/contexts/AuthContext';
import { useRouter } from 'expo-router';
import GaleryDetailModal from './GaleryDetailModal';

interface FeedCardProps {
  project?: AgriculturalProject;
  onShare?: () => void;
  onInvest?: () => void;
  onRegionFilter?: (region: string) => void;
  onDistrictFilter?: (district: string) => void;
  onCommuneFilter?: (commune: string) => void;
  onCultureFilter?: (culture: string) => void;
  onStatusFilter?: (status: string) => void;
}

const FeedCard: React.FC<FeedCardProps> = ({
  project,
  onShare,
  onInvest,
  onRegionFilter,
  onDistrictFilter,
  onCommuneFilter,
  onCultureFilter,
  onStatusFilter,
}) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [localCurrentFunding, setLocalCurrentFunding] = useState(project?.currentFunding || 0);
  const [showGalery, setShowGallery] = useState(false);
  const [galleryDefaultTab, setGalleryDefaultTab] = useState<'Photos' | 'Carte'>('Photos');
  const { user, profile } = useAuth();
  const userId = user?.id || undefined; // Remplacer par l'ID de l'utilisateur connecté, à récupérer depuis le contexte d'authentification

  const router = useRouter();
  // Utiliser le hook pour les interactions
  const {
    likesCount,
    isLiked,
    toggleProjectLike,
    comments,
    cultureDetails,
    showFinancialModal,
    financialDetailsLoading,
    openFinancialModal,
    closeFinancialModal,
  } = useProjectInteractions({
    projectId: project?.id || 0,
    userId,
  });

  // Synchroniser l'état local avec les changements du projet
  useEffect(() => {
    if (project?.currentFunding !== undefined) {
      setLocalCurrentFunding(project.currentFunding);
    }
  }, [project?.currentFunding]);

  if (!project) {
    return null;
  }

  const displayedPhotos = project.photos || [];

  const displayTitle = project.title || 'Projet agricole';
  const displayDescription = project.description || 'Description non disponible';
  const terrainName = project.location.region || 'Terrain'; // need verification
  const currentFunding = localCurrentFunding;
  const fundingGap = project.fundingGoal ? project.fundingGoal - localCurrentFunding : 0;

  const handlePhotoNavigation = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentPhotoIndex((prev) => (prev === 0 ? displayedPhotos.length - 1 : prev - 1));
    } else {
      setCurrentPhotoIndex((prev) => (prev === displayedPhotos.length - 1 ? 0 : prev + 1));
    }
  };

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return '0 Ar';
    return new Intl.NumberFormat('fr-MG', {
      style: 'currency',
      currency: 'MGA',
      minimumFractionDigits: 0,
    })
      .format(amount)
      .replace('MGA', 'Ar');
  };

  const handleLike = () => {
    toggleProjectLike();
  };

  const handleOpenInvestModal = () => {
    setShowInvestModal(true);
  };

  const handleInvestmentComplete = (amount: number) => {
    // Calculer le nouveau financement
    let newFunding = localCurrentFunding + amount;
    if (newFunding > project.fundingGoal) {
      newFunding = project.fundingGoal;
    }

    // Mettre à jour le financement local
    setLocalCurrentFunding(newFunding);
  };
  const projectId = project.id;

  const projectUrl = `https://maintsovola.com/feed?id_projet=${projectId}`; // Todo : Mbola mila amboarina ny URL

  const shareHandlers = {
    facebook: async () => {
      try {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(projectUrl)}`;
        await Linking.openURL(url);
      } catch (error) {
        Alert.alert('Erreur', "Impossible d'ouvrir Facebook");
      }
      setShowShareMenu(false);
    },
    whatsapp: async () => {
      try {
        const url = `whatsapp://send?text=${encodeURIComponent(projectUrl)}`;
        await Linking.openURL(url);
      } catch (error) {
        Alert.alert('Erreur', "WhatsApp n'est pas installé");
      }
      setShowShareMenu(false);
    },
    mail: async () => {
      try {
        const url = `mailto:?body=${encodeURIComponent(projectUrl)}`;
        await Linking.openURL(url);
      } catch (error) {
        Alert.alert('Erreur', "Impossible d'ouvrir l'application mail");
      }
      setShowShareMenu(false);
    },
    copyLink: async () => {
      try {
        // Pour React Native, on peut utiliser une approche différente selon la plateforme
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          await navigator.clipboard.writeText(projectUrl);
        } else {
          // Fallback pour les environnements où clipboard n'est pas disponible
          Alert.alert('Lien copié', projectUrl);
        }
        Alert.alert('Succès', 'Lien copié dans le presse-papiers');
      } catch (error) {
        Alert.alert('Erreur', 'Impossible de copier le lien');
      }
      setShowShareMenu(false);
    },
  };

  const handleViewGallery = (defaultTab: 'Photos' | 'Carte' = 'Photos') => {
    console.log('Opening gallery with photos:', project.photos);
    setGalleryDefaultTab(defaultTab);
    setShowGallery(true);
  };

  const handleViewPhotos = () => {
    handleViewGallery('Photos');
  };

  const handleViewMap = () => {
    handleViewGallery('Carte');
  };

  return (
    <View className="mb-4 rounded-lg border border-gray-100 bg-white shadow-sm">
      {/* Header with user info */}
      <View className="p-4">
        <View className="mb-3 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => {
                router.push(`/profil/${project.farmer?.id}`);
              }}
              className="h-10 w-10 items-center justify-center rounded-full bg-gray-300">
              {project.farmer?.avatar ? (
                <Image source={{ uri: project.farmer.avatar }} className="h-12 w-12 rounded-full" />
              ) : (
                <Text className="text-lg font-semibold text-gray-600">
                  {project.farmer?.name?.charAt(0) || 'A'}
                </Text>
              )}
            </TouchableOpacity>
            <View className="ml-3">
              <TouchableOpacity
                onPress={() => {
                  router.push(`/profil/${project.farmer?.id}`);
                }}>
                <Text className="text-md font-semibold text-gray-900">
                  {project.farmer?.name || 'Agriculteur'}
                </Text>
              </TouchableOpacity>
              <Text className="text-xs text-gray-500">
                {new Date(project.creationDate).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </Text>
            </View>
          </View>
        </View>

        {/* Title and Description */}
        <View className="mb-3">
          <Text className="mb-1 text-base font-semibold text-green-700">{displayTitle}</Text>
          <Text className="text-sm text-gray-700">{displayDescription}</Text>
        </View>

        {/* Photo Gallery */}
        {displayedPhotos.length > 0 && (
          <View className="relative mb-4 overflow-hidden rounded-md">
            <Image
              source={{ uri: displayedPhotos[currentPhotoIndex] }}
              className="h-48 w-full"
              style={{ resizeMode: 'cover' }}
            />
            {displayedPhotos.length > 1 && (
              <>
                <TouchableOpacity
                  onPress={() => handlePhotoNavigation('prev')}
                  className="absolute left-2 top-1/2 h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/30">
                  <Ionicons name="chevron-back" size={20} color="#ffffff" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handlePhotoNavigation('next')}
                  className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/30">
                  <Ionicons name="chevron-forward" size={20} color="#ffffff" />
                </TouchableOpacity>
                <View className="absolute bottom-2 right-2 rounded-md bg-black/50 px-2 py-1">
                  <Text className="text-xs text-white">
                    {currentPhotoIndex + 1} / {displayedPhotos.length}
                  </Text>
                </View>
              </>
            )}
          </View>
        )}

        {/* Financial Details */}
        <TouchableOpacity className="mb-4 rounded-md bg-gray-100 p-2" onPress={openFinancialModal}>
          <View className="mb-2 flex-row gap-2">
            <View className="flex-1">
              <Text className="text-xs text-gray-500">Coût d&apos;exploitation</Text>
              <View className="flex-row items-center">
                <Text className="font-medium">{formatCurrency(project.farmingCost)}</Text>
                <FontAwesome5
                  name="money-bill-wave"
                  size={12}
                  color="#16a34a"
                  style={{ marginLeft: 4 }}
                />
              </View>
            </View>
            <View className="flex-1">
              <Text className="text-xs text-gray-500">Rendement prévu</Text>
              <View className="flex-row items-center">
                <Text className="font-medium">{project.expectedYield || 'N/A'}</Text>
              </View>
            </View>
          </View>
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Text className="text-xs text-gray-500">Revenu estimé</Text>
              <View className="flex-row items-center">
                <Text className="font-medium">{formatCurrency(project.expectedRevenue)}</Text>
                <FontAwesome5
                  name="money-bill-wave"
                  size={12}
                  color="#16a34a"
                  style={{ marginLeft: 4 }}
                />
              </View>
            </View>
            <View className="flex-1">
              <Text className="text-xs text-gray-500">Bénéfice total</Text>
              <View className="flex-row items-center">
                <Text className="font-medium">{formatCurrency(project.totalProfit)}</Text>
                <FontAwesome5
                  name="money-bill-wave"
                  size={12}
                  color="#16a34a"
                  style={{ marginLeft: 4 }}
                />
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Funding Progress */}
        <View className="mb-4">
          <View className="mb-1 flex-row items-center justify-between">
            <Text className="text-xs">Financement</Text>
            <Text className="text-xs font-medium">
              {formatCurrency(currentFunding)} / {formatCurrency(project.fundingGoal)}
            </Text>
          </View>
          <View className="h-2.5 w-full rounded-full bg-gray-200">
            <View
              className="h-2.5 rounded-full bg-green-500"
              style={{
                width: `${Math.min(100, (currentFunding / (project.fundingGoal || 1)) * 100)}%`,
              }}
            />
          </View>
        </View>

        {/* Additional Details Section - Hidden by default */}
        {showMoreDetails && (
          <View className="mb-4">
            {/* Action Buttons */}
            <View className="mb-4 flex-row gap-2">
              <TouchableOpacity
                onPress={handleViewPhotos}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-md border border-green-600 px-3 py-2">
                <Ionicons name="camera-outline" size={18} color="#16a34a" />
                <Text className="text-sm font-medium text-green-600">Voir les photos</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleViewMap}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-md border border-green-600 px-3 py-2">
                <Ionicons name="map-outline" size={18} color="#16a34a" />
                <Text className="text-sm font-medium text-green-600">Voir sur la carte</Text>
              </TouchableOpacity>
            </View>

            {/* Project Details Grid */}
            <View className="mb-4">
              <View className="mb-3 flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-xs text-gray-500">Culture</Text>
                  <TouchableOpacity
                    onPress={() => {
                      onCultureFilter?.(project.cultivationType || '');
                    }}
                    className="flex-row items-center gap-1">
                    <Text className="font-medium text-green-700">
                      {project.cultivationType || 'N/A'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500">Terrain</Text>
                  <TouchableOpacity
                    onPress={() => onCommuneFilter?.(project.location?.commune || '')}>
                    <Text className="font-medium text-gray-800 underline">
                      {terrainName} ({project.cultivationArea || 0} ha)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-xs text-gray-500">Localisation</Text>
                  <TouchableOpacity
                    onPress={() => onCommuneFilter?.(project.location?.commune || '')}>
                    <Text className="font-medium text-green-700">
                      {project.location?.commune || 'N/A'}, {project.location?.district || 'N/A'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500">Région</Text>
                  <TouchableOpacity
                    onPress={() => onRegionFilter?.(project.location?.region || '')}>
                    <Text className="font-medium text-green-700">
                      {project.location?.region || 'N/A'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Technician Info */}
            {project.technicianId && (
              <View className="mb-4 rounded-md bg-gray-100 p-2">
                <View className="flex-row items-center">
                  <Ionicons name="shield-checkmark" size={16} color="#16a34a" />
                  <Text className="ml-2 flex-1 text-xs font-medium">
                    Contactez votre technicien agricole pour plus de détails.
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Show More Details Button */}
        <TouchableOpacity onPress={() => setShowMoreDetails(!showMoreDetails)} className="">
          <Text className={`mb-1  text-sm text-gray-600 `}>
            {showMoreDetails ? 'Voir moins...' : 'Voir plus ...'}
          </Text>
        </TouchableOpacity>

        {/* Action Buttons */}
        <View className="flex-row items-center justify-between border-t border-gray-100 pt-4">
          {/* Invest Button */}
          {
            <TouchableOpacity
              onPress={handleOpenInvestModal}
              disabled={fundingGap === 0}
              className={`flex-row items-center gap-1 rounded-md px-3 py-2 ${
                fundingGap === 0 ? 'bg-gray-300' : 'bg-green-600'
              }`}>
              {/* Replace MaterialIcons with Feather */}
              <Feather
                name="dollar-sign"
                size={16}
                color={fundingGap === 0 ? '#6b7280' : '#ffffff'}
              />
              <Text
                className={`text-xs font-medium ${
                  fundingGap === 0 ? 'text-gray-500' : 'text-white'
                }`}>
                {fundingGap > 0 ? 'Investir' : 'Financé'}
              </Text>
            </TouchableOpacity>
          }

          {/* Like Button */}
          <TouchableOpacity onPress={handleLike} className="flex-row items-center gap-1 px-2 py-1">
            {likesCount > 0 && (
              <Text className={`text-sm ${isLiked ? 'text-red-500' : 'text-gray-500'}`}>
                {likesCount}
              </Text>
            )}
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={18}
              color={isLiked ? '#ef4444' : '#6b7280'}
            />
          </TouchableOpacity>

          {/* Comment Button */}
          <TouchableOpacity
            onPress={() => setShowComments(!showComments)}
            className={`flex-row items-center gap-1 rounded-lg px-5 py-2 ${showComments ? 'bg-gray-100' : ''}`}>
            <Ionicons name="chatbubble-outline" size={18} color="#6b7280" />
            <Text className="text-sm font-normal text-gray-500">
              {comments.filter((c) => !c.id_parent_commentaire).length}
            </Text>
          </TouchableOpacity>

          {/* Share Button */}
          <View className="relative">
            <TouchableOpacity
              onPress={() => setShowShareMenu(!showShareMenu)}
              className="flex-row items-center gap-1 px-2 py-1">
              <Ionicons name="share-outline" size={18} color="#6b7280" />
            </TouchableOpacity>

            {/* Share Menu Dropdown */}
            {showShareMenu && (
              <View
                className="elevation-5 absolute bottom-full right-0 mb-2 w-48 rounded-lg border border-gray-200 bg-white shadow-lg"
                style={{ zIndex: 999 }}>
                <TouchableOpacity
                  onPress={shareHandlers.facebook}
                  className="flex-row items-center gap-3 border-b border-gray-100 px-4 py-3">
                  <Ionicons name="logo-facebook" size={20} color="#1877F2" />
                  <Text className="text-sm text-gray-700">Partager sur Facebook</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={shareHandlers.whatsapp}
                  className="flex-row items-center gap-3 border-b border-gray-100 px-4 py-3">
                  <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                  <Text className="text-sm text-gray-700">Partager sur WhatsApp</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={shareHandlers.mail}
                  className="flex-row items-center gap-3 border-b border-gray-100 px-4 py-3">
                  <Ionicons name="mail-outline" size={20} color="#6b7280" />
                  <Text className="text-sm text-gray-700">Envoyer par email</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={shareHandlers.copyLink}
                  className="flex-row items-center gap-3 rounded-b-lg px-4 py-3">
                  <Ionicons name="copy-outline" size={20} color="#6b7280" />
                  <Text className="text-sm text-gray-700">Copier le lien</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Comments Section */}
        <CommentsSection projectId={project.id || 0} userId={userId} isVisible={showComments} />

        {/* Share Menu Overlay */}
        {showShareMenu && (
          <TouchableOpacity
            onPress={() => setShowShareMenu(false)}
            className="absolute inset-0"
            style={{ zIndex: 998 }}
            activeOpacity={1}
          />
        )}

        {/* Financial Details Modal */}
        <FinancialDetailsModal
          visible={showFinancialModal}
          onClose={closeFinancialModal}
          project={project}
          cultureDetails={cultureDetails}
          loading={financialDetailsLoading}
        />

        {/* Investment Modal */}
        <InvestmentModal
          visible={showInvestModal}
          onClose={() => setShowInvestModal(false)}
          project={project}
          fundingGap={fundingGap}
          currentFunding={currentFunding}
          onInvestmentComplete={handleInvestmentComplete}
          user={user}
        />

        {/* Gallery Modal */}
        <GaleryDetailModal
          projectId={project.id.toString()}
          defaultTab={galleryDefaultTab}
          visible={showGalery}
          onClose={() => setShowGallery(false)}
          photos={displayedPhotos}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    marginBottom: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
});

export default FeedCard;