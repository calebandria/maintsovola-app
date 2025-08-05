import React from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ProjectCategoryData,ProjectCultureCount, ProjectStatusData, ProjectsSummaryProps } from '~/types/projet'  
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-MG', {
    style: 'currency',
    currency: 'MGA',
  }).format(amount);
};

const ProjectsSummary: React.FC<ProjectsSummaryProps> = ({
  totalProjects,
  totalArea,
  totalFunding,
  totalProfit,
  ownerProfit,
  projectsByStatus,
  projectsByCulture = [],
}) => {
  const statusData = [
    { name: "En financement", value: projectsByStatus.enFinancement.count, fill: "#94a3b8" },
    { name: "En cours", value: projectsByStatus.enCours.count, fill: "#3b82f6" },
    { name: "Terminés", value: projectsByStatus.termine.count, fill: "#10b981" },
  ];

  const screenWidth = Dimensions.get("window").width;

  const renderCategorySection = (title: string, data: ProjectCategoryData, color: string) => (
    // Replaced Card component with a View and direct NativeWind classes
    <View className="bg-white rounded-lg shadow-md p-4 mb-4">
      <View className="pb-2">
        <View className="flex-row justify-between items-center">
          <View>
            <View className="flex-row items-center">
              {/* Using MaterialCommunityIcons for icons */}
              {title === "En financement" && <MaterialCommunityIcons name="clock-outline" size={20} color="#94a3b8" className="mr-2" />}
              {title === "En cours" && <MaterialCommunityIcons name="tractor" size={20} color="#3b82f6" className="mr-2" />}
              {title === "Terminés" && <MaterialCommunityIcons name="sprout-outline" size={20} color="#10b981" className="mr-2" />}
              <Text className="text-lg font-semibold text-gray-800">{title} ({data.count})</Text>
            </View>
            <Text className="text-sm text-gray-500">Résumé financier</Text>
          </View>
          {data.count > 0 && (
            <Text className="text-sm font-medium">
              {((data.count / totalProjects) * 100).toFixed(1)}% des projets
            </Text>
          )}
        </View>
      </View>

      {data.count > 0 ? (
        <View className="pt-2">
          <View className="flex-row flex-wrap justify-between -mx-2 mb-4">
            {/* Inner "Cards" also replaced with Views and direct classes */}
            <View className="w-1/2 md:w-1/4 px-2 mb-4 bg-white rounded-lg shadow-sm p-3">
              <View className="pb-2">
                <Text className="text-sm text-gray-500">Surface</Text>
                <View className="flex-row items-center">
                  <MaterialCommunityIcons name="map-outline" size={16} color="gray" className="mr-2" />
                  <Text className="text-lg font-semibold text-gray-800">{data.area.toFixed(2)} ha</Text>
                </View>
              </View>
            </View>

            <View className="w-1/2 md:w-1/4 px-2 mb-4 bg-white rounded-lg shadow-sm p-3">
              <View className="pb-2">
                <Text className="text-sm text-gray-500">Financement</Text>
                <View className="flex-row items-center">
                  <MaterialCommunityIcons name="credit-card-outline" size={16} color="gray" className="mr-2" />
                  <Text className="text-lg font-semibold text-gray-800">{formatCurrency(data.funding)}</Text>
                </View>
              </View>
            </View>

            <View className="w-1/2 md:w-1/4 px-2 mb-4 bg-white rounded-lg shadow-sm p-3">
              <View className="pb-2">
                <Text className="text-sm text-gray-500">Bénéfice total</Text>
                <View className="flex-row items-center">
                  <MaterialCommunityIcons name="layers-outline" size={16} color="gray" className="mr-2" />
                  <Text className="text-lg font-semibold text-gray-800">{formatCurrency(data.profit)}</Text>
                </View>
              </View>
            </View>

            <View className="w-1/2 md:w-1/4 px-2 mb-4 bg-white rounded-lg shadow-sm p-3">
              <View className="pb-2">
                <Text className="text-sm text-gray-500">Part propriétaire (40%)</Text>
                <View className="flex-row items-center">
                  <MaterialCommunityIcons name="layers-outline" size={16} color="gray" className="mr-2" />
                  <Text className="text-lg font-semibold text-gray-800">{formatCurrency(data.ownerProfit)}</Text>
                </View>
              </View>
            </View>
          </View>

          {data.cultures.length > 0 && (
            <View className="mt-4">
              <Text className="text-sm font-medium mb-2">Cultures</Text>
              <View className="h-[180px] items-center">
                <PieChart
                  data={data.cultures.map(c => ({
                    name: c.name,
                    population: c.count,
                    color: c.fill,
                    legendFontColor: "#7F7F7F",
                    legendFontSize: 12
                  }))}
                  width={screenWidth * 0.8}
                  height={180}
                  chartConfig={{
                    backgroundColor: "#e26a00",
                    backgroundGradientFrom: "#fb8c00",
                    backgroundGradientTo: "#ffa726",
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    style: {
                      borderRadius: 16
                    },
                    propsForDots: {
                      r: "6",
                      strokeWidth: "2",
                      stroke: "#ffa726"
                    }
                  }}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                />
              </View>
            </View>
          )}
        </View>
      ) : (
        <View className="pt-2">
          <Text className="text-gray-500 text-center py-2">Pas de projets {title.toLowerCase()}</Text>
        </View>
      )}
    </View>
  );

  return (
    <ScrollView className="flex-1 p-4 bg-gray-100">
      <Text className="text-lg font-semibold mb-4 text-gray-800">Résumé des projets</Text>

      <View className="flex-1 mb-4">
        <View className="px-2 mb-4 bg-white rounded-lg shadow-md p-4">
          <View className="pb-2">
            <Text className="text-sm text-gray-500">Total des projets</Text>
            <View className="flex-row items-center">
              <MaterialCommunityIcons name="layers-outline" size={20} color="gray" className="mr-2" />
              <Text className="text-lg font-semibold text-gray-800">{totalProjects}</Text>
            </View>
          </View>
        </View>

        <View className="px-2 mb-4 bg-white rounded-lg shadow-md p-4">
          <View className="pb-2">
            <Text className="text-sm text-gray-500">Surface totale</Text>
            <View className="flex-row items-center">
              <MaterialCommunityIcons name="map-outline" size={20} color="gray" className="mr-2" />
              <Text className="text-lg font-semibold text-gray-800">{totalArea.toFixed(2)} ha</Text>
            </View>
          </View>
        </View>

        <View className="px-2 mb-4 bg-white rounded-lg shadow-md p-4">
          <View className="pb-2">
            <Text className="text-sm text-gray-500">Financements reçus</Text>
            <View className="flex-row items-center">
              <MaterialCommunityIcons name="credit-card-outline" size={20} color="gray" className="mr-2" />
              <Text className="text-lg font-semibold text-gray-800">{formatCurrency(totalFunding)}</Text>
            </View>
          </View>
        </View>

        <View className="px-2 mb-4 bg-white rounded-lg shadow-md p-4">
          <View className="pb-2">
            <Text className="text-sm text-gray-500">Bénéfice propriétaire</Text>
            <View className="flex-row items-center">
              <MaterialCommunityIcons name="chart-pie" size={20} color="gray" className="mr-2" />
              <Text className="text-base font-semibold text-gray-800">{formatCurrency(ownerProfit)}</Text>
            </View>
          </View>
          <Text className="text-xs text-gray-500">
            40% du bénéfice total ({formatCurrency(totalProfit)})
          </Text>
        </View>
      </View>

      {totalProjects > 0 && (
        <View className="bg-white rounded-lg shadow-md p-4 mb-4">
          <View>
            <Text className="text-lg font-semibold text-gray-800">Distribution des projets</Text>
            <Text className="text-sm text-gray-500">Par statut</Text>
          </View>
          <View className="pt-2">
            <View className="h-[250px] items-center">
              <BarChart
                data={{
                  labels: statusData.map(d => d.name),
                  datasets: [
                    {
                      data: statusData.map(d => d.value),
                      colors: statusData.map(d => (opacity = 1) => d.fill),
                    }
                  ]
                }}
                width={screenWidth * 0.9}
                height={220}
                yAxisLabel=""
                chartConfig={{
                  backgroundColor: "#ffffff",
                  backgroundGradientFrom: "#ffffff",
                  backgroundGradientTo: "#ffffff",
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16
                  },
                  propsForBackgroundLines: {
                    strokeDasharray: '',
                  },
                  propsForLabels: {
                    fontSize: 10,
                  },
                  barPercentage: 0.8,
                }}
                verticalLabelRotation={0} yAxisSuffix={''}              />
            </View>
          </View>
        </View>
      )}

      {renderCategorySection("En financement", projectsByStatus.enFinancement, "#94a3b8")}
      {renderCategorySection("En cours", projectsByStatus.enCours, "#3b82f6")}
      {renderCategorySection("Terminés", projectsByStatus.termine, "#10b981")}
    </ScrollView>
  );
};

export default ProjectsSummary;