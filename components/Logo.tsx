// components/Logo.tsx
import { images } from '~/constants/constants';
import { Image, Text, View } from 'react-native';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function Logo({ size = 'md', showText = true }: LogoProps) {
  const sizeConfig = {
    sm: { 
      container: 'w-8 h-8', 
      text: 'text-sm',
      spacing: 'mt-1'
    },
    md: { 
      container: 'w-12 h-12', 
      text: 'text-lg',
      spacing: 'mt-2'
    },
    lg: { 
      container: 'size-24', 
      text: 'text-2xl',
      spacing: 'mt-3'
    },
  };

  const config = sizeConfig[size];

  return (
    <View className="flex-row items-center">
      {/* Image du logo conservée */}
      <Image 
        source={images.logo} 
        className={config.container} 
        resizeMode="contain" 
      />
      
      {/* Texte stylisé moderne aligné */}
      {showText && (
        <View className="ml-3">
          <Text className={`${config.text} font-bold`}>
            <Text className="text-green-600">Maintso</Text>
            <Text className="text-gray-900"> Vola</Text>
          </Text>
        </View>
      )}
    </View>
  );
}