import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Button } from './button';
import { supabase } from '../../integrations/supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../ui/terrain/use-toast';
import { createConversationIfNotExists } from './messagerie';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/terrain/dialog';

interface MessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  technicien: {
    id: string;
    name: string;
  };
  subject?: string;
}

const MessageDialog: React.FC<MessageDialogProps> = ({
  isOpen,
  onClose,
  technicien,
  subject = '',
}) => {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (subject) {
      setMessage(`Concernant ${subject}:\n\n`);
    } else {
      setMessage('');
    }
  }, [subject, isOpen]);

  const handleSubmit = async () => {
    if (!user || !message.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un message');
      return;
    }

    try {
      setIsSubmitting(true);

      // Create or get a conversation
      const conversationId = await createConversationIfNotExists(user.id, technicien.id);

      if (!conversationId) {
        throw new Error('Impossible de créer une conversation');
      }

      // Send the message
      const { error } = await supabase.from('message').insert({
        id_conversation: conversationId,
        id_expediteur: user.id,
        id_destinataire: technicien.id,
        contenu: message.trim(),
        date_envoi: new Date().toISOString(),
      });

      if (error) throw error;

      // Update conversation activity
      await supabase
        .from('conversation')
        .update({ derniere_activite: new Date().toISOString() })
        .eq('id_conversation', conversationId);

      toast({
        title: 'Message envoyé',
        description: `Votre message a été envoyé à ${technicien.name}`,
      });

      setMessage('');
      onClose();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Erreur',
        description: "Impossible d'envoyer le message",
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog visible={isOpen} onDismiss={onClose}>
      <DialogContent style={styles.dialogContent}>
        <DialogHeader>
          <DialogTitle>Message à {technicien.name}</DialogTitle>
        </DialogHeader>

        <ScrollView contentContainerStyle={styles.formContainer}>
          <TextInput
            style={styles.textArea}
            placeholder="Écrivez votre message ici..."
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </ScrollView>
        <DialogFooter style={styles.footer}>
          <Button
            variant="outline"
            onPress={onClose}
            disabled={isSubmitting}
            title="Annuler"
            style={styles.cancelButton}
          />

          <Button
            onPress={handleSubmit}
            disabled={isSubmitting || !message.trim()}
            title={isSubmitting ? 'Envoi...' : 'Envoyer'}
            style={styles.sendButton}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const styles = StyleSheet.create({
  dialogContent: {
    width: Platform.OS === 'web' ? 400 : '100%',
    maxHeight: Platform.OS === 'web' ? 500 : '80%',
    borderColor: '#6b7280',
    backgroundColor: '#f9fafb',
    borderRadius: 20,
  },
  formContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 10,
    minHeight: 120,
    fontSize: 16,
    marginBottom: 10,
    flex: 1,
    textAlignVertical: 'top',
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    paddingTop: 40,
  },
  cancelButton: {
    flex: 1,
  },
  sendButton: {
    flex: 1,
    backgroundColor: '#16A34A',
  },
});

export default MessageDialog;
