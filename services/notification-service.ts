import {supabase} from '../lib/data';

const getIdExpediteur = (id_destinataire: number) => {
    try {
        const id_exp =  supabase
            .from('notifications')
            .select('id_expediteur')
            .eq('id_destinataire', id_destinataire);
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'ID de l\'expéditeur:', error);
        return null;
    }
};     