import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Calendar, Clock, AlertTriangle, CheckCircle } from 'lucide-react-native';
import { useWeeklyPlannings } from '~/hooks/useWeeklyPlanning';
import { WeeklyTask } from '@/types/technicien';

interface WeeklyPlanningTableProps {
  userId: string;
  userRole: string;
}

const WeeklyPlanningTable: React.FC<WeeklyPlanningTableProps> = ({ 
  userId,
  userRole
 }) => {
  const { tasks, loading, error, updateTaskStatus } = useWeeklyPlannings(userId, userRole);
  const [selectedTask, setSelectedTask] = useState<WeeklyTask | null>(null);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);

  if (loading) {
    return (
      <View className="flex-1 justify-center py-8">
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="items-center py-8">
        <Text className="text-red-500">Erreur: {error}</Text>
      </View>
    );
  }

  // Filter tasks
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const overdueTasks = tasks.filter(task => {
    const taskDate = new Date(task.date_prevue);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate < today && task.statut !== 'fait';
  });
  
  const currentWeekTasks = tasks.filter(task => {
    const taskDate = new Date(task.date_prevue);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate >= today || task.statut === 'fait';
  });

  const getStatusColor = (status: WeeklyTask['statut']) => {
    switch (status) {
      case 'fait': return 'bg-green-100 text-green-800';
      case 'en_cours': return 'bg-blue-100 text-blue-800';
      case 'retard': return 'bg-red-100 text-red-800';
      case 'bloque': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: WeeklyTask['priorite']) => {
    switch (priority) {
      case 'haute': return 'bg-red-100 text-red-800';
      case 'moyenne': return 'bg-orange-100 text-orange-800';
      case 'basse': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusChange = (taskId: number, newStatus: WeeklyTask['statut']) => {
    updateTaskStatus(taskId, newStatus);
  };

  const handleStartTask = (task: WeeklyTask) => {
    setSelectedTask(task);
    setIsReportDialogOpen(true);
  };

  const handleReportSubmitSuccess = () => {
    if (selectedTask) {
      updateTaskStatus(selectedTask.id_tache, 'fait');
    }
    setIsReportDialogOpen(false);
    setSelectedTask(null);
  };

  const handleCloseReportDialog = () => {
    setIsReportDialogOpen(false);
    setSelectedTask(null);
  };

  const renderTaskCard = (task: WeeklyTask) => (
    <View key={task.id_tache} className="bg-white rounded-xl p-4 mb-4 shadow-sm">
      <View className="flex-row justify-between items-start">
        <View className="flex-1 gap-2">
          <View className="flex-row items-center flex-wrap gap-2 mb-1">
            <Text
              className="font-semibold text-base flex-1"
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {task.description}
            </Text>
            <View className={`px-2 py-1 rounded-full ${getPriorityColor(task.priorite)}`}>
              <Text className="text-xs" numberOfLines={1} ellipsizeMode="tail">{task.priorite}</Text>
            </View>
            <View className={`px-2 py-1 rounded-full ${getStatusColor(task.statut)}`}>
              <Text className="text-xs" numberOfLines={1} ellipsizeMode="tail">{task.statut.replace('_', ' ')}</Text>
            </View>
          </View>

          <View className="flex-row items-center gap-4 mb-1">
            <View className="flex-row items-center gap-1">
              <Calendar size={14} color="#6b7280" />
              <Text className="text-sm text-gray-500" numberOfLines={1} ellipsizeMode="tail">
                {new Date(task.date_prevue).toLocaleDateString()}
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Clock size={14} color="#6b7280" />
              <Text className="text-sm text-gray-500" numberOfLines={1} ellipsizeMode="tail">{task.duree_estimee}min</Text>
            </View>
          </View>

          <Text className="text-sm text-gray-500" numberOfLines={1} ellipsizeMode="tail">
            Projet: {task.titre_projet}
          </Text>
        </View>

        <View className="flex-col gap-2 ml-2">
          {task.statut === 'a_faire' && (
            <>
              <TouchableOpacity
                className="border border-gray-300 px-4 py-2 rounded mb-2"
                onPress={() => handleStartTask(task)}
              >
                <Text className="font-semibold text-green-700">Démarrer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="border border-gray-300 px-3 py-2 rounded"
                onPress={() => handleStatusChange(task.id_tache, 'bloque')}
              >
                <AlertTriangle size={16} color="#f97316" />
              </TouchableOpacity>
            </>
          )}
          
          {task.statut === 'en_cours' && (
            <>
              <TouchableOpacity
                className="bg-green-600 px-4 py-2 rounded flex-row items-center gap-1 mb-2"
                onPress={() => handleStatusChange(task.id_tache, 'fait')}
              >
                <CheckCircle size={16} color="white" />
                <Text className="text-white font-semibold">Terminer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="border border-gray-300 px-3 py-2 rounded"
                onPress={() => handleStatusChange(task.id_tache, 'bloque')}
              >
                <AlertTriangle size={16} color="#f97316" />
              </TouchableOpacity>
            </>
          )}

          {task.statut === 'retard' && (
            <TouchableOpacity
              className="bg-green-600 px-4 py-2 rounded flex-row items-center gap-1"
              onPress={() => handleStartTask(task)}
            >
              <CheckCircle size={16} color="white" />
              <Text className="text-white font-semibold">Rattraper</Text>
            </TouchableOpacity>
          )}

          {task.statut === 'bloque' && (
            <TouchableOpacity
              className="border border-gray-300 px-4 py-2 rounded"
              onPress={() => handleStatusChange(task.id_tache, 'en_cours')}
            >
              <Text className="font-semibold text-green-700">Reprendre</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView className="p-4 bg-gray-50">
      {/* Overdue tasks section */}
      {overdueTasks.length > 0 && (
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <AlertTriangle size={20} color="#ef4444" />
              <Text className="text-lg font-semibold text-red-700">Tâches en retard</Text>
            </View>
            <View className="bg-red-100 px-2 py-1 rounded-full">
              <Text className="text-red-800 text-sm">{overdueTasks.length} tâche(s)</Text>
            </View>
          </View>

          <View className="bg-red-50 border border-red-200 rounded-lg p-3">
            {overdueTasks.map(renderTaskCard)}
          </View>
        </View>
      )}

      {/* Current week tasks section */}
      <View>
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-semibold">Planning de la semaine</Text>
          <View className="border border-gray-300 px-2 py-1 rounded-full">
            <Text className="text-sm">{currentWeekTasks.length} tâche(s)</Text>
          </View>
        </View>

        <View>
          {currentWeekTasks.map(renderTaskCard)}
        </View>

        {currentWeekTasks.length === 0 && overdueTasks.length === 0 && (
          <View className="items-center py-12">
            <Calendar size={48} color="#9ca3af" className="mb-4" />
            <Text className="text-gray-500">Aucune tâche planifiée cette semaine</Text>
          </View>
        )}

        {currentWeekTasks.length === 0 && overdueTasks.length > 0 && (
          <View className="items-center py-8">
            <Text className="text-gray-500">Aucune nouvelle tâche cette semaine</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default WeeklyPlanningTable;