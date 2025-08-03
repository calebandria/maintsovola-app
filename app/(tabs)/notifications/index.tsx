import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useAuth} from '~/contexts/AuthContext';
import { supabase } from '~/lib/data';
import { 
  getUser
 } from '~/services/conversation-message-service';
 import  {Utilisateur}  from '~/type/messageInterface';

interface NotificationItem {
  id: number;
  type: string;
  user: string;
  avatar: string;
  action: string;
  time: string;
  isRead: boolean;
  content?: string;
  senderId?: string;
}

export default function NotifScreen() {
  const { user } = useAuth();
  const userId: string = user?.id || '';
  console.log("les users data:",userId)
  
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [selectedNotificationId, setSelectedNotificationId] = useState<number | null>(null);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [userData, setUserData] = useState<Utilisateur | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fonction pour marquer une notification comme lue dans la base de données
  const markAsReadInDB = async (notificationId: number) => {
    try {
      const { error } = await supabase
        .from('notification')
        .update({ lu: true })
        .eq('id_notification', notificationId)
        .eq('id_destinataire', userId);

      if (error) {
        console.error('Erreur lors de la mise à jour:', error);
        return false;
      }

      console.log(`Notification ${notificationId} marquée comme lue`);
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      return false;
    }
  };

  // Fonction pour marquer toutes les notifications comme lues dans la DB
  const markAllAsReadInDB = async () => {
    try {
      const { error } = await supabase
        .from('notification')
        .update({ lu: true })
        .eq('id_destinataire', userId)
        .eq('lu', false);

      if (error) {
        console.error('Erreur lors de la mise à jour globale:', error);
        return false;
      }

      console.log('Toutes les notifications marquées comme lues');
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour globale:', error);
      return false;
    }
  };

  // Fonction modifiée pour marquer comme lu (locale + DB)
  const markAsRead = async (id: number) => {
    const success = await markAsReadInDB(id);
    
    if (success) {
      setNotifications((prev: NotificationItem[]) =>
        prev.map((notif: NotificationItem) =>
          notif.id === id ? { ...notif, isRead: true } : notif
        )
      );
    }
  };

  // Fonction modifiée pour marquer tout comme lu
  const markAllAsRead = async () => {
    const success = await markAllAsReadInDB();
    
    if (success) {
      setNotifications((prev: NotificationItem[]) =>
        prev.map((notif: NotificationItem) => ({ ...notif, isRead: true }))
      );
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      const { error } = await supabase
        .from('notification')
        .delete()
        .eq('id_notification', notificationId);

      if (error) {
        console.error('Erreur lors de la suppression:', error);
        Alert.alert('Erreur', 'Impossible de supprimer la notification');
        return;
      }

      Alert.alert('Succès', 'Notification supprimée avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    }
  };

  const confirmDelete = (notificationId: number) => {
    Alert.alert(
      'Confirmer la suppression',
      'Êtes-vous sûr de vouloir supprimer cette notification ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => deleteNotification(notificationId),
        },
      ]
    );
  };

  const openMenu = (notificationId: number) => {
    setSelectedNotificationId(notificationId);
    setShowMenuModal(true);
  };

  const closeMenu = () => {
    setShowMenuModal(false);
    setSelectedNotificationId(null);
  };

  const loadCurrentUserData = useCallback(async () => {
    try {
      console.log('Chargement des données utilisateur connecté...');
      const userData = await getUser({id: userId});
      console.log('Données utilisateur connecté reçues:', userData);
      setUserData(userData);
    } catch (error) {
      console.error('Erreur lors du chargement des données utilisateur:', error);
    }
  }, [userId]);

  const getSenderData = async (senderId: string) => {
    try {
      if (!senderId || senderId === 'null' || senderId === 'undefined') {
        console.log('ID expéditeur invalide:', senderId);
        return null;
      }
      
      const senderData = await getUsers({id: senderId});
      return senderData;
    } catch (error) {
      console.error('Erreur lors du chargement des données de l\'expéditeur:', error);
      return null;
    }
  };

  // Fonction pour formatter les notifications depuis la DB
  const formatNotifications = async (data: any[]) => {
    const formattedNotifications: NotificationItem[] = await Promise.all(
      (data || []).map(async (notif: any): Promise<NotificationItem> => {
        let senderData = null;
        if (notif.id_expediteur && notif.id_expediteur !== 'null' && notif.id_expediteur !== 'undefined') {
          senderData = await getSenderData(notif.id_expediteur);
        }
        
        return {
          id: notif.id_notification,
          type: 'comment',
          user: senderData ? `${senderData.prenoms} ${senderData.nom}` : 'Système',
          avatar: senderData?.photo_profil || 'https://ui-avatars.com/api/?name=Systeme&background=007bff&color=fff',
          action: senderData ? 'vous a envoyé une notification' : 'Notification système',
          time: new Date(notif.date_creation).toLocaleTimeString(),
          isRead: notif.lu,
          content: notif.message,
          senderId: notif.id_expediteur,
        };
      })
    );
    return formattedNotifications;
  };

  // Fonction pour charger les notifications
  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('notification')
        .select(`
          id_notification,
          id_expediteur,
          id_destinataire,
          message,
          date_creation,
          lu
        `)
        .eq('id_destinataire', userId)
        .order('date_creation', { ascending: false });

      if (error) {
        console.error('Erreur Supabase :', error);
        return;
      }

      const formattedNotifications = await formatNotifications(data);
      setNotifications(formattedNotifications);
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;

    // Charger les notifications initiales
    loadNotifications();
    loadCurrentUserData();

    // Configurer l'écoute en temps réel
    const notificationSubscription = supabase
      .channel('notifications_realtime')
      .on('postgres_changes', 
        { 
          event: '*',
          schema: 'public', 
          table: 'notification',
          filter: `id_destinataire=eq.${userId}`
        }, 
        async (payload) => {
          console.log('Changement de notification détecté:', payload);
          await loadNotifications();
        }
      )
      .subscribe();

    // Nettoyage de la subscription
    return () => {
      notificationSubscription.unsubscribe();
    };
  }, [userId, loadCurrentUserData]);

  const unreadCount = notifications.filter((n: NotificationItem) => !n.isRead).length;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row justify-between items-center px-5 py-4 bg-white border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity 
            onPress={markAllAsRead} 
            className="px-3 py-1.5 bg-emerald-700 rounded-md"
          >
            <Text className="text-white text-xs font-semibold">Tout marquer comme lu</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Unread count */}
      {unreadCount > 0 && (
        <View className="bg-emerald-200 px-5 py-3 border-b border-gray-200">
          <Text className="text-emerald-900 text-sm font-semibold">
            {unreadCount} notification{unreadCount > 1 ? 's' : ''} non lue{unreadCount > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* Notifications List */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Affichage du chargement */}
        {isLoading ? (
          <View className="flex-1 justify-center items-center py-12">
            <ActivityIndicator size="large" color="#064e3b" />
            <Text className="mt-4 text-base text-gray-500 font-medium">
              Chargement des notifications...
            </Text>
          </View>
        ) : (
          <>
            {notifications.map((notification: NotificationItem) => (
              <TouchableOpacity
                key={notification.id}
                className={`flex-row p-4 bg-white border-b border-gray-200 relative ${
                  !notification.isRead ? 'bg-emerald-200' : ''
                }`}
                onPress={() => markAsRead(notification.id)}
              >
                {!notification.isRead && (
                  <View className="w-2 h-2 rounded-full bg-emerald-700 absolute left-2 top-5" />
                )}
                
                <Image
                  source={{ uri: notification.avatar }}
                  className="w-12 h-12 rounded-full mr-3"
                />
                
                <View className="flex-1 flex-row justify-between items-start">
                  <View className="flex-1">
                    <Text className="text-base text-gray-900 leading-5">
                      <Text className="font-semibold text-gray-900">{notification.user}</Text>
                      {' ' + notification.action}
                    </Text>
                    
                    {notification.content && (
                      <Text className="text-sm text-gray-500 italic mt-1 leading-4">
                        {notification.content}
                      </Text>
                    )}
                    
                    <Text className="text-xs text-gray-500 mt-1.5">{notification.time}</Text>
                  </View>
                  
                  <TouchableOpacity
                    className="p-2 ml-2 justify-center items-center"
                    onPress={() => openMenu(notification.id)}
                  >
                    <Text className="text-xl text-gray-500 font-bold">⋮</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
            
            {/* Empty state when no notifications */}
            {notifications.length === 0 && (
              <View className="flex-1 justify-center items-center px-5">
                <Text className="text-6xl mb-5 opacity-50">🔔</Text>
                <Text className="text-xl font-semibold text-gray-900 mb-2">
                  Aucune notification
                </Text>
                <Text className="text-base text-gray-500 text-center">
                  Vos notifications apparaîtront ici
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Modal pour le menu d'actions */}
      <Modal
        visible={showMenuModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-center items-center"
          activeOpacity={1}
          onPress={closeMenu}
        >
          <View className="bg-white rounded-xl py-2 min-w-[200px] shadow-lg">
            <TouchableOpacity
              className="px-5 py-4 border-b border-gray-100"
              onPress={() => {
                closeMenu();
                if (selectedNotificationId) {
                  confirmDelete(selectedNotificationId);
                }
              }}
            >
              <Text className="text-base text-red-600 font-medium">🗑️ Supprimer</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className="px-5 py-4"
              onPress={closeMenu}
            >
              <Text className="text-base text-gray-600 font-medium">Annuler</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};