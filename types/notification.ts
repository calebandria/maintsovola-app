
import { supabase } from '@/integrations/supabase/client';

export interface Notification {
  id_notification: number;
  id_expediteur?: string;
  id_destinataire: string;
  titre: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'alerte' | 'validation' | 'assignment';
  date_creation: string;
  lu: boolean;
  entity_type?: 'terrain' | 'projet' | 'jalon' | 'investissement' | 'commentaire' | string;
  entity_id?: number | null;
  projet_id?: number | null;
}

export async function sendNotification(
  supabaseClient: typeof supabase,
  senderId: string,
  recipients: { id_utilisateur: string }[],
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' | 'alerte' | 'validation' | 'assignment' = 'info',
  entityType?: 'terrain' | 'projet' | 'jalon' | 'investissement' | 'commentaire',
  entityId?: number | string | null,
  projetId?: number | string | null
) {
  try {
    const notifications = recipients.map(recipient => ({
      id_expediteur: senderId,
      id_destinataire: recipient.id_utilisateur,
      titre: title,
      message: message,
      type: type,
      lu: false,
      entity_type: entityType,
      entity_id: entityId ? Number(entityId) : null,
      projet_id: projetId ? Number(projetId) : null
    }));

    const { error } = await supabaseClient
      .from('notification')
      .insert(notifications);

    if (error) throw error;
    
    return { success: true, count: notifications.length };
  } catch (err) {
    console.error('Error sending notifications:', err);
    return { success: false, error: err };
  }
}
