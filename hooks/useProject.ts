import { useEffect, useState } from 'react';
import { supabase } from '@/lib/data';
import type { ProjectData, ProjectDataDetails } from '@/type/projectInterface';

export function useProjects() {
  const [data, setData] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const { data, error } = await supabase
      .from('projet')
      .select(`
        *,
        tantsaha:id_tantsaha(nom, prenoms),
        terrain(id_terrain, nom_terrain),
        region:id_region(nom_region),
        district:id_district(nom_district),
        commune:id_commune(nom_commune),
        projet_culture(
          id_projet_culture,
          id_culture,
          cout_exploitation_previsionnel,
          culture(id_culture, nom_culture)
        ),
        investissements:investissement(montant)
      `);
    if (!error) setData(data ?? []);

    setLoading(false);
  }
  useEffect(() => { fetchData(); }, []);

  return { projects: data, loading, refetch: fetchData };
}

export function useDetails(projectId: number) {
  const [data, setData] = useState<ProjectDataDetails>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('projet')
        .select(`
          *,
          tantsaha:id_tantsaha(nom, prenoms, photo_profil),
          technicien:id_technicien(nom, prenoms, photo_profil),
          superviseur:id_superviseur(nom, prenoms, photo_profil),
          terrain:id_terrain(*),
          region:id_region(nom_region),
          district:id_district(nom_district),
          commune:id_commune(nom_commune),
          projet_culture:projet_culture(
            id_projet_culture,
            id_culture,
            cout_exploitation_previsionnel,
            rendement_previsionnel,
            date_debut_previsionnelle,
            culture:id_culture(nom_culture,prix_tonne,rendement_ha)
          )
        `)
        .eq('id_projet', projectId)
        .single();

      if (!error) setData(data);
      setLoading(false);
    })();
  });

  return { projects: data, loading };
}

/**
 * Interface pour un investissement
 */
export interface Investment {
  id_investissement: number;
  id_projet: number;
  id_investisseur: number;
  montant: number;
  date_decision_investir: string;
  date_paiement?: string;
  statut_paiement: string;
  investisseur?: {
    nom: string;
    prenoms?: string;
  };
}

/**
 * Interface pour un jalon de projet
 */
export interface ProjectJalon {
  id_projet: number;
  id_jalon_agricole: number;
  date_previsionnelle: string;
  date_reelle?: string;
  rapport_jalon?: string;
  photos_jalon?: string;
  jalon_agricole?: {
    nom_jalon: string;
    action_a_faire: string;
    id_culture: number;
    delai_apres_lancement: number;
  };
  culture?: {
    id_culture: {
      nom_culture: string;
    };
  };
}

/**
 * Interface pour les jalons agricoles (modèles)
 */
export interface JalonAgricole {
  id_jalon_agricole: number;
  nom_jalon: string;
  action_a_faire: string;
  id_culture: number;
  delai_apres_lancement: number;
}

/** ProjectDetails */
export interface ProjectDetails {
  id_projet: number;
  surface_ha: number;
  description?: string;
  statut: string;
  date_lancement?: string;
  date_fin?: string;
  tantsaha?: {
    nom: string;
    prenoms?: string;
    photo_profil?: string;
  };
  technicien?: {
    nom: string;
    prenoms?: string;
    photo_profil?: string;
  };
  superviseur?: {
    nom: string;
    prenoms?: string;
    photo_profil?: string;
  };
  terrain?: {
    id_terrain: number;
    nom_terrain: string;
  };
  region?: {
    nom_region: string;
  };
  district?: {
    nom_district: string;
  };
  commune?: {
    nom_commune: string;
  };
  projet_culture: {
    id_projet_culture: number;
    id_culture: number;
    cout_exploitation_previsionnel: number;
    rendement_previsionnel: number;
    date_debut_previsionnelle: string;
    culture?: {
      nom_culture: string;
      prix_tonne: number;
      rendement_ha: number;
    };
  }[];
}

export interface ProjectMetrics {
  totalCost: number;
  currentFunding: number;
  fundingProgress: number;
  isFundingComplete: boolean;
  rendementProduits: string;
  totalEstimatedRevenue: number;
  totalProfit: number;
}

export const useProjectData = (projectId: number) => {
  const [project, setProject] = useState<ProjectDataDetails | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [jalons, setJalons] = useState<ProjectJalon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projet')
        .select(`
          *,
          tantsaha:id_tantsaha(nom,prenoms,photo_profil),
          terrain:id_terrain(*),
          region:id_region(nom_region),
          district:id_district(nom_district),
          commune:id_commune(nom_commune),
          superviseur:id_superviseur(nom,prenoms,photo_profil),
          technicien:id_technicien(nom,prenoms,photo_profil),
          projet_culture(*,culture:id_culture(nom_culture,prix_tonne,rendement_ha))
        `)
        .eq('id_projet', projectId)
        .single();

      if (error) throw error;
      setProject(data);
      return data;
    } catch (err: any) {
      console.error('Erreur lors de la récupération du projet:', err);
      setError(err.message);
      return null;
    }
  };

  const fetchInvestments = async () => {
    try {
      const { data, error } = await supabase
        .from('investissement')
        .select(`
          *,
          investisseur:id_investisseur(nom,prenoms,photo_profil)
        `)
        .eq('id_projet', projectId)
        .order('date_decision_investir', { ascending: false });

      if (error) throw error;
      setInvestments(data || []);
      return data || [];
    } catch (err: any) {
      console.error('Erreur lors de la récupération des investissements:', err);
      setError(err.message);
      return [];
    }
  };

  const fetchJalons = async () => {
    try {
      const { data, error } = await supabase
        .from('jalon_projet')
        .select(`
          *,
          jalon_agricole:id_jalon_agricole(nom_jalon,action_a_faire),
          culture:jalon_agricole(id_culture(nom_culture))
        `)
        .eq('id_projet', projectId)
        .order('date_previsionnelle', { ascending: true });

      if (error) throw error;
      setJalons(data || []);
      return data || [];
    } catch (err: any) {
      console.error('Erreur lors de la récupération des jalons:', err);
      setError(err.message);
      return [];
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchProject(),
        fetchInvestments(),
        fetchJalons()
      ]);
    } catch (err: any) {
      console.error('Erreur lors de la récupération des données:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calcul des métriques du projet
  const calculateMetrics = (): ProjectMetrics | null => {
    if (!project || !investments) return null;

    const projetCultures = project.projet_culture || [];

    // Coût total d'exploitation
    const totalCost = projetCultures.reduce((sum, pc) => 
      sum + (pc.cout_exploitation_previsionnel || 0), 0);

    // Financement actuel (somme de tous les investissements)
    const currentFunding = investments.reduce((sum, inv) => 
      sum + (inv.montant || 0), 0);

    // Progression du financement
    const fundingProgress = totalCost === 0 ? 0 : Math.min(Math.round((currentFunding / totalCost) * 100), 100);
    const isFundingComplete = fundingProgress >= 100;

    // Rendement prévu
    const yieldStrings = projetCultures.map(pc => {
      const nom = pc.culture?.nom_culture || "Non spécifié";
      const tonnage = pc.rendement_previsionnel || 
                     ((pc.culture?.rendement_ha || 0) * (project.surface_ha || 1));
      return `${Math.round(tonnage * 100) / 100} t de ${nom}`;
    });
    const rendementProduits = yieldStrings.length > 0 ? yieldStrings.join(", ") : "N/A";

    // Revenu estimé
    const totalEstimatedRevenue = projetCultures.reduce((sum, pc) => {
      const rendement = pc.rendement_previsionnel || 
                       ((pc.culture?.rendement_ha || 0) * (project.surface_ha || 1));
      const prixTonne = pc.culture?.prix_tonne || 0;
      return sum + (rendement * prixTonne);
    }, 0);

    // Bénéfice total
    const totalProfit = totalEstimatedRevenue - totalCost;

    return {
      totalCost,
      currentFunding,
      fundingProgress,
      isFundingComplete,
      rendementProduits,
      totalEstimatedRevenue,
      totalProfit
    };
  };

  useEffect(() => {
    if (projectId) {
      fetchAll();
    }
  }, [projectId]);

  const metrics = calculateMetrics();

  return {
    // Données
    project,
    investments,
    jalons,
    
    // État
    loading,
    error,
    
    // Métriques calculées
    metrics,
    
    // Fonctions de rafraîchissement
    refetchProject: fetchProject,
    refetchInvestments: fetchInvestments,
    refetchJalons: fetchJalons,
    refetchAll: fetchAll,
  };
};


export const fetchProjectInvestments = async (projectId: number): Promise<Investment[]> => {
  const { data, error } = await supabase
    .from('investissement')
    .select(`
      *,
      investisseur:id_investisseur(nom, prenoms),
      statut_paiement:statut_paiement
    `)
    .eq('id_projet', projectId)
    .order('date_paiement', { ascending: false });

  if (error) {
    throw new Error(`Erreur lors de la récupération des investissements: ${error.message}`);
  }

  return data || [];
};

export const fetchProjectJalons = async (projectId: number): Promise<ProjectJalon[]> => {
  const { data, error } = await supabase
    .from('jalon_projet')
    .select(`
      *,
      jalon_agricole:id_jalon_agricole(nom_jalon, action_a_faire, id_culture, delai_apres_lancement),
      culture:jalon_agricole(id_culture(nom_culture))
    `)
    .eq('id_projet', projectId)
    .order('date_previsionnelle', { ascending: true });

  if (error) {
    throw new Error(`Erreur lors de la récupération des jalons: ${error.message}`);
  }

  // Tri par culture puis par date
  const sortedData = (data || []).sort((a, b) =>
    a.culture?.id_culture?.nom_culture?.localeCompare(
      b.culture?.id_culture?.nom_culture || ''
    ) || 0
  );

  return sortedData;
};

export const fetchJalonsAgricolesByCulture = async (cultureId: number): Promise<JalonAgricole[]> => {
  const { data, error } = await supabase
    .from('jalon_agricole')
    .select('*')
    .eq('id_culture', cultureId)
    .order('delai_apres_lancement', { ascending: true });

  if (error) {
    throw new Error(`Erreur lors de la récupération des jalons agricoles: ${error.message}`);
  }

  return data || [];
};

export const startProjectProduction = async (
  projectId: number, 
  projectCultures: { id_culture: number }[]
): Promise<void> => {
  const startDate = new Date().toISOString().split('T')[0];
  
  // Mise à jour du statut du projet
  const { error: projectError } = await supabase
    .from('projet')
    .update({
      statut: 'en cours',
      date_lancement: startDate
    })
    .eq('id_projet', projectId);

  if (projectError) {
    throw new Error(`Erreur lors du lancement du projet: ${projectError.message}`);
  }

  // Création des jalons pour chaque culture
  for (const projectCulture of projectCultures) {
    const jalons = await fetchJalonsAgricolesByCulture(projectCulture.id_culture);
    
    for (const jalon of jalons) {
      const jalonDate = new Date(startDate);
      jalonDate.setDate(jalonDate.getDate() + jalon.delai_apres_lancement);
      
      const { error: insertError } = await supabase
        .from('jalon_projet')
        .insert({
          id_projet: projectId,
          id_jalon_agricole: jalon.id_jalon_agricole,
          date_previsionnelle: jalonDate.toISOString().split('T')[0]
        });
      
      if (insertError) {
        throw new Error(`Erreur lors de la création du jalon: ${insertError.message}`);
      }
    }
  }
};

export const completeJalon = async (
  projectId: number, 
  jalonId: number, 
  realDate?: string
): Promise<void> => {
  const dateReelle = realDate || new Date().toISOString().split('T')[0];
  
  const { error } = await supabase
    .from('jalon_projet')
    .update({
      date_reelle: dateReelle
    })
    .eq('id_projet', projectId)
    .eq('id_jalon_agricole', jalonId);

  if (error) {
    throw new Error(`Erreur lors de la mise à jour du jalon: ${error.message}`);
  }
};

export const updateJalonWithReport = async (
  projectId: number,
  jalonId: number,
  rapport: string,
  photos: string[] = [],
  realDate?: string
): Promise<void> => {
  const dateReelle = realDate || new Date().toISOString().split('T')[0];
  
  const { error } = await supabase
    .from('jalon_projet')
    .update({
      date_reelle: dateReelle,
      rapport_jalon: rapport,
      photos_jalon: JSON.stringify(photos)
    })
    .eq('id_projet', projectId)
    .eq('id_jalon_agricole', jalonId);

  if (error) {
    throw new Error(`Erreur lors de la mise à jour du rapport: ${error.message}`);
  }
};

export const completeProject = async (projectId: number, endDate?: string): Promise<void> => {
  const dateFin = endDate || new Date().toISOString().split('T')[0];
  
  const { error } = await supabase
    .from('projet')
    .update({
      statut: 'terminé',
      date_fin: dateFin
    })
    .eq('id_projet', projectId);

  if (error) {
    throw new Error(`Erreur lors de la finalisation du projet: ${error.message}`);
  }
};

export const calculateProjectMetrics = (project: ProjectDataDetails, investments: Investment[]) => {
  const projetCultures = project.projet_culture || [];

  const totalCost = projetCultures.reduce((sum, pc) => 
    sum + (pc.cout_exploitation_previsionnel || 0), 0);

  const totalEstimatedRevenue = projetCultures.reduce((sum, pc) => {
    const rendement = pc.rendement_previsionnel || 0;
    const prixTonne = pc.culture?.prix_tonne || 0;
    return sum + (rendement * prixTonne);
  }, 0);

  const yieldStrings = projetCultures.map(pc => {
    const nom = pc.culture?.nom_culture || "Non spécifié";
    const tonnage = pc.rendement_previsionnel != null 
      ? pc.rendement_previsionnel 
      : (pc.culture?.rendement_ha || 0) * (project.surface_ha || 1);
    
    return `${Math.round(tonnage * 100) / 100} t de ${nom}`;
  });

  const rendementProduits = yieldStrings.length > 0 ? yieldStrings.join(", ") : "N/A";
  const totalProfit = totalEstimatedRevenue - totalCost;
  const currentFunding = investments.reduce((sum, inv) => sum + (inv.montant || 0), 0);
  const fundingProgress = totalCost === 0 ? 0 : Math.min(Math.round((currentFunding / totalCost) * 100), 100);

  return {
    totalCost,
    totalEstimatedRevenue,
    rendementProduits,
    totalProfit,
    currentFunding,
    fundingProgress,
    isFundingComplete: fundingProgress >= 100
  };
};

export const getJalonStatus = (jalon: ProjectJalon): 'completed' | 'overdue' | 'normal' => {
  if (jalon.date_reelle) {
    return 'completed';
  }
  
  const today = new Date();
  const datePrevisionnelle = new Date(jalon.date_previsionnelle);
  
  if (datePrevisionnelle < today && !jalon.date_reelle) {
    return 'overdue';
  }
  
  return 'normal';
};

export const areAllJalonsCompleted = (jalons: ProjectJalon[]): boolean => {
  return jalons.length > 0 && jalons.every(j => j.date_reelle);
};