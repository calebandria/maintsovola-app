import { Stack } from 'expo-router';
import { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import ProjectsSummary from '~/components/ProjectsSummary';
import { ProjectsSummaryProps } from '~/types/projet';
import { useAuth } from '~/contexts/AuthContext';
import { supabase } from '~/lib/data_with_type';

type ProjectCultureCount = { name: string; count: number; fill: string; };

const defaultProjectsSummaryData: ProjectsSummaryProps = {
  totalProjects: 0,
  totalArea: 0,
  totalFunding: 0,
  totalProfit: 0,
  ownerProfit: 0,
  projectsByStatus: {
    enFinancement: { count: 0, area: 0, funding: 0, profit: 0, ownerProfit: 0, cultures: [] },
    enCours: { count: 0, area: 0, funding: 0, profit: 0, ownerProfit: 0, cultures: [] },
    termine: { count: 0, area: 0, funding: 0, profit: 0, ownerProfit: 0, cultures: [] },
  },
  projectsByCulture: [],
};

const Projets = () => {
  const { user } = useAuth();
  const currentTantsahaId: string | null = user?.id ?? null;

  const [summaryData, setSummaryData] = useState<ProjectsSummaryProps>(defaultProjectsSummaryData);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // This effect runs once on mount or when the user ID changes.
    if (!currentTantsahaId) {
      setIsLoading(false);
      return;
    }

    const fetchProjectsSummary = async () => {
      try {
        setIsLoading(true);
        setHasError(false);

        const { data: projectsData, error } = await supabase
          .from('projet')
          .select(`
            id_projet,
            statut,
            surface_ha,
            cultures:projet_culture(
              culture:id_culture(*),
              cout_exploitation_previsionnel,
              rendement_previsionnel
            ),
            investissements:investissement(montant)
          `)
          .eq('id_tantsaha', currentTantsahaId);
        
        if (error) throw error;
        
        if (!projectsData) {
          setSummaryData(defaultProjectsSummaryData);
          setIsLoading(false);
          return;
        }

        let totalArea = 0;
        let totalFunding = 0;
        let totalProfit = 0;
        const statusColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
        const cultureMap = new Map<string, { count: number, fill: string }>();
        const projectsByStatus = {
          enFinancement: { count: 0, area: 0, funding: 0, profit: 0, ownerProfit: 0, cultures: [] as ProjectCultureCount[] },
          enCours: { count: 0, area: 0, funding: 0, profit: 0, ownerProfit: 0, cultures: [] as ProjectCultureCount[] },
          termine: { count: 0, area: 0, funding: 0, profit: 0, ownerProfit: 0, cultures: [] as ProjectCultureCount[] }
        };
        const culturesByStatus = {
          enFinancement: new Map<string, number>(),
          enCours: new Map<string, number>(),
          termine: new Map<string, number>()
        };

        projectsData.forEach(project => {
          let statusCategory: 'enFinancement' | 'enCours' | 'termine' = 
            project.statut === 'en financement' ? 'enFinancement' : 
            (project.statut === 'en_production' || project.statut === 'en_cours') ? 'enCours' : 
            project.statut === 'terminé' ? 'termine' : 'enFinancement';
          
          const area = project.surface_ha || 0;
          totalArea += area;
          projectsByStatus[statusCategory].area += area;
          projectsByStatus[statusCategory].count += 1;
          
          let projectProfit = 0;
          if (project.cultures && Array.isArray(project.cultures)) {
            project.cultures.forEach(pc => {
              if (pc.culture) {
                const cultureName = pc.culture.nom_culture;
                const rendement = pc.rendement_previsionnel || 0;
                const coutExploitation = pc.cout_exploitation_previsionnel || 0;
                const revenue = rendement * (pc.culture.prix_tonne || 0);
                const profit = revenue - coutExploitation;
                
                projectProfit += profit;
                if (!cultureMap.has(cultureName)) {
                  const colorIndex = cultureMap.size % statusColors.length;
                  cultureMap.set(cultureName, { count: 1, fill: statusColors[colorIndex] });
                } else {
                  cultureMap.get(cultureName)!.count += 1;
                }
                if (!culturesByStatus[statusCategory].has(cultureName)) {
                  culturesByStatus[statusCategory].set(cultureName, 1);
                } else {
                  culturesByStatus[statusCategory].set(cultureName, culturesByStatus[statusCategory].get(cultureName)! + 1);
                }
              }
            });
          }
          
          totalProfit += projectProfit;
          projectsByStatus[statusCategory].profit += projectProfit;
          projectsByStatus[statusCategory].ownerProfit += projectProfit * 0.4;
          
          let projectFunding = 0;
          if (project.investissements && Array.isArray(project.investissements)) {
            project.investissements.forEach(inv => {
              projectFunding += inv.montant || 0;
            });
          }
          totalFunding += projectFunding;
          projectsByStatus[statusCategory].funding += projectFunding;
        });
        
        const projectsByCulture = Array.from(cultureMap.entries()).map(([name, info]) => ({ name, count: info.count, fill: info.fill }));
        
        Object.keys(culturesByStatus).forEach((status) => {
          const statusKey = status as keyof typeof culturesByStatus;
          projectsByStatus[statusKey].cultures = Array.from(culturesByStatus[statusKey].entries())
            .map(([name, count], index) => ({ name, count, fill: statusColors[index % statusColors.length] }));
        });
        
        setSummaryData({
          totalProjects: projectsData.length,
          totalArea,
          totalFunding,
          totalProfit,
          ownerProfit: totalProfit * 0.4,
          projectsByStatus,
          projectsByCulture
        });

        console.log("the user id is: ", currentTantsahaId)
        console.log("fetching project summary")
      } catch (error) {
        console.error("Erreur lors de la récupération des informations sur les projets:", error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProjectsSummary();
  }, [currentTantsahaId]);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#125b47" />
      </View>
    );
  }
  if (hasError) {
    return (
      <View className="flex-1 justify-center items-center p-5">
        <Text className="text-red-500 text-base text-center mb-2">Error loading data. Please try again later.</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Projets' }} />
      <View className='flex-1'>
        <ProjectsSummary {...summaryData} />
      </View>
    </>
  );
};

export default Projets;