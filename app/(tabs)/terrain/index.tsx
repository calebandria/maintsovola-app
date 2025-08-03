import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { AntDesign, Feather } from '@expo/vector-icons';
import SubNavTabs from 'components/terrain/TerrainSubNavTabs';
import { useAuth } from 'contexts/AuthContext';
import { router } from 'expo-router';
import { supabase } from 'integrations/supabase/client';
import { TerrainData } from '../../../types/Terrain';
import { useToast } from '../../../components/ui/terrain/use-toast';
import TerrainTable from '../../../components/terrain/TerrainTable';
import TerrainEditDialog from '../../../components/terrain/TerrainEditDialog';
import TerrainCard from '../../../components/terrain/TerrainCard';
import MessageDialog from '../../../components/terrain/MessageDialog';

const Header = ({ onCreateTerrain }: { onCreateTerrain: () => void }) => {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>Gestion des terrains</Text>
      <TouchableOpacity style={styles.button} onPress={onCreateTerrain}>
        <Feather name="plus" color="#193B2D" style={styles.icon} />
        <Text style={styles.text}>Nouveau terrain</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function TerrainScreen() {
  const { user, profile } = useAuth();

  const userRole = profile?.nom_role?.toLowerCase() || 'simple';
  // console.log(userRole);

  useEffect(() => {
    if (!user) {
      router.replace('/(auth)/login');
    }
  }, [user]);

  const { toast } = useToast();

  const [loadingTerrains, setLoadingTerrains] = useState(true);
  const [pendingTerrains, setPendingTerrains] = useState<TerrainData[]>([]);
  const [validatedTerrains, setValidatedTerrains] = useState<TerrainData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTerrain, setSelectedTerrain] = useState<TerrainData | null>(null);
  const [selectedTechnicien, setSelectedTechnicien] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isTerrainDialogOpen, setIsTerrainDialogOpen] = useState(false);
  const [isTerrainCardOpen, setIsTerrainCardOpen] = useState(false);
  const [isTerrainValidateOpen, setIsTerrainValidateOpen] = useState(false);
  const [isTerrainDeleteOpen, setIsTerrainDeleteOpen] = useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);

  const [agriculteurs, setAgriculteurs] = useState<
    {
      id_utilisateur: string;
      nom: string;
      prenoms?: string;
    }[]
  >([]);
  const [techniciens, setTechniciens] = useState<
    {
      id_utilisateur: string;
      nom: string;
      prenoms?: string;
    }[]
  >([]);

  const fetchAgriculteurs = useCallback(async () => {
    if (userRole !== 'technicien' && userRole !== 'superviseur') return;
    try {
      const { data, error } = await supabase
        .from('utilisateurs_par_role')
        .select('id_utilisateur, nom, prenoms')
        .eq('id_role', 1);
      if (error) throw error;
      setAgriculteurs(
        (data || []).map(
          (item: {
            id_utilisateur: string | null;
            nom: string | null;
            prenoms: string | null;
          }) => ({
            id_utilisateur: item.id_utilisateur ?? '',
            nom: item.nom ?? '',
            ...(item.prenoms !== null && { prenoms: item.prenoms }),
          })
        )
      );
    } catch (error) {
      console.error('Error fetching agriculteurs:', error);
    }
  }, [userRole]);
  const fetchTerrains = useCallback(async () => {
    if (!user) return;
    setLoadingTerrains(true);
    try {
      /**
       * 1. Prépare le filtre sur le rôle
       *    (on ne modifie QUE la partie `filter`, pas la requête principale)
       */
      const roleFilter: Record<string, unknown> = {};
      if (userRole === 'simple') roleFilter.id_tantsaha = user.id;
      else if (userRole === 'technicien') roleFilter.id_technicien = user.id;
      /**
       * 2. Requête unique comprenant :
       *    - les tables dépendantes (`region`, `district`, `commune`)
       *    - les trois utilisateurs liés (tech, superviseur, tantsaha)
       */

      const { data, error } = await supabase
        .from('v_terrain_complet')
        .select('*')
        .match(roleFilter); // même logique de filtre

      if (error) throw error;
      const terrains = (data ?? []).map((t) => ({
        id_terrain: t.id_terrain,
        nom_terrain: t.nom_terrain || `Terrain #${t.id_terrain}`,
        surface_proposee: t.surface_proposee,
        surface_validee: t.surface_validee,
        acces_eau: t.acces_eau,
        acces_route: t.acces_route,
        statut: t.statut,
        geom: t.geom,
        photos: t.photos ?? '',
        photos_validation: t.photos_validation ?? '',
        rapport_validation: t.rapport_validation ?? '',
        date_validation: t.date_validation,
        /* libellés déjà disponibles */
        id_region: t.id_region ?? null,
        id_district: t.id_district ?? null,
        id_commune: t.id_commune ?? null,
        region_name: t.nom_region ?? 'Non spécifié',
        district_name: t.nom_district ?? 'Non spécifié',
        commune_name: t.nom_commune ?? 'Non spécifié',
        id_technicien: t.id_technicien ?? null,
        id_superviseur: t.id_superviseur ?? null,
        id_tantsaha: t.id_tantsaha ?? null,
        techniqueNom: t.technicien_nom
          ? `${t.technicien_nom} ${t.technicien_prenoms ?? ''}`.trim()
          : 'Non assigné',
        superviseurNom: t.superviseur_nom
          ? `${t.superviseur_nom} ${t.superviseur_prenoms ?? ''}`.trim()
          : 'Non assigné',
        tantsahaNom: t.tantsaha_nom
          ? `${t.tantsaha_nom} ${t.tantsaha_prenoms ?? ''}`.trim()
          : 'Non spécifié',
      }));
      setPendingTerrains(terrains.filter((t) => t.statut === false) as TerrainData[]);
      setValidatedTerrains(terrains.filter((t) => t.statut === true) as TerrainData[]);
    } catch (err) {
      console.error('Error fetching terrains:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de récupérer les terrains',
        variant: 'error',
      });
    } finally {
      setLoadingTerrains(false);
    }
  }, [user, userRole, toast]);
  const fetchTechniciens = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('utilisateurs_par_role')
        .select('id_utilisateur, nom, prenoms')
        .eq('id_role', 4);
      if (error) throw error;
      setTechniciens(
        (data || []).map(
          (item: {
            id_utilisateur: string | null;
            nom: string | null;
            prenoms: string | null;
          }) => ({
            id_utilisateur: item.id_utilisateur ?? '',
            nom: item.nom ?? '',
            ...(item.prenoms !== null && { prenoms: item.prenoms }),
          })
        )
      );
    } catch (error) {
      console.error('Error fetching techniciens:', error);
    }
  }, []);

  const [activeTab, setActiveTab] = useState(() => {
    if (userRole === 'superviseur') {
      return 'À assigner';
    } else {
      return 'En attente';
    }
  });
  const tabs =
    userRole === 'superviseur' ? ['À assigner', 'À valider', 'Validés'] : ['En attente', 'Validés'];

  useEffect(() => {
    if (user) {
      fetchTerrains();
      fetchTechniciens();
      fetchAgriculteurs();
    }
  }, [user, fetchTerrains, fetchTechniciens, fetchAgriculteurs]);

  const handleTerrainUpdate = (
    updatedTerrain?: TerrainData,
    action?: 'add' | 'update' | 'delete'
  ) => {
    if (!updatedTerrain) return;
    if (action === 'delete') {
      setPendingTerrains((prev) => prev.filter((t) => t.id_terrain !== updatedTerrain.id_terrain));
      setValidatedTerrains((prev) =>
        prev.filter((t) => t.id_terrain !== updatedTerrain.id_terrain)
      );
    } else if (action === 'add') {
      if (updatedTerrain.statut) {
        setValidatedTerrains((prev) => [updatedTerrain, ...prev]);
      } else {
        setPendingTerrains((prev) => [updatedTerrain, ...prev]);
      }
    } else if (action === 'update') {
      if (updatedTerrain.statut) {
        setPendingTerrains((prev) =>
          prev.filter((t) => t.id_terrain !== updatedTerrain.id_terrain)
        );
        setValidatedTerrains((prev) => {
          const exists = prev.some((t) => t.id_terrain === updatedTerrain.id_terrain);
          if (exists) {
            return prev.map((t) =>
              t.id_terrain === updatedTerrain.id_terrain ? updatedTerrain : t
            );
          } else {
            return [updatedTerrain, ...prev];
          }
        });
      } else {
        setValidatedTerrains((prev) =>
          prev.filter((t) => t.id_terrain !== updatedTerrain.id_terrain)
        );
        setPendingTerrains((prev) => {
          const exists = prev.some((t) => t.id_terrain === updatedTerrain.id_terrain);
          if (exists) {
            return prev.map((t) =>
              t.id_terrain === updatedTerrain.id_terrain ? updatedTerrain : t
            );
          } else {
            return [updatedTerrain, ...prev];
          }
        });
      }
    }
  };
  const handleCreateTerrain = () => {
    setSelectedTerrain(null);
    setIsTerrainDialogOpen(true);
  };
  const handleEditTerrain = (terrain: TerrainData) => {
    setSelectedTerrain(terrain);
    setIsTerrainDialogOpen(true);
  };
  const handleViewTerrainDetails = (terrain: TerrainData) => {
    setSelectedTerrain(terrain);
    setIsTerrainCardOpen(true);
  };
  const handleValidateTerrain = (terrain: TerrainData) => {
    setSelectedTerrain(terrain);
    setIsTerrainValidateOpen(true);
  };
  const handleDeleteTerrain = (terrain: TerrainData) => {
    setSelectedTerrain(terrain);
    setIsTerrainDeleteOpen(true);
  };
  const handleTerrainSaved = (updatedTerrain: TerrainData) => {
    console.log('Terrain saved:', updatedTerrain);
    const isNewTerrain =
      !pendingTerrains.some((t) => t.id_terrain === updatedTerrain.id_terrain) &&
      !validatedTerrains.some((t) => t.id_terrain === updatedTerrain.id_terrain);
    if (isNewTerrain) {
      handleTerrainUpdate(updatedTerrain, 'add');
    } else {
      handleTerrainUpdate(updatedTerrain, 'update');
    }
    setIsTerrainDialogOpen(false);
    setIsTerrainValidateOpen(false);
  };
  const handleContactTechnicien = (terrain: TerrainData) => {
    setSelectedTerrain(terrain);
    if (terrain.id_technicien) {
      setSelectedTechnicien({
        id: terrain.id_technicien,
        name: `${terrain.techniqueNom ?? ''}`.trim(),
      });
      setIsMessageDialogOpen(true);
    }
  };
  //icii
  const filteredTerrains =
    activeTab === 'En attente'
      ? pendingTerrains.filter((terrain) =>
          [
            terrain.nom_terrain,
          ].some((field) => (field?.toLowerCase() || '').includes(searchQuery.toLowerCase()))
        )
      : validatedTerrains.filter((terrain) =>
          [
            terrain.nom_terrain,
          ].some((field) => (field?.toLowerCase() || '').includes(searchQuery.toLowerCase()))
        );
  return (
    <View style={styles.container}>
      <Header onCreateTerrain={handleCreateTerrain} />
      <View style={styles.searchContainer}>
        <Feather name="search" size={26} style={styles.searchIcon} />
        <TextInput
          placeholder="Rechercher un terrain..."
          placeholderTextColor={'#218358'}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          style={styles.inputSearch}
        />
      </View>
      {userRole === 'superviseur' ? (
        <View>
          <SubNavTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
          {activeTab === 'À assigner' && (
            <View style={styles.viewContainer}>
              <TerrainTable
                terrains={filteredTerrains.filter((t) => !t.id_technicien)}
                type="pending"
                userRole={userRole}
                onTerrainUpdate={handleTerrainUpdate}
                techniciens={techniciens}
                onEdit={handleEditTerrain}
                onViewDetails={handleViewTerrainDetails}
                onDelete={handleDeleteTerrain}
              />
            </View>
          )}
          {activeTab === 'À valider' && (
            <View style={styles.viewContainer}>
              <TerrainTable
                terrains={filteredTerrains.filter((t) => !t.id_technicien)}
                type="pending"
                userRole={userRole}
                onTerrainUpdate={handleTerrainUpdate}
                onEdit={handleEditTerrain}
                onViewDetails={handleViewTerrainDetails}
                onValidate={handleValidateTerrain}
                onDelete={handleDeleteTerrain}
              />
            </View>
          )}
          {activeTab === 'Validés' && (
            <View style={styles.viewContainer}>
              <TerrainTable
                terrains={filteredTerrains}
                type="validated"
                userRole={userRole}
                onTerrainUpdate={handleTerrainUpdate}
                onEdit={handleEditTerrain}
                onViewDetails={handleViewTerrainDetails}
                onDelete={handleDeleteTerrain}
              />
            </View>
          )}
        </View>
      ) : userRole === 'technicien' ? (
        <View>
          {/* <View style={styles.searchContainer}>
            <Text>Débug: Barre de recherche</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un terrain..."
              value={searchQuery}
              onChangeText={(text) => setSearchQuery(text)}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View> */}
          <SubNavTabs
            tabs={['En attente', 'Validés']}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
          {activeTab === 'En attente' && (
            <View style={styles.viewContainer}>
              <TerrainTable
                terrains={filteredTerrains.filter((t) => t.id_technicien === user?.id)}
                type="pending"
                userRole={userRole}
                onTerrainUpdate={handleTerrainUpdate}
                onEdit={handleEditTerrain}
                onViewDetails={handleViewTerrainDetails}
                onValidate={handleValidateTerrain}
              />
            </View>
          )}
          {activeTab === 'Validés' && (
            <View style={styles.viewContainer}>
              <TerrainTable
                terrains={filteredTerrains.filter((t) => t.id_technicien === user?.id)}
                type="validated"
                userRole={userRole}
                onTerrainUpdate={handleTerrainUpdate}
                onViewDetails={handleViewTerrainDetails}
              />
            </View>
          )}
        </View>
      ) : (
        <View>
          <SubNavTabs
            tabs={['En attente', 'Validés']}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
          {activeTab === 'En attente' && (
            <View style={styles.viewContainer}>
              <TerrainTable
                terrains={filteredTerrains}
                type="pending"
                userRole={userRole}
                onTerrainUpdate={handleTerrainUpdate}
                onEdit={handleEditTerrain}
                onViewDetails={handleViewTerrainDetails}
              />
            </View>
          )}
          {activeTab === 'Validés' && (
            <View style={styles.viewContainer}>
              <TerrainTable
                terrains={filteredTerrains}
                type="validated"
                userRole={userRole}
                onTerrainUpdate={handleTerrainUpdate}
                onViewDetails={handleViewTerrainDetails}
                onContactTechnicien={handleContactTechnicien}
              />
            </View>
          )}
        </View>
      )}
      {/* Dialog pour création/édition de terrain */}
      {isTerrainDialogOpen && (
        <TerrainEditDialog
          isOpen={isTerrainDialogOpen}
          onClose={() => setIsTerrainDialogOpen(false)}
          terrain={(selectedTerrain as any) || undefined}
          onSubmitSuccess={handleTerrainSaved as any}
          userId={user?.id ?? ''}
          userRole={userRole}
          isValidationMode={false}
          agriculteurs={agriculteurs}
        />
      )}

      {/* Dialog pour validation de terrain */}
      {isTerrainValidateOpen && selectedTerrain && (
        <TerrainEditDialog
          isOpen={isTerrainValidateOpen}
          onClose={() => setIsTerrainValidateOpen(false)}
          terrain={{
            ...selectedTerrain,
            id_tantsaha: selectedTerrain.id_tantsaha ?? undefined,
          }}
          onSubmitSuccess={handleTerrainSaved}
          userId={user?.id ?? ''}
          userRole={userRole}
          isValidationMode={true}
          agriculteurs={agriculteurs}
        />
      )}

      {/* Card pour affichage des détails du terrain */}
      {isTerrainCardOpen && selectedTerrain && (
        <TerrainCard
          isOpen={isTerrainCardOpen}
          onClose={() => setIsTerrainCardOpen(false)}
          terrain={selectedTerrain}
          onTerrainUpdate={handleTerrainUpdate}
          userRole={userRole}
        />
      )}

      {/* Card pour suppression de terrain */}
      {isTerrainDeleteOpen && selectedTerrain && (
        <TerrainCard
          isOpen={isTerrainDeleteOpen}
          onClose={() => setIsTerrainDeleteOpen(false)}
          terrain={selectedTerrain}
          onTerrainUpdate={handleTerrainUpdate}
          isDeleteMode={true}
          userRole={userRole}
        />
      )}

      {/* Dialog pour contact du technicien */}
      {isMessageDialogOpen && selectedTechnicien && (
        <MessageDialog
          isOpen={isMessageDialogOpen}
          onClose={() => setIsMessageDialogOpen(false)}
          technicien={selectedTechnicien}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: '#FBFEFC',
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 23,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#218358',
    width: '50%',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C4E8D1',
    padding: 14,
    borderRadius: 8,
    gap: 14,
    borderColor: '#5BB98B',
    borderWidth: 2,
  },
  text: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#193B2D',
  },
  icon: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  viewContainer: {
    borderColor: '#e5e7eb',
    borderWidth: 1,
    borderRadius: 10,
    maxHeight: 550,
    height: '76%',
  },
  littleDescription: {
    fontSize: 15,
    fontWeight: 500,
    marginVertical: 15,
  },
  searchContainer: {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    paddingLeft: '10%',
    paddingRight: '5%',
    borderWidth: 1,
    borderColor: '#5BB98B',
    borderRadius: 15,
    paddingVertical: 5,
    marginVertical: 5,
    backgroundColor: '#F4FBF6',
    marginBottom: 10,
  },
  searchInput: {
    borderColor: '#9ca3af',
    borderWidth: 1,
    borderRadius: 10,
    fontSize: 16,
  },
  inputSearch: {
    color: '#193B2D',
  },
  searchIcon: {
    position: 'absolute',
    left: '3%',
    color: '#30A46C',
  },
});
