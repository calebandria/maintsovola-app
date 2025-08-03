import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MetricCardProps {
  type: 'cost' | 'revenue' | 'profit';
  value: string;
  label: string;
  subtitle?: string;
  percentage?: string;
  profitValue?: number;
}

const MetricCard: React.FC<MetricCardProps> = ({
  type,
  value,
  label,
  subtitle,
  percentage,
  profitValue = 0,
}) => {
  const getCardStyle = () => {
    switch (type) {
      case 'cost':
        return {
          containerClass: 'rounded-xl bg-blue-50 p-6',
          iconContainerClass: 'rounded-lg bg-blue-100 p-2',
          iconName: 'wallet' as any,
          iconColor: '#2563EB',
          labelClass: 'text-sm font-semibold text-blue-700',
          valueClass: 'text-2xl font-bold text-blue-800',
          subtitleClass: 'mt-1 text-sm text-blue-600',
        };
      case 'revenue':
        return {
          containerClass: 'rounded-xl p-6',
          containerStyle: {
            backgroundColor: '#6EE7B7', // softer green
            shadowColor: '#A7F3D0', // lighter shadow
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.18, // slightly softer shadow
            shadowRadius: 10,
            elevation: 6,
          },
          iconContainerStyle: { backgroundColor: 'rgba(255,255,255,0.18)' },
          iconName: 'trending-up' as any,
          iconColor: '#047857', // dark green for icon
          labelStyle: {
            color: '#065F46', // dark green for better contrast
            // No text shadow for clarity
          },
          valueStyle: {
            color: '#065F46', // dark green for better contrast
            // No text shadow for clarity
          },
          subtitleStyle: {
            color: '#065F46', // dark green for better contrast
            // No text shadow for clarity
          },
        };
      case 'profit':
        return {
          containerClass: 'rounded-xl p-6',
          containerStyle: {
            backgroundColor: profitValue >= 0 ? '#FFE066' : '#FEE2E2',
            shadowColor: profitValue >= 0 ? '#FFD700' : '#DC2626',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 4,
          },
          iconContainerStyle: {
            backgroundColor: profitValue >= 0 ? '#FFF3BF' : '#FECACA',
          },
          iconName: (profitValue >= 0 ? 'trophy' : 'warning') as any,
          iconColor: profitValue >= 0 ? '#FFD700' : '#DC2626',
          labelStyle: {
            color: profitValue >= 0 ? '#7C5E00' : '#7F1D1D',
            textShadowColor: '#FFF',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
          },
          valueStyle: {
            color: profitValue >= 0 ? '#7C5E00' : '#7F1D1D',
            textShadowColor: '#FFF',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
          },
          percentageStyle: {
            backgroundColor: profitValue >= 0 ? '#FFFF' : '#DC2626',
            color: profitValue >= 0 ? '#7C5E00' : '#FFF',
            textShadowColor: profitValue >= 0 ? '#FFF' : 'transparent',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 1,
          },
        };
      default:
        return {};
    }
  };

  const styles = getCardStyle();

  return (
    <View className={styles.containerClass} style={styles.containerStyle}>
      <View className="mb-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View
            className={styles.iconContainerClass || 'rounded-lg p-2'}
            style={styles.iconContainerStyle}>
            <Ionicons name={styles.iconName} size={20} color={styles.iconColor} />
          </View>
          <Text className={styles.labelClass || 'text-sm font-semibold'} style={styles.labelStyle}>
            {label}
          </Text>
        </View>
        {percentage && (
          <View
            className="rounded-full px-3 py-1"
            style={
              styles.percentageStyle && { backgroundColor: styles.percentageStyle.backgroundColor }
            }>
            <Text className="text-xs font-bold" style={styles.percentageStyle}>
              {percentage}
            </Text>
          </View>
        )}
      </View>
      <Text className={styles.valueClass || 'text-2xl font-bold'} style={styles.valueStyle}>
        {value}
      </Text>
      {subtitle && (
        <Text className={styles.subtitleClass || 'mt-1 text-sm'} style={styles.subtitleStyle}>
          {subtitle}
        </Text>
      )}
    </View>
  );
};

export default MetricCard;
