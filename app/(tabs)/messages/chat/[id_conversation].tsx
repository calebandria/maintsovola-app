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
  StyleSheet,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Dimensions
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getConversationById, getMessages, sendMessage, subscribeToMessages, uploadFile, getUser } from '~/services/conversation-message-service';

import { Conversation, Message, Utilisateur } from '~/type/messageInterface';
import { useAuth } from '~/contexts/AuthContext';
import { LucideArrowLeft, LucidePhone, LucideVideo, LucideMoreVertical, LucideSend } from 'lucide-react-native';
import { supabase } from '~/lib/supabase';
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHideNavbar } from '~/contexts/NavContext';
 // Import du hook personnalisé
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

  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  
  useHideNavbar(); 
  // Utilisation du hook pour cacher la navbar

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

  //gestion clavier
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


  // Calcul de l'offset pour KeyboardAvoidingView
  // Header height (approximatif) + safe area top + marge de sécurité
  const keyboardVerticalOffset = Platform.OS === 'ios' ? insets.top + 60 : 150;

  const fetchMessages = useCallback(async () => {
    if (!parsedConvId || isNaN(parsedConvId)) {
      setConvValid(false);
      return;
    }
    try {
      const fetched = await getMessages({ id_conversation: parsedConvId });
      //setMessages(fetched);
      // trier par date
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

        // Récupérer les infos de l'autre utilisateur
        const { username, photo_profil } = await getUser({ id: otherId });
        const cleanedUsername = username 
          ? username.replace(/\bnull\b/gi, '').trim().replace(/\s+/g, ' ')
          : 'Utilisateur';
        
        setOtherUser({
          nom: cleanedUsername || 'Utilisateur',
          photoProfil: photo_profil,
          isOnline: Math.random() > 0.5 // Simulation statut en ligne (à remplacer par vraie logique)
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

  // Couleurs d'avatar aléatoires
  const getAvatarColor = (userId: string) => {
    const colors = ['#25D366', '#34B7F1', '#FF6B6B', '#4ECDC4', '#9B59B6', '#F39C12', '#E74C3C', '#27AE60'];
    const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

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
      console.warn('Aucun contenu ou fichier à envoyer');
      return;
    }

    if (!user?.id || !receiverId) {
      console.warn('Missing user or receiverId');
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
      // pieces_jointes: uploadFile ? uploadFile.map(file => file.uri) : undefined,
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
      let errorMessage = 'Erreur lors de l\'envoi du message. Veuillez vérifier votre connexion et réessayer.';
      if (err.message.includes('Network request failed')) {
        errorMessage = 'Problème de connexion réseau. Veuillez vérifier votre connexion Internet.';
      } else if (err.message.includes('Failed to upload file')) {
        errorMessage = 'Échec de l\'envoi des fichiers joints. Le message texte a été envoyé.';
      }
      setError(errorMessage);
      if (inputToSend) {
        try {
          await sendMessage({
            id_conversation: parsedConvId,
            id_expediteur: user.id,
            id_destinataire: receiverId,
            contenu: inputToSend,
            files: [],
          });
          setMessages((prev) => prev.filter((msg) => msg.id_message !== tempMessage.id_message));
        } catch (textErr) {
          console.error('Failed to send text-only message:', textErr);
        }
      }
    }
  };

  const handleLongPress = (message: Message, event: any) => {
    const { pageX, pageY } = event.nativeEvent;
    setSelectedMessage(message);
    setMenuPosition({ x: pageX, y: pageY });
    setMenuVisible(true);
  };

  const addReaction = async (emoji: string) => {
    if (!selectedMessage) return;
    
    try {
      // Appel à votre service pour ajouter la réaction
      // await addReactionToMessage(selectedMessage.id_message, emoji, user.id);
      
      // Mise à jour locale temporaire
      setMessages(prev => prev.map(msg => 
        msg.id_message === selectedMessage.id_message 
          ? { 
              ...msg, 
              reactions: [
                ...(msg.reactions || []),
                { emoji, user_id: user?.id || '', user_name: user?.email || '' }
              ]
            }
          : msg
      ));
      
      setMenuVisible(false);
      setSelectedMessage(null);
    } catch (error) {
      console.error('Erreur ajout réaction:', error);
    }
  };

  const deleteMessage = async () => {
    if (!selectedMessage) return;
    
    Alert.alert(
      'Supprimer le message',
      'Êtes-vous sûr de vouloir supprimer ce message ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              // Appel à votre service pour supprimer
              // await deleteMessageById(selectedMessage.id_message);
              
              // Suppression locale temporaire
              setMessages(prev => prev.filter(msg => msg.id_message !== selectedMessage.id_message));
              
              setMenuVisible(false);
              setSelectedMessage(null);
            } catch (error) {
              console.error('Erreur suppression:', error);
            }
          }
        }
      ]
    );
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isCurrentUser = item.id_expediteur === user?.id;

    return (
      <View style={[
        styles.messageContainer, 
        // { justifyContent: isCurrentUser ? 'flex-end' : 'flex-start' },
        { alignItems: isCurrentUser ? 'flex-end' : 'flex-start'}
        
        ]}>
        <View
          style={[
            styles.messageBubble,
            { 
              backgroundColor: isCurrentUser ? '#DCF8C6' : 'white',
              borderTopRightRadius: isCurrentUser ? 8 : 18,
              borderTopLeftRadius: isCurrentUser ? 18 : 8,
            },
          ]}
        >
          {item.contenu && (
            <Text style={[styles.messageText, { color: isCurrentUser ? '#000' : '#000' }]}>
              {item.contenu}
            </Text>
          )}
          {item.pieces_jointes && item.pieces_jointes.length > 0 && (
            <View style={styles.attachmentContainer}>
              {item.pieces_jointes.map((uri, index) => {
                const isImage = uri.match(/\.(jpg|jpeg|png|gif)$/i);
                const isAudio = uri.match(/\.(mp3|wav|ogg)$/i);
                return (
                  <View key={index} style={styles.attachmentItem}>
                    {isImage ? (
                      <Image source={{ uri }} style={styles.attachmentImage} />
                    ) : isAudio ? (
                      <Text style={[styles.attachmentText, { color: '#000' }]}>
                        🎵 Fichier audio
                      </Text>
                    ) : (
                      <Text style={[styles.attachmentText, { color: '#000' }]}>
                        📄 {uri.split('/').pop()}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* Affichage des réactions */}
          {item.reactions && item.reactions.length > 0 && (
            <View style={styles.reactionsContainer}>
              {item.reactions.map((reaction, index) => (
                <View key={index} style={styles.reactionBubble}>
                  <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.messageFooter}>
            <Text style={[styles.messageTime, { color: '#8E8E93' }]}>
              {new Date(item.date_envoi).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              })}
            </Text>
            {isCurrentUser && (
              <Text style={[styles.messageStatus, { color: '#4FC3F7' }]}>✓✓</Text>
            )}
          </View>
        </View>
      </View>
      
    );
  };

  if (!convValid) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Conversation invalide ou introuvable.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    Alert.alert('Erreur', error, [
      { text: 'OK', onPress: () => setError(null) },
      {
        text: 'Réessayer',
        onPress: () => handleSend(),
        style: 'default',
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header WhatsApp Style */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <LucideArrowLeft color="white" size={24} />
        </TouchableOpacity>
        
        {/* Avatar de l'utilisateur */}
        <View style={styles.avatarContainer}>
          <Image
            source={{ 
              uri: otherUser.photoProfil || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.nom)}&background=${getAvatarColor(receiverId).substring(1)}&color=fff&size=40&font-size=0.6&rounded=true&bold=true`
            }}
            style={styles.avatar}
          />
          {otherUser.isOnline && <View style={styles.onlineIndicator} />}
        </View>

        {/* Infos utilisateur */}
        <TouchableOpacity style={styles.headerTextContainer} activeOpacity={0.7}>
          <Text style={styles.headerTitle}>{otherUser.nom}</Text>
        </TouchableOpacity>

        {/* Boutons d'action */}
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton}>
            <LucidePhone color="white" size={22} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <LucideMoreVertical color="white" size={22} />
          </TouchableOpacity>
        </View>
      </View>

      {/* <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 60 : 0}
        style={styles.container}
      > */}
      <View style={[
        styles.container,
        Platform.OS === 'android' && keyboardHeight > 0 && { 
          marginBottom: keyboardHeight - 330 
        }
      ]}>
        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item: Message) => item.id_message}
          renderItem={renderMessage}
          style={styles.messageList}
          contentContainerStyle={[
            styles.messageListContent,
            // Ajustement dynamique selon le clavier
            { paddingBottom: keyboardHeight > 0 ? 10 : 20 }
          ]}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={false}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={10}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }}
          onLayout={() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }}
        />

        {/* Affichage des fichiers sélectionnés */}
        {selectedFiles.length > 0 && (
          <View style={styles.selectedFilesContainer}>
            <Text style={styles.selectedFilesText}>
              {selectedFiles.length} fichier(s) sélectionné(s)
            </Text>
            <TouchableOpacity onPress={() => setSelectedFiles([])}>
              <Text style={styles.clearFilesText}>Effacer</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Input Area avec gestion du clavier */}
        <View style={[
          styles.inputContainer,
          // Pas de padding supplémentaire sur Android quand le clavier est fermé
          Platform.OS === 'android' && keyboardHeight === 0 && { paddingBottom: 8 }
        ]}>
          <View style={styles.textInputContainer}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Message"
              placeholderTextColor="#8E8E93"
              multiline
              style={styles.textInput}
              maxLength={1000}
            />
            <TouchableOpacity onPress={handleFilePick} style={styles.attachmentButton}>
              <Text style={styles.attachmentButtonText}>📎</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={handleSend}
            disabled={!input.trim() && selectedFiles.length === 0}
            style={[
              styles.sendButton, 
              { 
                backgroundColor: input.trim() || selectedFiles.length > 0 ? '#25D366' : '#BDC3C7',
                transform: input.trim() || selectedFiles.length > 0 ? [{ scale: 1 }] : [{ scale: 0.95 }]
              }
            ]}
          >
            <LucideSend color="white" size={20} />
          </TouchableOpacity>
        </View>
      {/* </KeyboardAvoidingView> */}
      </View>

      {menuVisible && (
      <>
        {/* Overlay pour fermer le menu */}
        <TouchableOpacity 
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => {
            setMenuVisible(false);
            setSelectedMessage(null);
          }}
        />
        
        {/* Menu contextuel */}
        <View style={[
          styles.contextMenu,
          {
            left: Math.min(menuPosition.x - 100, Dimensions.get('window').width - 220),
            top: Math.max(menuPosition.y - 100, 100),
          }
        ]}>
          {/* Réactions rapides */}
          <View style={styles.reactionsRow}>
            {['❤️', '😂', '😮', '😢', '😡', '👍'].map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={styles.reactionButton}
                onPress={() => addReaction(emoji)}
              >
                <Text style={styles.reactionButtonText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Actions */}
          <View style={styles.menuActions}>
            {selectedMessage?.id_expediteur === user?.id && (
              <TouchableOpacity 
                style={styles.menuActionButton}
                onPress={deleteMessage}
              >
                <Text style={[styles.menuActionText, { color: '#FF3B30' }]}>
                  🗑️ Supprimer
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.menuActionButton}
              onPress={() => {
                // Logique pour répondre au message
                setMenuVisible(false);
                setSelectedMessage(null);
              }}
            >
              <Text style={styles.menuActionText}>↩️ Répondre</Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#ECE5DD' // Couleur de fond WhatsApp
  },
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: '#075E54', // Vert WhatsApp plus foncé
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: { 
    marginRight: 8, 
    padding: 8, 
    marginLeft: -4 
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#25D366',
    borderWidth: 2,
    borderColor: '#075E54',
  },
  headerTextContainer: { 
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: { 
    color: 'white', 
    fontSize: 18, 
    fontWeight: '600',
    marginBottom: 1,
  },
  headerSubtitle: { 
    color: 'rgba(255,255,255,0.8)', 
    fontSize: 13,
    fontWeight: '400',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  errorContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  errorText: { 
    color: '#8E8E93', 
    fontSize: 18 
  },
  messageList: { 
    flex: 1,
    backgroundColor: '#ECE5DD',
  },
  messageListContent: { 
    paddingVertical: 12, 
    flexGrow: 1, 
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
  messageContainer: { 
    flexDirection: 'row', 
    marginVertical: 1, 
    marginHorizontal: 8 
  },
  messageBubble: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: '85%',
    minWidth: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  messageText: { 
    fontSize: 16, 
    lineHeight: 22 
  },
  attachmentContainer: { 
    marginTop: 6 
  },
  attachmentItem: { 
    marginBottom: 6 
  },
  attachmentImage: { 
    width: 200, 
    height: 200, 
    borderRadius: 8 
  },
  attachmentText: { 
    fontSize: 14, 
    marginTop: 2 
  },
  messageFooter: { 
    flexDirection: 'row', 
    justifyContent: 'flex-end', 
    alignItems: 'center', 
    marginTop: 4 
  },
  messageTime: { 
    fontSize: 11, 
    marginRight: 4 
  },
  messageStatus: { 
    fontSize: 12 
  },
  selectedFilesContainer: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5E5',
  },
  selectedFilesText: {
    fontSize: 14,
    color: '#666',
  },
  clearFilesText: {
    fontSize: 14,
    color: '#25D366',
    fontWeight: '600',
  },
  inputContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5E5',
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 120,
    minHeight: 44,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 20,
    color: '#000',
    paddingVertical: 0,
    minHeight: 20,
    textAlignVertical: 'center',
  },
  attachmentButton: { 
    padding: 4,
    marginLeft: 8,
  },
  attachmentButtonText: { 
    fontSize: 20 
  },
  sendButton: {
    borderRadius: 25,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0,
  },
  sendButtonText: {
    fontSize: 18,
  },
  reactionsContainer: {
    flexDirection: 'row',
    marginTop: 4,
    flexWrap: 'wrap',
  },
  reactionBubble: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
    marginTop: 2,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.1)',
    zIndex: 999,
  },
  contextMenu: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
    minWidth: 200,
  },
  reactionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  reactionButton: {
    padding: 8,
    borderRadius: 20,
  },
  reactionButtonText: {
    fontSize: 20,
  },
  menuActions: {
    paddingTop: 8,
  },
  menuActionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  menuActionText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
});

export default ChatScreen;

