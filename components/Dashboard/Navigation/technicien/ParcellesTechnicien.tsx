import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { MapPin, Calendar, Sprout } from 'lucide-react-native';
import { useAssignedParcels } from '~/hooks/useAssignedParcels';
import { Card } from 'react-native-paper';
import { Badge } from '~/components/ui/terrain/Badge';
// import { AssignedParcel } from '~/types/technicien';
import { ProjectDetailsDialog } from '~/components/Dashboard/Navigation/technicien/ProjectDetailDialog';
import { TerrainCardDialog } from '~/components/terrain/TerrainCardDialog';

interface AssignedParcelsViewProps {
  userId: string;
  userRole: string;
}

const AssignedParcelsView: React.FC<AssignedParcelsViewProps> = ({
  userId,
  userRole 
}) => {
  const { parcels, loading, error } = useAssignedParcels(userId, userRole);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedTerrainId, setSelectedTerrainId] = useState<number | null>(null);

  if (loading) {
    return (
      <View className="flex-1 justify-center py-8">
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="items-center py-8">
        <Text className="text-red-500 font-bold">Erreur: {error}</Text>
      </View>
    );
  }

  const getJalonStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'terminé': return 'bg-green-100 text-green-700';
      case 'en cours': return 'bg-green-200 text-green-800';
      case 'en attente': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="flex-row items-center justify-between mb-4 px-4">
          <Text className="text-2xl font-bold text-green-700" numberOfLines={1} ellipsizeMode="tail">
            Parcelles assignées
          </Text>
          <Badge variant="outline">{parcels.length} parcelle(s)</Badge>
        </View>

        {parcels.length === 0 ? (
          <View className="items-center py-12">
            <Sprout size={48} color="#22c55e" style={{ opacity: 0.5, marginBottom: 16 }} />
            <Text className="text-gray-500 text-lg">Aucune parcelle assignée</Text>
          </View>
        ) : (
          <View className="gap-4 px-2">
            {parcels.map((parcel) => (
              <Card
                key={parcel.id_projet}
                style={{
                  padding: 16,
                  borderRadius: 16,
                  elevation: 2,
                  backgroundColor: '#fff',
                  marginBottom: 8
                }}
              >
                <View className="pt-3">
                  <TouchableOpacity onPress={() => setSelectedProjectId(parcel.id_projet)}>
                    <Text
                      className="text-lg font-semibold text-green-700"
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {parcel.titre}
                    </Text>
                  </TouchableOpacity>
                  <View className="flex-row items-center mt-2">
                    <MapPin size={16} color="#22c55e" />
                    <Text
                      className="text-base text-gray-600 ml-2 flex-1"
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {parcel.localisation.region}, {parcel.localisation.district}
                    </Text>
                  </View>
                  {parcel.nom_terrain && parcel.id_terrain && (
                    <View className="mt-1 flex-row flex-wrap items-center">
                      <Text className="text-base text-gray-600">
                        Terrain:{' '}
                      </Text>
                      <TouchableOpacity onPress={() => typeof parcel.id_terrain === 'number' ? setSelectedTerrainId(parcel.id_terrain) : setSelectedTerrainId(null)}>
                        <Text
                          className="text-green-700 font-medium"
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {parcel.nom_terrain}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                <View className="gap-3 mt-2">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-base font-medium text-gray-700">Surface:</Text>
                    <Text className="text-base text-gray-700">{parcel.surface_ha} ha</Text>
                  </View>

                  <View className="gap-2">
                    <Text className="text-base font-medium text-gray-700">Cultures:</Text>
                    {parcel.cultures.map((culture, idx) => (
                      <View key={idx} className="mb-1">
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center space-x-2 flex-1">
                            <Sprout size={16} color="#22c55e" />
                            <Text
                              className="text-base text-gray-700 flex-1"
                              numberOfLines={1}
                              ellipsizeMode="tail"
                            >
                              {culture.nom_culture}
                            </Text>
                          </View>
                          <View className={`rounded-full px-2 py-1 ${getJalonStatusColor(culture.statut_jalon)}`}>
                            <Text className="text-xs font-bold" numberOfLines={1} ellipsizeMode="tail">
                              {culture.statut_jalon}
                            </Text>
                          </View>
                        </View>
                        {culture.dernier_jalon && (
                          <View className="flex-row items-center justify-between ml-6">
                            <Text className="text-xs text-gray-500" numberOfLines={1} ellipsizeMode="tail">
                              {formatDate(culture.date_dernier_jalon || '')}
                            </Text>
                            <Text className="text-xs text-gray-500" numberOfLines={1} ellipsizeMode="tail">
                              {culture.dernier_jalon}
                            </Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>

                  {parcel.date_debut_production && (
                    <View className="flex-row items-center space-x-2">
                      <Calendar size={16} color="#22c55e" />
                      <Text className="text-base text-gray-600" numberOfLines={1} ellipsizeMode="tail">
                        Début: {new Date(parcel.date_debut_production).toLocaleDateString()}
                      </Text>
                    </View>
                  )}

                  {parcel.prochaines_actions.length > 0 && (
                    <View className="pt-2 border-t border-gray-200">
                      <Text className="text-base font-medium text-gray-700">Prochaines actions:</Text>
                      <View className="mt-1">
                        {parcel.prochaines_actions.slice(0, 2).map((action, idx) => (
                          <Text key={idx} className="text-xs text-green-700" numberOfLines={2} ellipsizeMode="tail">
                            • {action}
                          </Text>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
      {selectedProjectId && (
        <ProjectDetailsDialog
          isOpen={!!selectedProjectId}
          onClose={() => setSelectedProjectId(null)}
          projectId={selectedProjectId}
          userRole={userRole}
        />
      )}

      {selectedTerrainId && (
        <TerrainCardDialog
          isOpen={!!selectedTerrainId}
          onClose={() => setSelectedTerrainId(null)}
          terrainId={selectedTerrainId}
        />
      )}
    </View>
  );
};

export default AssignedParcelsView;