import { WebView } from 'react-native-webview';

const CallScreen = () => {
  return (
    <WebView
      source={{ uri: 'https://your-subrealm.daily.co/room-name' }}
      style={{ flex: 1 }}
    />
  );
};
