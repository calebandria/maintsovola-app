import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, FlatList, TextInput } from 'react-native';
import { Search, FileText, BookOpen, Wrench, GraduationCap, Download } from 'lucide-react-native';
import { useTechnicalResources } from '~/hooks/useTechnicalRessources';
import { TechnicalResource } from '@/types/technicien';
import { Picker } from '@react-native-picker/picker';

const TechnicalResourcesLibrary: React.FC = () => {
  const { resources, loading, filterByType, filterByCulture, searchResources } = useTechnicalResources();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<TechnicalResource['type'] | 'all'>('all');
  const [selectedCulture, setSelectedCulture] = useState<string>('all');

  const getTypeIcon = (type: TechnicalResource['type']) => {
    switch (type) {
      case 'fiche_technique': return <FileText size={16} color="#3b82f6" />;
      case 'guide_pratique': return <BookOpen size={16} color="#10b981" />;
      case 'procedure': return <Wrench size={16} color="#f97316" />;
      case 'formation': return <GraduationCap size={16} color="#8b5cf6" />;
      default: return <FileText size={16} color="#6b7280" />;
    }
  };

  const getTypeColor = (type: TechnicalResource['type']) => {
    switch (type) {
      case 'fiche_technique': return 'bg-blue-100 text-blue-800';
      case 'guide_pratique': return 'bg-green-100 text-green-800';
      case 'procedure': return 'bg-orange-100 text-orange-800';
      case 'formation': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredResources = React.useMemo(() => {
    let filtered = resources;

    if (searchQuery) {
      filtered = searchResources(searchQuery);
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(r => r.type === selectedType);
    }

    if (selectedCulture !== 'all') {
      filtered = filtered.filter(r => r.culture === selectedCulture);
    }

    return filtered;
  }, [resources, searchQuery, selectedType, selectedCulture, searchResources]);

  const availableCultures = React.useMemo(() => {
    const cultures = resources
      .filter(r => r.culture)
      .map(r => r.culture!)
      .filter((culture, index, self) => self.indexOf(culture) === index);
    return cultures;
  }, [resources]);

  if (loading) {
    return (
      <View className="flex justify-center py-8">
        <ActivityIndicator size="small" color="#0000ff" />
      </View>
    );
  }

  const renderResourceItem = ({ item }: { item: TechnicalResource }) => (
    <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-row items-center gap-2 flex-1">
          {getTypeIcon(item.type)}
          <Text className="text-sm font-bold flex-1" numberOfLines={2}>{item.titre}</Text>
        </View>
        <View className={`px-2 py-1 rounded-full ${getTypeColor(item.type)}`}>
          <Text className="text-xs">{item.type.replace('_', ' ')}</Text>
        </View>
      </View>

      {item.culture && (
        <View className="flex-row items-center gap-2 mb-2">
          <Text className="text-sm font-medium">Culture:</Text>
          <View className="border border-gray-300 px-2 py-1 rounded-full">
            <Text className="text-xs">{item.culture}</Text>
          </View>
        </View>
      )}

      <Text className="text-sm text-gray-500 mb-3" numberOfLines={3}>
        {item.contenu}
      </Text>

      <View className="flex-row flex-wrap gap-1 mb-3">
        {item.tags.map((tag, idx) => (
          <View key={idx} className="bg-gray-100 px-2 py-1 rounded-full">
            <Text className="text-xs text-gray-700">{tag}</Text>
          </View>
        ))}
      </View>

      <View className="flex-row justify-between items-center">
        <Text className="text-xs text-gray-400">
          {new Date(item.date_creation).toLocaleDateString()}
        </Text>
        <TouchableOpacity 
          className="flex-row items-center border border-gray-300 px-3 py-1 rounded-md"
          onPress={() => console.log('Download', item.id_ressource)}
        >
          <Download size={14} color="#6b7280" className="mr-1" />
          <Text className="text-sm">Consulter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="p-4 flex-1">
      <FlatList
        data={filteredResources}
        renderItem={renderResourceItem}
        keyExtractor={(item) => item.id_ressource.toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 20, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold">Ressources techniques</Text>
              <View className="border border-gray-300 px-2 py-1 rounded-full">
                <Text className="text-sm">{filteredResources.length} ressource(s)</Text>
              </View>
            </View>
            {/* Filtres */}
            <View className="gap-4 mb-4">
              <View className="relative">
                <View className="absolute left-3 top-3 z-10">
                  <Search size={16} color="#6b7280" />
                </View>
                <TextInput
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  className="pl-10 border border-gray-300 rounded-md p-2 bg-white"
                />
              </View>
              <View className="border border-gray-300 rounded-md bg-white">
                <Picker
                  selectedValue={selectedType}
                  onValueChange={(itemValue) => setSelectedType(itemValue)}
                >
                  <Picker.Item label="Tous les types" value="all" />
                  <Picker.Item label="Fiches techniques" value="fiche_technique" />
                  <Picker.Item label="Guides pratiques" value="guide_pratique" />
                  <Picker.Item label="Procédures" value="procedure" />
                  <Picker.Item label="Formations" value="formation" />
                </Picker>
              </View>
              <View className="border border-gray-300 rounded-md bg-white">
                <Picker
                  selectedValue={selectedCulture}
                  onValueChange={(itemValue) => setSelectedCulture(itemValue)}
                >
                  <Picker.Item label="Toutes les cultures" value="all" />
                  {availableCultures.map(culture => (
                    <Picker.Item key={culture} label={culture} value={culture} />
                  ))}
                </Picker>
              </View>
            </View>
            {filteredResources.length === 0 && (
              <View className="items-center py-12">
                <BookOpen size={48} color="#9ca3af" className="mb-4" />
                <Text className="text-gray-500">Aucune ressource trouvée</Text>
              </View>
            )}
          </>
        }
        ListEmptyComponent={null}
      />
    </View>
  );
};

export default TechnicalResourcesLibrary;