import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import SubNavTabs from '~/components/SubNavTabs';
import { useProjectData } from '~/hooks/use-project-data';
import FeedCard from '~/components/feed/FeedCard';
import FilterContainer from '~/components/FilterContainer';
import FilterInterface from '~/components/FilterInterface';
import { PaginatedFeedExample } from './PaginatedFeedExample';

export default function FeedScreen() {
  const tabs = ['Pour vous', 'Abonnements'];
  const [activeTab, setActiveTab] = useState('Pour vous');

  // État pour gérer les filtres
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  // Utilisation du hook avec les filtres et pagination
  const { projects, loading, loadingMore, error, hasMore, loadMore, refresh } = useProjectData(
    {
      followedUsersOnly: activeTab === 'Abonnements',
      status: 'en financement',
      ...activeFilters, // Spread des filtres actifs
    },
    {
      limit: 10, // 10 projets par page
    }
  );

  // Fonction pour ajouter un filtre
  const addFilter = (key: string, value: string) => {
    setActiveFilters((prev) => {
      const newFilters = {
        ...prev,
        [key]: value,
      };
      console.log('Filtres mis à jour:', newFilters);
      return newFilters;
    });
  };

  // Fonction pour supprimer un filtre spécifique
  const removeFilter = (key: string) => {
    setActiveFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  };

  // Fonction pour effacer tous les filtres
  const clearAllFilters = () => {
    setActiveFilters({});
  };

  // Fonctions pour ajouter des filtres spécifiques (exemples)
  const handleRegionFilter = (region: string) => {
    addFilter('region', region);
  };

  const handleDistrictFilter = (district: string) => {
    addFilter('district', district);
  };

  const handleCommuneFilter = (commune: string) => {
    addFilter('commune', commune);
  };

  const handleCultureFilter = (culture: string) => {
    addFilter('culture', culture);
  };

  const handleStatusFilter = (status: string) => {
    addFilter('status', status);
  };

  // Fonction pour rendre un projet
  const renderProject = ({ item }: { item: any }) => (
    <FeedCard
      project={item}
      onShare={() => handleShare(item.id)}
      onInvest={() => handleInvest(item.id)}
      onRegionFilter={handleRegionFilter}
      onDistrictFilter={handleDistrictFilter}
      onCommuneFilter={handleCommuneFilter}
      onCultureFilter={handleCultureFilter}
      onStatusFilter={handleStatusFilter}
    />
  );

  // Fonction pour rendre le footer avec bouton "Charger plus"
  const renderFooter = () => {
    if (!hasMore) {
      return (
        <View style={styles.footerContainer}>
          {/* <Text style={styles.footerText}>Aucun autre projet à charger</Text> */}
        </View>
      );
    }

    if (loadingMore) {
      return (
        <View style={styles.footerContainer}>
          <ActivityIndicator size="small" color="#16a34a" />
          <Text style={styles.footerText}>Chargement des projets...</Text>
        </View>
      );
    }

    return (
      <TouchableOpacity onPress={loadMore} style={styles.loadMoreButton}>
        <Text style={styles.loadMoreText}>Charger plus de projets</Text>
      </TouchableOpacity>
    );
  };

  // Fonction pour rendre la liste vide
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>Aucun projet disponible</Text>
      <Text style={styles.emptySubtext}>
        Revenez plus tard pour découvrir de nouveaux projets agricoles
      </Text>
    </View>
  );

  const handleShare = (projectId: number) => {
    console.log('Share project:', projectId);
    // Logique pour le partage à implémenter
  };

  const handleInvest = (projectId: number) => {
    console.log('Invest in project:', projectId);
    // Logique pour l'investissement à implémenter
  };

  if (loading && projects.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Projets en financement</Text>
        <SubNavTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        <FilterContainer
          filters={activeFilters}
          onRemove={removeFilter}
          onClearAll={clearAllFilters}
        />
        <View style={[styles.container, styles.centerContent]}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={styles.loadingText}>Chargement des projets...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Projets en financement</Text>
        <SubNavTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        <FilterContainer
          filters={activeFilters}
          onRemove={removeFilter}
          onClearAll={clearAllFilters}
        />
        <View style={[styles.container, styles.centerContent]}>
          <Text style={styles.errorText}>Erreur: {error}</Text>
          <TouchableOpacity onPress={refresh} style={styles.retryButton}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Projets en financement</Text>
      <SubNavTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Conteneur des filtres actifs */}
      <FilterContainer
        filters={activeFilters}
        onRemove={removeFilter}
        onClearAll={clearAllFilters}
      />

      {/* FlatList avec pagination infinie */}
      <FlatList
        data={projects}
        renderItem={renderProject}
        keyExtractor={(item) => item.id.toString()}
        onRefresh={refresh}
        refreshing={loading}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        onEndReached={() => {
          if (!loadingMore && hasMore) {
            console.log('Loading more projects...');

            loadMore();
          }
        }}
        onEndReachedThreshold={0.1}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        contentContainerStyle={{ flexGrow: 1 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  loadingText: { marginTop: 10, fontSize: 16, color: '#6B7280' },
  errorText: { fontSize: 16, color: '#EF4444', textAlign: 'center' },
  footerContainer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  loadMoreButton: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    margin: 10,
    borderRadius: 8,
  },
  loadMoreText: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  retryButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#16a34a',
    borderRadius: 5,
  },
  retryText: {
    color: 'white',
    fontWeight: '600',
  },
});
