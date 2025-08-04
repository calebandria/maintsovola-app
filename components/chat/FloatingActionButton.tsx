import React from 'react';
import { TouchableOpacity, Text, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FloatingActionButtonProps {
  onPress: () => void;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ 
  onPress
}) => {
  return (
    <View style={{
      position: 'absolute',
      bottom: Platform.OS === 'ios' ? 60 : 40, 
      right: 20,
      zIndex: 1000,
    }}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={{
          backgroundColor: '#16a34a',
          width: 56,
          height: 56,
          borderRadius: 28,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 12, // Ombre pour Android
          // Ajout d'une bordure subtile pour plus de contraste
          borderWidth: Platform.OS === 'android' ? 0.5 : 0,
          borderColor: 'rgba(182, 235, 195, 0.2)',
        }}
      >
        <Text style={{
          color: '#FFFFFF',
          fontSize: 24,
          fontWeight: '300',
          lineHeight: 24,
        }}>
          +
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default FloatingActionButton;