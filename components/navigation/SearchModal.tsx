import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { LucideSearch, LucideX, LucideClock, LucideUser } from 'lucide-react-native';

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ visible, onClose }) => {
  const [searchText, setSearchText] = useState('');
  
  const recentSearches = [
    { id: '1', text: 'Terrain Antananarivo', type: 'recent' },
    { id: '2', text: 'Projet construction', type: 'recent' },
    { id: '3', text: 'Jean Rakoto', type: 'user' },
  ];

  const suggestions = [
    { id: '1', text: 'Terrain à vendre', type: 'suggestion' },
    { id: '2', text: 'Projet immobilier', type: 'suggestion' },
    { id: '3', text: 'Construction maison', type: 'suggestion' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row items-center p-4 border-b border-gray-200">
          <View className="flex-1 flex-row items-center bg-gray-100 rounded-full px-3 py-2">
            <LucideSearch size={20} color="#65676B" />
            <TextInput
              className="flex-1 ml-2 text-base"
              placeholder="Rechercher sur MaintsoVola"
              value={searchText}
              onChangeText={setSearchText}
              autoFocus
            />
          </View>
          <TouchableOpacity className="ml-3" onPress={onClose}>
            <Text className="text-green-500 font-semibold">Annuler</Text>
          </TouchableOpacity>
        </View>

        {/* Contenu */}
        <View className="flex-1 p-4">
          {searchText === '' ? (
            <>
              <Text className="text-lg font-bold mb-3">Recherches récentes</Text>
              <FlatList
                data={recentSearches}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity className="flex-row items-center py-3">
                    <View className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center mr-3">
                      {item.type === 'user' ? (
                        <LucideUser size={16} color="#65676B" />
                      ) : (
                        <LucideClock size={16} color="#65676B" />
                      )}
                    </View>
                    <Text className="flex-1 text-base">{item.text}</Text>
                    <TouchableOpacity>
                      <LucideX size={16} color="#65676B" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                )}
              />
            </>
          ) : (
            <>
              <Text className="text-lg font-bold mb-3">Suggestions</Text>
              <FlatList
                data={suggestions.filter(item => 
                  item.text.toLowerCase().includes(searchText.toLowerCase())
                )}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity className="flex-row items-center py-3">
                    <LucideSearch size={16} color="#65676B" />
                    <Text className="ml-3 text-base">{item.text}</Text>
                  </TouchableOpacity>
                )}
              />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};