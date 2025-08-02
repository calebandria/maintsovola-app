"use client";
import React, {
    useCallback,
    useEffect, 
    useState,
    useMemo
} from 'react';
import { useAuth } from '~/contexts/AuthContext';
import { 
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { getAllUsers, getConversation, setNewConversation, subscribeToConversations } from '~/services/conversation-message-service';
import { 
    Conversation,
    Utilisateur, 
} from '~/type/messageInterface';
import RenderConversation from './RenderItem';
import { router } from 'expo-router';
import RenderUsers from './RenderUsers';
import Modal from 'react-native-modal';
import { LucideX } from 'lucide-react-native';
import { supabase } from '~/lib/data';
import SearchBar from './SearchBar';
import FloatingActionButton from './FloatingActionButton';

const { height: screenHeight } = Dimensions.get('window');

const ConversationMessage = () => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [everyone, setEveryone] = useState<Utilisateur[]>([]);
    const [search, setSearch] = useState('');
    const [searchUsers, setSearchUsers] = useState('');
    const [isUserModalVisible, setUserModalVisible] = useState(false);
    const [isLoadingConversations, setIsLoadingConversations] = useState(true);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);

    const { user } = useAuth();
    const userId: string = user?.id || '';

    // Mémoriser l'utilisateur actuel pour éviter les re-renders inutiles
    const currentUser = useMemo(() => user, [user?.id]);

    // Mémoriser les fonctions de fetch pour éviter les re-créations
    const fetchConversations = useCallback(async () => {
        if (!userId) return;
        setIsLoadingConversations(true);
        try {
            const conversations = await getConversation({ id_user: userId });
            setConversations(conversations);
        } catch (error) {
            console.error("Error fetching conversations:", error);
        } finally {
            setIsLoadingConversations(false);
        }
    }, [userId]);

    const fetchEveryOne = useCallback(async () => {
        if (!userId) return;
        setIsLoadingUsers(true);
        try {
            const allUsers = await getAllUsers({currentUserId: userId});
            setEveryone(allUsers);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setIsLoadingUsers(false);
        }
    }, [userId]);

    // Mémoriser la création d'un map des utilisateurs pour un accès plus rapide
    const usersMap = useMemo(() => {
        const map = new Map<string, Utilisateur>();
        everyone.forEach(user => {
            map.set(user.id_utilisateur, user);
        });
        return map;
    }, [everyone]);

    // Mémoriser les conversations filtrées
    const filteredConversations = useMemo(() => {
        if (!search.trim()) {
            return conversations;
        }
        
        const lowerText = search.toLowerCase();
        return conversations.filter((conv) => {
            const otherUserId = conv.id_utilisateur1 === userId
                ? conv.id_utilisateur2
                : conv.id_utilisateur1;
            
            const user = usersMap.get(otherUserId);
            if (!user) return false;
            
            return (
                user.nom?.toLowerCase().includes(lowerText) ||
                user.prenoms?.toLowerCase().includes(lowerText) ||
                user.email?.toLowerCase().includes(lowerText)
            );
        });
    }, [search, conversations, usersMap, userId]);

    // Mémoriser les utilisateurs filtrés
    const filteredUsers = useMemo(() => {
        if (!searchUsers.trim()) {
            return everyone;
        }
        
        const lowerText = searchUsers.toLowerCase();
        return everyone.filter((user) => {
            return (
                user.nom?.toLowerCase().includes(lowerText) ||
                user.prenoms?.toLowerCase().includes(lowerText) ||
                user.email?.toLowerCase().includes(lowerText)
            );
        });
    }, [searchUsers, everyone]);

    // Mémoriser les handlers pour éviter les re-créations
    const handleSearch = useCallback((text: string) => {
        setSearch(text);
    }, []);

    const handleSearchUsers = useCallback((text: string) => {
        setSearchUsers(text);
    }, []);

    const navigateToChat = useCallback((conversation: Conversation) => {
        console.log("Navigating to chat with conversation:", conversation);
        router.push(`/messages/chat/${conversation.id_conversation}`);
    }, []);

    // Mémoriser les handlers de modal
    const handleModalClose = useCallback(() => {
        setUserModalVisible(false);
    }, []);

    const handleModalOpen = useCallback(() => {
        setUserModalVisible(true);
    }, []);

    const handleUserPress = useCallback(async (user: Utilisateur) => {
        setUserModalVisible(false);
        // Logique pour créer une nouvelle conversation si nécessaire
    }, []);

    // Mémoriser les composants pour éviter les re-renders
    const LoadingComponent = useMemo(() => (
        <View className="flex-1 justify-center items-center py-20">
            <ActivityIndicator size="large" color="#25D366" />
            <Text className="text-gray-500 mt-4 text-base">
                Chargement des conversations...
            </Text>
        </View>
    ), []);

    const EmptyComponent = useMemo(() => (
        <View className="flex-1 justify-center items-center py-20">
            <Text className="text-gray-500 text-lg font-medium mb-2">
                Aucune conversation
            </Text>
            <Text className="text-gray-400 text-center px-8">
                Commencez une nouvelle conversation en appuyant sur le bouton +
            </Text>
        </View>
    ), []);

    const UserModalEmptyComponent = useMemo(() => (
        <View className="py-10 items-center">
            <Text className="text-gray-500">Aucun utilisateur trouvé</Text>
        </View>
    ), []);

    const UserModalLoadingComponent = useMemo(() => (
        <View className="flex-1 justify-center items-center py-10">
            <ActivityIndicator size="large" color="#25D366" />
            <Text className="text-gray-500 mt-2">Chargement des utilisateurs...</Text>
        </View>
    ), []);

    // Mémoriser le style du container principal
    const containerStyle = useMemo(() => ({ 
        flex: 1, 
        minHeight: screenHeight - 200 
    }), [screenHeight]);

    const contentContainerStyle = useMemo(() => ({ 
        flexGrow: 1 
    }), []);

    // Mémoriser les keyExtractor pour les FlatList
    const conversationKeyExtractor = useCallback((item: Conversation) => 
        item.id_conversation.toString(), []);
    
    const userKeyExtractor = useCallback((item: Utilisateur) => 
        item.id_utilisateur, []);

    // Mémoriser les renderItem pour les FlatList
    const renderConversationItem = useCallback(({ item }: { item: Conversation }) => (
        <RenderConversation 
            item={item} 
            onPress={navigateToChat}
        />
    ), [navigateToChat]);

    const renderUserItem = useCallback(({ item }: { item: Utilisateur }) => (
        <RenderUsers 
            item={item} 
            onPress={handleUserPress}
        />
    ), [handleUserPress]);

    useEffect(() => {
        fetchConversations();
        fetchEveryOne();
    }, [fetchConversations, fetchEveryOne]);

    useEffect(() => {
        if (!userId) return;
      
        const subscription = subscribeToConversations(userId, (newConv) => {
            setConversations((prev) => [newConv, ...prev]);
        });
      
        return () => {
            supabase.removeChannel(subscription);
        };
    }, [userId]);

    // Mémoriser la condition de chargement
    const shouldShowOfflineMessage = useMemo(() => 
        isLoadingConversations && !userId, [isLoadingConversations, userId]);

    if (shouldShowOfflineMessage) {
        return (
            <View className='flex-1 justify-center items-center p-3 border-1 rounded-md'>
                <Text className=" font-bold text-xs text-gray-60 p-10 border-2">
                    Vous êtes Hors Ligne
                </Text>
            </View>
        );
    }

    return (
        <View style={containerStyle}>
            <View className="mb-4">
                <SearchBar search={search} handleSearch={handleSearch} />
            </View>

            <Modal
                isVisible={isUserModalVisible}
                onBackdropPress={handleModalClose}
                onBackButtonPress={handleModalClose}
                style={{ justifyContent: 'flex-end', margin: 0 }}
            >
                <View className="bg-white rounded-t-2xl p-4 max-h-[70%]">
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-lg font-semibold text-gray-900">
                            Nouveau message
                        </Text>
                        <TouchableOpacity 
                            onPress={handleModalClose}
                            className="p-2 -mr-2"
                        >
                            <LucideX size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <View className="mb-4">
                       <TextInput
                           className="bg-gray-100 rounded-xl px-4 py-3 text-base"
                           placeholder="Rechercher un contact..."
                           value={searchUsers}
                           onChangeText={handleSearchUsers}
                       />
                    </View>

                    {isLoadingUsers ? (
                        UserModalLoadingComponent
                    ) : (
                        <FlatList
                            data={filteredUsers}
                            keyExtractor={userKeyExtractor}
                            renderItem={renderUserItem}
                            ListEmptyComponent={UserModalEmptyComponent}
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                </View>
            </Modal>

            <View className="flex-1">
                {isLoadingConversations ? (
                    LoadingComponent
                ) : (
                    <FlatList
                        data={filteredConversations}
                        keyExtractor={conversationKeyExtractor}
                        renderItem={renderConversationItem}
                        ListEmptyComponent={EmptyComponent}
                        contentContainerStyle={contentContainerStyle}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>

            <FloatingActionButton onPress={handleModalOpen} />
        </View>
    );
};

export default ConversationMessage;