import { useState, useEffect } from 'react';
import { supabase } from '~/lib/data';
import { AssignedParcel } from '@/types/technicien';

export const useAssignedParcels = (userId: string, userRole: string) => {
  const [parcels, setParcels] = useState<AssignedParcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssignedParcels = async () => {
      try {
        setLoading(true);
        
        // Superviseurs voient tous les projets, techniciens seulement les leurs
        let query = supabase
          .from('projet')
          .select(`
            id_projet,
            titre,
            surface_ha,
            statut,
            date_debut_production,
            id_region,
            id_district,
            id_commune,
            id_terrain,
            terrain:id_terrain(id_terrain, nom_terrain),
            projet_culture!inner(
              id_projet_culture,
              culture:id_culture(id_culture, nom_culture),
              date_debut_previsionnelle,
              date_debut_reelle
            )
          `);

        if (userRole === 'technicien') {
          // Filtrer par technicien assigné
          query = query.eq('id_technicien', userId);
        }

        const { data, error } = await query;
        
        if (error) throw error;

        const formattedParcels: AssignedParcel[] = [];
        
        for (const project of data || []) {
          // Fetch jalons for this project
          const { data: jalonsData } = await supabase
            .from('jalon_projet')
            .select(`
              id_projet,
              date_previsionnelle,
              date_reelle,
              jalon_agricole:id_jalon_agricole(
                nom_jalon,
                id_culture
              )
            `)
            .eq('id_projet', project.id_projet)
            .order('date_previsionnelle', { ascending: false });

          const culturesWithJalons = project.projet_culture?.map((pc: any) => {
            // Find the latest jalon for this culture
            const cultureJalons = jalonsData?.filter(j => 
              j.jalon_agricole?.id_culture === pc.culture?.id_culture
            ) || [];
            
            let dernierJalon = '';
            let dateDernierJalon = '';
            let statutJalon = 'En attente';
            
            if (cultureJalons.length > 0) {
              // Find the latest completed jalon or the next pending one
              const completedJalons = cultureJalons.filter(j => j.date_reelle);
              const pendingJalons = cultureJalons.filter(j => !j.date_reelle);
              
              if (completedJalons.length > 0) {
                const latest = completedJalons[0];
                dernierJalon = latest.jalon_agricole?.nom_jalon || '';
                dateDernierJalon = latest.date_reelle;
                statutJalon = 'Terminé';
              } else if (pendingJalons.length > 0) {
                const next = pendingJalons[pendingJalons.length - 1]; // Get the earliest pending
                dernierJalon = next.jalon_agricole?.nom_jalon || '';
                dateDernierJalon = next.date_previsionnelle;
                statutJalon = 'En cours';
              }
            }

            return {
              nom_culture: pc.culture?.nom_culture || 'Non spécifié',
              phase_actuelle: determinePhase(pc.date_debut_previsionnelle, pc.date_debut_reelle),
              date_semis: pc.date_debut_previsionnelle,
              date_recolte_prevue: pc.date_debut_reelle,
              dernier_jalon: dernierJalon,
              date_dernier_jalon: dateDernierJalon,
              statut_jalon: statutJalon,
            };
          }) || [];

          formattedParcels.push({
            id_projet: project.id_projet,
            titre: project.titre || `Projet ${project.id_projet}`,
            surface_ha: project.surface_ha || 0,
            statut: project.statut || 'en_cours',
            date_debut_production: project.date_debut_production,
            id_terrain: project.terrain?.id_terrain,
            nom_terrain: project.terrain?.nom_terrain,
            cultures: culturesWithJalons,
            localisation: {
              region: project.id_region?.toString() || 'Non spécifié',
              district: project.id_district?.toString() || 'Non spécifié',
              commune: project.id_commune?.toString() || 'Non spécifié',
            },
            prochaines_actions: [], // À implémenter selon la logique métier
          });
        }

        setParcels(formattedParcels);
      } catch (err) {
        console.error('Error fetching assigned parcels:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchAssignedParcels();
    }
  }, [userId, userRole]);

  return { parcels, loading, error };
};

// Fonction utilitaire pour déterminer la phase actuelle
const determinePhase = (datePrevisionnelle?: string, dateReelle?: string): 'ensemencement' | 'croissance' | 'recolte' | 'termine' => {
  if (!datePrevisionnelle) return 'ensemencement';
  
  const semis = new Date(datePrevisionnelle);
  const maintenant = new Date();
  const recolte = dateReelle ? new Date(dateReelle) : null;
  
  if (recolte && maintenant > recolte) return 'termine';
  if (recolte && maintenant >= new Date(recolte.getTime() - 30 * 24 * 60 * 60 * 1000)) return 'recolte';
  if (maintenant > semis) return 'croissance';
  
  return 'ensemencement';
};
