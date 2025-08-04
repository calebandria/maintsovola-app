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
    Image,
} from 'react-native';
import { getAllUsers, getConversation, markMessagesAsRead, setNewConversation, subscribeToConversations } from '~/services/conversation-message-service';
import { 
    Conversation,
    Utilisateur, 
} from '~/type/messageInterface';
import RenderConversation from './RenderItem';
import { 
    router, 
    useSegments
} from 'expo-router';
import RenderUsers from './RenderUsers';
import Modal from 'react-native-modal';
import { LucideX, LucideSearch, LucidePlus } from 'lucide-react-native';
import { supabase } from '~/lib/data';
import SearchSuggestionsPage from './SearchSuggestion';

const { height: screenHeight } = Dimensions.get('window');

const ConversationMessage = () => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [everyone, setEveryone] = useState<Utilisateur[]>([]);
    const [search, setSearch] = useState('');
    const [searchUsers, setSearchUsers] = useState('');
    const [filteredUsers, setFilteredUsers] = useState<Utilisateur[]>([]);
    const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
    const [isUserModalVisible, setUserModalVisible] = useState(false);
    const [isSearchPageVisible, setSearchPageVisible] = useState(false);
    const [isLoadingConversations, setIsLoadingConversations] = useState(true);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const segments = useSegments();
    const { user } = useAuth();
    const { setLastPage } = useLastPage();

    const userId: string = user?.id || '';
    // setLastPage(segments.join('/'));

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
    
    useEffect(() => {
        setLastPage(`/${segments.join('/')}`);
    }, [segments, setLastPage]);
      
    useEffect(() => {
        fetchConversations();
        fetchEveryOne();
    }, [fetchConversations, fetchEveryOne]);

    const filteredConversationsMemo = useMemo(() => {
        if (!search.trim()) {
            return conversations;
        }
        const lowerText = search.toLowerCase();
        return conversations.filter((conv) => {
            const otherUserId = conv.id_utilisateur1 === userId
                ? conv.id_utilisateur2
                : conv.id_utilisateur1;
            const user = everyone.find(u => u.id_utilisateur === otherUserId);
            if (!user) return false;
            return (
                user.nom?.toLowerCase().includes(lowerText) ||
                user.prenoms?.toLowerCase().includes(lowerText) ||
                user.email?.toLowerCase().includes(lowerText)
            );
        });
    }, [search, conversations, everyone, userId]);

    const filteredUsersMemo = useMemo(() => {
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

    useEffect(() => {
        setFilteredConversations(filteredConversationsMemo);
    }, [filteredConversationsMemo]);

    useEffect(() => {
        setFilteredUsers(filteredUsersMemo);
    }, [filteredUsersMemo]);

    const handleSearch = useCallback((text: string) => {
        setSearch(text);
    }, []);

    const handleSearchUsers = useCallback((text: string) => {
        setSearchUsers(text);
    }, []);

    useEffect(() => {
        if (!userId) return;
      
        const subscription = subscribeToConversations(userId, (newConv) => {
            setConversations((prev) => [newConv, ...prev]);
        });
      
        return () => {
            supabase.removeChannel(subscription);
        };
    }, [userId]);

    const createConversation = async (otherUserId: string, currentUserId: string) => {
        try {
            const new_id_conversation = await setNewConversation({ currentUserId, otherUserId });
            if (!new_id_conversation) {
                console.warn("No conversation ID returned.");
                return;
            }
            console.log("Creating conversation with otherUserId:", otherUserId, "and currentUserId:", currentUserId);
            router.push(`/messages/chat/${new_id_conversation}`);
        } catch (error) {
            console.error("Error fetching conversation:", error);
        }
    };

    const navigateToChat = async (conversation: Conversation) => {
        console.log("Navigating to chat with conversation:", conversation);
        
        // Marquer les messages comme lus quand on ouvre la conversation
        await markMessagesAsRead(conversation.id_conversation, userId);
        
        // Mettre à jour la liste des conversations pour retirer le badge
        setConversations(prev => 
            prev.map(conv => 
                conv.id_conversation === conversation.id_conversation 
                    ? { ...conv, messages_non_lus: 0 }
                    : conv
            )
        );
        
        router.push(`/messages/chat/${conversation.id_conversation}`);
    };

    const LoadingComponent = () => (
        <View className="flex-1 justify-center items-center py-20">
            <ActivityIndicator size="large" color="#22C55E" />
            <Text className="text-gray-500 mt-4 text-base">
                Chargement des conversations...
            </Text>
        </View>
    );

    const EmptyComponent = () => (
        <View className="flex-1 justify-center items-center py-20">
            <Text className="text-gray-500 text-lg font-medium mb-2">
                Aucune conversation
            </Text>
            <Text className="text-gray-400 text-center px-8">
                Commencez une nouvelle conversation en appuyant sur le bouton +
            </Text>
        </View>
    );

    // Composant des icônes utilisateurs style Facebook
    const FacebookUserIcons = () => (
        <View className="px-4 py-3">
            <FlatList
                data={everyone.slice(0, 8)} // Limiter à 8 utilisateurs
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id_utilisateur}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => createConversation(item.id_utilisateur, userId)}
                        className="mr-4 items-center"
                        style={{ width: 56 }}
                    >
                        <View className="relative">
                            <View 
                                className="w-14 h-14 rounded-full items-center justify-center overflow-hidden"
                                style={{ backgroundColor: '#E5E5E5' }}
                            >
                                {item.photo_profil && item.photo_profil.trim() !== '' ? (
                                    <Image
                                        source={{ uri: item.photo_profil }}
                                        className="w-full h-full"
                                        style={{ borderRadius: 28 }}
                                    />
                                ) : (
                                    <View style={{ width: 28, height: 28 }}>
                                        <View 
                                            style={{
                                                width: 12,
                                                height: 12,
                                                borderRadius: 6,
                                                backgroundColor: '#8E8E93',
                                                alignSelf: 'center',
                                                marginBottom: 2
                                            }}
                                        />
                                        <View 
                                            style={{
                                                width: 20,
                                                height: 14,
                                                borderRadius: 10,
                                                backgroundColor: '#8E8E93',
                                                alignSelf: 'center'
                                            }}
                                        />
                                    </View>
                                )}
                            </View>
                            
                            {/* Indicateur en ligne aléatoire */}
                            {Math.random() > 0.6 && (
                                <View 
                                    className="absolute bottom-1 right-1 w-3 h-3 rounded-full border border-white"
                                    style={{ backgroundColor: '#42B883' }}
                                />
                            )}
                        </View>
                        
                        <Text 
                            className="text-xs mt-1 text-center"
                            style={{ color: '#65676B', fontSize: 11 }}
                            numberOfLines={1}
                        >
                            {item.prenoms?.split(' ')[0] || item.nom || 'Utilisateur'}
                        </Text>
                    </TouchableOpacity>
                )}
                ListFooterComponent={() => (
                    <TouchableOpacity
                        onPress={() => setUserModalVisible(true)}
                        className="items-center"
                        style={{ width: 56 }}
                    >
                        <View 
                            className="w-14 h-14 rounded-full items-center justify-center border-2"
                            style={{ 
                                backgroundColor: '#F0F2F5',
                                borderColor: '#E4E6EA',
                                borderStyle: 'dashed'
                            }}
                        >
                            <LucidePlus size={20} color="#65676B" />
                        </View>
                        <Text 
                            className="text-xs mt-1 text-center"
                            style={{ color: '#65676B', fontSize: 11 }}
                        >
                            Plus
                        </Text>
                    </TouchableOpacity>
                )}
            />
        </View>
    );

    // Bouton flottant style Facebook (simplifié car on a déjà les icônes)
    const FacebookFloatingButton = () => (
        <TouchableOpacity
            onPress={() => setUserModalVisible(true)}
            className="absolute bottom-6 right-6 w-12 h-12 rounded-full shadow-lg items-center justify-center"
            style={{
                backgroundColor: '#22C55E',
                elevation: 6,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
            }}
        >
            <LucidePlus size={20} color="white" />
        </TouchableOpacity>
    );

    return (
        <>
            {isSearchPageVisible ? (
                <SearchSuggestionsPage onClose={() => setSearchPageVisible(false)} />
            ) : (
                <View style={{ flex: 1, minHeight: screenHeight - 200, backgroundColor: '#ffffff' }}>
                    {/* Icônes utilisateurs style Facebook */}
                    <FacebookUserIcons />

                    {/* Barre de recherche déplacée sous les icônes */}
                    <TouchableOpacity 
                        onPress={() => setSearchPageVisible(true)}
                        className="mx-4 mb-3"
                    >
                        <View className="flex-row items-center bg-gray-100 rounded-full px-4 py-2">
                            <LucideSearch size={20} color="#65676B" style={{ marginRight: 8 }} />
                            <Text 
                                className="flex-1 text-base"
                                style={{ color: '#65676B', fontSize: 16 }}
                            >
                                Rechercher dans Messenger
                            </Text>
                        </View>
                    </TouchableOpacity>

                    {/* Modal pour les utilisateurs */}
                    <Modal
                        isVisible={isUserModalVisible}
                        onBackdropPress={() => setUserModalVisible(false)}
                        onBackButtonPress={() => setUserModalVisible(false)}
                        style={{ justifyContent: 'flex-end', margin: 0 }}
                    >
                        <View className="bg-white rounded-t-2xl p-4 max-h-[70%]">
                            <View className="flex-row items-center justify-between mb-4">
                                <Text 
                                    className="text-lg font-semibold"
                                    style={{ color: '#050505', fontSize: 18 }}
                                >
                                    Nouveau message
                                </Text>
                                <TouchableOpacity 
                                    onPress={() => setUserModalVisible(false)}
                                    className="p-2 -mr-2"
                                >
                                    <LucideX size={24} color="#65676B" />
                                </TouchableOpacity>
                            </View>

                            <View className="mb-4">
                            <TextInput
                                className="bg-gray-100 rounded-xl px-4 py-3 text-base"
                                placeholder="Rechercher un contact..."
                                placeholderTextColor="#65676B"
                                value={searchUsers}
                                onChangeText={handleSearchUsers}
                                style={{ fontSize: 16, color: '#050505' }}
                            />
                            </View>

                            {isLoadingUsers ? (
                                <View className="flex-1 justify-center items-center py-10">
                                    <ActivityIndicator size="large" color="#22C55E" />
                                    <Text className="text-gray-500 mt-2">Chargement des utilisateurs...</Text>
                                </View>
                            ) : (
                                <FlatList
                                    data={filteredUsers}
                                    keyExtractor={(item) => item.id_utilisateur}
                                    renderItem={({ item }) => (
                                        <RenderUsers 
                                            item={item} 
                                            onPress={async () => {
                                                setUserModalVisible(false);
                                                await createConversation(item.id_utilisateur, userId);
                                            }}
                                        />
                                    )}
                                    ListEmptyComponent={() => (
                                        <View className="py-10 items-center">
                                            <Text style={{ color: '#65676B' }}>Aucun utilisateur trouvé</Text>
                                        </View>
                                    )}
                                    showsVerticalScrollIndicator={false}
                                />
                            )}
                        </View>
                    </Modal>

                    {/* Liste des conversations */}
                    <View className="flex-1">
                        {isLoadingConversations ? (
                            <LoadingComponent />
                        ) : (
                            <FlatList
                                data={filteredConversations}
                                keyExtractor={(item: Conversation) => item.id_conversation.toString()}
                                renderItem={({ item }) => (
                                    <RenderConversation 
                                        item={item} 
                                        onPress={(conv: Conversation) => navigateToChat(conv)}
                                    />
                                )}
                                ListEmptyComponent={<EmptyComponent />}
                                contentContainerStyle={{ 
                                    flexGrow: 1,
                                }}
                                showsVerticalScrollIndicator={false}
                                style={{ backgroundColor: 'white' }}
                            />
                        )}
                    </View>

                    {/* Bouton flottant style Facebook */}
                    <FacebookFloatingButton />
                </View>
            )}
        </>
    );
}

export default ConversationMessage;