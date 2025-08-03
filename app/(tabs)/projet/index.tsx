import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Project from '../Project';

export default function ProjetScreen() {
  // Créer un QueryClient spécifiquement pour cette route
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes - les données restent "fraîches"
        gcTime: 10 * 60 * 1000, // 10 minutes - durée en mémoire
        retry: 1, // 1 retry en cas d'erreur
        refetchOnWindowFocus: false, // Pas de refetch au focus
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <Project isPass={true} />
    </QueryClientProvider>
  );
}