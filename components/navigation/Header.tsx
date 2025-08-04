import type React from "react"
import { View, Text, Image, TouchableOpacity } from "react-native"
import { useRouter, usePathname } from "expo-router"
import { 
  LucideSearch, 
  LucideMessageCircleMore, 
  LucideMoreHorizontal,
  LucideArrowLeft,
  LucidePlus,
  LucideUsers,
  LucideShoppingBag,
  LucidePlay,
  LucideBell,
  LucideHome,
  LucideLocationEdit,
  LucideArchive
} from "lucide-react-native"
import { useEffect, useState } from "react";
import { getCountUnreadMessages, getCountUnreadNotification } from "~/services/conversation-message-service";
import { useAuth } from "~/contexts/AuthContext";

interface HeaderProps {
  type: 'home' | 'tabs' | 'profile' | 'hidden';
  title?: string;
  username?: string;
}

const Header: React.FC<HeaderProps> = ({ type, title, username }) => {
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);
  const [unreadNotificationCount, setUnreadNotificationsCount] = useState<number>(0);


  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const userId = user?.id ?? '';

  const [isSearchPageVisible, setSearchPageVisible] = useState(false);


  useEffect(() => {
    const fetchUnreadMessagesCount = async () => {
      try {
        const count = await getCountUnreadMessages(userId);
        setUnreadMessagesCount(count);
      } catch (error) {
        console.error("Error fetching unread messages count:", error);
      }
    };
    const fetchUnreadNotificationCount = async () => {
      try {
        const count = await getCountUnreadNotification(userId);
        setUnreadNotificationsCount(count);
      } catch (error) {
        console.error("Error fetching unread messages count:", error);
      }
    };

    fetchUnreadNotificationCount();
    fetchUnreadMessagesCount();
  }, [userId]);

  
  if (type === 'hidden') return null;

  // Fonction pour déterminer si un onglet est actif
  const isActiveTab = (tabPath: string) => {
    if (tabPath === '/feed') {
      return pathname === '/feed' || pathname === '/';
    }
    if (tabPath === '/terrain') {
      return pathname === '/terrain';
    }
    if (tabPath === '/messages') {
      return pathname === '/messages' || pathname.startsWith('/messages');
    }
    if (tabPath === '/projet') {
      return pathname === '/projet';
    }
    if (tabPath === '/notifications') {
      return pathname === '/notifications';
    }
    if (tabPath === '/profil') {
      return pathname === '/profil' || pathname.startsWith('/profil');
    }
    return false;
  };

  // Composant pour un icône de navigation
  const NavIcon = ({ 
    icon, 
    path, 
    badgeCount 
  }: { 
    icon: React.ReactNode, 
    path: string, 
    badgeCount?: number 
  }) => {
    const isActive = isActiveTab(path);
    
    return (
      <TouchableOpacity 
        className="flex-1 items-center py-2 relative"
        onPress={() => router.push(path as any)}
      >
        <View className="relative">
          {icon}
          {/* Badge notification */}
          {badgeCount && badgeCount > 0 && (
            <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-5 h-5 justify-center items-center">
              <Text className="text-white text-xs font-bold">
                {badgeCount > 99 ? '99+' : badgeCount.toString()}
              </Text>
            </View>
          )}
        </View>
        
        {/* Ligne verte en bas si actif */}
        {isActive && (
          <View className="absolute bottom-0 w-8 h-1 bg-green-500 rounded-t-full" />
        )}
      </TouchableOpacity>
    );
  };

  const renderHeader = () => {
    switch (type) {
      case 'home':
        return (
          <View className="bg-white border-b border-gray-200">
            {/* Ligne 1: Logo + icônes droite */}
            <View className="flex-row items-center justify-between px-4 py-3">
              {/* Logo Maintso Vola */}
              <View className="flex-row items-center">
                <Image
                  source={require("../../assets/maintsovola_logo_pm.png")}
                  style={{ width: 32, height: 32, borderRadius: 16 }}
                />
                <Text className="text-xl font-bold text-green-500 ml-2">Maintso</Text>
                <Text className="text-xl ml-1 font-bold text-gray-800">Vola</Text>
              </View>
              
              {/* Icônes droite */}
              <View className="flex-row items-center">
                <TouchableOpacity 
                  className="p-2 mr-2 bg-gray-100 rounded-full"
                  onPress={() => router.push('/terrain')}
                >
                  <LucidePlus size={20} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity 
                  className="p-2 mr-2 bg-gray-100 rounded-full"
                  onPress={() => router.push('/search')}
                >
                  <LucideSearch size={20} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity 
                  className="p-2 bg-gray-100 rounded-full"
                  onPress={() => router.push('/messages')}
                >
                  <LucideMessageCircleMore size={20} color="#000" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Ligne 2: Icônes de navigation */}
            <View className="flex-row items-center justify-around py-2 border-t border-gray-100">
              <NavIcon
                icon={<LucideHome size={24} color={isActiveTab('/feed') ? "#22C55E" : "#65676B"} />}
                path="/feed"
                badgeCount={15}
              />
              
              <NavIcon
                icon={<LucideLocationEdit size={24} color={isActiveTab('/terrain') ? "#22C55E" : "#65676B"} />}
                path="/terrain"
              />
              
              <NavIcon
                icon={<LucideMessageCircleMore size={24} color={isActiveTab('/messages') ? "#22C55E" : "#65676B"} />}
                path="/messages"
                badgeCount={unreadMessagesCount !==0 ? unreadMessagesCount : undefined}
              />
              
              <NavIcon
                icon={<LucideArchive size={24} color={isActiveTab('/projet') ? "#22C55E" : "#65676B"} />}
                path="/projet"
              />
              
              <NavIcon
                icon={<LucideBell size={24} color={isActiveTab('/notifications') ? "#22C55E" : "#65676B"} />}
                path="/notifications"
                badgeCount={unreadNotificationCount !==0 ? unreadNotificationCount : undefined}

              />
              
              <NavIcon
                icon={<LucideMoreHorizontal size={24} color={isActiveTab('/profil') ? "#22C55E" : "#65676B"} />}
                path="/profil"
              />
            </View>
          </View>
        );

      case 'tabs':
        return (
          <View className="bg-white border-b border-gray-200">
            {/* Ligne 1: Icônes de navigation (identique à home) */}
            <View className="flex-row items-center justify-around py-2 border-t border-gray-100">
              <NavIcon
                icon={<LucideHome size={24} color={isActiveTab('/feed') ? "#22C55E" : "#65676B"} />}
                path="/feed"
                badgeCount={15}
              />
              
              <NavIcon
                icon={<LucideLocationEdit size={24} color={isActiveTab('/terrain') ? "#22C55E" : "#65676B"} />}
                path="/terrain"
              />
              
              <NavIcon
                icon={<LucideMessageCircleMore size={24} color={isActiveTab('/messages') ? "#22C55E" : "#65676B"} />}
                path="/messages"
                badgeCount={unreadMessagesCount !==0 ? unreadMessagesCount : undefined}

              />
              
              <NavIcon
                icon={<LucideArchive size={24} color={isActiveTab('/projet') ? "#22C55E" : "#65676B"} />}
                path="/projet"
              />
              
              <NavIcon
                icon={<LucideBell size={24} color={isActiveTab('/notifications') ? "#22C55E" : "#65676B"} />}
                path="/notifications"
                badgeCount={unreadNotificationCount !==0 ? unreadNotificationCount : undefined}

              />
              
              <NavIcon
                icon={<LucideMoreHorizontal size={24} color={isActiveTab('/profil') ? "#22C55E" : "#65676B"} />}
                path="/profil"
              />
            </View>

            {/* Ligne 2: Titre + icônes droite */}
            <View className="flex-row items-center justify-between px-4 py-3">
              <View className="flex-row items-center flex-1">
                <TouchableOpacity
                  className="p-1 mr-3"
                  onPress={() => router.back()}
                >
                  <LucideArrowLeft size={24} color="#000" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-black">{title || 'Page'}</Text>
              </View>
              
              <View className="flex-row items-center">
                {/* <TouchableOpacity className="p-2 mr-2">
                  <View className="w-6 h-6 bg-gray-800 rounded-full items-center justify-center">
                    <Text className="text-white text-xs font-bold">✓</Text>
                  </View>
                </TouchableOpacity> */}
                <TouchableOpacity className="p-2" onPress={() => setSearchPageVisible(true)}>
                  <LucideSearch size={20} color="#000" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );

      case 'profile':
        return (
          <View className="bg-white border-b border-gray-200">
            <View className="flex-row items-center justify-between px-4 py-3">
              <View className="flex-row items-center flex-1">
                <TouchableOpacity
                  className="p-1 mr-3"
                  onPress={() => router.back()}
                >
                  <LucideArrowLeft size={24} color="#000" />
                </TouchableOpacity>
                
                <View className="flex-row items-center">
                  <Text className="text-xl font-bold text-black">{username || 'Profil'}</Text>
                  <View className="ml-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center">
                    <Text className="text-white text-xs font-bold">9+</Text>
                  </View>
                  <TouchableOpacity className="ml-2">
                    <Text className="text-lg">▼</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <TouchableOpacity className="p-2">
                <LucideSearch size={24} color="#000" />
              </TouchableOpacity>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return renderHeader();
};

export default Header;
