// ~/services/notificationWebSocketService.ts

import { supabase } from '~/lib/data';

interface WebSocketNotificationData {
  senderId?: string;
  message: string;
  actionLink?: string;
}

export class NotificationWebSocketService {
  private ws: WebSocket | null = null;
  private userId: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;
  private isManuallyDisconnected = false;

  constructor(userId: string) {
    this.userId = userId;
  }

  // Fonction pour se connecter au WebSocket
  connect(wsUrl?: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        // URL par défaut (à remplacer par votre vraie URL)
        const url = wsUrl || `ws://votre-serveur-websocket.com/notifications/${this.userId}`;
        
        this.ws = new WebSocket(url);
        this.isManuallyDisconnected = false;

        this.ws.onopen = () => {
          console.log('✅ WebSocket connecté pour les notifications');
          this.reconnectAttempts = 0;
          resolve(true);
        };

        this.ws.onmessage = async (event) => {
          try {
            const notificationData: WebSocketNotificationData = JSON.parse(event.data);
            console.log('📨 Notification WebSocket reçue:', notificationData);
            
            await this.handleIncomingNotification(notificationData);
          } catch (error) {
            console.error('❌ Erreur lors du traitement de la notification WebSocket:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ Erreur WebSocket:', error);
          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log('🔌 WebSocket fermé', event.code, event.reason);
          this.ws = null;
          
          // Tentative de reconnexion automatique si ce n'est pas une déconnexion manuelle
          if (!this.isManuallyDisconnected && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnect();
          }
        };

      } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation WebSocket:', error);
        reject(error);
      }
    });
  }

  // Fonction pour traiter les notifications reçues
  private async handleIncomingNotification(notificationData: WebSocketNotificationData) {
    try {
      const { error } = await supabase
        .from('notification')
        .insert({
          id_expediteur: notificationData.senderId || null,
          id_destinataire: this.userId,
          message: notificationData.message,
          action: notificationData.actionLink || null,
          lu: false,
          statut: false,
          date_creation: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Erreur lors de la création de la notification:', error);
        throw error;
      } else {
        console.log('✅ Notification créée avec succès via WebSocket');
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'insertion en base:', error);
      throw error;
    }
  }

  // Fonction de reconnexion automatique
  private attemptReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectInterval * this.reconnectAttempts;
    
    console.log(`🔄 Tentative de reconnexion ${this.reconnectAttempts}/${this.maxReconnectAttempts} dans ${delay}ms`);
    
    setTimeout(() => {
      if (!this.isManuallyDisconnected) {
        this.connect().catch((error) => {
          console.error('❌ Échec de la reconnexion:', error);
        });
      }
    }, delay);
  }

  // Fonction pour envoyer un message (optionnel)
  sendMessage(data: any): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(data));
        console.log('📤 Message envoyé via WebSocket:', data);
        return true;
      } catch (error) {
        console.error('❌ Erreur lors de l\'envoi:', error);
        return false;
      }
    } else {
      console.error('❌ WebSocket non connecté');
      return false;
    }
  }

  // Fonction pour se déconnecter proprement
  disconnect() {
    this.isManuallyDisconnected = true;
    if (this.ws) {
      this.ws.close(1000, 'Déconnexion manuelle');
      this.ws = null;
      console.log('🔌 WebSocket déconnecté manuellement');
    }
  }

  // Getter pour l'état de connexion
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // Getter pour l'état de la connexion
  get connectionState(): string {
    if (!this.ws) return 'DISCONNECTED';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'CONNECTING';
      case WebSocket.OPEN:
        return 'CONNECTED';
      case WebSocket.CLOSING:
        return 'CLOSING';
      case WebSocket.CLOSED:
        return 'CLOSED';
      default:
        return 'UNKNOWN';
    }
  }

  // Fonction pour changer d'utilisateur
  changeUser(newUserId: string, wsUrl?: string) {
    this.disconnect();
    this.userId = newUserId;
    this.reconnectAttempts = 0;
    
    if (newUserId) {
      this.connect(wsUrl);
    }
  }
}

// Export d'une instance singleton (optionnel)
let notificationWebSocketInstance: NotificationWebSocketService | null = null;

export const getNotificationWebSocket = (userId: string): NotificationWebSocketService => {
  if (!notificationWebSocketInstance || notificationWebSocketInstance['userId'] !== userId) {
    if (notificationWebSocketInstance) {
      notificationWebSocketInstance.disconnect();
    }
    notificationWebSocketInstance = new NotificationWebSocketService(userId);
  }
  return notificationWebSocketInstance;
};

// Export pour nettoyer l'instance
export const cleanupNotificationWebSocket = () => {
  if (notificationWebSocketInstance) {
    notificationWebSocketInstance.disconnect();
    notificationWebSocketInstance = null;
  }
};