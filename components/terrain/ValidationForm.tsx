import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from "react-native";
import { UseFormReturn, useFormContext } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "components/ui/terrain/form";
import { Input } from "components/ui/terrain/input";
import { Textarea } from "components/ui/terrain/textarea";
import { RadioGroup, RadioGroupItem } from "components/ui/terrain/radio-group";
import { Label } from "components/ui/terrain/label";
import { Button } from "components/ui/terrain/Button";
import * as ImagePicker from 'expo-image-picker'
import { MaterialIcons } from '@expo/vector-icons';
import { TerrainData } from "types/terrain";
import { useEffect } from "react";

interface ValidationFormProps {
  validationPhotos: any[];
  setValidationPhotos: React.Dispatch<React.SetStateAction<any[]>>;
  photoValidationUrls: string[];
  setPhotoValidationUrls: React.Dispatch<React.SetStateAction<string[]>>;
  terrain: TerrainData;
}

const ValidationForm: React.FC<ValidationFormProps> = ({
  validationPhotos,
  setValidationPhotos,
  photoValidationUrls,
  setPhotoValidationUrls,
  terrain
}) => {
  const form = useFormContext();

  // Request permission to access the gallery
  const requestPermission = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    alert('Permission refusée pour accéder à la galerie.');
  }
  };
  useEffect(() => {
    requestPermission();
  }, []);

  // Function to pick images from the gallery and update state
  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newPhotos = result.assets;
      console.log('Photos sélectionnées:', newPhotos);
      setValidationPhotos(prev => [...prev, ...newPhotos]);
      setPhotoValidationUrls(prev => [...prev, ...newPhotos.map(photo => photo.uri)]);
    } else {
      console.log('Sélection annulée');
    }
  };

    // Function to handle file selection and update state
  const handleFileChange = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      const selectedPhotos = result.assets.map(asset => ({
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
      }));
      setValidationPhotos(prevPhotos => [...prevPhotos, ...selectedPhotos]);
      const previewUrls = result.assets.map(asset => asset.uri);
      setPhotoValidationUrls(prevUrls => [...prevUrls, ...previewUrls]);
    }
  };

  // Function to remove a photo by index

  const removePhoto = (index: number) => {
    setValidationPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoValidationUrls(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.terrainInfo}>
        <Text style={styles.sectionTitle}>Informations du terrain</Text>
        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <Text style={styles.label}>Nom du terrain:</Text>
            <Text style={styles.value}>{terrain.nom_terrain}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.label}>Surface proposée:</Text>
            <Text style={styles.value}>{terrain.surface_proposee} hectares</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.label}>Localisation:</Text>
            <Text style={styles.value}>{terrain.commune_name}, {terrain.district_name}, {terrain.region_name}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.label}>Agriculteur:</Text>
            <Text style={styles.value}>{terrain.tantsahaNom}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.label}>Accès à l'eau:</Text>
            <Text style={styles.value}>{terrain.acces_eau ? 'Oui' : 'Non'}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.label}>Accès à la route:</Text>
            <Text style={styles.value}>{terrain.acces_route ? 'Oui' : 'Non'}</Text>
          </View>
        </View>
      </View>

      <FormField
        control={form.control}
        name="surface_validee"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Surface validée (hectares)</FormLabel>
            <FormControl>
              <Input
                keyboardType="numeric"
                value={field.value?.toString() || "0"}
                onChangeText={(text) => field.onChange(parseFloat(text) || 0)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="date_validation"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Date de validation</FormLabel>
            <FormControl>
              <Input
                placeholder="JJ/MM/AAAA"
                value={field.value}
                onChangeText={field.onChange}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="rapport_validation"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Rapport de validation</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Entrez votre rapport de validation ici..."
                value={field.value}
                onChangeText={field.onChange}
                style={{ minHeight: 120 }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="validation_decision"
        render={({ field }) => (
          <FormItem style={styles.radioGroup}>
            <FormLabel>Décision de validation</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
              >
                <RadioGroupItem value="valider">
                  <Label>Valider le terrain</Label>
                </RadioGroupItem>
                <RadioGroupItem value="rejetter">
                  <Label>Rejeter le terrain</Label>
                </RadioGroupItem>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <View style={styles.photosSection}>
        <View style={styles.photosHeader}>
          <FormLabel>Photos de validation</FormLabel>
          <Button 
            variant="outline" 
            size="sm"
            onPress={handleFileChange}
            icon={<MaterialIcons name="cloud-upload" size={16} color="black" />}
            title="Ajouter des photos"
          />
        </View>
        
        {photoValidationUrls.length > 0 && (
          <View style={styles.photosGrid}>
            {photoValidationUrls.map((uri, index) => (
              <View key={index} style={styles.photoContainer}>
                <Image 
                  source={{ uri }}
                  style={styles.photo}
                />
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => removePhoto(index)}
                >
                  <MaterialIcons name="delete" size={16} color="white" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  contentContainer: {
    paddingBottom: 32,
  },
  terrainInfo: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    backgroundColor: '#f8fafc',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  gridItem: {
    width: '48%',
  },
  label: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
  },
  radioGroup: {
    marginBottom: 24,
  },
  photosSection: {
    marginBottom: 24,
  },
  photosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoContainer: {
    width: '48%',
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ValidationForm;