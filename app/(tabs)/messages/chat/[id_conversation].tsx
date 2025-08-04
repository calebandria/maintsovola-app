"use client";
import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Platform,
  SafeAreaView,
  Alert,
  Image,
  Keyboard,
  Modal,
  Pressable
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getConversationById, getMessages, sendMessage, subscribeToMessages, uploadFile, getUser } from '~/services/conversation-message-service';
import { Conversation, Message } from '~/type/messageInterface';
import { useAuth } from '~/contexts/AuthContext';
import { LucideArrowLeft, LucidePhone, LucideVideo, LucideMoreVertical, LucideSend, LucideCamera, LucideMic, LucideImage, LucideSmile } from 'lucide-react-native';
import { supabase } from '~/lib/data';
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ChatScreen = () => {
  const { id_conversation } = useLocalSearchParams<{ id_conversation: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

  const parsedConvId = parseInt(id_conversation, 10);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [receiverId, setReceiverId] = useState<string>('');
  const [convValid, setConvValid] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<DocumentPicker.DocumentPickerAsset[]>([]);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [reactionModalVisible, setReactionModalVisible] = useState(false);
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  
  // États pour les infos de l'autre utilisateur
  const [otherUser, setOtherUser] = useState<{
    nom: string;
    photoProfil?: string;
    isOnline?: boolean;
  }>({
    nom: 'Utilisateur',
    photoProfil: undefined,
    isOnline: false
  });

  // Gestion clavier
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (event) => {
        setKeyboardHeight(event.endCoordinates.height);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!parsedConvId || isNaN(parsedConvId)) {
      setConvValid(false);
      return;
    }
    try {
      const fetched = await getMessages({ id_conversation: parsedConvId });
      const sortedMessages = fetched.sort((a, b) => 
        new Date(a.date_envoi).getTime() - new Date(b.date_envoi).getTime()
      );
      setMessages(sortedMessages);
    } catch (err) {
      console.error('Erreur chargement messages:', err);
      setError('Impossible de charger les messages. Veuillez réessayer.');
    }
  }, [parsedConvId]);

  useEffect(() => {
    if (!parsedConvId || !user || isNaN(parsedConvId)) {
      console.warn("Invalid conversation ID or user:", id_conversation, user);
      setConvValid(false);
      return;
    }

    const fetchInitialData = async () => {
      try {
        const data: Conversation | null = await getConversationById({
          id_conversation: parsedConvId,
        });

        if (!data) {
          setConvValid(false);
          return;
        }

        const otherId = data.id_utilisateur1 === user.id ? data.id_utilisateur2 : data.id_utilisateur1;
        setReceiverId(otherId);

        const { username, photo_profil } = await getUser({ id: otherId });
        const cleanedUsername = username 
          ? username.replace(/\bnull\b/gi, '').trim().replace(/\s+/g, ' ')
          : 'Utilisateur';
        
        setOtherUser({
          nom: cleanedUsername || 'Utilisateur',
          photoProfil: photo_profil,
          isOnline: Math.random() > 0.5
        });

      } catch (err) {
        console.error('Erreur identification destinataire:', err);
        setConvValid(false);
        setError('Erreur lors du chargement de la conversation.');
      }
    };

    fetchInitialData();
    fetchMessages();
  }, [parsedConvId, user, fetchMessages, id_conversation]);

  useEffect(() => {
    if (!parsedConvId || isNaN(parsedConvId)) return;

    const subscription = subscribeToMessages(parsedConvId, (newMessage) => {
      setMessages((prev) => {
        const exists = prev.some((msg) => msg.id_message === newMessage.id_message);
        if (exists) return prev;
        return [...prev, newMessage];
      });
    });

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [parsedConvId]);

  const UserIcon = ({ size = 28 }: { size?: number }) => (
    <View 
      className="bg-gray-300 rounded-full items-center justify-center"
      style={{ width: size, height: size }}
    >
      <View 
        className="bg-gray-500 rounded-full"
        style={{ 
          width: size * 0.4, 
          height: size * 0.4,
          marginBottom: size * 0.1
        }}
      />
      <View 
        className="bg-gray-500 rounded-full"
        style={{ 
          width: size * 0.6, 
          height: size * 0.35,
          marginTop: size * 0.05
        }}
      />
    </View>
  );

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'audio/*', 'application/*'],
        multiple: true,
      });
      if (!result.canceled && result.assets) {
        setSelectedFiles((prev) => [...prev, ...result.assets]);
      }
    } catch (err) {
      console.error('Erreur lors de la sélection du fichier:', err);
      setError('Erreur lors de la sélection du fichier. Veuillez réessayer.');
    }
  };

  const handleSend = async (): Promise<void> => {
    if (!input.trim() && selectedFiles.length === 0) {
      return;
    }

    if (!user?.id || !receiverId) {
      return;
    }

    const tempMessage: Message = {
      id_message: `temp-${Date.now()}`,
      contenu: input.trim(),
      id_expediteur: user.id,
      id_destinataire: receiverId,
      date_envoi: new Date().toISOString(),
      id_conversation: parsedConvId,
      lu: false,
      created_at: new Date().toISOString(),
      modified_at: new Date().toISOString(),
      pieces_jointes: selectedFiles.map((file) => file.uri || ''),
    };

    setMessages((prev) => [...prev, tempMessage]);
    const inputToSend = input.trim();
    setInput('');
    const filesToSend = [...selectedFiles];
    setSelectedFiles([]);

    try {
      let uploadedFiles: string[] = [];
      if (filesToSend.length > 0) {
        uploadedFiles = await Promise.all(
          filesToSend.map(async (file, index) => {
            try {
              const fileExt = file.name.split('.').pop();
              const fileName = `${user.id}/${Date.now()}-${index}.${fileExt}`;
              return await uploadFile(file.uri, fileName, file.mimeType || 'application/octet-stream');
            } catch (uploadErr) {
              console.error(`Failed to upload file ${file.name}:`, uploadErr);
              return '';
            }
          })
        );
      }

      const validFiles = uploadedFiles.filter((url) => url !== '');

      await sendMessage({
        id_conversation: parsedConvId,
        id_expediteur: user.id,
        id_destinataire: receiverId,
        contenu: inputToSend,
        files: validFiles,
      });

      setMessages((prev) => prev.filter((msg) => msg.id_message !== tempMessage.id_message));
    } catch (err: any) {
      console.error('Erreur envoi message:', err);
      setError('Erreur lors de l\'envoi du message.');
    }
  };

  const handleLongPress = (message: Message, event: any) => {
    const { pageX, pageY } = event.nativeEvent;
    setSelectedMessage(message);
    setMenuPosition({ x: pageX, y: pageY });
    setReactionModalVisible(true);
  };

  const addReaction = async (emoji: string) => {
    if (!selectedMessage || !user?.id) return;
    
    try {
      setMessages(prev => prev.map(msg => 
        msg.id_message === selectedMessage.id_message 
          ? { 
              ...msg, 
              reactions: [
                ...(msg.reactions || []).filter(r => r.user_id !== user.id),
                { emoji, user_id: user.id, user_name: user.email || '' }
              ]
            }
          : msg
      ));
      
      setReactionModalVisible(false);
      setSelectedMessage(null);
    } catch (error) {
      console.error('Erreur ajout réaction:', error);
    }
  };

  const showContextMenu = (message: Message, event: any) => {
    const { pageX, pageY } = event.nativeEvent;
    setSelectedMessage(message);
    setMenuPosition({ x: pageX, y: pageY });
    setContextMenuVisible(true);
  };

  const deleteMessage = async () => {
    if (!selectedMessage) return;
    
    Alert.alert(
      'Supprimer le message',
      'Voulez-vous supprimer ce message ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              setMessages(prev => prev.filter(msg => msg.id_message !== selectedMessage.id_message));
              setContextMenuVisible(false);
              setSelectedMessage(null);
            } catch (error) {
              console.error('Erreur suppression:', error);
            }
          }
        }
      ]
    );
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isCurrentUser = item.id_expediteur === user?.id;
    const nextMessage = messages[index + 1];
    const prevMessage = messages[index - 1];
    
    const isFirstInGroup = !prevMessage || prevMessage.id_expediteur !== item.id_expediteur;
    const isLastInGroup = !nextMessage || nextMessage.id_expediteur !== item.id_expediteur;

    return (
      <View className={`px-4 ${isFirstInGroup ? 'mt-2' : 'mt-0.5'}`}>
        <View className={`flex-row ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
          {/* Avatar pour les messages reçus */}
          {!isCurrentUser && isLastInGroup && (
            <View className="mr-2 mb-1">
              {otherUser.photoProfil ? (
                <Image
                  source={{ uri: otherUser.photoProfil }}
                  className="w-7 h-7 rounded-full"
                />
              ) : (
                <UserIcon size={28} />
              )}
            </View>
          )}
          {!isCurrentUser && !isLastInGroup && (
            <View className="w-7 mr-2" />
          )}

          <TouchableOpacity
            onLongPress={(event) => handleLongPress(item, event)}
            onPress={(event) => {
              if (Platform.OS === 'android') {
                showContextMenu(item, event);
              }
            }}
            className={`max-w-[75%] relative ${
              isCurrentUser 
                ? 'bg-green-500' 
                : 'bg-gray-100'
            } ${
              isFirstInGroup && isLastInGroup 
                ? 'rounded-2xl' 
                : isFirstInGroup 
                  ? isCurrentUser 
                    ? 'rounded-2xl rounded-br-md' 
                    : 'rounded-2xl rounded-bl-md'
                  : isLastInGroup 
                    ? isCurrentUser 
                      ? 'rounded-2xl rounded-tr-md' 
                      : 'rounded-2xl rounded-tl-md'
                    : isCurrentUser 
                      ? 'rounded-2xl rounded-r-md' 
                      : 'rounded-2xl rounded-l-md'
            } px-3 py-2`}
          >
            {/* Contenu du message */}
            {item.contenu && (
              <Text className={`text-base leading-5 ${
                isCurrentUser ? 'text-white' : 'text-gray-900'
              }`}>
                {item.contenu}
              </Text>
            )}

            {/* Pièces jointes */}
            {item.pieces_jointes && item.pieces_jointes.length > 0 && (
              <View className="mt-2">
                {item.pieces_jointes.map((uri, fileIndex) => {
                  const isImage = uri.match(/\.(jpg|jpeg|png|gif)$/i);
                  const isAudio = uri.match(/\.(mp3|wav|ogg)$/i);
                  return (
                    <View key={fileIndex} className="mb-2 last:mb-0">
                      {isImage ? (
                        <Image source={{ uri }} className="w-48 h-48 rounded-xl" />
                      ) : isAudio ? (
                        <View className="flex-row items-center p-3 bg-gray-50 rounded-xl">
                          <Text className="text-2xl mr-2">🎵</Text>
                          <Text className="text-gray-700 flex-1">Fichier audio</Text>
                        </View>
                      ) : (
                        <View className="flex-row items-center p-3 bg-gray-50 rounded-xl">
                          <Text className="text-2xl mr-2">📄</Text>
                          <Text className="text-gray-700 flex-1" numberOfLines={1}>
                            {uri.split('/').pop()}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* Réactions */}
            {item.reactions && item.reactions.length > 0 && (
              <View className="absolute -bottom-2 -right-1 flex-row">
                {item.reactions.slice(0, 3).map((reaction, reactionIndex) => (
                  <View 
                    key={reactionIndex} 
                    className="bg-white rounded-full w-6 h-6 items-center justify-center border border-gray-200 -ml-1 first:ml-0"
                    style={{ zIndex: 3 - reactionIndex }}
                  >
                    <Text className="text-xs">{reaction.emoji}</Text>
                  </View>
                ))}
                {item.reactions.length > 3 && (
                  <View className="bg-gray-200 rounded-full w-6 h-6 items-center justify-center -ml-1">
                    <Text className="text-xs text-gray-600">+{item.reactions.length - 3}</Text>
                  </View>
                )}
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Timestamp (seulement pour le dernier message du groupe) */}
        {isLastInGroup && (
          <View className={`mt-1 ${isCurrentUser ? 'items-end' : 'items-start ml-9'}`}>
            <Text className="text-xs text-gray-500">
              {new Date(item.date_envoi).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
              {isCurrentUser && (
                <Text className="text-green-500 ml-1">✓</Text>
              )}
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (!convValid) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-500 text-lg">Conversation invalide ou introuvable.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    Alert.alert('Erreur', error, [
      { text: 'OK', onPress: () => setError(null) },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header  Messenger Style */}
      <View className="bg-white border-b border-gray-200 px-4 py-3 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <LucideArrowLeft color="#22C55E" size={24} />
        </TouchableOpacity>
        
        <View className="relative mr-3">
          {otherUser.photoProfil ? (
            <Image
              source={{ uri: otherUser.photoProfil }}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <UserIcon size={40} />
          )}
          {otherUser.isOnline && (
            <View className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          )}
        </View>

        <TouchableOpacity className="flex-1" activeOpacity={0.7}>
          <Text className="text-lg font-semibold text-gray-900">{otherUser.nom}</Text>
          {otherUser.isOnline && (
            <Text className="text-sm text-green-500">En ligne</Text>
          )}
        </TouchableOpacity>

        <View className="flex-row items-center space-x-4">
          <TouchableOpacity>
            <LucidePhone color="#22C55E" size={24} />
          </TouchableOpacity>
          <TouchableOpacity>
            <LucideVideo color="#22C55E" size={24} />
          </TouchableOpacity>
          <TouchableOpacity>
            <LucideMoreVertical color="#22C55E" size={24} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages List */}
      <View className="flex-1 bg-white">
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item: Message) => item.id_message}
          renderItem={renderMessage}
          className="flex-1"
          contentContainerStyle={{
            paddingVertical: 12,
            paddingBottom: keyboardHeight > 0 ? 10 : 20,
            flexGrow: 1,
            justifyContent: 'flex-end'
          }}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={false}
          initialNumToRender={20}
          maxToRenderPerBatch={10}
          windowSize={10}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }}
          onLayout={() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }}
        />
      </View>

      {/* Fichiers sélectionnés */}
      {selectedFiles.length > 0 && (
        <View className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex-row justify-between items-center">
          <Text className="text-gray-700 font-medium">
            {selectedFiles.length} fichier(s) sélectionné(s)
          </Text>
          <TouchableOpacity onPress={() => setSelectedFiles([])}>
            <Text className="text-green-500 font-semibold">Effacer</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Zone de saisie  Messenger Style */}
      <View 
        className="bg-white px-4 py-3 border-t border-gray-200"
        style={{ 
          paddingBottom: Platform.OS === 'android' && keyboardHeight > 0 
            ? Math.max(12, keyboardHeight - 300) 
            : 12 
        }}
      >
        <View className="flex-row items-end space-x-2">
          {/* Boutons d'action à gauche */}
          <View className="flex-row space-x-2">
            <TouchableOpacity className="w-8 h-8 items-center justify-center">
              <LucideCamera color="#22C55E" size={20} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleFilePick} className="w-8 h-8 items-center justify-center">
              <LucideImage color="#22C55E" size={20} />
            </TouchableOpacity>
            <TouchableOpacity className="w-8 h-8 items-center justify-center">
              <LucideMic color="#22C55E" size={20} />
            </TouchableOpacity>
          </View>

          {/* Zone de texte */}
          <View className="flex-1 bg-gray-100 rounded-2xl px-4 py-2 max-h-32 min-h-10 justify-center">
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Tapez votre message..."
              placeholderTextColor="#8E8E93"
              multiline
              className="text-base text-gray-900 min-h-6"
              style={{ textAlignVertical: 'center' }}
              maxLength={1000}
              onFocus={() => setIsTyping(true)}
              onBlur={() => setIsTyping(false)}
            />
          </View>

          {/* Bouton d'envoi ou emoji */}
          {input.trim() || selectedFiles.length > 0 ? (
            <TouchableOpacity
              onPress={handleSend}
              className="w-8 h-8 items-center justify-center"
            >
              <LucideSend color="#22C55E" size={20} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity className="w-8 h-8 items-center justify-center">
              <LucideSmile color="#22C55E" size={20} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Modal des réactions */}
      <Modal
        visible={reactionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setReactionModalVisible(false);
          setSelectedMessage(null);
        }}
      >
        <Pressable 
          className="flex-1 bg-black/20 justify-center items-center"
          onPress={() => {
            setReactionModalVisible(false);
            setSelectedMessage(null);
          }}
        >
          <View className="bg-white rounded-3xl p-4 mx-4 shadow-lg">
            <View className="flex-row justify-around items-center space-x-4">
              {['❤️', '😂', '😮', '😢', '😡', '👍'].map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => addReaction(emoji)}
                  className="w-12 h-12 items-center justify-center bg-gray-50 rounded-full"
                  style={{ transform: [{ scale: 1.2 }] }}
                >
                  <Text className="text-2xl">{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Actions supplémentaires */}
            <View className="mt-4 pt-4 border-t border-gray-200">
              <TouchableOpacity 
                className="py-3 px-4 flex-row items-center"
                onPress={() => {
                  setReactionModalVisible(false);
                  setContextMenuVisible(true);
                }}
              >
                <Text className="text-gray-700 text-base font-medium">Plus d&apos;options</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Menu contextuel */}
      <Modal
        visible={contextMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setContextMenuVisible(false);
          setSelectedMessage(null);
        }}
      >
        <Pressable 
          className="flex-1 bg-black/20 justify-center items-center"
          onPress={() => {
            setContextMenuVisible(false);
            setSelectedMessage(null);
          }}
        >
          <View className="bg-white rounded-xl mx-4 shadow-lg overflow-hidden">
            <TouchableOpacity 
              className="py-4 px-6 border-b border-gray-100 flex-row items-center"
              onPress={() => {
                // Logique pour répondre
                setContextMenuVisible(false);
                setSelectedMessage(null);
              }}
            >
              <Text className="text-base text-gray-900 font-medium">Répondre</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="py-4 px-6 border-b border-gray-100 flex-row items-center"
              onPress={() => {
                // Logique pour copier
                setContextMenuVisible(false);
                setSelectedMessage(null);
              }}
            >
              <Text className="text-base text-gray-900 font-medium">Copier</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="py-4 px-6 border-b border-gray-100 flex-row items-center"
              onPress={() => {
                // Logique pour transférer
                setContextMenuVisible(false);
                setSelectedMessage(null);
              }}
            >
              <Text className="text-base text-gray-900 font-medium">Transférer</Text>
            </TouchableOpacity>

            {selectedMessage?.id_expediteur === user?.id && (
              <TouchableOpacity 
                className="py-4 px-6 flex-row items-center"
                onPress={() => {
                  setContextMenuVisible(false);
                  deleteMessage();
                }}
              >
                <Text className="text-base text-red-500 font-medium">Supprimer pour moi</Text>
              </TouchableOpacity>
            )}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

export default ChatScreen;