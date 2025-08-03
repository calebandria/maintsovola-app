// components/AuthGuard.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useAuth } from '~/contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Chargement...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Veuillez vous connecter</Text>
      </View>
    );
  }

  return <>{children}</>;
}