// components/ProjectCards.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Landmark, TrendingUp, DollarSign, Eye } from 'lucide-react-native';
import { InvestedProject as Project } from '../hooks/useInvestments'

interface ProjectCardProps {
  project: Project;
  onViewDetails: (project: Project) => void;
}

export const ProjectCard = React.memo(
  ({ project, onViewDetails }: ProjectCardProps) => {
    const statusStyle = {
      terminé: 'bg-green-100 text-green-800',
      'en financement': 'bg-blue-100 text-blue-800',
    }[project.status] || 'bg-yellow-100 text-yellow-800';

    return (
      <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
        <View className="flex-row justify-between items-start mb-2">
          <Text className="font-bold text-lg flex-1">{project.title}</Text>
          <Text className={`text-xs px-2 py-1 rounded ${statusStyle}`}>
            {project.status}
          </Text>
        </View>

        {project.creator && (
          <View className="flex-row items-center mb-2">
            {project.creator.avatar && (
              <Image
                source={{ uri: project.creator.avatar }}
                className="w-6 h-6 rounded-full mr-2"
              />
            )}
            <Text className="text-sm text-gray-600">Créé par {project.creator.name}</Text>
          </View>
        )}

        <View className="space-y-2 mb-3">
          <View className="flex-row justify-between">
            <View className="flex-row items-center gap-2">
              <Landmark size={12} color="#125b47" />
              <Text className="text-gray-500">Investissement:</Text>
            </View>
            <Text className="font-semibold">{project.userInvestment.toLocaleString()} AR</Text>
          </View>

          <View className="flex-row justify-between">
            <View className="flex-row items-center gap-2">
              <DollarSign size={12} color="#16a34a" />
              <Text className="text-gray-500">Bénéfice estimé:</Text>
            </View>
            <Text className={`font-semibold ${project.userProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {project.userProfit.toLocaleString()} AR
            </Text>
          </View>

          <View className="flex-row justify-between">
            <View className="flex-row items-center gap-2">
              <TrendingUp size={12} color="#2563eb" />
              <Text className="text-gray-500">ROI:</Text>
            </View>
            <Text className={`font-semibold ${project.roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {project.roi.toFixed(1)}%
            </Text>
          </View>
        </View>

        <View className="mt-2">
          <View className="flex-row justify-between mb-1">
            <Text className="text-xs text-gray-500">Progrès des jalons</Text>
            <Text className="text-xs text-gray-500">
              {project.completedJalons}/{project.totalJalons} ({Math.round(project.jalonProgress)}%)
            </Text>
          </View>
          <View className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <View
              className={`h-full rounded-full ${
                project.jalonProgress < 33
                  ? 'bg-red-500'
                  : project.jalonProgress < 66
                  ? 'bg-yellow-400'
                  : 'bg-green-500'
              }`}
              style={{ width: `${project.jalonProgress}%` }}
            />
          </View>
        </View>

        <View className="flex-row justify-between mt-4">
          <TouchableOpacity
            className="w-[48%] flex-row justify-center items-center gap-2 bg-green-600 px-4 py-2 rounded border border-green-600"
            accessibilityLabel={`Investir dans ${project.title}`}
          >
            <DollarSign size={18} color="#fff" />
            <Text className="text-white font-bold">Investir</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="w-[48%] flex-row justify-center items-center gap-2 bg-white px-4 py-2 rounded border border-green-600"
            accessibilityLabel={`Voir les détails de ${project.title}`}
            onPress={() => onViewDetails(project)}
          >
            <Eye size={18} color="#16a34a" />
            <Text className="text-green-600 font-bold">Voir plus</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
);