import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ModalHeaderProps {
  projectTitle?: string;
  onClose: () => void;
}

const ModalHeader: React.FC<ModalHeaderProps> = ({ projectTitle, onClose }) => {
  return (
    <View className="border-b border-gray-200 bg-white px-4 pb-4 pt-12">
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-xl font-bold text-gray-900">Détails financiers</Text>
          <Text className="mt-1 text-sm text-gray-500">{projectTitle || 'Projet agricole'}</Text>
        </View>
        <TouchableOpacity onPress={onClose} className="rounded-full bg-gray-100 p-2">
          <Ionicons name="close" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ModalHeader;
