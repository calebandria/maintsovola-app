import { ScrollView, View, ActivityIndicator, Text } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import ProfileHeader from '~/components/Dashboard/Profile/Header';
import ProfileTabs from '~/components/Dashboard/Profile/Tabs';
import { useAuth } from '~/contexts/AuthContext';
import { useProfile, useProjectsCount, useFollowersCount, useFollowingCount } from '~/hooks/userhooks';

export default function UserLayout() {
  const { id } = useLocalSearchParams<{id: string}>();
  const { user } = useAuth();
  const userId: string = user?.id ?? '';
  const isSameId = id === userId;
  const { profile, loading } = useProfile(id);
  const { projectsCount } = useProjectsCount(id);
  const { followersCount } = useFollowersCount(id);
  const { followingCount } = useFollowingCount(id);

  const handleFollowToggle = async () => {
    console.log('Toggle follow state');
  };

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#125b47" />
          <Text>Chargement du profil...</Text>
        </View>
      ) : profile ? (
        <ScrollView className="flex-1">
          <ProfileHeader
            profile={profile}
            isCurrentUser={isSameId}
            isFollowing={false}
            followersCount={followersCount}
            followingCount={followingCount}
            projectsCount={projectsCount}
            onFollowToggle={handleFollowToggle}
          />
          <ProfileTabs isCurrentUser={isSameId} id={id} />
        </ScrollView>
      ) : (
        <View className="flex-1 justify-center items-center">
          <Text>Profil introuvable.</Text>
        </View>
      )}
    </View>
  );
}