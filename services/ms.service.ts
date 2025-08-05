// ms.service.ts
import { supabase } from '../lib/ms-supabase'; // Assurez-vous que le chemin est correct
import { User } from "@supabase/supabase-js";

interface Conversations {
    id_conversation: string;
    id_utilisateur1: string;
    id_utilisateur2: string;
    derniere_activite: string;
    created_at: Date;
}

interface Message {
    id_message: string;
    id_conversation: string;
    id_expediteur: string;
    id_destinateur: string;
    date_envoi: string;
    contenu: string;
    created_at: Date;
    created_by: Date;
    modified_at: Date;
    pieces_jointes: string[] | null; // Correction du typo "pirces_jointes"
    lu: boolean;
}

// Fonction pour récupérer les conversations
const getConversation = async (user: User | null): Promise<Conversations[]> => {
    if (!user) {
        console.warn("Utilisateur non connecté");
        return [];
    }

    try {
        const { data, error } = await supabase
            .from('conversation')
            .select('*')
            .or(`id_utilisateur1.eq.${user.id},id_utilisateur2.eq.${user.id}`) // Décommentez cette ligne !
            .order('derniere_activite', { ascending: false });

        if (error) {
            console.error('Erreur lors de la récupération des conversations:', error);
            throw error;
        }

        console.log("DATA MS.SERVICES", JSON.stringify(data));

        // Mapper les données
        const convData: Conversations[] = data?.map((conv) => ({
            id_conversation: conv.id_conversation,
            id_utilisateur1: conv.id_utilisateur1,
            id_utilisateur2: conv.id_utilisateur2,
            derniere_activite: conv.derniere_activite,
            created_at: conv.created_at
        })) || [];

        console.log("Conversations mappées:", JSON.stringify(convData));

        return convData;

    } catch (error) {
        console.error("Erreur inattendue:", error);
        return [];
    }
};

// Fonction pour récupérer les messages
const getMessages = async (conversationId: string): Promise<Message[]> => {
    try {
        const { data, error } = await supabase
            .from('message')
            .select('*')
            .eq('id_conversation', conversationId)
            .order('date_envoi', { ascending: true });

        if (error) {
            console.error('Erreur lors de la récupération des messages:', error);
            throw error;
        }

        return data || [];

    } catch (error) {
        console.error("Erreur inattendue lors de la récupération des messages:", error);
        return [];
    }
};

// Fonction pour envoyer un message
const sendMessage = async (
    selectedConversation: Conversations, 
    user: { id: string, email: string }, 
    newMessage: string
): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('message')
            .insert({
                id_conversation: selectedConversation.id_conversation,
                id_expediteur: user.id,
                id_destinateur: selectedConversation.id_utilisateur1 === user.id
                    ? selectedConversation.id_utilisateur2
                    : selectedConversation.id_utilisateur1,
                contenu: newMessage,
                date_envoi: new Date().toISOString(),
            });

        if (error) {
            console.error('Erreur lors de l\'envoi du message:', error);
            throw error;
        }

        // Mettre à jour la dernière activité de la conversation
        await supabase
            .from('conversation')
            .update({ derniere_activite: new Date().toISOString() })
            .eq('id_conversation', selectedConversation.id_conversation);

        return true;

    } catch (error) {
        console.error("Erreur inattendue lors de l'envoi du message:", error);
        return false;
    }
};

export { getConversation, getMessages, sendMessage, type Conversations, type Message };