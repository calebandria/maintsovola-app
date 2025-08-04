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
import { useHideNavbar } from '~/contexts/NavContext';

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
  const [photoProfil, setPhotoProfil] = useState<string>('');
  const [unreadCount, setUnreadCount] = useState<number>(0);
  useHideNavbar(); // Utilisation du hook pour cacher la navbar
  
  useEffect(() => {
    const fetchUsername = async () => {
      const { username, photo_profil } = await getUser({id: otherUserId});

      const cleanedUsername = username 
        ? username.replace(/\bnull\b/gi, '').trim().replace(/\s+/g, ' ')
        : 'Utilisateur';
      
      setPhotoProfil(photo_profil || '');
      setOtherUsername(cleanedUsername || 'Utilisateur');
      console.log("Fetched username:", JSON.stringify(username, null, 2));
      console.log("Photo profil:", photo_profil);
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

  // Fonction pour formater le temps comme WhatsApp/Facebook
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.abs(now.getTime() - date.getTime()) / (1000 * 60);
      if (diffInMinutes < 1) {
        return 'maintenant';
      }
      return `${Math.floor(diffInMinutes)}min`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else if (diffInHours < 168) {
      const days = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];
      return days[date.getDay()];
    } else {
      return date.toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: '2-digit'
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

  // Couleur d'icône par défaut
  const getIconColor = () => {
    return '#8E8E93'; // Gris comme les icônes par défaut
  };

  return (
    <TouchableOpacity
      onPress={() => onPress(item)}
      className="flex-row items-center bg-white active:bg-gray-50"
      style={{
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 0,
      }}
    >
      {/* Avatar avec photo ou icône par défaut */}
      <View className="relative mr-3">
        <View 
          className="w-14 h-14 rounded-full items-center justify-center overflow-hidden"
          style={{ 
            backgroundColor: '#E5E5E5'
          }}
        >
          {photoProfil && photoProfil.trim() !== '' ? (
            // Afficher la photo de profil si elle existe
            <Image
              source={{ uri: photoProfil }}
              className="w-full h-full"
              style={{ borderRadius: 28 }}
              onError={() => {
                console.warn("Avatar loading failed for:", otherUsername);
                setPhotoProfil(''); // Fallback vers l'icône
              }}
            />
          ) : (
            // Afficher l'icône par défaut si pas de photo
            <View style={{ width: 28, height: 28 }}>
              <View 
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: getIconColor(),
                  alignSelf: 'center',
                  marginBottom: 2
                }}
              />
              <View 
                style={{
                  width: 20,
                  height: 14,
                  borderRadius: 10,
                  backgroundColor: getIconColor(),
                  alignSelf: 'center'
                }}
              />
            </View>
          )}
        </View>
        
        {/* Indicateur en ligne - style Facebook (petit point vert) */}
        <View 
          className="absolute bottom-1 right-1 w-3 h-3 bg-green-500 rounded-full border border-white"
          style={{ 
            backgroundColor: '#42B883',
            display: Math.random() > 0.5 ? 'flex' : 'none' // Simulation aléatoire
          }}
        />
      </View>

      {/* Contenu principal - Style Facebook */}
      <View className="flex-1 justify-center">
        {/* Ligne supérieure : Nom + Heure */}
        <View className="flex-row items-center justify-between mb-1">
          <Text 
            className="text-gray-900 flex-1"
            numberOfLines={1}
            style={{ 
              fontSize: 16, 
              fontWeight: unreadCount > 0 ? '600' : '400',
              color: '#050505'
            }}
          >
            {otherUsername}
          </Text>
          
          {/* Heure - style Facebook */}
          <Text 
            className="ml-2"
            style={{ 
              fontSize: 13, 
              color: unreadCount > 0 ? '#22C55E' : '#65676B',
              fontWeight: unreadCount > 0 ? '500' : '400'
            }}
          >
            {formatTime(item.derniere_activite)}
          </Text>
        </View>

        {/* Ligne inférieure : Dernier message + Badge */}
        <View className="flex-row items-center justify-between">
          <Text 
            className="flex-1"
            numberOfLines={1}
            style={{ 
              fontSize: 14, 
              color: unreadCount > 0 ? '#050505' : '#65676B',
              fontWeight: unreadCount > 0 ? '500' : '400'
            }}
          >
            {lastMesage || 'Aucun message'} 
          </Text>
          
          {/* Badge de messages non lus - style Facebook */}
          {unreadCount > 0 && (
            <View 
              className="rounded-full ml-2"
              style={{ 
                backgroundColor: '#22C55E',
                minWidth: 18,
                height: 18,
                justifyContent: 'center',
                alignItems: 'center',
                paddingHorizontal: unreadCount > 9 ? 6 : 0,
              }}
            >
              <Text 
                style={{ 
                  color: 'white', 
                  fontSize: 11, 
                  fontWeight: 'bold' 
                }}
              >
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