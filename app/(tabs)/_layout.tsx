import { Slot, usePathname } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FacebookHeader from '../../components/navigation/Header';
import { getUsername } from '~/services/conversation-message-service';

export default function TabsLayout() {
  const pathname = usePathname();

  // Fonction pour déterminer le type d'header selon la route
  const getHeaderType = () => {
    // Page d'accueil (feed) -> header complet avec logo + navigation
    if (pathname === '/feed' || pathname === '/') return 'home';
    
    // Pages secondaires avec navigation -> titre + navigation en bas
    else if (pathname === '/terrain' || pathname === '/projet' || pathname === '/notifications' || pathname === '/messages') {
      return 'tabs';
    }
    
    // Page profil -> seulement flèche retour + nom (PAS de navigation)
    else if (pathname?.startsWith('/profil')) return 'profile';
    
    // Pages où on masque complètement le header
    else if (pathname?.includes('/post/') || pathname?.includes('/story/')) return 'hidden';

    else return 'hidden'; 
    
    return 'home';
  };

  // Fonction pour obtenir le titre selon la page
  const getHeaderTitle = () => {
    if (pathname === '/notifications') return 'Notifications';
    if (pathname === '/messages') return 'Messages';
    if (pathname === '/terrain') return 'Terrain';
    if (pathname === '/projet') return 'Projets';
    return undefined;
  };

  // Fonction pour obtenir le nom d'utilisateur (profil)
  const getUsername = () => {
    if (pathname?.startsWith('/profil')) {
      //const user = getUsername();
      const user = "Nom";
      return user;
    }
    return undefined;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }} edges={['top', 'bottom']}>
      <View style={{ flex: 1 }}>
        
        {/* Header Facebook-like */}
        <FacebookHeader 
          type={getHeaderType()}
          title={getHeaderTitle()}
          username={getUsername()}
        />

        {/* Contenu principal */}
        <Slot />

      </View>
    </SafeAreaView>
  );
}