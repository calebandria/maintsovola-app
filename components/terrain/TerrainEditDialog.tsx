import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Button } from '../ui/terrain/Button';
import { TerrainData } from '@/types/terrain';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '../ui/terrain/use-toast';
import TerrainForm from './TerrainForm';
import { Entypo } from '@expo/vector-icons';

interface TerrainEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  terrain?: TerrainData;
  onSubmitSuccess: (terrain: TerrainData) => void;
  userId: string;
  userRole?: string;
  isValidationMode?: boolean;
  agriculteurs?: { id_utilisateur: string; nom: string; prenoms?: string }[];
}

const TerrainEditDialog: React.FC<TerrainEditDialogProps> = ({
  isOpen,
  onClose,
  terrain,
  onSubmitSuccess,
  userId,
  userRole = 'simple',
  isValidationMode = false,
  agriculteurs = [],
}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const isNew = !terrain || !terrain.id_terrain;

  const handleSubmit = async (data: Partial<TerrainData>) => {
    if (!userId) return;

    setLoading(true);
    try {
      // Handle image URLs (convert arrays to strings)
      const dataToSave = { ...data };

      if (Array.isArray(dataToSave.photos)) {
        dataToSave.photos = dataToSave.photos.join(',');
      }

      if (Array.isArray(dataToSave.photos_validation)) {
        dataToSave.photos_validation = dataToSave.photos_validation.join(',');
      }

      let result;

      if (isNew) {
        // Create new terrain
        const newTerrain = {
          ...dataToSave,
          id_tantsaha: userRole === 'simple' ? userId : data.id_tantsaha,
          statut: false,
          archive: false,
          created_by: userId,
        };

        const { data: insertedData, error } = await supabase
          .from('terrain')
          .insert(newTerrain as any)
          .select('*')
          .single();

        if (error) throw error;
        result = insertedData;

        toast({
          title: 'Succès',
          description: 'Terrain ajouté avec succès',
          variant: 'success',
        });
      } else if (isValidationMode && terrain) {
        // Update terrain and set as validated
        const updatedTerrain = {
          ...dataToSave,
          statut: true,
          surface_validee: data.surface_validee || terrain.surface_proposee,
          id_superviseur: userId,
          date_validation: new Date().toISOString().split('T')[0],
        };

        const { data: updatedData, error } = await supabase
          .from('terrain')
          .update(updatedTerrain as any)
          .eq('id_terrain', terrain.id_terrain as number)
          .select('*')
          .single();

        if (error) throw error;
        result = updatedData;

        // Send notification to owner
        if (terrain.id_tantsaha) {
          await supabase.from('notification').insert({
            id_destinataire: terrain.id_tantsaha,
            id_expediteur: userId,
            titre: 'Terrain validé',
            message: `Votre terrain ${terrain.nom_terrain} a été validé`,
            type: 'success',
            entity_type: 'terrain',
            entity_id: terrain.id_terrain,
          });
        }

        // Send notification to technician if assigned
        if (terrain.id_technicien) {
          await supabase.from('notification').insert({
            id_destinataire: terrain.id_technicien,
            id_expediteur: userId,
            titre: 'Terrain validé',
            message: `Le terrain ${terrain.nom_terrain} a été validé`,
            type: 'success',
            entity_type: 'terrain',
            entity_id: terrain.id_terrain,
          });
        }

        toast({
          title: 'Succès',
          description: 'Terrain validé avec succès',
          variant: 'success',
        });
      } else if (terrain) {
        // Update existing terrain
        const { data: updatedData, error } = await supabase
          .from('terrain')
          .update(dataToSave as any)
          .eq('id_terrain', terrain.id_terrain as number)
          .select('*')
          .single();

        if (error) throw error;
        result = updatedData;

        toast({
          title: 'Succès',
          description: 'Terrain mis à jour avec succès',
          variant: 'success',
        });
      }

      // Fetch additional data for the terrain
      if (result) {
        // Get region name
        if (result.id_region) {
          const { data: regionData } = await supabase
            .from('region')
            .select('nom_region')
            .eq('id_region', result.id_region)
            .maybeSingle();

          if (regionData) {
            (result as any).region_name = regionData.nom_region;
          }
        }

        // Get district name
        if (result.id_district) {
          const { data: districtData } = await supabase
            .from('district')
            .select('nom_district')
            .eq('id_district', result.id_district)
            .maybeSingle();

          if (districtData) {
            (result as any).district_name = districtData.nom_district;
          }
        }

        // Get commune name
        if (result.id_commune) {
          const { data: communeData } = await supabase
            .from('commune')
            .select('nom_commune')
            .eq('id_commune', result.id_commune)
            .maybeSingle();

          if (communeData) {
            (result as any).commune_name = communeData.nom_commune;
          }
        }

        // Get farmer name
        if (result.id_tantsaha) {
          const { data: ownerData } = await supabase
            .from('utilisateurs_par_role')
            .select('nom, prenoms')
            .eq('id_utilisateur', result.id_tantsaha)
            .maybeSingle();

          if (ownerData) {
            (result as any).tantsahaNom = `${ownerData.nom} ${ownerData.prenoms || ''}`.trim();
          }
        }

        // Get technician name
        if (result.id_technicien) {
          const { data: techData } = await supabase
            .from('utilisateurs_par_role')
            .select('nom, prenoms')
            .eq('id_utilisateur', result.id_technicien)
            .maybeSingle();

          if (techData) {
            (result as any).techniqueNom = `${techData.nom} ${techData.prenoms || ''}`.trim();
          } else {
            (result as any).techniqueNom = 'Non assigné';
          }
        } else {
          (result as any).techniqueNom = 'Non assigné';
        }

        // Get supervisor name
        if (result.id_superviseur) {
          const { data: supervData } = await supabase
            .from('utilisateurs_par_role')
            .select('nom, prenoms')
            .eq('id_utilisateur', result.id_superviseur)
            .maybeSingle();

          if (supervData) {
            (result as any).superviseurNom = `${supervData.nom} ${supervData.prenoms || ''}`.trim();
          } else {
            (result as any).superviseurNom = 'Non assigné';
          }
        } else {
          (result as any).superviseurNom = 'Non assigné';
        }

        onSubmitSuccess(result as TerrainData);
      }

      onClose();
    } catch (error: any) {
      console.error('Error saving terrain:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue',
        variant: 'error',
      });
      setLoading(false);
    }
  };

  return (
    <Modal visible={isOpen} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {isValidationMode
              ? `Valider le terrain: ${terrain?.nom_terrain}`
              : isNew
                ? 'Ajouter un terrain'
                : `Modifier le terrain: ${terrain?.nom_terrain}`}
          </Text>
          <Button
            variant="ghost"
            size="icon"
            onPress={onClose}
            icon={<Entypo name="cross" size={24} color="black" />}
          />
        </View>

        <Text style={styles.description}>
          {isValidationMode
            ? 'Completez le formulaire pour valider ce terrain'
            : isNew
              ? 'Remplissez les informations du nouveau terrain'
              : 'Modifiez les informations du terrain'}
        </Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text style={styles.loadingText}>
              {isNew ? 'Création' : 'Mise à jour'} du terrain en cours...
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.formContainer}>
            <TerrainForm
              initialData={terrain}
              onSubmit={handleSubmit}
              onCancel={onClose}
              userRole={userRole}
              userId={userId}
              agriculteurs={agriculteurs}
              isValidationMode={isValidationMode}
              onSubmitSuccess={onSubmitSuccess}
            />
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#F4FBF6',
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    margin: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 3,
    marginHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  formContainer: {
    flex: 1,
  },
});

export default TerrainEditDialog;
