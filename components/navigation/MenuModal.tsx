import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { 
  LucideSettings, 
  LucideHelpCircle, 
  LucideShield, 
  LucideMoon,
  LucideLogOut,
  LucideChevronRight,
  LucideUser
} from 'lucide-react-native';

interface MenuModalProps {
  visible: boolean;
  onClose: () => void;
  userData?: { username: string; photo_profil: string };
}

export const MenuModal: React.FC<MenuModalProps> = ({ visible, onClose, userData }) => {
  const menuItems = [
    { icon: LucideUser, title: 'Mon Profil', subtitle: 'Voir et modifier vos informations' },
    { icon: LucideSettings, title: 'Paramètres', subtitle: 'Confidentialité, notifications, etc.' },
    { icon: LucideShield, title: 'Confidentialité', subtitle: 'Contrôlez qui peut voir quoi' },
    { icon: LucideHelpCircle, title: 'Aide et support', subtitle: 'Centre d\'aide et signaler un problème' },
    { icon: LucideMoon, title: 'Mode sombre', subtitle: 'Activer le thème sombre' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
          <Text className="text-xl font-bold">Menu</Text>
          <TouchableOpacity onPress={onClose}>
            <Text className="text-green-500 font-semibold">Fermer</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1">
          {/* Profil utilisateur */}
          <View className="p-4 border-b border-gray-100">
            <View className="flex-row items-center">
              <Image
                source={{ uri: userData?.photo_profil || 'https://via.placeholder.com/60' }}
                className="w-15 h-15 rounded-full"
              />
              <View className="ml-3 flex-1">
                <Text className="text-lg font-bold">{userData?.username || 'Utilisateur'}</Text>
                <Text className="text-gray-500">Voir votre profil</Text>
              </View>
              <LucideChevronRight size={20} color="#65676B" />
            </View>
          </View>

          {/* Menu items */}
          <View className="p-4">
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                className="flex-row items-center py-4"
                onPress={() => console.log(`Navigate to ${item.title}`)}
              >
                <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3">
                  <item.icon size={20} color="#65676B" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold">{item.title}</Text>
                  <Text className="text-sm text-gray-500">{item.subtitle}</Text>
                </View>
                <LucideChevronRight size={16} color="#65676B" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Section MaintsoVola */}
          <View className="p-4 border-t border-gray-100">
            <Text className="text-sm font-bold text-gray-500 mb-3">MAINTSO VOLA</Text>
            <TouchableOpacity className="flex-row items-center py-3">
              <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-3">
                <Text className="text-green-600 font-bold text-lg">M</Text>
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold">À propos de MaintsoVola</Text>
                <Text className="text-sm text-gray-500">Conditions d'utilisation et politique</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Déconnexion */}
          <View className="p-4 border-t border-gray-100">
            <TouchableOpacity 
              className="flex-row items-center py-3"
              onPress={() => console.log('Logout')}
            >
              <View className="w-10 h-10 bg-red-100 rounded-full items-center justify-center mr-3">
                <LucideLogOut size={20} color="#EF4444" />
              </View>
              <Text className="text-red-500 text-base font-semibold">Se déconnecter</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};