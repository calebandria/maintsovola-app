import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';

import { Button } from 'components/ui/terrain/Button';
import { Badge } from '../ui/terrain/Badge';

import { MaterialIcons, MaterialCommunityIcons, FontAwesome6, Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { TerrainData } from '../../types/Terrain';
import { supabase } from '../../integrations/supabase/client';

interface TerrainTableProps {
  terrains: TerrainData[];
  type?: 'pending' | 'validated';
  userRole?: string;
  onTerrainUpdate: (terrain: TerrainData, action?: 'update' | 'delete') => void;
  onEdit?: (terrain: TerrainData) => void;
  onViewDetails?: (terrain: TerrainData) => void;
  onValidate?: (terrain: TerrainData) => void;
  onDelete?: (terrain: TerrainData) => void;
  onContactTechnicien?: (terrain: TerrainData) => void;
  techniciens?: { id_utilisateur: string; nom: string; prenoms?: string }[];
}

const TerrainTable: React.FC<TerrainTableProps> = ({
  terrains,
  type = 'pending',
  userRole = 'simple',
  onTerrainUpdate,
  onEdit,
  onViewDetails,
  onValidate,
  onDelete,
  onContactTechnicien,
  techniciens = [],
}) => {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof TerrainData;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [selectedTech, setSelectedTech] = useState<{ terrainId: number; techId: string } | null>(
    null
  );
  const [modalVisible, setModalVisible] = useState(false);

  const sortedTerrains = useMemo(() => {
    if (!sortConfig) return terrains;

    return [...terrains].sort((a, b) => {
      const aValue = a[sortConfig.key] ?? '';
      const bValue = b[sortConfig.key] ?? '';

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [terrains, sortConfig]);

  const requestSort = (key: keyof TerrainData) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  function convertSupabaseToTerrainData(data: any): TerrainData {
    return {
      ...data,
      surface_validee: data.surface_validee ?? undefined,
      surface_proposee: data.surface_proposee ?? 0, // Valeur par défaut
      acces_eau: data.acces_eau ?? undefined,
      acces_route: data.acces_route ?? undefined,
    };
  }
  const assignTechnicien = async (terrainId: number, technicienId: string) => {
    try {
      const { data, error } = await supabase
        .from('terrain')
        .update({ id_technicien: technicienId })
        .eq('id_terrain', terrainId)
        .select('*')
        .single();

      if (error) throw error;

      const tech = techniciens.find((t) => t.id_utilisateur === technicienId);
      const updatedTerrain = convertSupabaseToTerrainData({
        ...data,
        techniqueNom: tech ? `${tech.nom} ${tech.prenoms || ''}`.trim() : 'Non assigné',
      });
      onTerrainUpdate(updatedTerrain, 'update');
      Toast.show({
        type: 'success',
        text1: 'Technicien assigné avec succès',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.message || "Échec de l'assignation",
      });
    } finally {
      setModalVisible(false);
    }
  };

  const renderItem = ({ item }: { item: TerrainData }) => (
    <View style={styles.itemContainer}>
      <TouchableOpacity
        onPress={() => {
          onViewDetails?.(item);
        }}>
        <View style={styles.row}>
          <View style={styles.info1}>
            <Text style={styles.terrainName}>{item.nom_terrain}</Text>
            {/* <Text style={styles.terrainName}>{item.tantsahaNom || 'Non spécifié'}</Text> */}
          </View>

          {/* <View>
            <Text>
              {item.region_name}, {item.district_name}, {item.commune_name}
            </Text>
          </View> */}

          {/* <View>
            <Text>{item.surface_validee || item.surface_proposee} ha</Text>
            {item.surface_validee !== item.surface_proposee && (
              <Text style={styles.smallText}> Proposé: {item.surface_proposee} ha</Text>
            )}
          </View> */}
          {type === 'pending' && userRole === 'superviseur' && (
            <View style={[styles.technicien]}>
              {item.id_technicien ? (
                <View style={styles.techContainer}>
                  <MaterialIcons name="check" size={16} color="green" />
                  <Text>{item.techniqueNom}</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.assignButton}
                  onPress={() => {
                    setSelectedTech({ terrainId: item.id_terrain!, techId: '' });
                    setModalVisible(true);
                  }}>
                  <Text>Assigner</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* {type === 'validated' && (
            <View style={[styles.valide]}>
              <Text>{item.superviseurNom || 'Non spécifié'}</Text>
            </View>
          )} */}

          <View style={styles.info2}>
            <Badge variant={item.acces_eau ? 'success' : 'destructive'}>
              <MaterialIcons
                name={item.acces_eau ? 'check' : 'close'}
                size={14}
                color={item.acces_eau ? 'black' : 'white'}
              />
              <Text> Eau</Text>
            </Badge>
            <View style={{ height: 5 }} />
            <Badge variant={item.acces_route ? 'success' : 'destructive'}>
              <MaterialIcons
                name={item.acces_route ? 'check' : 'close'}
                size={14}
                color={item.acces_route ? 'black' : 'white'}
              />
              <Text> Route</Text>
            </Badge>
          </View>

          <View style={styles.iconContainer}>
            {onViewDetails && (
              <Button
                variant="ghost"
                size="icon"
                onPress={() => onViewDetails(item)}
                title={<MaterialCommunityIcons name="eye-outline" size={20} color="white" />}
              />
            )}
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onPress={() => onEdit(item)}
                title={<FontAwesome6 name="edit" size={18} color="white" />}
              />
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onPress={() => onDelete(item)}
                title={<Feather name="trash-2" size={20} color="white" />}
              />
            )}
            {onValidate && (userRole === 'superviseur' || userRole === 'technicien') && (
              <Button
                variant="ghost"
                size="icon"
                onPress={() => onValidate(item)}
                title={
                  <MaterialCommunityIcons name="check-circle-outline" size={20} color="white" />
                }
              />
            )}
            {onContactTechnicien && (
              <Button
                variant="ghost"
                size="icon"
                onPress={() => onContactTechnicien(item)}
                title={<MaterialCommunityIcons name="message-outline" size={20} color="white" />}
              />
            )}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* En-tête du tableau */}
      {/* <View style={styles.header}>
        <TouchableOpacity style={styles.nom_terrain} onPress={() => requestSort('nom_terrain')}>
          <Text>
            Terrain
            {sortConfig?.key === 'nom_terrain' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.region_name} onPress={() => requestSort('region_name')}>
          <Text>
            Localisation
            {sortConfig?.key === 'region_name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.surface_proposee}
          onPress={() => requestSort('surface_proposee')}>
          <Text>
            Surface
            {sortConfig?.key === 'surface_proposee'
              ? sortConfig.direction === 'asc'
                ? '↑'
                : '↓'
              : ''}
          </Text>
        </TouchableOpacity>
        {type === 'pending' && userRole === 'superviseur' && (
          <View style={[styles.headerCell, styles.technicien]}>
            <Text>Technicien</Text>
          </View>
        )}
        {type === 'validated' && (
          <View style={(styles.headerCell, styles.valide)}>
            <Text>Validé par</Text>
          </View>
        )}
        <View style={(styles.headerCell, styles.access)}>
          <Text>Accès</Text>
        </View>
        <View style={(styles.headerCell, styles.action)}>
          <Text>Actions</Text>
        </View>
      </View> */}

      {/* Liste des terrains */}
      <FlatList
        style={styles.list}
        data={sortedTerrains}
        renderItem={renderItem}
        keyExtractor={(item) => item.id_terrain?.toString() || Math.random().toString()}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {type === 'pending' ? 'Aucun terrain en attente' : 'Aucun terrain validé'}
            </Text>
          </View>
        }
      />

      {/* Modal pour assigner un technicien */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Assigner un technicien</Text>

            {techniciens.map((tech) => (
              <TouchableOpacity
                key={tech.id_utilisateur}
                style={styles.techItem}
                onPress={() =>
                  selectedTech && assignTechnicien(selectedTech.terrainId, tech.id_utilisateur)
                }>
                <Text>
                  {tech.nom} {tech.prenoms}
                </Text>
              </TouchableOpacity>
            ))}

            <Button
              variant="outline"
              title="Annuler"
              onPress={() => setModalVisible(false)}
              style={styles.cancelButton}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#e5e7eb',
    width: 810,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerCell: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  list: {
    // width: '100%',
    display: 'flex',
  },
  itemContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2B9A66',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#5BB98B',
  },
  cell: {
    flex: 1,
    paddingHorizontal: 4,
  },
  actionsCell: {
    display: 'flex',
    flexDirection: 'row',
  },
  terrainName: {
    fontWeight: 'bold',
    fontSize: 14,
    color: 'white',
    paddingLeft: 10,
  },
  ownerText: {
    fontSize: 12,
    color: '#666',
  },
  smallText: {
    fontSize: 11,
    color: '#888',
  },
  techContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  assignButton: {
    padding: 5,
    backgroundColor: '#e3f2fd',
    borderRadius: 4,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  techItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cancelButton: {
    marginTop: 15,
  },
  technicien: {
    width: 189,
  },
  valide: {
    width: 136,
  },
  iconContainer: {
    display: 'flex',
    flexDirection: 'row',
  },
  info1: {
    width: '25%',
  },
  info2: {},
});

export default TerrainTable;
