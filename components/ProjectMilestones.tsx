import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';

import { supabase } from '~/lib/supabase';
import { JalonData } from '~/types/jalonData';
import { CultureData } from '~/types/cultureData';


const ProjectMilestones = ({ projectId }:{projectId: number}) => {
  const [jalons, setJalons] = useState<JalonData[]>([]);
  const [cultures, setCultures] = useState<CultureData[]>([]);
  const [rapportModal, setRapportModal] = useState({ open: false, content: '' });

  useEffect(() => {
    const fetchData = async () => {
      const { data: jalonData } = await supabase
        .from('jalon_projet')
        .select('*')
        .eq('projet_id', projectId)
        .order('ordre');

      const { data: cultureData } = await supabase.from('culture').select('*');

      if (jalonData) setJalons(jalonData);
      if (cultureData) setCultures(cultureData);
    };
    fetchData();
  }, [projectId]);

  const getCultureName = (cultureId : number) => {
    const culture = cultures.find(c => c.id_culture === cultureId);
    return culture ? culture.nom_culture : 'Culture inconnue';
  };

  const markAsDone = async (jalonId: number) => {
    const today = new Date().toISOString().split('T')[0];
    const { error } = await supabase
      .from('jalon_projet')
      .update({ date_realisation: today, statut: 'réalisé' })
      .eq('id', jalonId);

    if (!error) {
      setJalons(prev =>
        prev.map(j =>
          j.id === jalonId
            ? { ...j, date_realisation: today, statut: 'réalisé' }
            : j
        )
      );
    }
  };

  function addDayDate(dateStr: string, days: number): string {
  // 1. Crée un objet Date à partir de la chaîne
  //    (le format est directement lisible par le constructeur)
  const date = new Date(dateStr);

  // 2. Ajoute les jours
  date.setDate(date.getDate() + days);

  // 3. Reformate le résultat en gardant la même précision (micro-secondes)
  const pad = (n: number, d = 2) => n.toString().padStart(d, '0');

  const Y = date.getFullYear();
  const M = pad(date.getMonth() + 1);
  const D = pad(date.getDate());
  const h = pad(date.getHours());
  const m = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  const ms = date.getMilliseconds().toString().padStart(3, '0');
  const µs = '000'; // on tronque à la milliseconde, car JS ne donne pas les µs

  return `${Y}-${M}-${D} ${h}:${m}:${s}.${ms}${µs}`;
}

  return (
    <ScrollView className="p-4">
      <Text className="text-xl font-bold mb-4">📆 Jalons du projet</Text>

      {jalons.map(jalon => (
        <View key={jalon.id} className="mb-4 p-4 border rounded bg-white">
          <Text className="font-bold text-lg">{jalon.nom}</Text>
          <Text className="text-gray-600">🌿 Culture : {getCultureName(jalon.culture_id)}</Text>
          <Text>📅 Prévu : {jalon.date_prevue}</Text>
          <Text>✅ Réalisé : {addDayDate(jalon.date_debut, jalon.date_prevue) || 'Pas encore'}</Text>

          {addDayDate(jalon.date_debut, jalon.date_prevue) ? (
            <TouchableOpacity
              className="mt-2 p-2 bg-blue-500 rounded"
              onPress={() => setRapportModal({ open: true, content: jalon.todo || 'Aucun rapport saisi.' })}
            >
              <Text className="text-white text-center">📄 Consulter le rapport</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              className="mt-2 p-2 bg-green-500 rounded"
              onPress={() => markAsDone(jalon.id)}
            >
              <Text className="text-white text-center">✅ Marquer comme réalisé</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      {jalons.length === 0 && (
        <Text className="text-center text-gray-500">Aucun jalon trouvé pour ce projet.</Text>
      )}

      {/* Modal pour afficher rapport */}
      <Modal
        visible={rapportModal.open}
        transparent
        animationType="slide"
        onRequestClose={() => setRapportModal({ open: false, content: '' })}
      >
        <View className="flex-1 bg-black bg-opacity-50 justify-center items-center">
          <View className="bg-white p-6 rounded w-11/12 max-h-[80%]">
            <Text className="text-xl font-bold mb-4">📝 Rapport du jalon</Text>
            <ScrollView>
              <Text>{rapportModal.content}</Text>
            </ScrollView>
            <TouchableOpacity
              className="mt-4 p-2 bg-red-500 rounded"
              onPress={() => setRapportModal({ open: false, content: '' })}
            >
              <Text className="text-white text-center">Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default ProjectMilestones;

type Props = {
  projectId: number;
  isVisible: boolean;
  onClose: () => void;
};

export const ProjectMilestonesModal = ({ projectId, isVisible, onClose }: Props) => {
  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center bg-black/50 px-4">
        <View className="rounded-xl bg-white p-6 border border-zinc-500 max-h-[90%]">
          <ScrollView>
            <ProjectMilestones projectId={projectId} />
          </ScrollView>
          <TouchableOpacity
            onPress={onClose}
            className="mt-4 p-3 bg-yellow-500 rounded-lg items-center"
          >
            <Text className="font-semibold">Retour aux détails</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};