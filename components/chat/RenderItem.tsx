"use client";
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Conversation } from "~/type/messageInterface";
import { useAuth } from '~/contexts/AuthContext';
import { getLastMessage, getUsername, getUser, getUnreadMessagesCount } from '~/services/conversation-message-service'; 

interface RenderConversationProps {
  item: Conversation;
  onPress: (conversation: Conversation) => void;
}

const RenderConversation: React.FC<RenderConversationProps> = ({ item, onPress }) => {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const otherUserId = item.id_utilisateur1 === userId ? item.id_utilisateur2 : item.id_utilisateur1;
  const [otherUsername, setOtherUsername] = useState<string>('Utilisateur');
  const [lastMesage, setLastMessage] = useState<string>();
  const [photoProfil, setPhotoProfil] = useState<string>();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    const fetchUsername = async () => {
      const { username, photo_profil} = await getUser({id: otherUserId});

      const cleanedUsername = username 
        ? username.replace(/\bnull\b/gi, '').trim().replace(/\s+/g, ' ')
        : 'Utilisateur';
      
      setPhotoProfil(photo_profil);
      setOtherUsername(cleanedUsername || 'Utilisateur');
      console.log("Fetched username:", JSON.stringify(username, null, 2));
      if (!username) {
        console.warn("Username not found for user ID:", otherUserId);
      }
    };
    
    fetchUsername();
  }, [otherUserId]);

  // Charger le nombre de messages non lus
  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const count = await getUnreadMessagesCount(item.id_conversation, userId);
        setUnreadCount(count);
      } catch (error) {
        console.error("Error loading unread count:", error);
        setUnreadCount(0);
      }
    };
    
    if (userId) {
      loadUnreadCount();
    }
  }, [item.id_conversation, userId]);

  // Fonction pour formater le temps comme WhatsApp
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } else if (diffInHours < 168) {
      const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
      return days[date.getDay()];
    } else {
      return date.toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: '2-digit',
        year: '2-digit'
      });
    }
  };

  const loadLastMessage = useCallback(async () => {
    try {
      const ms = await getLastMessage(item.id_conversation);
      console.log("Last message loaded:", ms);
      setLastMessage(ms);
    } catch (error) {
      console.error("Error loading last message:", error);
      return '';
    } 
  }, [item.id_conversation]);
  
  useEffect(() => {
    loadLastMessage();
  }, [loadLastMessage]);

  // Couleurs d'avatar aléatoires pour chaque utilisateur
  const getAvatarColor = (userId: string) => {
    const colors = ['#25D366', '#34B7F1', '#FF6B6B', '#4ECDC4', '#9B59B6', '#F39C12', '#E74C3C', '#27AE60'];
    const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  return (
    <TouchableOpacity
      onPress={() => onPress(item)}
      className="flex-row items-center bg-white active:bg-gray-50"
      style={{
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: '#E5E5E5'
      }}
    >
      {/* Avatar */}
      <View className="relative mr-3">
        <View 
          className="w-14 h-14 rounded-full bg-gray-300 items-center justify-center overflow-hidden"
          style={{ backgroundColor: getAvatarColor(otherUserId) }}
        >
          <Image
            source={{ 
              uri: `${photoProfil !== '' ? photoProfil : `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUsername)}&background=${getAvatarColor(otherUserId).substring(1)}&color=fff&size=56&font-size=0.6&rounded=true&bold=true`}` 
            }}
            className="w-full h-full"
            style={{ borderRadius: 28 }}
            onError={() => {
              console.warn("Avatar loading failed for:", otherUsername);
            }}
          />
        </View>
        
        {/* Indicateur en ligne*/}
        <View 
          className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"
          style={{ display: 'none' }}
        />
      </View>

      {/* Contenu principal */}
      <View className="flex-1 justify-center">
        {/* Ligne supérieure : Nom + Heure */}
        <View className="flex-row items-center justify-between mb-1">
          {/* Nom avec style conditionnel */}
          <Text 
            className="text-gray-900 font-medium text-base flex-1"
            numberOfLines={1}
            style={{ 
              fontSize: 16, 
              fontWeight: unreadCount > 0 ? 'bold' : '500'
            }}
          >
            {otherUsername}
          </Text>
          
          {/* Heure de la dernière activité */}
          <Text 
            className="text-gray-500 text-xs ml-2"
            style={{ 
              fontSize: 12, 
              color: unreadCount > 0 ? '#25D366' : '#8E8E93',
              fontWeight: unreadCount > 0 ? 'bold' : 'normal'
            }}
          >
            {formatTime(item.derniere_activite)}
          </Text>
        </View>

        {/* Ligne inférieure : Dernier message + Badge */}
        <View className="flex-row items-center justify-between">
          <Text 
            className="text-gray-600 text-sm flex-1"
            numberOfLines={1}
            style={{ 
              fontSize: 14, 
              color: unreadCount > 0 ? '#1F2937' : '#8E8E93',
              fontWeight: unreadCount > 0 ? '600' : 'normal'
            }}
          >
            {lastMesage} 
          </Text>
          
          {/* Badge de messages non lus */}
          {unreadCount > 0 && (
            <View 
              className="bg-green-500 rounded-full px-2 py-1 ml-2"
              style={{ 
                backgroundColor: '#25D366',
                minWidth: 20,
                height: 20,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text className="text-white text-xs font-medium" style={{ fontSize: 12 }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default RenderConversation;