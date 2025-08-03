import React, { useEffect, useState } from 'react';
import { View, FlatList, ActivityIndicator, Text, RefreshControl, StyleSheet } from 'react-native';
import FeedCard from './feed/FeedCard';
import { AgriculturalProject } from '~/hooks/use-project-data';

// Importer le type depuis le fichier de types

interface FeedListProps {
  projects: AgriculturalProject[]; // Projets optionnels passés en props (format hook)
  loading?: boolean; // État de chargement optionnel
  error?: string | null; // Erreur optionnelle
  userId?: number; // ID de l'utilisateur connecté
  onShare?: (projectId: number) => void;
  onInvest?: (projectId: number) => void;
  // Props pour la récupération automatique des données (si projects n'est pas fourni)
  followedUsersOnly?: boolean;
  status?: string;
  onRegionFilter?: (region: string) => void;
  onDistrictFilter?: (district: string) => void;
  onCommuneFilter?: (commune: string) => void;
  onCultureFilter?: (culture: string) => void;
  onStatusFilter?: (status: string) => void;
}

const FeedList: React.FC<FeedListProps> = ({
  projects: externalProjects,
  loading: externalLoading,
  error: externalError,
  userId,
  onShare,
  onInvest,
  followedUsersOnly,
  status,
  onRegionFilter,
  onDistrictFilter,
  onCommuneFilter,
  onCultureFilter,
  onStatusFilter,
}) => {
  const [internalProjects, setInternalProjects] = useState<AgriculturalProject[]>([]);
  const [internalLoading, setInternalLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  const projects = externalProjects;
  const loading = externalLoading !== undefined ? externalLoading : internalLoading;
  const error = externalError !== undefined ? externalError : internalError;

  const fetchProjects = async (isRefresh = false) => {
    // Ne récupérer les données que si elles ne sont pas fournies en externe
    if (externalProjects) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setInternalLoading(true);
      }
      setInternalError(null);
    } catch (err) {
      console.error('Erreur lors du chargement des projets:', err);
      setInternalError('Erreur lors du chargement des projets');
    } finally {
      setInternalLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Ne récupérer les données que si elles ne sont pas fournies en externe
    if (!externalProjects) {
      fetchProjects();
    }
  }, [externalProjects]);

  const onRefresh = () => {
    if (!externalProjects) {
      fetchProjects(true);
    }
  };

  const renderProject = ({ item }: { item: AgriculturalProject }) => {
    return (
      <FeedCard
        project={item}
        onShare={() => onShare?.(item.id)}
        onInvest={() => onInvest?.(item.id)}
        onRegionFilter={() => onRegionFilter?.(item.location.region)}
        onDistrictFilter={() => onDistrictFilter?.(item.location.district)}
        onCommuneFilter={() => {
          onCommuneFilter?.(item.location.commune);
        }}
        onCultureFilter={() => {
          onCultureFilter?.(item.cultivationType);
        }}
        onStatusFilter={() => onStatusFilter?.(item.status)}
      />
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>Aucun projet disponible</Text>
      <Text style={styles.emptySubtext}>
        Revenez plus tard pour découvrir de nouveaux projets agricoles
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>⚠️ {error}</Text>
      <Text style={styles.retryText} onPress={() => fetchProjects()}>
        Toucher pour réessayer
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Chargement des projets...</Text>
      </View>
    );
  }

  if (error && !refreshing && projects.length === 0) {
    return renderError();
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={projects}
        renderItem={renderProject}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#16a34a']}
            tintColor="#16a34a"
          />
        }
        ListEmptyComponent={renderEmpty}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  separator: {
    height: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    marginBottom: 12,
    textAlign: 'center',
  },
  retryText: {
    fontSize: 14,
    color: '#16a34a',
    textDecorationLine: 'underline',
  },
});

export default FeedList;
