
import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import TerrainCard from '~/components/Dashboard/Navigation/technicien/TerrainCard';
import { TerrainData } from "@/types/terrain";

interface TerrainCardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  terrainId: number;
}

const TerrainCardDialog: React.FC<TerrainCardDialogProps> = ({
  isOpen,
  onClose,
  terrainId
}) => {
  const [loading, setLoading] = useState(true);
  const [terrain, setTerrain] = useState<TerrainData | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && terrainId) {
      fetchTerrainDetails();
    }
  }, [isOpen, terrainId]);

  const fetchTerrainDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('terrain')
        .select(`
          *,
          region:id_region(nom_region),
          district:id_district(nom_district),
          commune:id_commune(nom_commune)
        `)
        .eq('id_terrain', terrainId)
        .single();
      
      if (error) throw error;
      
      // After getting terrain, get user info separately to avoid relationship issues
      let formattedData: any = {
        ...data,
        region_name: data.region?.nom_region,
        district_name: data.district?.nom_district,
        commune_name: data.commune?.nom_commune,
        tantsahaNom: '',
        techniqueNom: 'Non assigné',
        superviseurNom: 'Non assigné'
      };
      
      // Fetch tantsaha info if available
      if (data.id_tantsaha) {
        const { data: tantsahaData, error: tantsahaError } = await supabase
          .from('utilisateur')
          .select('nom, prenoms')
          .eq('id_utilisateur', data.id_tantsaha)
          .single();
          
        if (!tantsahaError && tantsahaData) {
          formattedData.tantsahaNom = `${tantsahaData.nom} ${tantsahaData.prenoms || ''}`.trim();
        }
      }
      
      // Fetch technicien info if available
      if (data.id_technicien) {
        const { data: technicienData, error: technicienError } = await supabase
          .from('utilisateur')
          .select('nom, prenoms')
          .eq('id_utilisateur', data.id_technicien)
          .single();
          
        if (!technicienError && technicienData) {
          formattedData.techniqueNom = `${technicienData.nom} ${technicienData.prenoms || ''}`.trim();
        } else {
          formattedData.techniqueNom = 'Non assigné';
        }
      } else {
        formattedData.techniqueNom = 'Non assigné';
      }
      
      // Fetch superviseur info if available
      if (data.id_superviseur) {
        const { data: superviseurData, error: superviseurError } = await supabase
          .from('utilisateur')
          .select('nom, prenoms')
          .eq('id_utilisateur', data.id_superviseur)
          .single();
          
        if (!superviseurError && superviseurData) {
          formattedData.superviseurNom = `${superviseurData.nom} ${superviseurData.prenoms || ''}`.trim();
        } else {
          formattedData.superviseurNom = 'Non assigné';
        }
      } else {
        formattedData.superviseurNom = 'Non assigné';
      }
      
      setTerrain(formattedData as TerrainData);
    } catch (error) {
      console.error('Error fetching terrain details:', error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les détails du terrain",
        variant: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  // If not open or no terrain data, don't render anything
  if (!isOpen || !terrainId) {
    return null;
  }

  // If loading or no terrain data yet, just return the closed TerrainCard
  if (loading || !terrain) {
    return null;
  }

  return (
    <TerrainCard
      isOpen={isOpen}
      onClose={onClose}
      terrain={terrain}
      userRole="simple" // Using 'simple' as default, could be passed as prop if needed
    />
  );
};

export default TerrainCardDialog;
