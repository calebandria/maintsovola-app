import { Stack } from 'expo-router';
import { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import ProjectsSummary from '~/components/ProjectsSummary';
import { ProjectsSummaryProps } from '~/types/projet'
import { useTotalSurfaceForTantsaha } from '~/hooks/useTotalSurfaceForTantsaha';
import { useTotalProjectNumberForTantsaha } from '~/hooks/useTotalProjectNumberForTantsaha'; // Assumed to return 'count'
import { useTotalFundingForTantsaha } from '~/hooks/useTotalFundingForTantsaha';
import { useAuth } from '~/contexts/AuthContext';

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
  const { totalSurface, loading: loadingSurface, error: errorSurface } = useTotalSurfaceForTantsaha(currentTantsahaId);
  const { totalProject: totalProjectCount, loading: loadingProjectCount, error: errorProjectCount } = useTotalProjectNumberForTantsaha(currentTantsahaId);
  const { totalFunding, loading: loadingFunding, error: errorFunding } = useTotalFundingForTantsaha(currentTantsahaId);
  const [summaryData, setSummaryData] = useState<ProjectsSummaryProps>(defaultProjectsSummaryData);
  const isLoading = loadingSurface || loadingProjectCount || loadingFunding;
  const hasError = errorSurface || errorProjectCount || errorFunding;

  useEffect(() => {
    if (
      !isLoading && 
      !hasError && 
      totalSurface !== null &&
      totalProjectCount !== null && 
      totalFunding !== null
    ) {
      setSummaryData(prevData => ({
        ...prevData,
        totalArea: totalSurface,
        totalProjects: totalProjectCount, 
        totalFunding: totalFunding,
      }));
    }
  }, [
    totalSurface, totalProjectCount, totalFunding, 
    isLoading, 
    hasError
  ]);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
      <ActivityIndicator size="large" color="#0000ff" />
      <Text>Loading project summary...</Text>
    </View>
    );
  }
  console.log(summaryData)
 if (hasError) {
  return (
    <View className="flex-1 justify-center items-center p-5">
      <Text className="text-red-500 text-base text-center mb-2">Error loading data:</Text>
      {errorSurface && <Text className="text-red-500 text-base text-center mb-2">- Surface data: {errorSurface}</Text>}
      {errorProjectCount && <Text className="text-red-500 text-base text-center mb-2">- Project count data: {errorProjectCount}</Text>}
      {errorFunding && <Text className="text-red-500 text-base text-center mb-2">- Funding data: {errorFunding}</Text>}
      <Text className="text-red-500 text-base text-center mb-2">Please try again later.</Text>
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
}
export default Projets;
