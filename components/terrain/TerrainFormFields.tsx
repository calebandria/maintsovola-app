import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  TextInput,
} from 'react-native';
import { Button } from 'react-native-paper';
//import { Button } from '@/components/ui/button';
// import { Select, SelectItem } from '@/components/ui/terrain/select';
import { Checkbox } from 'components/ui/terrain/checkbox';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from 'integrations/supabase/client';
import { useFormContext } from 'react-hook-form';
import RNPickerSelect from 'react-native-picker-select';
import TerrainMap from './TerrainMap';
import { TerrainData } from '~/types/Terrain';

interface Region {
  id_region: number;
  nom_region: string;
}

interface District {
  id_district: number;
  nom_district: string;
  id_region: number;
}

interface Commune {
  id_commune: number;
  nom_commune: string;
  id_district: number;
}

interface TerrainFormFieldsProps {
  userRole?: string;
  agriculteurs?: { id_utilisateur: string; nom: string; prenoms?: string }[];
  photoUrls: string[];
  setPhotoUrls: (urls: string[]) => void;
  photos: any[];
  setPhotos: (photos: any[]) => void;
  polygonCoordinates: { latitude: number; longitude: number }[];
  setPolygonCoordinates: React.Dispatch<
    React.SetStateAction<{ latitude: number; longitude: number }[]>
  >;
}

const TerrainFormFields: React.FC<TerrainFormFieldsProps> = ({
  userRole,
  agriculteurs = [],
  photoUrls,
  setPhotoUrls,
  photos,
  setPhotos,
  polygonCoordinates,
  setPolygonCoordinates,
}) => {
  const form = useFormContext();
  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [filteredDistricts, setFilteredDistricts] = useState<District[]>([]);
  const [filteredCommunes, setFilteredCommunes] = useState<Commune[]>([]);

  // Fonction pour demander la permission d'accéder à la galerie
  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission refusée pour accéder à la galerie.');
    }
  };
  useEffect(() => {
    requestPermission();
  }, []);

  // Chargement initial des données
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: regions } = await supabase.from('region').select('*').order('nom_region');
        const { data: districts } = await supabase
          .from('district')
          .select('*')
          .order('nom_district');
        const { data: communes } = await supabase.from('commune').select('*').order('nom_commune');
        setDistricts(
          (districts || []).map((d) => ({
            ...d,
            id_region: d.id_region === null ? 0 : Number(d.id_region),
          }))
        );
        setRegions(regions || []);
        setCommunes(
          (communes || []).map((c) => ({
            ...c,
            id_district: c.id_district === null ? 0 : Number(c.id_district),
          }))
        );
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  // Filtrage des districts quand la région change
  useEffect(() => {
    const regionId = form.watch('id_region');
    if (regionId) {
      const filtered = districts.filter((d) => d.id_region === parseInt(regionId));
      setFilteredDistricts(filtered);
    } else {
      setFilteredDistricts([]);
    }
  }, [form.watch('id_region'), districts]);

  // Filtrage des communes quand le district change
  useEffect(() => {
    const districtId = form.watch('id_district');
    if (districtId) {
      const filtered = communes.filter((c) => c.id_district === parseInt(districtId));
      setFilteredCommunes(filtered);
    } else {
      setFilteredCommunes([]);
    }
  }, [form.watch('id_district'), communes]);

  // Gestion des photos
  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Uncomment if using expo-image-picker
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newPhotos = result.assets;
      setPhotos([...photos, ...newPhotos]);
      setPhotoUrls([...photoUrls, ...newPhotos.map((img) => img.uri)]);
    }
  };
  //Nouvelle Gestion de Photo
  const handleFileChange = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      const selectedPhotos = result.assets.map((asset) => ({
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
      }));
      setPhotos([...photos, ...selectedPhotos]);
      const previewUrls = result.assets.map((asset) => asset.uri);
      setPhotoUrls([...photoUrls, ...previewUrls]);
    }
  };

  // Suppression d'une photo
  const removePhoto = (index: number) => {
    const newPhotos = [...photos];
    const newPhotoUrls = [...photoUrls];
    newPhotos.splice(index, 1);
    newPhotoUrls.splice(index, 1);
    setPhotos(newPhotos);
    setPhotoUrls(newPhotoUrls);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Sélection du propriétaire (pour techniciens/superviseurs) */}
      {(userRole === 'technicien' || userRole === 'superviseur') && (
        <View style={styles.field}>
          <Text style={styles.label}>Propriétaire du terrain</Text>
          <RNPickerSelect
            onValueChange={(value) => form.setValue('id_tantsaha', value)}
            value={form.watch('id_tantsaha')}
            placeholder={{ label: 'Sélectionner un agriculteur' }}
            items={agriculteurs.map((agriculteur) => ({
              label: `${agriculteur.nom} ${agriculteur.prenoms || ''}`,
              value: agriculteur.id_utilisateur,
              key: agriculteur.id_utilisateur,
            }))}
          />
        </View>
      )}

      {/* Nom du terrain */}
      <View style={styles.field}>
        <Text style={styles.label}>Nom du terrain</Text>
        <TextInput
          style={styles.input}
          value={form.watch('nom_terrain')}
          onChangeText={(text) => form.setValue('nom_terrain', text)}
          placeholder="Entrez le nom du terrain"
        />
      </View>

      {/* Sélection de la localisation */}
      <View style={styles.field}>
        <Text style={styles.label}>Région</Text>
        <RNPickerSelect
          onValueChange={(value) => {
            form.setValue('id_region', value);
            form.setValue('id_district', '');
            form.setValue('id_commune', '');
          }}
          value={form.watch('id_region')}
          placeholder={{ label: 'Sélectionner une région' }}
          items={regions.map((region) => ({
            label: `${region.nom_region}`,
            value: region.id_region,
            key: region.id_region,
          }))}
          style={{
            inputIOS: {
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 5,
              padding: 0,
              fontSize: 16,
              color: '#333',
              backgroundColor: '#FBFEFC',
            },
            inputAndroid: {
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 5,
              padding: 0,
              fontSize: 16,
              color: '#333',
              backgroundColor: '#FBFEFC',
            },
            placeholder: {
              color: '#999',
            },
          }}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>District</Text>
        <RNPickerSelect
          onValueChange={(value) => {
            form.setValue('id_district', value);
            form.setValue('id_commune', '');
          }}
          value={form.watch('id_district')}
          placeholder={{ label: 'Sélectionner un district' }}
          items={filteredDistricts.map((district) => ({
            label: `${district.nom_district}`,
            value: district.id_district,
            key: district.id_district,
          }))}
          style={{
            inputIOS: {
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 5,
              padding: 0,
              fontSize: 16,
              color: '#333',
              backgroundColor: '#FBFEFC',
            },
            inputAndroid: {
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 5,
              padding: 0,
              fontSize: 16,
              color: '#333',
              backgroundColor: '#FBFEFC',
            },
            placeholder: {
              color: '#999',
            },
          }}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Commune</Text>
        <RNPickerSelect
          onValueChange={(value) => form.setValue('id_commune', value)}
          value={form.watch('id_commune')}
          placeholder={{ label: 'Sélectionner une commune' }}
          items={filteredCommunes.map((commune) => ({
            label: commune.nom_commune,
            value: commune.id_commune,
            key: commune.id_commune,
          }))}
          style={{
            inputIOS: {
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 5,
              padding: 0,
              fontSize: 16,
              color: '#333',
              backgroundColor: '#FBFEFC',
            },
            inputAndroid: {
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 5,
              padding: 0,
              fontSize: 16,
              color: '#333',
              backgroundColor: '#FBFEFC',
            },
            placeholder: {
              color: '#999',
            },
          }}
        />
      </View>

      {/* Surface */}
      <View style={styles.field}>
        <Text style={styles.label}>Surface (hectares)</Text>
        <TextInput
          style={styles.input}
          value={form.watch('surface_proposee')?.toString()}
          onChangeText={(text) => form.setValue('surface_proposee', parseFloat(text) || 0)}
          keyboardType="numeric"
          placeholder="Entrez la surface"
        />
      </View>

      {/* Accès */}
      <View style={styles.row}>
        <View style={styles.checkboxField}>
          <Checkbox
            checked={form.watch('acces_eau')}
            onValueChange={(value) => form.setValue('acces_eau', value)}
          />
          <Text style={styles.checkboxLabel}>Accès à l`eau</Text>
        </View>

        <View style={styles.checkboxField}>
          <Checkbox
            checked={form.watch('acces_route')}
            onValueChange={(value) => form.setValue('acces_route', value)}
          />
          <Text style={styles.checkboxLabel}>Accès à la route</Text>
        </View>
      </View>

      {/* Photos */}
      <View style={styles.field}>
        <View style={styles.photoHeader}>
          <Text style={styles.label}>Photos du terrain</Text>
          <Button onPress={handleFileChange} icon="image-plus">
            Ajouter des photos
          </Button>
        </View>

        {photoUrls.length > 0 && (
          <ScrollView horizontal style={styles.photos}>
            {photoUrls.map((uri, index) => (
              <View key={index} style={styles.photoContainer}>
                <Image source={{ uri }} style={styles.photo} />
                <TouchableOpacity style={styles.removePhoto} onPress={() => removePhoto(index)}>
                  <Icon name="close" size={16} color="white" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
      <View style={styles.field}>
        <TerrainMap drawnCoords={polygonCoordinates} setDrawnCoords={setPolygonCoordinates} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4FBF6',
  },
  content: {
    padding: 3,
  },
  field: {
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#193B2D',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ADDDC0',
    borderRadius: 5,
    paddingHorizontal: 12,
    backgroundColor: '#FBFEFC',
  },
  checkboxField: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 16,
  },
  photoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  photos: {
    marginTop: 8,
  },
  photoContainer: {
    width: 100,
    height: 100,
    marginRight: 8,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  removePhoto: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    height: 300,
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  map: {
    flex: 1,
  },
  helper: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
});

export default TerrainFormFields;
