import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 

interface SearchBarProps {
  search: string;
  handleSearch: (text: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ search, handleSearch }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={{ marginTop: 10, marginBottom: 1, paddingHorizontal: 16 }}>
      <View 
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: isFocused ? '#FFFFFF' : '#F3F4F6',
          borderRadius: 25,
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderWidth: isFocused ? 1 : 0,
          borderColor: isFocused ? '#b6ebc3' : 'transparent',
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: isFocused ? 4 : 2,
          },
          shadowOpacity: isFocused ? 0.15 : 0.1,
          shadowRadius: isFocused ? 8 : 4,
          elevation: isFocused ? 8 : 2,
        }}
      >
        {/* Icône de recherche */}
        <Ionicons 
          name="search" 
          size={20} 
          color={isFocused ? "#4CAF50" : "#6B7280"} 
          style={{ marginRight: 12 }}
        />
        
        {/* Champ de saisie */}
        <TextInput
          style={{
            flex: 1,
            fontSize: 12,
            color: isFocused ? '#111827' : '#374151',
          }}
          placeholder="Rechercher une conversation..."
          placeholderTextColor={isFocused ? "#9CA3AF" : "#6B7280"}
          value={search}
          onChangeText={handleSearch}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        {/* Bouton clear (affiché seulement si il y a du texte) */}
        {search.length > 0 && (
          <TouchableOpacity
            onPress={() => handleSearch('')}
            style={{ marginLeft: 8, padding: 4 }}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="close-circle" 
              size={20} 
              color="#6B7280"
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default SearchBar;