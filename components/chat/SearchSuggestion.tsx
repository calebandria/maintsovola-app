"use client";
import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Image,
} from 'react-native';
import { LucideArrowLeft, LucideSearch } from 'lucide-react-native';
import { useAuth } from '~/contexts/AuthContext';
import { getAllUsers, setNewConversation } from '~/services/conversation-message-service';
import { Utilisateur } from '~/type/messageInterface';
import { router } from 'expo-router';

interface SearchSuggestionsPageProps {
    onClose: () => void;
}

const SearchSuggestionsPage: React.FC<SearchSuggestionsPageProps> = ({ onClose }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<Utilisateur[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();
    const userId = user?.id || '';

    // Charger tous les utilisateurs
    useEffect(() => {
        const fetchUsers = async () => {
            if (!userId) return;
            setIsLoading(true);
            try {
                const allUsers = await getAllUsers({ currentUserId: userId });
                setUsers(allUsers);
            } catch (error) {
                console.error("Error fetching users:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
    }, [userId]);

    // Filtrer les utilisateurs selon la recherche
    const filteredUsers = useMemo(() => {
        if (!searchQuery.trim()) {
            return users; // Retourner tous les utilisateurs si pas de recherche
        }
        
        const lowerQuery = searchQuery.toLowerCase();
        return users.filter(user => 
            user.nom?.toLowerCase().includes(lowerQuery) ||
            user.prenoms?.toLowerCase().includes(lowerQuery) ||
            user.email?.toLowerCase().includes(lowerQuery)
        );
    }, [searchQuery, users]);

    const createConversation = async (otherUserId: string) => {
        try {
            const conversationId = await setNewConversation({ 
                currentUserId: userId, 
                otherUserId 
            });
            
            if (conversationId) {
                onClose();
                router.push(`/messages/chat/${conversationId}`);
            }
        } catch (error) {
            console.error("Error creating conversation:", error);
        }
    };

    const renderUserItem = ({ item }: { item: Utilisateur }) => (
        <TouchableOpacity
            onPress={() => createConversation(item.id_utilisateur)}
            className="flex-row items-center px-4 py-3 active:bg-gray-50"
        >
            {/* Avatar */}
            <View className="mr-3">
                <View 
                    className="w-12 h-12 rounded-full items-center justify-center overflow-hidden"
                    style={{ backgroundColor: '#E5E5E5' }}
                >
                    {item.photo_profil && item.photo_profil.trim() !== '' ? (
                        <Image
                            source={{ uri: item.photo_profil }}
                            className="w-full h-full"
                            style={{ borderRadius: 24 }}
                        />
                    ) : (
                        <View style={{ width: 24, height: 24 }}>
                            <View 
                                style={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: 5,
                                    backgroundColor: '#8E8E93',
                                    alignSelf: 'center',
                                    marginBottom: 1
                                }}
                            />
                            <View 
                                style={{
                                    width: 16,
                                    height: 12,
                                    borderRadius: 8,
                                    backgroundColor: '#8E8E93',
                                    alignSelf: 'center'
                                }}
                            />
                        </View>
                    )}
                </View>
            </View>

            {/* Nom */}
            <View className="flex-1">
                <Text 
                    className="text-base font-medium"
                    style={{ color: '#050505', fontSize: 16 }}
                >
                    {`${item.prenoms || ''} ${item.nom || ''}`.trim() || 'Utilisateur'}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-white">
            {/* Header */}
            <View className="bg-white border-b border-gray-200">
                <View className="flex-row items-center px-4 py-3" style={{ paddingTop: 50 }}>
                    <TouchableOpacity 
                        onPress={onClose}
                        className="p-1 mr-3"
                    >
                        <LucideArrowLeft size={24} color="#000" />
                    </TouchableOpacity>
                    
                    <View className="flex-1 flex-row items-center bg-gray-100 rounded-full px-4 py-2">
                        <LucideSearch size={16} color="#65676B" style={{ marginRight: 8 }} />
                        <TextInput
                            className="flex-1 text-base"
                            placeholder="Rechercher"
                            placeholderTextColor="#65676B"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoFocus
                            style={{ fontSize: 16, color: '#050505' }}
                        />
                    </View>
                </View>
            </View>

            {/* Titre Suggestions */}
            <View className="px-4 py-3">
                <Text 
                    className="text-base font-medium"
                    style={{ color: '#65676B' }}
                >
                    Suggestions
                </Text>
            </View>

            {/* Liste des utilisateurs */}
            {isLoading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#22C55E" />
                    <Text className="text-gray-500 mt-2">Chargement...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredUsers}
                    keyExtractor={(item) => item.id_utilisateur}
                    renderItem={renderUserItem}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={() => (
                        <View className="flex-1 justify-center items-center py-20">
                            <Text className="text-gray-500 text-center">
                                {searchQuery.trim() 
                                    ? 'Aucun résultat trouvé' 
                                    : 'Aucun utilisateur disponible'
                                }
                            </Text>
                        </View>
                    )}
                />
            )}
        </View>
    );
};

export default SearchSuggestionsPage;