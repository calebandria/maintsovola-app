import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Calendar, Clock, CheckCircle, Eye } from 'lucide-react-native';
import { useWeeklyPlannings } from '~/hooks/useWeeklyPlanning';
import { WeeklyTask } from '@/types/technicien';
// import JalonReportDialog from '@/components/JalonReportDialog';

interface CompletedTasksListProps {
  userId: string;
  userRole: string;
}

const CompletedTasksList: React.FC<CompletedTasksListProps> = ({ 
  userId,
  userRole 
 }) => {
  const { tasks, loading, error } = useWeeklyPlannings(userId, userRole);
  const [selectedTask, setSelectedTask] = useState<WeeklyTask | null>(null);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);

  if (loading) {
    return (
      <View className="flex justify-center py-8">
        <ActivityIndicator size="small" color="#0000ff" />
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

  // Filter only completed tasks
  const completedTasks = tasks.filter(task => task.statut === 'fait');

  // Sort by completion date (most recent first)
  const sortedCompletedTasks = completedTasks.sort((a, b) => {
    const dateA = new Date(a.date_prevue);
    const dateB = new Date(b.date_prevue);
    return dateB.getTime() - dateA.getTime();
  });

  const getPriorityColor = (priority: WeeklyTask['priorite']) => {
    switch (priority) {
      case 'haute': return 'bg-red-100 text-red-800';
      case 'moyenne': return 'bg-orange-100 text-orange-800';
      case 'basse': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewReport = (task: WeeklyTask) => {
    setSelectedTask(task);
    setIsReportDialogOpen(true);
  };

  const handleCloseReportDialog = () => {
    setIsReportDialogOpen(false);
    setSelectedTask(null);
  };

  const renderCompletedTaskCard = (task: WeeklyTask) => (
    <View key={task.id_tache} className="bg-white rounded-lg p-4 mb-3 shadow-sm">
      <View className="flex-row justify-between">
        <View className="flex-1 gap-2">
          <View className="flex-row items-center flex-wrap gap-2">
            <CheckCircle size={16} color="#16a34a" />
            <Text className="font-medium text-base">{task.description}</Text>
            <View className={`px-2 py-1 rounded-full ${getPriorityColor(task.priorite)}`}>
              <Text className="text-xs">{task.priorite}</Text>
            </View>
            <View className="bg-green-100 px-2 py-1 rounded-full">
              <Text className="text-green-800 text-xs">Effectué</Text>
            </View>
          </View>

          <View className="flex-row items-center gap-4">
            <View className="flex-row items-center gap-1">
              <Calendar size={14} color="#6b7280" />
              <Text className="text-sm text-gray-500">
                Prévu: {new Date(task.date_prevue).toLocaleDateString()}
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Clock size={14} color="#6b7280" />
              <Text className="text-sm text-gray-500">{task.duree_estimee}min</Text>
            </View>
          </View>

          <Text className="text-sm text-gray-500">Projet: {task.titre_projet}</Text>
        </View>

        <View className="flex gap-2">
          <TouchableOpacity
            className="flex-row items-center gap-1 px-3 py-1 bg-blue-50 rounded-md"
            onPress={() => handleViewReport(task)}
          >
            <Eye size={14} color="#2563eb" />
            <Text className="text-blue-600 text-sm">Voir rapport</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View className="p-4">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-lg font-semibold">Tâches effectuées</Text>
        <View className="border border-gray-300 px-2 py-1 rounded-full">
          <Text className="text-sm">{completedTasks.length} tâche(s) terminée(s)</Text>
        </View>
      </View>

      {completedTasks.length === 0 ? (
        <View className="items-center py-12">
          <CheckCircle size={48} color="#9ca3af" className="mb-4" />
          <Text className="text-gray-500">Aucune tâche effectuée pour le moment</Text>
        </View>
      ) : (
        <ScrollView>
          <View className="gap-3">
            {sortedCompletedTasks.map(renderCompletedTaskCard)}
          </View>
        </ScrollView>
      )}

      {/* {selectedTask && (
        <JalonReportDialog
          isOpen={isReportDialogOpen}
          onClose={handleCloseReportDialog}
          projectId={selectedTask.id_projet}
          jalonId={selectedTask.id_tache}
          jalonName={selectedTask.description}
          datePrevue={selectedTask.date_prevue}
          readOnly={true}
        />
      )} */}
    </View>
  );
};

export default CompletedTasksList;