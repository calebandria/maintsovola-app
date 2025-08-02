import React from 'react';
import { View, FlatList, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useProjectData } from '~/hooks/use-project-data';
import FeedCard from '~/components/feed/FeedCard';

export const PaginatedFeedExample = () => {
  // Utilisation du hook avec pagination
  const { projects, loading, loadingMore, error, hasMore, loadMore, refresh, toggleLike } =
    useProjectData(
      // Filtres
      {
        status: 'en financement',
        // region: 'Analamanga', // exemple de filtre par région
      },
      // Options de pagination
      {
        limit: 2, // 10 projets par page
      }
    );

  type Project = typeof projects extends (infer U)[] ? U : any;

  const renderProject = ({ item }: { item: Project }) => <FeedCard project={item} />;

  const renderFooter = () => {
    if (!hasMore) {
      return (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text>Aucun autre projet à charger</Text>
        </View>
      );
    }

    if (loadingMore) {
      return (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <ActivityIndicator size="small" />
          <Text>Chargement des projets...</Text>
        </View>
      );
    }

    return (
      <TouchableOpacity
        onPress={loadMore}
        style={{
          padding: 20,
          alignItems: 'center',
          backgroundColor: '#f0f0f0',
          margin: 10,
          borderRadius: 8,
        }}>
        <Text>Charger plus de projets</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text>Chargement des projets...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Erreur: {error}</Text>
        <TouchableOpacity
          onPress={refresh}
          style={{
            marginTop: 10,
            padding: 10,
            backgroundColor: '#007AFF',
            borderRadius: 5,
          }}>
          <Text style={{ color: 'white' }}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={projects}
      renderItem={renderProject}
      keyExtractor={(item) => item.id.toString()}
      onRefresh={refresh}
      refreshing={loading}
      ListFooterComponent={renderFooter}
      onEndReached={() => {
        if (!loadingMore && hasMore) {
          loadMore();
        }
      }}
      onEndReachedThreshold={0.1}
    />
  );
};

// Exemple d'utilisation avec différents filtres et pagination
export const FilteredPaginatedFeedExample = () => {
  const { projects, loading, loadingMore, hasMore, loadMore, refresh } = useProjectData(
    {
      followedUsersOnly: true, // Afficher seulement les projets des utilisateurs suivis
    },
    {
      limit: 5, // 5 projets par page
    }
  );

  // ... rest of the component
};

// Exemple pour un projet spécifique (pas de pagination nécessaire)
export const SingleProjectExample = ({ projectId }: { projectId: string }) => {
  const { projects, loading, error } = useProjectData({
    projectId,
  });

  const project = projects[0];

  if (loading) return <ActivityIndicator />;
  if (error) return <Text>Erreur: {error}</Text>;
  if (!project) return <Text>Projet non trouvé</Text>;

  return <FeedCard project={project} />;
};
