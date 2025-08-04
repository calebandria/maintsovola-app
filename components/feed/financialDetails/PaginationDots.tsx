import React from 'react';
import { View, Animated } from 'react-native';

interface PaginationDotsProps {
  totalSections: number;
  currentIndex: number;
  shakeAnimation: Animated.Value;
}

const PaginationDots: React.FC<PaginationDotsProps> = ({
  totalSections,
  currentIndex,
  shakeAnimation,
}) => {
  return (
    <View className="mb-4 mt-2 flex-row justify-center gap-2">
      {[...Array(totalSections)].map((_, index) => {
        const isActive = index === currentIndex;
        return (
          <Animated.View
            key={index}
            className={`h-3 w-3 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-300'}`}
            style={{
              transform: [{ scale: index === 0 ? shakeAnimation : 1 }],
            }}
          />
        );
      })}
    </View>
  );
};

export default PaginationDots;
