import * as React from 'react';
import {
  View,
  Text,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';

// Types pour les variants
type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';

interface BadgeProps extends TouchableOpacityProps {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
}
// Style de base pour le badge
const baseBadgeStyle: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  borderRadius: 9999, // Pour un arrondi complet
  borderWidth: 1,
  paddingHorizontal: 10,
  paddingVertical: 2,
};

const baseTextStyle: TextStyle = {
  fontSize: 12,
  fontWeight: '600', // Semibold
};

// Styles des variants
const variantStyles: Record<BadgeVariant, { container: ViewStyle; text: TextStyle }> = {
  default: {
    container: {
      backgroundColor: '#007AFF', // Couleur primary
      borderColor: 'transparent',
    },
    text: {
      color: 'white', // Couleur primary-foreground
    },
  },
  secondary: {
    container: {
      backgroundColor: '#5E5CE6', // Couleur secondary
      borderColor: 'transparent',
    },
    text: {
      color: 'white', // Couleur secondary-foreground
    },
  },
  destructive: {
    container: {
      // backgroundColor: '#641723', // Couleur destructive
      backgroundColor: '#2F265F', // Couleur destructive
      borderColor: 'transparent',
    },
    text: {
      color: 'white', // Couleur destructive-foreground
    },
  },
  outline: {
    container: {
      backgroundColor: 'transparent',
      borderColor: '#8E8E93', // Couleur de bordure par défaut
    },
    text: {
      color: '#000000', // Couleur foreground
    },
  },
  success: {
    container: {
      backgroundColor: '#D1FAE5', // bg-green-100
      borderColor: 'transparent',
    },
    text: {
      color: '#065F46', // text-green-800
    },
  },
  warning: {
    container: {
      backgroundColor: '#FEF3C7', // bg-yellow-100
      borderColor: 'transparent',
    },
    text: {
      color: '#92400E', // text-yellow-800
    },
  },
};

export function Badge({ className, variant = 'default', children, style, ...props }: BadgeProps) {
  const variantStyle = variantStyles[variant] || variantStyles.default;

  return (
    <TouchableOpacity
      style={[baseBadgeStyle, variantStyle.container, style]}
      activeOpacity={0.8}
      {...props}>
      <Text style={[baseTextStyle, variantStyle.text]}>{children}</Text>
    </TouchableOpacity>
  );
}
