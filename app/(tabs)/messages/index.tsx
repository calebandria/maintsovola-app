import { View } from 'react-native';
import ConversationMessage from '../../../components/chat/ConversationMessage';
import SearchSuggestionsPage from '~/components/chat/SearchSuggestion';

export default function MessagesScreen() {
  return (
    <View className="flex-1">
        <ConversationMessage />
    </View>
  );
}


