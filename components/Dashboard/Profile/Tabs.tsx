import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import Investissement from '../Navigation/Investissement';
import Projets from '../Navigation/Projets';
import Paiement from '../Navigation/Paiement';
import Activity from '../Navigation/Activity';
import { MaterialIcons, FontAwesome, Feather } from '@expo/vector-icons';
import { useFetchUserRoleByID } from '~/hooks/useFetchUserRoleByID';
import ParcellesTechnicien  from "../Navigation/technicien/ParcellesTechnicien";
import EffectuesTechnicien from "../Navigation/technicien/EffectuesTechnicien";
import RessourcesTechnicien from "../Navigation/technicien/RessourcesTechnicien";
import PaiementsTechnicien from '../Navigation/technicien/PaiementsTechnicien';
import PlanningTechnicien from '../Navigation/technicien/PlanningTechnicien'

export default function ProfileTabs({
  isCurrentUser,
  id
}: {
  isCurrentUser: boolean,
  id: string
}) {
  let tabs = [
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


let tabsTechnicien = [
  {
    label: 'Parcelles',
    icon: (color: string) => <FontAwesome name="map" size={20} color={color} />,
    component: (props: any) => <ParcellesTechnicien userRole={userRole} userId={id} {...props} />,
  },
  {
    label: 'Planning',
    icon: (color: string) => <MaterialIcons name="calendar-today" size={20} color={color} />,
    component: (props: any) => <PlanningTechnicien userRole={userRole} userId={id} {...props} />,
<<<<<<< HEAD
  },
  {
    label: 'Effectués',
    icon: (color: string) => <Feather name="check-circle" size={20} color={color} />,
    component: (props: any) => <EffectuesTechnicien userRole={userRole} userId={id} {...props} />,
  },
  {
    label: 'Ressources',
    icon: (color: string) => <MaterialIcons name="inventory" size={20} color={color} />,
    component: (props: any) => <RessourcesTechnicien userRole={userRole} userId={id} {...props} />,
  },
  {
    label: 'Paiements',
    icon: (color: string) => <FontAwesome name="credit-card" size={20} color={color} />,
    component: (props: any) => <PaiementsTechnicien userRole={userRole} userId={id} {...props} />,
  },
=======
  },
  {
    label: 'Effectués',
    icon: (color: string) => <Feather name="check-circle" size={20} color={color} />,
    component: (props: any) => <EffectuesTechnicien userRole={userRole} userId={id} {...props} />,
  },
  {
    label: 'Ressources',
    icon: (color: string) => <MaterialIcons name="inventory" size={20} color={color} />,
    component: (props: any) => <RessourcesTechnicien userRole={userRole} userId={id} {...props} />,
  },
  {
    label: 'Paiements',
    icon: (color: string) => <FontAwesome name="credit-card" size={20} color={color} />,
    component: (props: any) => <PaiementsTechnicien userRole={userRole} userId={id} {...props} />,
  },

];
>>>>>>> d2b19ec (fix:parcels)

];


  const [activeTab, setActiveTab] = useState(0);
  const { userRole, error } = useFetchUserRoleByID(id);

  // Ajoute d'un rendu pour l'erreur
  if (error) {
    return <>
    <View className="flex-1 items-center justify-center">
      <Text className="text-red-500 font-semibold text-center">
        Une erreur est survenue : {error.message || 'Erreur inconnue'}
      </Text>
    </View>
    </>
  }

  if (!isCurrentUser) {
    tabs = [tabs[0], tabs[1]]
  }

  // console.log("userRole : ", userRole);
  const tabProfile = userRole === "technicien" ? tabsTechnicien : tabs;
  const ActiveComponent = tabProfile[activeTab].component;
  
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
