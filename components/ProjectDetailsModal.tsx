// components/ProjectDetailsModal.tsx
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { InvestedProject as Project } from '../hooks/useInvestments';

interface ProjectDetailsModalProps {
  project: Project | null;
  visible: boolean;
  onClose: () => void;
}

export const ProjectDetailsModal = React.memo(
  ({ project, visible, onClose }: ProjectDetailsModalProps) => {
    if (!project) return null;

    const fundingPercentage = Math.min(
      100,
      (project.currentFunding / project.farmingCost) * 100
    );
    const progressColor =
      project.jalonProgress < 33
        ? 'bg-red-500'
        : project.jalonProgress < 66
        ? 'bg-yellow-400'
        : 'bg-green-500';

    return (
      <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
        <View className="flex-1 bg-black/60 justify-center p-4">
          <View className="bg-white rounded-2xl p-6 max-h-[90%] shadow-xl">
            <View className="flex-row justify-between items-center mb-6 pb-4 border-b border-gray-100">
              <Text className="text-2xl font-bold text-gray-900">Projet #{project.id}</Text>
              <TouchableOpacity
                onPress={onClose}
                className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
                activeOpacity={0.7}
              >
                <Text className="text-primary text-2xl">×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="mb-6 p-4 bg-gray-50 rounded-lg">
                <Text className="text-lg font-bold text-gray-900 mb-3">Aperçu du projet</Text>
                <View className="space-y-2">
                  {project.creator && (
                    <View className="flex-row items-start">
                      <Text className="text-gray-500 w-24">Propriétaire:</Text>
                      <Text className="text-gray-800 flex-1 font-medium">
                        {project.creator.name}
                      </Text>
                    </View>
                  )}
                  <View className="flex-row items-start">
                    <Text className="text-gray-500 w-24">Localisation:</Text>
                    <Text className="text-gray-800 flex-1">
                      {project.location.region}, {project.location.district},{' '}
                      {project.location.commune}
                    </Text>
                  </View>
                  <View className="flex-row items-start">
                    <Text className="text-gray-500 w-24">Cultures:</Text>
                    <Text className="text-gray-800 flex-1 font-medium">
                      {project.cultivationType}
                    </Text>
                  </View>
                  <View className="flex-row items-start">
                    <Text className="text-gray-500 w-24">Description:</Text>
                    <Text className="text-gray-800 flex-1">{project.description}</Text>
                  </View>
                </View>
              </View>

              <View className="mb-6 p-4 bg-gray-50 rounded-lg">
                <Text className="text-lg font-bold text-gray-900 mb-3">
                  Détails du terrain{' '}
                  <Text className="text-gray-500 font-normal">({project.cultivationArea} ha)</Text>
                </Text>
                <View className="flex-row items-center">
                  <Text className="text-gray-500 mr-2">Statut:</Text>
                  <View
                    className={`px-3 py-1 rounded-full ${
                      project.status === 'Active'
                        ? 'bg-green-100 text-green-800'
                        : project.status === 'Pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <Text className="font-medium text-sm">{project.status}</Text>
                  </View>
                </View>
              </View>

              <View className="mb-6 p-4 bg-gray-50 rounded-lg">
                <Text className="text-lg font-bold text-gray-900 mb-3">Financement</Text>
                <View className="space-y-3">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-gray-600">Coût d&apos;exploitation:</Text>
                    <Text className="font-bold text-gray-900">
                      {project.farmingCost.toLocaleString()} MGA
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-gray-600">Revenu estimé:</Text>
                    <Text className="font-bold text-green-600">
                      {project.expectedRevenue.toLocaleString()} MGA
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center border-t border-gray-100 pt-3">
                    <Text className="text-gray-600 font-medium">Bénéfice total:</Text>
                    <Text className="font-bold text-green-700 text-lg">
                      {project.totalProfit.toLocaleString()} MGA
                    </Text>
                  </View>
                </View>
              </View>

              <View className="mb-6 p-4 bg-gray-50 rounded-lg">
                <Text className="text-lg font-bold text-gray-900 mb-3">
                  Progression du financement
                </Text>
                <View className="mb-2 flex-row justify-between">
                  <Text className="text-gray-600 text-sm">
                    {project.currentFunding.toLocaleString()} MGA
                  </Text>
                  <Text className="text-gray-600 text-sm">
                    {project.farmingCost.toLocaleString()} MGA
                  </Text>
                </View>
                <View className="h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
                  <View
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${fundingPercentage}%` }}
                  />
                </View>
                <Text className="text-right text-primary font-medium">
                  {fundingPercentage.toFixed(1)}% financé
                </Text>
              </View>

              <View className="mb-6 p-4 bg-gray-50 rounded-lg">
                <Text className="text-lg font-bold text-gray-900 mb-3">Progression des jalons</Text>
                <View className="mb-2 flex-row justify-between">
                  <Text className="text-gray-600 text-sm">
                    {project.completedJalons} sur {project.totalJalons} terminés
                  </Text>
                  <Text className="text-gray-600 text-sm">
                    {Math.round(project.jalonProgress)}%
                  </Text>
                </View>
                <View className="h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
                  <View
                    className={`h-full rounded-full ${progressColor}`}
                    style={{ width: `${project.jalonProgress}%` }}
                  />
                </View>
              </View>

              {project.jalons?.length > 0 && (
                <View className="p-4 bg-gray-50 rounded-lg">
                  <Text className="text-lg font-bold text-gray-900 mb-3">Jalons</Text>
                  <View className="flex flex-col gap-3">
                    {project.jalons.map((jalon, index) => (
                      <View
                        key={`jalon-${index}`}
                        className="p-3 bg-white rounded-lg shadow-sm border border-gray-100"
                      >
                        <View className="flex-row justify-between items-start mb-1">
                          <Text className="font-medium text-gray-900">
                            {jalon.nom_jalon || `Jalon ${index + 1}`}
                          </Text>
                          {jalon.date_reelle ? (
                            <View className="px-2 py-1 bg-green-100 rounded-full">
                              <Text className="text-green-800 text-xs font-medium">Terminé</Text>
                            </View>
                          ) : (
                            <View className="px-2 py-1 bg-yellow-100 rounded-full">
                              <Text className="text-yellow-800 text-xs font-medium">En attente</Text>
                            </View>
                          )}
                        </View>
                        <View className="space-y-1">
                          {jalon.date_prevue && (
                            <Text className="text-gray-500 text-sm">
                              Prévu: {new Date(jalon.date_prevue).toLocaleDateString()}
                            </Text>
                          )}
                          {jalon.date_reelle && (
                            <Text className="text-gray-500 text-sm">
                              Réalisé: {new Date(jalon.date_reelle).toLocaleDateString()}
                            </Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  }
);