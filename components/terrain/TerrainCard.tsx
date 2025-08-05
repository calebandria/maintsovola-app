import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  Image,
  FlatList,
  Dimensions,
} from 'react-native';
import { Polygon, UrlTile } from 'react-native-maps';
import MapView from 'react-native-maps';
import { Button } from 'components/terrain/button';
import { TerrainData } from '../../types/Terrain';
import { useAuth } from 'contexts/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import { Pencil, Trash2, Mail, User, MapPin, Calendar, Check, X } from 'lucide-react';
import ProjectPhotosGallery from 'components/ProjectPhotosGallery';
import UserAvatar from 'components/terrain/UserAvatar';
import { supabase } from 'integrations/supabase/client';
import Toast from 'react-native-toast-message';

interface TerrainCardProps {
  isOpen: boolean;
  onClose: () => void;
  terrain: TerrainData;
  onTerrainUpdate?: (terrain: TerrainData, action?: 'update' | 'delete') => void;
  userRole?: string;
  isDeleteMode?: boolean;
}

const TerrainCard: React.FC<TerrainCardProps> = ({
  isOpen,
  onClose,
  terrain,
  onTerrainUpdate,
  userRole = 'simple',
  isDeleteMode = false,
}) => {
  const { user } = useAuth();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [photoGalleryOpen, setPhotoGalleryOpen] = useState(false);
  const [validationPhotoGalleryOpen, setValidationPhotoGalleryOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  const canModify =
    userRole === 'admin' ||
    (userRole === 'technicien' && terrain.id_technicien === user?.id) ||
    userRole === 'superviseur' ||
    (userRole === 'simple' && terrain.id_tantsaha === user?.id);
  const canDelete =
    userRole === 'admin' ||
    userRole === 'superviseur' ||
    (userRole === 'simple' && terrain.id_tantsaha === user?.id && !terrain.statut);

  // Convert polygon coordinates from GeoJSON to MapView format
  const getPolygonCoordinates = () => {
    if (!terrain.geom) return [];

    try {
      const geomData = typeof terrain.geom === 'string' ? JSON.parse(terrain.geom) : terrain.geom;

      if (geomData && geomData.coordinates && geomData.coordinates[0]) {
        return geomData.coordinates[0].map((coord: number[]) => ({
          latitude: coord[1],
          longitude: coord[0],
        }));
      }
    } catch (error) {
      console.error('Error parsing polygon geometry:', error);
    }

    return [];
  };

  const polygonCoordinates = getPolygonCoordinates();

  // Get photo arrays
  const getPhotos = () => {
    if (!terrain.photos) return [];

    return typeof terrain.photos === 'string'
      ? terrain.photos.split(',').filter((p) => p.trim() !== '')
      : Array.isArray(terrain.photos)
        ? terrain.photos.filter((p) => p)
        : [];
  };

  const getValidationPhotos = () => {
    if (!terrain.photos_validation) return [];

    return typeof terrain.photos_validation === 'string'
      ? terrain.photos_validation.split(',').filter((p) => p.trim() !== '')
      : Array.isArray(terrain.photos_validation)
        ? terrain.photos_validation.filter((p) => p)
        : [];
  };

  const photos = getPhotos();
  const validationPhotos = getValidationPhotos();

  const handleDelete = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('terrain')
        .update({ archive: true })
        .eq('id_terrain', terrain.id_terrain ?? 0);

      if (error) throw error;
      Toast.show({
        type: 'success',
        text1: 'Succès',
        text2: 'Terrain supprimé avec succès',
      });
      if (onTerrainUpdate) {
        onTerrainUpdate({ ...terrain, archive: true }, 'delete');
      }

      setIsDeleteConfirmOpen(false);
      onClose();
    } catch (error: any) {
      console.error('Error deleting terrain:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: `Erreur: ${error.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  if (isDeleteMode) {
    return (
      <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le terrain</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le terrain {terrain.nom_terrain} ? Cette action ne
              peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading} onPress={() => onClose()}>
              <Text>Annuler</Text>
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isLoading}
              onPress={handleDelete}
              style={styles.destructiveButton}>
              <Text>{isLoading ? 'Suppression...' : 'Supprimer'}</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <>
      <Modal visible={isOpen} animationType="slide" onRequestClose={onClose}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>{terrain.nom_terrain}</Text>
            <Button
              variant="ghost"
              size="icon"
              onPress={onClose}
              icon={<X size={24} color="#000" />}
            />
          </View>

          <Text style={styles.description}>Détails du terrain #{terrain.id_terrain}</Text>

          <View style={styles.tabsContainer}>
            <Button
              variant={activeTab === 'details' ? 'secondary' : 'ghost'}
              size="sm"
              onPress={() => setActiveTab('details')}
              title="Détails du terrain"
            />
            <Button
              variant={activeTab === 'validation' ? 'secondary' : 'ghost'}
              size="sm"
              onPress={() => setActiveTab('validation')}
              title="Rapport de validation"
              disabled={!terrain.statut}
            />
          </View>

          <ScrollView style={styles.contentContainer}>
            {activeTab === 'details' ? (
              <View style={styles.detailsContainer}>
                <View style={styles.card}>
                  <View style={styles.cardContent}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Proposé par</Text>
                      <View style={styles.detailValue}>
                        <UserAvatar
                          name={terrain.tantsahaNom || 'Utilisateur'}
                          size="sm"
                          photoUrl={undefined}
                        />
                        <Text style={styles.detailText}>
                          {terrain.tantsahaNom || 'Non spécifié'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Surface proposée</Text>
                      <Text style={styles.detailText}>{terrain.surface_proposee} hectares</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Localisation</Text>
                      <Text style={[styles.detailText, styles.textRight]}>
                        {terrain.commune_name}, {terrain.district_name}, {terrain.region_name}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Accès à l&apos;eau</Text>
                      {terrain.acces_eau ? (
                        <Check size={20} color="#10B981" />
                      ) : (
                        <X size={20} color="#EF4444" />
                      )}
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Accès à la route</Text>
                      {terrain.acces_route ? (
                        <Check size={20} color="#10B981" />
                      ) : (
                        <X size={20} color="#EF4444" />
                      )}
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Statut</Text>
                      <Text
                        style={[
                          styles.detailText,
                          terrain.statut ? styles.textSuccess : styles.textWarning,
                        ]}>
                        {terrain.statut ? 'Validé' : 'En attente de validation'}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Technicien assigné</Text>
                      <View style={styles.detailValue}>
                        <UserAvatar
                          name={terrain.techniqueNom || 'Non assigné'}
                          size="sm"
                          photoUrl={undefined}
                        />
                        <Text style={styles.detailText}>
                          {terrain.techniqueNom || 'Non assigné'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.mapPhotoContainer}>
                  <View style={styles.mapContainer}>
                    {polygonCoordinates.length > 0 ? (
                      <MapView
                        style={styles.map}
                        initialRegion={{
                          latitude: polygonCoordinates[0].latitude,
                          longitude: polygonCoordinates[0].longitude,
                          latitudeDelta: 0.01,
                          longitudeDelta: 0.01,
                        }}>
                        <UrlTile
                          urlTemplate="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          maximumZ={19}
                          tileSize={256}
                        />
                        <Polygon
                          coordinates={polygonCoordinates}
                          strokeColor="red"
                          fillColor="rgba(255,0,0,0.3)"
                          strokeWidth={2}
                        />
                      </MapView>
                    ) : (
                      <View style={styles.noMapData}>
                        <Text style={styles.noMapDataText}>Aucune donnée de carte disponible</Text>
                      </View>
                    )}
                  </View>

                  {photos.length > 0 && (
                    <View style={styles.card}>
                      <View style={styles.cardContent}>
                        <View style={styles.photoHeader}>
                          <Text style={styles.photoTitle}>Photos</Text>
                          <Button
                            variant="outline"
                            size="sm"
                            onPress={() => setPhotoGalleryOpen(true)}
                            title="Voir toutes"
                          />
                        </View>
                        <View style={styles.photoGrid}>
                          {photos.slice(0, 3).map((photo, index) => (
                            <View key={index} style={styles.photoItem}>
                              <Image
                                source={{ uri: photo }}
                                style={styles.photoImage}
                                resizeMode="cover"
                              />
                            </View>
                          ))}
                          {photos.length > 3 && (
                            <View style={styles.photoMore}>
                              <Text style={styles.photoMoreText}>+{photos.length - 3}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            ) : (
              <View style={styles.validationContainer}>
                {terrain.statut ? (
                  <View style={styles.validationContent}>
                    <View style={styles.card}>
                      <View style={styles.cardContent}>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Validé par</Text>
                          <View style={styles.detailValue}>
                            <UserAvatar
                              name={terrain.superviseurNom || 'Non spécifié'}
                              size="sm"
                              photoUrl={undefined}
                            />
                            <Text style={styles.detailText}>
                              {terrain.superviseurNom || 'Non spécifié'}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Date de validation</Text>
                          <Text style={styles.detailText}>
                            {terrain.date_validation
                              ? new Date(terrain.date_validation).toLocaleDateString()
                              : 'N/A'}
                          </Text>
                        </View>

                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Surface validée</Text>
                          <Text style={styles.detailText}>
                            {terrain.surface_validee || terrain.surface_proposee} hectares
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.card}>
                      <View style={styles.cardContent}>
                        <Text style={styles.reportTitle}>Rapport de validation</Text>
                        <Text style={styles.reportText}>
                          {terrain.rapport_validation || 'Aucun rapport fourni'}
                        </Text>
                      </View>
                    </View>

                    {validationPhotos.length > 0 && (
                      <View style={styles.card}>
                        <View style={styles.cardContent}>
                          <View style={styles.photoHeader}>
                            <Text style={styles.photoTitle}>Photos de validation</Text>
                            <Button
                              variant="outline"
                              size="sm"
                              onPress={() => setValidationPhotoGalleryOpen(true)}
                              title="Voir toutes"
                            />
                          </View>
                          <View style={styles.photoGrid}>
                            {validationPhotos.slice(0, 3).map((photo, index) => (
                              <View key={index} style={styles.photoItem}>
                                <Image
                                  source={{ uri: photo }}
                                  style={styles.photoImage}
                                  resizeMode="cover"
                                />
                              </View>
                            ))}
                            {validationPhotos.length > 3 && (
                              <View style={styles.photoMore}>
                                <Text style={styles.photoMoreText}>
                                  +{validationPhotos.length - 3}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={styles.notValidated}>
                    <Text style={styles.notValidatedText}>
                      Ce terrain n&apos;a pas encore été validé
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            {canDelete && (
              <Button
                variant="destructive"
                onPress={() => setIsDeleteConfirmOpen(true)}
                icon={<Trash2 size={16} color="white" />}
                title="Supprimer"
              />
            )}
            <Button variant="outline" onPress={onClose} title="Fermer" />
          </View>
        </View>
      </Modal>

      {/* Delete confirmation */}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le terrain</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le terrain &apos;{terrain.nom_terrain}&apos;? Cette
              action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading} onPress={() => setIsDeleteConfirmOpen(false)}>
              <Text>Annuler</Text>
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isLoading}
              onPress={handleDelete}
              style={styles.destructiveButton}>
              <Text>{isLoading ? 'Suppression...' : 'Supprimer'}</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Photo galleries */}
      <ProjectPhotosGallery
        isOpen={photoGalleryOpen}
        onClose={() => setPhotoGalleryOpen(false)}
        photos={photos}
        title={`Photos: ${terrain.nom_terrain}`}
        terrainCoordinates={polygonCoordinates}
      />

      <ProjectPhotosGallery
        isOpen={validationPhotoGalleryOpen}
        onClose={() => setValidationPhotoGalleryOpen(false)}
        photos={validationPhotos}
        title={`Photos de validation: ${terrain.nom_terrain}`}
      />
    </>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  contentContainer: {
    flex: 1,
  },
  detailsContainer: {
    gap: 16,
  },
  validationContainer: {
    gap: 16,
  },
  validationContent: {
    gap: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardContent: {
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#111827',
  },
  textRight: {
    textAlign: 'right',
  },
  textSuccess: {
    color: '#10B981',
  },
  textWarning: {
    color: '#F59E0B',
  },
  mapPhotoContainer: {
    gap: 16,
  },
  mapContainer: {
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  noMapData: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  noMapDataText: {
    color: '#6B7280',
  },
  photoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  photoTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  photoGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  photoItem: {
    width: 80,
    height: 80,
    borderRadius: 4,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoMore: {
    width: 80,
    height: 80,
    borderRadius: 4,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoMoreText: {
    color: '#6B7280',
    fontSize: 16,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 8,
  },
  reportText: {
    fontSize: 14,
    color: '#6B7280',
  },
  notValidated: {
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notValidatedText: {
    fontSize: 14,
    color: '#6B7280',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    gap: 8,
  },
  destructiveButton: {
    backgroundColor: '#EF4444',
  },
});

export default TerrainCard;
