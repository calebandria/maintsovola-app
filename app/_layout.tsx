// app/_layout.tsx
import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import "global.css"
import { NavbarProvider } from '~/contexts/NavContext';
import { LastPageProvider } from '~/contexts/LastPageContext';

export default function RootLayout() {
  return (
    <LastPageProvider>
      <AuthProvider>
        <NavbarProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </NavbarProvider>
      </AuthProvider>
    </LastPageProvider>
  );
}
