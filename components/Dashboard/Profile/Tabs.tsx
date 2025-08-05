import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import Investissement from '../Navigation/Investissement';
import Projets from '../Navigation/Projets';
import Paiement from '../Navigation/Paiement';
import Activity from '../Navigation/Activity';
import { MaterialIcons, FontAwesome, Feather } from '@expo/vector-icons';

const tabs = [
  {
    label: 'Poketra',
    icon: (color: string) => <MaterialIcons name="attach-money" size={20} color={color} />,
    component: Investissement,
  },
  {
    label: 'Projets',
    icon: (color: string) => <FontAwesome name="briefcase" size={20} color={color} />,
    component: Projets,
  },
  {
    label: 'Paiement',
    icon: (color: string) => <FontAwesome name="credit-card" size={20} color={color} />,
    component: Paiement,
  },
  {
    label: 'Activité',
    icon: (color: string) => <Feather name="activity" size={20} color={color} />,
    component: Activity,
  },
];

export default function ProfileTabs() {
  const [activeTab, setActiveTab] = useState(0);
  const ActiveComponent = tabs[activeTab].component;

  return (
    <View className="flex-1 bg-white">
      {/* Barre d'onglets fixe en haut */}
      <View className="flex-row justify-around bg-white border-b p-1 border-gray-200 shadow-sm">
        {tabs.map((tab, index) => {
          const isActive = index === activeTab;
          const color = isActive ? '#ffffff' : '#6b7280';
          return (
            <TouchableOpacity
              key={index}
              onPress={() => setActiveTab(index)}
              className={`flex-1 items-center p-3 rounded-lg ${isActive ? 'bg-green-500 text-white' : 'bg-white text-gray-500'}`}
            >
              {tab.icon(color)}
              <Text className={`text-xs mt-1 font-semibold ${isActive ? 'text-white' : 'text-gray-400'}`}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Contenu défilable */}
      <ScrollView contentContainerStyle={{ padding: 12 }} showsVerticalScrollIndicator={false}>
        <ActiveComponent />
      </ScrollView>
    </View>
  );
}
