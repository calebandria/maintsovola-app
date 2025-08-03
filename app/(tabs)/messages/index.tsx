import { View } from 'react-native';
import ConversationMessage from '../../../components/chat/ConversationMessage';

export default function MessagesScreen() {
  return (
    <View className="flex-1">
      <ConversationMessage />
    </View>
  );
}


