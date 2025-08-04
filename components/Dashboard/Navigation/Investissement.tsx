import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, FlatList } from 'react-native';
import { useAuth } from '~/contexts/AuthContext';
import { useInvestments, InvestedProject } from '../../../hooks/useInvestments';

// Imports individuels pour chaque composant
import { InvestmentSummaryCard } from '~/components/InvestmentSummaryCard';
import { ProjectCard } from '../../../components/ProjectCard';
import { ProjectDetailsModal } from '~/components/ProjectDetailsModal';

export default function InvestmentsScreen() {
  const { user } = useAuth();
  // Utilisation du hook optimisé useInvestments
  const {
    investedProjects,
    investmentSummary,
    loading,
    error,
    refresh,
  } = useInvestments(user?.id || '');

  const [selectedProject, setSelectedProject] = useState<InvestedProject | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Fonction de rappel pour afficher les détails du projet, stable car peu de dépendances
  const handleViewDetails = (project: InvestedProject) => {
    setSelectedProject(project);
    setModalVisible(true);
  };

  // keyExtractor optimisé pour FlatList, basé sur l'ID unique du projet
  const getProjectKey = (item: InvestedProject) => {
    return `${item.id}-${Math.random()*50000}`; // Ajout d'un random pour éviter les conflits de clés
  };

  // Affichage conditionnel basé sur l'état de chargement et d'erreur
  if (loading && investedProjects.length === 0) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#125b47" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-red-500 text-center mb-4">{error}</Text>
        <TouchableOpacity
          onPress={refresh}
          className="bg-primary py-2 px-4 rounded"
          accessibilityLabel="Réessayer de charger les investissements"
        >
          <Text className="text-white">Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        className="flex-1 bg-gray-50 p-4"
        // Le `refreshControl` permet à l'utilisateur de rafraîchir la liste en tirant vers le bas
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} colors={['#125b47']} />
        }
      >
        {/* Affichage du résumé des investissements si disponible */}
        {investmentSummary && <InvestmentSummaryCard summary={investmentSummary} />}

        <Text className="text-xl font-bold mb-4 text-gray-800">Mes Projets Investis</Text>

        {/* FlatList pour un rendu performant des listes d'éléments */}
        <FlatList
          data={investedProjects}
          scrollEnabled={false} // Désactivé car la ScrollView parente gère le défilement
          keyExtractor={getProjectKey}
          renderItem={({ item }) => (
            <ProjectCard project={item} onViewDetails={handleViewDetails} />
          )}
          ListEmptyComponent={
            <View className="bg-white rounded-lg p-6 items-center">
              <Text className="text-gray-500 mb-4 text-center">Aucun projet investi pour le moment</Text>
              <TouchableOpacity
                className="bg-primary py-2 px-4 rounded"
                accessibilityLabel="Explorer les projets"
              >
                <Text className="text-white">Explorer les projets</Text>
              </TouchableOpacity>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </ScrollView>

      {/* Modale des détails du projet, affichée conditionnellement */}
      <ProjectDetailsModal
        project={selectedProject}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}