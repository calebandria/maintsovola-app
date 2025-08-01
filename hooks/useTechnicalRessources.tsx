
import { useState, useEffect } from 'react';
import { TechnicalResource } from '@/types/technicien';

export const useTechnicalResources = () => {
  const [resources, setResources] = useState<TechnicalResource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simuler des  (à remplacer par de vraies données)
    const mockResources: TechnicalResource[] = [
      {
        id_ressource: 1,
        titre: "Guide de culture du riz",
        type: "guide_pratique",
        culture: "riz",
        contenu: "Guide complet pour la culture du riz pluvial...",
        date_creation: new Date().toISOString(),
        tags: ["riz", "pluvial", "semis", "entretien"]
      },
      {
        id_ressource: 2,
        titre: "Fiche technique - Fertilisation maïs",
        type: "fiche_technique",
        culture: "maïs",
        contenu: "Dosages et calendrier de fertilisation...",
        date_creation: new Date().toISOString(),
        tags: ["maïs", "fertilisation", "NPK"]
      },
      {
        id_ressource: 3,
        titre: "Procédure de récolte mécanisée",
        type: "procedure",
        contenu: "Étapes détaillées pour la récolte mécanisée...",
        date_creation: new Date().toISOString(),
        tags: ["récolte", "mécanisation", "procédure"]
      }
    ];

    setTimeout(() => {
      setResources(mockResources);
      setLoading(false);
    }, 500);
  }, []);

  const filterByType = (type: TechnicalResource['type']) => {
    return resources.filter(resource => resource.type === type);
  };

  const filterByCulture = (culture: string) => {
    return resources.filter(resource => resource.culture === culture);
  };

  const searchResources = (query: string) => {
    return resources.filter(resource => 
      resource.titre.toLowerCase().includes(query.toLowerCase()) ||
      resource.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
  };

  return { 
    resources, 
    loading, 
    filterByType, 
    filterByCulture, 
    searchResources 
  };
};
