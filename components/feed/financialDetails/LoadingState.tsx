import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LoadingStateProps {
  loading: boolean;
  hasData: boolean;
}

const LoadingState: React.FC<LoadingStateProps> = ({ loading, hasData }) => {
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#16A34A" />
        <Text className="mt-4 text-gray-500">Chargement des détails...</Text>
      </View>
    );
  }

  if (!hasData) {
    return (
      <View className="flex-1 items-center justify-center">
        <Ionicons name="document-outline" size={48} color="#9CA3AF" />
        <Text className="mt-4 text-center text-gray-600">
          Aucun détail financier disponible pour ce projet
        </Text>
      </View>
    );
  }

  return null;
};

export default LoadingState;
