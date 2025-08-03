import 
React, 
{ useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
} from 'react-native';

interface User {
  id_utilisateur: string
  nom: string
  email: string
  photo_profil: string
  photo_couverture: string
  created_at: Date
  prenoms: string
  id_role: number
  bio: string | null
  adresse: string
}

interface Notification {
  id: string
  type: string
  user: string
  avatar: string
  action: string
  time: string
  isRead: boolean
  content?: string
  id_expediteur?: string
}

import { supabase } from '~/lib/data';
import { useAuth } from '~/contexts/AuthContext';

export default function Notify() {
  const [currentUser, setCurrentUser] = useState<User>()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])

  const { user } = useAuth();
  const currentUserId = user?.id || null;

  const markAsRead = async (id: string | number) => {
    // Mettre à jour l'état local immédiatement
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id.toString() ? { ...notif, isRead: true } : notif
      )
    );

    // Mettre à jour la base de données
    try {
      await supabase
        .from('notification')
        .update({ lu: true })
        .eq('id_notification', id.toString());
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la notification:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from("utilisateur").select("*")

      if (error) {
        console.error("Erreur lors de la récupération des utilisateurs:", error)
        return []
      }

      const formattedData: User[] = (data || []).map((item: any) => ({
        id_utilisateur: item.id_utilisateur,
        nom: item.nom,
        email: item.email,
        photo_profil: item.photo_profil,
        photo_couverture: item.photo_couverture,
        created_at: new Date(item.created_at),
        prenoms: item.prenoms,
        id_role: item.id_role,
        bio: item.bio,
        adresse: item.adresse,
      }))

      // setUsers(formattedData)
      console.log("Utilisateurs récupérés:", formattedData.length)
      
      return formattedData
    } catch (error) {
      console.error("Erreur fetchUsers:", error)
      return []
    }
  }

  const getNotifications = async (userId: string) => {
    if (!userId) {
      console.log("Pas d'ID utilisateur pour récupérer les notifications")
      return
    }
    
    console.log("Récupération des notifications pour l'utilisateur:", userId);
    
    try {
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
        console.error('Erreur Supabase notifications:', error);
        return
      }

      console.log('Notifications récupérées:', data?.length || 0);

      // Récupérer les informations des expéditeurs
      // const expediteurIds = [...new Set((data || []).map(n => n.id_expediteur).filter(Boolean))]
      const expediteurIds: string[] = (data || [])
        .map((n: any) => n.id_expediteur)
        .filter((id: string | null) => Boolean(id));

   // Pour éviter les null

      
      let expediteursInfo: { [key: string]: { nom: string, prenom: string, photo_profil?: string } } = {}
      
      if (expediteurIds.length > 0) {
        const { data: usersData } = await supabase
          .from('utilisateur')
          .select('id_utilisateur, nom, prenoms, photo_profil')
          .in('id_utilisateur', expediteurIds)

        if (usersData) {
          usersData.forEach(user => {
            expediteursInfo[user.id_utilisateur] = {
              nom: user.nom || 'Utilisateur',
              prenom: user.prenoms || '',
              photo_profil: user.photo_profil || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(`${user.prenoms} ${user.nom}`)
            }
          })
        }
      }

      const formatted: Notification[] = (data || []).map((notif: any) => {
        const expediteur = expediteursInfo[notif.id_expediteur] || { nom: 'Utilisateur', prenom: '' }
        const fullName = `${expediteur.prenom} ${expediteur.nom}`.trim() || 'Utilisateur inconnu'
        
        return {
          id: notif.id_notification,
          type: 'comment',
          user: fullName,
          avatar: expediteur.photo_profil || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(fullName),
          action: 'vous a envoyé une notification',
          time: new Date(notif.date_creation).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          isRead: notif.lu,
          content: notif.message,
          id_expediteur: notif.id_expediteur
        }
      });

      console.log('Notifications formatées:', formatted.length)
      setNotifications(formatted);
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error)
    }
  }

  // Configuration de l'écoute en temps réel
  const setupRealtimeSubscription = (userId: string) => {
    if (!userId) return;

    console.log('Configuration de l\'écoute temps réel pour l\'utilisateur:', userId);

    // Écouter les changements dans la table notification
    const notificationSubscription = supabase
      .channel('notification_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notification',
          filter: `id_destinataire=eq.${userId}`,
        },
        (payload) => {
          console.log('Changement détecté dans les notifications:', payload);
          getNotifications(userId);
        }
      )
      .subscribe((status) => {
        console.log('Statut de l\'abonnement notifications:', status);
      });

    // Écouter les changements dans la table utilisateur
    const userSubscription = supabase
      .channel('user_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'utilisateur',
        },
        (payload) => {
          console.log('Changement détecté dans les utilisateurs:', payload);
          getNotifications(userId);
        }
      )
      .subscribe((status) => {
        console.log('Statut de l\'abonnement utilisateurs:', status);
      });

    // Retourner une fonction de nettoyage
    return () => {
      console.log('Nettoyage des abonnements temps réel');
      supabase.removeChannel(notificationSubscription);
      supabase.removeChannel(userSubscription);
    };
  };

  const initializeData = async () => {
    if (!currentUserId) {
      console.log("Aucun utilisateur connecté via le contexte d'authentification")
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      console.log("Initialisation pour l'utilisateur:", currentUserId)

      // 1. Récupérer l'utilisateur actuel depuis la table utilisateur
      const { data: userData, error: userError } = await supabase
        .from("utilisateur")
        .select("*")
        .eq("id_utilisateur", currentUserId)
        .single()

      if (userError || !userData) {
        console.error("Erreur lors de la récupération de l'utilisateur:", userError)
        Alert.alert("Erreur", "Utilisateur non trouvé")
        setLoading(false)
        return
      }

      console.log("Utilisateur trouvé:", userData.nom, userData.prenoms)

      // 2. Définir l'utilisateur actuel
      const formattedUser: User = {
        id_utilisateur: userData.id_utilisateur,
        nom: userData.nom,
        email: userData.email,
        photo_profil: userData.photo_profil,
        photo_couverture: userData.photo_couverture,
        created_at: new Date(userData.created_at),
        prenoms: userData.prenoms,
        id_role: userData.id_role,
        bio: userData.bio,
        adresse: userData.adresse,
      }

      // setCurrentUser(formattedUser)

      // 3. Récupérer tous les utilisateurs
      await fetchUsers()

      // 4. Récupérer les notifications
      await getNotifications(currentUserId)

      // 5. Configurer l'écoute temps réel
      const cleanup = setupRealtimeSubscription(currentUserId)
      
      return cleanup

    } catch (error) {
      console.error("Erreur lors de l'initialisation:", error)
      Alert.alert("Erreur", "Impossible de charger les données")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const init = async () => {
      cleanup = await initializeData();
    };

    // Seulement initialiser si on a un utilisateur connecté
    if (currentUserId) {
      init();
    } else {
      console.log("En attente de l'authentification de l'utilisateur...")
      setLoading(false)
    }

    // Fonction de nettoyage
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [currentUserId]) // Relancer quand currentUserId change

  const markAllAsRead = async () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, isRead: true }))
    );

    // Mettre à jour la base de données
    if (currentUserId) {
      try {
        await supabase
          .from('notification')
          .update({ lu: true })
          .eq('id_destinataire', currentUserId)
          .eq('lu', false)
      } catch (error) {
        console.error('Erreur lors de la mise à jour des notifications:', error)
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return '👍';
      case 'comment':
        return '💬';
      case 'friend_request':
        return '👥';
      case 'tag':
        return '🏷️';
      case 'birthday':
        return '🎂';
      default:
        return '📢';
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Afficher un message si l'utilisateur n'est pas connecté
  if (!currentUserId) {
    return (
      <SafeAreaView className="flex-1 bg-green-50">
        <View className="flex-1 justify-center items-center px-10">
          <Text className="text-6xl mb-5 opacity-60">🔐</Text>
          <Text className="text-xl font-semibold text-green-800 mb-2">
            Non authentifié
          </Text>
          <Text className="text-base text-green-500 text-center">
            Veuillez vous connecter pour voir vos notifications
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-green-50">
        <View className="flex-1 justify-center items-center px-10">
          <Text className="text-xl font-semibold text-green-800 mb-2">Chargement...</Text>
          {/* {currentUser && (
            <Text className="text-base text-green-600">
              Connexion de {currentUser.prenoms} {currentUser.nom}
            </Text>
          )} */}

        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-green-50">
      {/* Header */}
      <View className="flex-row justify-between items-center px-5 py-4 bg-white border-b-2 border-green-300 shadow-sm">
        <View>
          <Text className="text-2xl font-bold text-green-800">Notifications</Text>
          {/* {currentUser && (
            <Text className="text-xs text-green-500 mt-0.5">
              {currentUser.prenoms} {currentUser.nom}
            </Text>
          )} */}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity 
            onPress={markAllAsRead} 
            className="px-3 py-1.5 bg-green-700 rounded-lg shadow-sm"
          >
            <Text className="text-white text-xs font-semibold">Tout marquer comme lu</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Unread count */}
      {unreadCount > 0 && (
        <View className="bg-green-300 px-5 py-3 border-b border-green-500">
          <Text className="text-green-800 text-sm font-semibold">
            {unreadCount} notification{unreadCount > 1 ? 's' : ''} non lue{unreadCount > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* Notifications List */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {notifications.map((notification) => (
          <TouchableOpacity
            key={notification.id}
            className={`flex-row p-4 bg-white border-b border-green-100 relative mx-2 my-0.5 rounded-lg shadow-sm ${
              !notification.isRead ? 'bg-green-50 border-l-4 border-l-green-500' : ''
            }`}
            onPress={() => markAsRead(notification.id)}
          >
            {!notification.isRead && (
              <View className="w-2.5 h-2.5 rounded-full bg-green-700 absolute left-2 top-5 shadow-sm" />
            )}
            
            <Image
              source={{ uri: notification.avatar }}
              className="w-12 h-12 rounded-full mr-3 border-2 border-green-300"
            />
            
            <View className="flex-1 flex-row justify-between">
              <View className="flex-1">
                <Text className="text-base text-gray-900 leading-5">
                  <Text className="font-semibold text-green-800">{notification.user}</Text>
                  {' ' + notification.action}
                </Text>
                
                {notification.content && (
                  <Text className="text-sm text-green-500 italic mt-1 leading-4 bg-green-50 p-2 rounded-md border-l-3 border-l-green-300">
                    "{notification.content}"
                  </Text>
                )}
                
                <Text className="text-xs text-green-600 mt-1.5 font-medium">{notification.time}</Text>
              </View>
              
              <View className="ml-2 justify-center bg-green-100 rounded-full w-10 h-10 items-center">
                <Text className="text-xl">
                  {getNotificationIcon(notification.type)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Empty state when no notifications */}
      {notifications.length === 0 && !loading && (
        <View className="flex-1 justify-center items-center px-10 bg-green-50">
          <Text className="text-6xl mb-5 opacity-60">🔔</Text>
          <Text className="text-xl font-semibold text-green-800 mb-2">Aucune notification</Text>
          <Text className="text-base text-green-500 text-center">
            Vos notifications apparaîtront ici
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};