import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
  StatusBar,
  StyleSheet,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import Animated, {
  FadeInUp,
  FadeInLeft,
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { TrendingUp, Users, MapPin, FileText, ArrowRight, ChevronRight } from 'lucide-react-native';
import { supabase } from '../lib/data';
import logo from '../assets/maintsovola_logo_pm.png';
import { useRouter } from "expo-router"

const { width } = Dimensions.get('window');

// Types
interface Stats {
  totalUsers: number;
  totalProjects: number;
  totalHectares: number;
  totalInvestment: number;
}

interface FeaturedProject {
  id: string;
  title: string;
  description: string;
  image: string;
  progress: number;
  amount: string;
  target: string;
}

interface PopularCulture {
  id: string;
  name: string;
  count: number;
  image: string;
}

interface RecentProject {
  id: string;
  title: string;
  date: string;
  type: string;
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  heroContainer: {
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  heroName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e4a3a',
    textAlign: 'center',
    marginBottom: 16,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'column',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '100%',
    marginBottom: 16,
    borderRadius: 12,

  },
  statCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
    marginRight: 8,
  },
  mainContent: {
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontWeight: '500',
    color: '#10b981',
    marginRight: 4,
  },
  // Styles pour le carrousel de projets
  projectsCarousel: {
    paddingLeft: 16,
    paddingBottom: 10,
  },
  projectCard: {
    width: width * 0.85, // 85% de la largeur de l'écran
    marginRight: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  projectImage: {
    height: 160,
    width: '100%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  projectInfo: {
    padding: 16,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  projectDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressAmount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  progressTarget: {
    fontSize: 14,
    color: '#6b7280',
  },
  progressBar: {
    height: 10,
    backgroundColor: '#e5e7eb',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
    marginTop: 4,
  },
  projectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  projectButtonText: {
    fontWeight: '500',
    color: '#ffffff',
    marginRight: 8,
  },
  culturesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cultureCard: {
    width: '48%',
    marginBottom: 16,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  cultureImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 12,
  },
  cultureName: {
    fontWeight: '500',
    color: '#111827',
    textAlign: 'center',
  },
  cultureCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  quickNavContainer: {
    flexDirection: 'column',
    gap: 16,
    marginHorizontal: -4,
  },
  quickNavItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  quickNavButton: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 12,
  },
  quickNavIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 16,
  },
  quickNavTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  quickNavDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 16,
  },
  quickNavCta: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  quickNavCtaText: {
    fontWeight: '500',
    color: '#ffffff',
    marginRight: 8,
  },
  recentProjectItem: {
    marginBottom: 8,
    paddingVertical: 12,
    paddingLeft: 16,
    backgroundColor: 'rgba(249, 250, 251, 0.5)',
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  recentProjectContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  recentProjectInfo: {
    flex: 1,
    marginRight: 16,
  },
  recentProjectTitle: {
    fontWeight: '500',
    color: '#111827',
  },
  recentProjectType: {
    fontSize: 14,
    color: '#6b7280',
  },
  recentProjectDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  finalCta: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  finalCtaTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  finalCtaSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  finalCtaButtons: {
    flexDirection: 'row',
    width: '100%',
  },
  finalCtaButtonPrimary: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  finalCtaButtonSecondary: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  finalCtaButtonTextPrimary: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#ffffff',
  },
  finalCtaButtonTextSecondary: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#10b981',
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#6b7280',
    textAlign: 'center',
  },
  skeletonCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  skeletonLine: {
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
  },
  section: {
    marginBottom: 48,
  },
  // Styles pour les skeletons du carrousel
  projectCarouselSkeleton: {
    paddingLeft: 16,
  },
  projectSkeletonCard: {
    width: width * 0.85,
    marginRight: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
});

// Utilitaires
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-MG', {
    style: 'currency',
    currency: 'MGA',
    minimumFractionDigits: 0,
  }).format(amount);
};

// Composants de skeleton
const StatsSkeleton: React.FC = () => (
  <View style={styles.statsContainer}>
    {Array.from({ length: 4 }).map((_, index) => (
      <View key={index} style={styles.statCard}>
        <View style={[styles.statCardInner, styles.skeletonCard]}>
          <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]} />
          <View style={{ flex: 1 }}>
            <View style={[styles.skeletonLine, { height: 12, marginBottom: 8 }]} />
            <View style={[styles.skeletonLine, { height: 24, width: '75%' }]} />
          </View>
        </View>
      </View>
    ))}
  </View>
);

const ProjectCarouselSkeleton: React.FC<{ count: number }> = ({ count }) => (
  <View style={{ marginLeft: -16 }}>
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.projectCarouselSkeleton}
      data={Array.from({ length: count })}
      keyExtractor={(_, index) => `skeleton-${index}`}
      renderItem={({ index }) => (
        <View style={styles.projectSkeletonCard}>
          <View style={[styles.projectImage, { backgroundColor: '#e5e7eb' }]} />
          <View style={styles.projectInfo}>
            <View style={[styles.skeletonLine, { height: 20, marginBottom: 8 }]} />
            <View style={[styles.skeletonLine, { height: 16, width: '80%', marginBottom: 12 }]} />
            <View style={[styles.skeletonLine, { height: 8, marginBottom: 8 }]} />
            <View style={[styles.skeletonLine, { height: 32 }]} />
          </View>
        </View>
      )}
    />
  </View>
);

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { router } from 'expo-router';

type RootStackParamList = {
  Feed: { culture?: string } | undefined;
  Terrain: undefined;
  Projects: undefined;
  ProjectDetail: { id: string };
  Auth: undefined;
};

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  // États
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalProjects: 0,
    totalHectares: 0,
    totalInvestment: 0,
  });
  const [featuredProjects, setFeaturedProjects] = useState<FeaturedProject[]>([]);
  const [popularCultures, setPopularCultures] = useState<PopularCulture[]>([]);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);

  const [isLoading, setIsLoading] = useState({
    stats: true,
    featured: true,
    cultures: true,
    recent: true,
  });

  // Animations
  const fadeAnim = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(fadeAnim.value, { duration: 500 }),
  }));

  useEffect(() => {
    fadeAnim.value = 1;
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([
        fetchStats(),
        fetchFeaturedProjects(),
        fetchPopularCultures(),
        fetchRecentProjects(),
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const fetchStats = async () => {
    try {
      const [usersResponse, projectsResponse, hectaresResponse, investmentsResponse] =
        await Promise.all([
          supabase.from('utilisateur').select('id_utilisateur', { count: 'exact', head: true }),
          supabase.from('projet').select('id_projet', { count: 'exact', head: true }),
          supabase.from('projet').select('surface_ha').in('statut', ['en cours', 'en financement']),
          supabase.from('investissement').select('montant'),
        ]);

      const totalHectares =
        hectaresResponse.data?.reduce((sum, project) => sum + (project.surface_ha || 0), 0) || 0;
      const totalInvestment =
        investmentsResponse.data?.reduce((sum, inv) => sum + (inv.montant || 0), 0) || 0;

      setStats({
        totalUsers: usersResponse.count || 0,
        totalProjects: projectsResponse.count || 0,
        totalHectares: parseFloat(totalHectares.toFixed(2)),
        totalInvestment: totalInvestment,
      });

      setIsLoading((prev) => ({ ...prev, stats: false }));
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      setIsLoading((prev) => ({ ...prev, stats: false }));
    }
  };

  const fetchFeaturedProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projet')
        .select(
          `
          id_projet, 
          titre,
          statut,
          surface_ha,
          description,
          photos,
          projet_culture(culture(nom_culture),cout_exploitation_previsionnel,rendement_previsionnel)
        `
        )
        .eq('statut', 'en financement')
        .limit(5); // Augmenté à 5 pour le carrousel

      if (!error && data) {
        const projectsWithFunding = await Promise.all(
          data.map(async (project) => {
            const { data: investments } = await supabase
              .from('investissement')
              .select('montant')
              .eq('id_projet', project.id_projet);

            const currentFunding =
              investments?.reduce((sum, inv) => sum + (inv.montant || 0), 0) || 0;
            const cout_total =
              project.projet_culture?.reduce(
                (sum, pc) => sum + (pc.cout_exploitation_previsionnel || 0),
                0
              ) || 0;
            const progress = cout_total
              ? Math.min(Math.round((currentFunding / cout_total) * 100), 100)
              : 0;

            return {
              id: project.id_projet,
              title: project.titre || `Projet #${project.id_projet}`,
              description:
                project.description ||
                `Culture de ${project.projet_culture?.[0]?.culture?.[0]?.nom_culture || 'divers produits'} sur ${project.surface_ha} hectares`,
              image: project.photos?.split(',')[0].trim() || 'https://via.placeholder.com/300x200',
              progress: progress,
              amount: formatCurrency(currentFunding),
              target: formatCurrency(cout_total || 0),
            };
          })
        );

        setFeaturedProjects(projectsWithFunding);
      }

      setIsLoading((prev) => ({ ...prev, featured: false }));
    } catch (error) {
      console.error('Erreur lors du chargement des projets vedettes:', error);
      setIsLoading((prev) => ({ ...prev, featured: false }));
    }
  };

  const fetchPopularCultures = async () => {
    try {
      const { data, error } = await supabase.from('popular_cultures').select('*').limit(4);

      if (!error && data) {
        const cultures = data.map((item) => ({
          id: item.id_culture,
          name: item.nom_culture,
          count: item.count,
          image: item.photos ? `/cultures/${item.photos}` : 'https://via.placeholder.com/100x100',
        }));

        setPopularCultures(cultures);
      }

      setIsLoading((prev) => ({ ...prev, cultures: false }));
    } catch (error) {
      console.error('Erreur lors du chargement des cultures populaires:', error);
      setIsLoading((prev) => ({ ...prev, cultures: false }));
    }
  };

  const fetchRecentProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projet')
        .select('id_projet, titre, statut, created_at')
        .order('created_at', { ascending: false })
        .limit(4);

      if (!error && data) {
        const projects = data.map((project) => {
          let type = 'Nouveau projet';
          if (project.statut === 'en financement') type = 'En financement';
          if (project.statut === 'en cours') type = 'En production';
          if (project.statut === 'terminé') type = 'Projet terminé';

          const createdDate = new Date(project.created_at);
          const now = new Date();
          const diffDays = Math.floor(
            (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          let date;
          if (diffDays === 0) date = "Aujourd'hui";
          else if (diffDays === 1) date = 'Hier';
          else if (diffDays < 7) date = `Il y a ${diffDays} jours`;
          else if (diffDays < 30) date = `Il y a ${Math.floor(diffDays / 7)} semaines`;
          else date = `Il y a ${Math.floor(diffDays / 30)} mois`;

          return {
            id: project.id_projet,
            title: project.titre || `Projet #${project.id_projet}`,
            date: date,
            type: type,
          };
        });

        setRecentProjects(projects);
      }

      setIsLoading((prev) => ({ ...prev, recent: false }));
    } catch (error) {
      console.error('Erreur lors du chargement des projets récents:', error);
      setIsLoading((prev) => ({ ...prev, recent: false }));
    }
  };

  const quickNavigations = [
    {
      title: 'Investir',
      description: 'Découvrez les projets disponibles pour vos investissements',
      icon: TrendingUp,
      color: '#10b981',
      screen: 'Feed',
    },
    {
      title: 'Terrains',
      description: 'Consultez et ajoutez des terrains agricoles',
      icon: MapPin,
      color: '#3b82f6',
      screen: 'Terrain',
    },
    {
      title: 'Projets',
      description: 'Gérez vos projets agricoles',
      icon: FileText,
      color: '#f59e0b',
      screen: 'Projects',
    },
  ];

  type IconProps = { size?: number; color?: string };

  const renderStatCard = (
    icon: React.ComponentType<IconProps>,
    title: string,
    value: string | number,
    color: string,
    index: number,
    unity: string|undefined
  ) => (
    <Animated.View key={index} entering={FadeInUp.delay(index * 100)} style={styles.statCard}>
      <BlurView intensity={20} style={styles.statCardInner}>
        <View style={styles.statIconContainer}>
          {React.createElement(icon, { size: 20, color: color })}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.statTitle}>{title}</Text>
          <Text style={styles.statValue}>
            {typeof value === 'number' ? value.toLocaleString('fr-MG') : value} {unity}
          </Text>
        </View>
      </BlurView>
    </Animated.View>
  );

  // Nouveau composant pour le rendu des projets vedettes dans le carrousel
  const renderFeaturedProject = ({ item, index }: { item: FeaturedProject; index: number }) => (
    <Animated.View
      entering={FadeInLeft.delay(index * 150)}
      style={styles.projectCard}>
      <Image
        source={{ uri: item.image }}
        style={styles.projectImage}
        resizeMode="cover"
      />
      <View style={styles.projectInfo}>
        <Text style={styles.projectTitle}>{item.title}</Text>
        <Text style={styles.projectDescription} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressAmount}>{item.amount}</Text>
            <Text style={styles.progressTarget}>{item.target}</Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${item.progress}%` }]}
            />
          </View>
          <Text style={styles.progressText}>{item.progress}% financé</Text>
        </View>

        <TouchableOpacity
          style={styles.projectButton}
          onPress={() => router.replace('/(auth)/login', { id: item.id })}>
          <Text style={styles.projectButtonText}>Voir le projet</Text>
          <ArrowRight size={16} color="white" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderPopularCulture = (culture: PopularCulture, index: number) => (
    <Animated.View key={culture.id} entering={FadeInUp.delay(index * 100)} style={styles.cultureCard}>
      <TouchableOpacity
        style={{ alignItems: 'center' }}
        onPress={() => router.replace('/(auth)/login', { culture: culture.name })}>
        <Image
          source={{ uri: culture.image }}
          style={styles.cultureImage}
          resizeMode="cover"
        />
        <Text style={styles.cultureName}>{culture.name}</Text>
        <Text style={styles.cultureCount}>{culture.count} projets</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderRecentProject = (project: RecentProject, index: number) => (
    <Animated.View key={project.id} entering={FadeInRight.delay(index * 100)}>
      <TouchableOpacity
        style={styles.recentProjectItem}
        onPress={() => router.replace('/(auth)/login', { id: project.id })}>
        <View style={styles.recentProjectContent}>
          <View style={styles.recentProjectInfo}>
            <Text style={styles.recentProjectTitle}>{project.title}</Text>
            <Text style={styles.recentProjectType}>{project.type}</Text>
          </View>
          <Text style={styles.recentProjectDate}>{project.date}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderQuickNavigation = (item: any, index: number) => (
    <Animated.View key={index} entering={FadeInUp.delay(index * 150)} style={styles.quickNavItem}>
      <TouchableOpacity
        style={[styles.quickNavButton, { backgroundColor: item.color }]}
        onPress={() => router.navigate(item.screen)}>
        <View style={styles.quickNavIconContainer}>
          <item.icon size={24} color="white" />
        </View>
        <Text style={styles.quickNavTitle}>{item.title}</Text>
        <Text style={styles.quickNavDescription}>{item.description}</Text>
        <View style={styles.quickNavCta}>
          <Text style={styles.quickNavCtaText}>Accéder</Text>
          <ArrowRight size={16} color="white" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#10b981" />
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        
        {/* Hero Section */}
        <LinearGradient colors={['#10b981', '#059669']} style={styles.heroContainer}>
          <Animated.View style={animatedStyle}>
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <Image
                source={logo}
                style={{ width: 96, height: 96, marginBottom: 16 }}
                resizeMode="cover"
              />
              <Text style={styles.heroName}>Maintso Vola</Text>
            </View>

            {/* Logo et titre */}
            <View style={{ marginBottom: 32, alignItems: 'center' }}>
              <Text style={styles.heroTitle}>
                🚀 L&apos;agritech intelligente au service de la rentabilité durable
              </Text>
              <Text style={styles.heroSubtitle}>
                Chez Maintso Vola, nous connectons la finance et la technologie pour révolutionner
                l&apos;agriculture.
              </Text>
            </View>

            {/* Stats Cards */}
            {isLoading.stats ? (
              <StatsSkeleton />
            ) : (
              <View style={styles.statsContainer}>
                {renderStatCard(Users, 'Utilisateurs actifs', stats.totalUsers, '#3b82f6', 0, undefined)}
                {renderStatCard(
                  FileText,
                  'Projets en financement',
                  stats.totalProjects,
                  '#f59e0b',
                  1,undefined
                )}
                {renderStatCard(MapPin, 'Hectares cultivés', stats.totalHectares, '#10b981', 2,undefined)}
                {renderStatCard(
                  TrendingUp,
                  'Total investissement',
                  stats.totalInvestment,
                  '#8b5cf6',
                  3, 'Ar'
                )}
              </View>
            )}

            {/* CTA Button */}
            <View style={{ alignItems: 'center' }}>
              <TouchableOpacity
                style={styles.ctaButton}
                onPress={() => router.replace('/(auth)/login')}>
                <Text style={styles.ctaButtonText}>Découvrir les projets</Text>
                <ChevronRight size={20} color="#10b981" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </LinearGradient>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Featured Projects Carousel */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Projets Vedettes</Text>
              <TouchableOpacity
                style={styles.seeAllButton}
                onPress={() => router.navigate('/feed')}>
                <Text style={styles.seeAllText}>Voir tout</Text>
                <ArrowRight size={16} color="#10b981" />
              </TouchableOpacity>
            </View>

            {isLoading.featured ? (
              <ProjectCarouselSkeleton count={3} />
            ) : (
              <View style={{ marginLeft: -16 }}>
                {featuredProjects.length > 0 ? (
                  <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.projectsCarousel}
                    data={featuredProjects}
                    keyExtractor={(item) => item.id}
                    renderItem={renderFeaturedProject}
                    snapToInterval={width * 0.85 + 16} // Largeur de la carte + margin
                    decelerationRate="fast"
                    pagingEnabled={false}
                    snapToAlignment="start"
                  />
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>
                      Aucun projet vedette disponible pour le moment
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Popular Cultures */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cultures Populaires</Text>
            {isLoading.cultures ? (
              <View style={styles.culturesContainer}>
                {Array.from({ length: 4 }).map((_, index) => (
                  <View key={index} style={styles.cultureCard}>
                    <View style={[styles.cultureImage, { backgroundColor: '#e5e7eb' }]} />
                    <View style={[styles.skeletonLine, { height: 16, width: '75%', marginBottom: 8 }]} />
                    <View style={[styles.skeletonLine, { height: 12, width: '50%' }]} />
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.culturesContainer}>
                {popularCultures.length > 0 ? (
                  popularCultures.map(renderPopularCulture)
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>
                      Aucune culture populaire disponible pour le moment
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Quick Navigation */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Explorer par Catégorie</Text>
            <View style={styles.quickNavContainer}>
              {quickNavigations.map(renderQuickNavigation)}
            </View>
          </View>

          {/* Recent Projects */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actualités Récentes</Text>
            {isLoading.recent ? (
              <View>
                {Array.from({ length: 3 }).map((_, index) => (
                  <View key={index} style={styles.recentProjectItem}>
                    <View style={styles.recentProjectContent}>
                      <View style={styles.recentProjectInfo}>
                        <View style={[styles.skeletonLine, { height: 20, marginBottom: 8 }]} />
                        <View style={[styles.skeletonLine, { height: 16, width: '50%' }]} />
                      </View>
                      <View style={[styles.skeletonLine, { height: 16, width: 64 }]} />
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View>
                {recentProjects.length > 0 ? (
                  recentProjects.map(renderRecentProject)
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>
                      Aucune actualité récente disponible pour le moment
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Call-to-Action */}
          <Animated.View
            entering={FadeInUp.delay(500)}
            style={styles.finalCta}>
            <Text style={styles.finalCtaTitle}>Rejoignez notre communauté</Text>
            <Text style={styles.finalCtaSubtitle}>
              Que vous soyez investisseur ou agriculteur, Maintso Vola vous offre les outils
              nécessaires pour réussir dans le secteur agricole à Madagascar.
            </Text>
            <View style={styles.finalCtaButtons}>
              <TouchableOpacity
                style={styles.finalCtaButtonPrimary}
                onPress={() => router.navigate('/(auth)/register')}>
                <Text style={styles.finalCtaButtonTextPrimary}>Créer un compte</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.finalCtaButtonSecondary}
                onPress={() => router.navigate('/(auth)/login')}>
                <Text style={styles.finalCtaButtonTextSecondary}>Se connecter</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;