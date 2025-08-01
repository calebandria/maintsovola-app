
import { useState, useEffect } from 'react';
import { supabase } from '~/lib/data';
import { WeeklyTask } from '@/types/technicien';

export const useWeeklyPlannings = (userId: string, userRole: string) => {
  const [tasks, setTasks] = useState<WeeklyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeeklyTasks = async () => {
      try {
        setLoading(true);
        
        // Calculer la date de début pour récupérer les tâches (30 jours dans le passé minimum)
        const today = new Date();
        const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
        
        console.log('Fetching tasks for user:', userId, 'role:', userRole);
        console.log('Date range: from', thirtyDaysAgo.toISOString(), 'to future');

        // Modifier la requête pour récupérer toutes les tâches non terminées + tâches récentes
        let query = supabase
          .from('jalon_projet')
          .select(`
            id_jalon_projet,
            id_projet,
            date_previsionnelle,
            date_reelle,
            observations,
            jalon_agricole:id_jalon_agricole(nom_jalon),
            projet:id_projet(titre, id_technicien)
          `)
          .or(`date_reelle.is.null,date_reelle.gte.${today.toISOString().split('T')[0]}`)
          .gte('date_previsionnelle', thirtyDaysAgo.toISOString());

        if (userRole === 'technicien') {
          // Filtrer par projets assignés au technicien
          query = query.eq('projet.id_technicien', userId);
        }

        const { data, error } = await query.order('date_previsionnelle', { ascending: true });
        
        if (error) throw error;

        console.log('Raw data from database:', data);
        console.log('Number of records fetched:', data?.length || 0);

        const formattedTasks: WeeklyTask[] = data?.map(jalon => {
          const task = {
            id_tache: jalon.id_jalon_projet,
            id_projet: jalon.id_projet,
            titre_projet: jalon.projet?.titre || `Projet ${jalon.id_projet}`,
            description: jalon.jalon_agricole?.nom_jalon || 'Tâche',
            date_prevue: jalon.date_previsionnelle,
            priorite: determinePriorite(jalon.date_previsionnelle),
            statut: jalon.date_reelle ? 'fait' : determineStatut(jalon.date_previsionnelle) as WeeklyTask['statut'],
            type_intervention: jalon.jalon_agricole?.nom_jalon || 'Intervention',
            duree_estimee: 120, // 2 heures par défaut
          };
          console.log('Formatted task:', task);
          return task;
        }) || [];

        console.log('Formatted tasks:', formattedTasks);
        console.log('Tasks by status:', {
          fait: formattedTasks.filter(t => t.statut === 'fait').length,
          retard: formattedTasks.filter(t => t.statut === 'retard').length,
          a_faire: formattedTasks.filter(t => t.statut === 'a_faire').length
        });

        setTasks(formattedTasks);
      } catch (err) {
        console.error('Error fetching weekly tasks:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchWeeklyTasks();
    }
  }, [userId, userRole]);

  const updateTaskStatus = async (taskId: number, newStatus: WeeklyTask['statut']) => {
    try {
      console.log('Updating task status:', taskId, 'to', newStatus);
      
      // Mettre à jour le statut de la tâche
      if (newStatus === 'fait') {
        const { error } = await supabase
          .from('jalon_projet')
          .update({ date_reelle: new Date().toISOString().split('T')[0] })
          .eq('id_jalon_projet', taskId);
          
        if (error) throw error;
      } else {
        // Pour les autres statuts, on peut supprimer la date_reelle si elle existe
        const { error } = await supabase
          .from('jalon_projet')
          .update({ date_reelle: null })
          .eq('id_jalon_projet', taskId);
          
        if (error) throw error;
      }
      
      // Mettre à jour l'état local
      setTasks(prev => prev.map(task => 
        task.id_tache === taskId ? { ...task, statut: newStatus } : task
      ));
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  return { tasks, loading, error, updateTaskStatus };
};

// Fonctions utilitaires
const determinePriorite = (datePrevue: string): 'haute' | 'moyenne' | 'basse' => {
  const diff = new Date(datePrevue).getTime() - new Date().getTime();
  const jours = diff / (1000 * 60 * 60 * 24);
  
  if (jours < 1) return 'haute';
  if (jours < 3) return 'moyenne';
  return 'basse';
};

const determineStatut = (datePrevue: string): 'a_faire' | 'retard' => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const taskDate = new Date(datePrevue);
  taskDate.setHours(0, 0, 0, 0);
  
  return taskDate < today ? 'retard' : 'a_faire';
};
