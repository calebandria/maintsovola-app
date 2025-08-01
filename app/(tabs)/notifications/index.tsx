import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';
import {useAuth} from '~/contexts/AuthContext'; // Adjust the import path as necessary
import { supabase } from '~/lib/data'; // Adjust the import path as necessary

export default  function NotifScreen() {
  const user = useAuth();
  console.log('User Auth:', user);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'like',
      user: 'Marie Dubois',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b9b9b069?w=50&h=50&fit=crop&crop=face',
      action: 'a aimé votre publication',
      time: '5 min',
      isRead: false,
      content: 'Belle photo de vacances !',
    },
    {
      id: 2,
      type: 'comment',
      user: 'Thomas Martin',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face',
      action: 'a commenté votre publication',
      time: '15 min',
      isRead: false,
      content: 'Sympa cette soirée !',
    },
    {
      id: 3,
      type: 'friend_request',
      user: 'Sophie Laurent',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face',
      action: 'vous a envoyé une demande d\'ami',
      time: '1 h',
      isRead: true,
    },
    {
      id: 4,
      type: 'tag',
      user: 'Lucas Petit',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face',
      action: 'vous a identifié dans une publication',
      time: '2 h',
      isRead: true,
      content: 'Super soirée entre amis !',
    },
    {
      id: 5,
      type: 'birthday',
      user: 'Emma Garcia',
      avatar: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=50&h=50&fit=crop&crop=face',
      action: 'fête son anniversaire aujourd\'hui',
      time: '3 h',
      isRead: true,
    },
  ]);

  const markAsRead =  (id: number) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
  };
 
const id = '1'; // Remplace par l'ID réel de l'utilisateur (ex: user?.id)
  
  useEffect(() => {
    const getNotify = async () => {
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
        .eq('id_expediteur', id)
        .eq('id_destinataire', id)
        .order('date_creation', { ascending: false });
  
      if (error) {
        console.error('Erreur Supabase :', error);
      } else {
        const formatted = (data || []).map((notif: any) => ({
          id: notif.id_notification,
          type: 'comment', // Tu peux adapter si tu as un champ type
          user: 'Utilisateur', // à remplacer si tu récupères le nom
          avatar: 'https://ui-avatars.com/api/?name=User',
          action: 'vous a envoyé une notification',
          time: new Date(notif.date_creation).toLocaleTimeString(),
          isRead: notif.lu,
          content: notif.message,
        }));
        console.log('Notifications Supabase :', JSON.stringify(formatted, null, 2));
        setNotifications(formatted);
      }
    };
  
    getNotify();
  }, [id]);
  
  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, isRead: true }))
    );
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
            <Text style={styles.markAllText}>Tout marquer comme lu</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Unread count */}
      {unreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <Text style={styles.unreadText}>
            {unreadCount} notification{unreadCount > 1 ? 's' : ''} non lue{unreadCount > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* Notifications List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {notifications.map((notification) => (
          <TouchableOpacity
            key={notification.id}
            style={[
              styles.notificationItem,
              !notification.isRead && styles.unreadNotification
            ]}
            onPress={() => markAsRead(notification.id)}
          >
            {!notification.isRead && <View style={styles.unreadDot} />}
            
            <Image
              source={{ uri: notification.avatar }}
              style={styles.avatar}
            />
            
            <View style={styles.notificationContent}>
              <View style={styles.textContainer}>
                <Text style={styles.notificationText}>
                  <Text style={styles.userName}>{notification.user}</Text>
                  {' ' + notification.action}
                </Text>
                
                {notification.content && (
                  <Text style={styles.contentText}>{notification.content}</Text>
                )}
                
                <Text style={styles.timeText}>{notification.time}</Text>
              </View>
              
              <View style={styles.iconContainer}>
                <Text style={styles.notificationIcon}>
                  {getNotificationIcon(notification.type)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Empty state when no notifications */}
      {notifications.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyText}>Aucune notification</Text>
          <Text style={styles.emptySubtext}>
            Vos notifications apparaîtront ici
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1c1e21',
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#1877f2',
    borderRadius: 6,
  },
  markAllText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  unreadBanner: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  unreadText: {
    color: '#1565c0',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    position: 'relative',
  },
  unreadNotification: {
    backgroundColor: '#f0f8ff',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1877f2',
    position: 'absolute',
    left: 8,
    top: 20,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
  },
  notificationText: {
    fontSize: 15,
    color: '#1c1e21',
    lineHeight: 20,
  },
  userName: {
    fontWeight: '600',
    color: '#1c1e21',
  },
  contentText: {
    fontSize: 14,
    color: '#65676b',
    fontStyle: 'italic',
    marginTop: 4,
    lineHeight: 18,
  },
  timeText: {
    fontSize: 13,
    color: '#65676b',
    marginTop: 6,
  },
  iconContainer: {
    marginLeft: 8,
    justifyContent: 'center',
  },
  notificationIcon: {
    fontSize: 24,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1c1e21',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#65676b',
    textAlign: 'center',
  },
});