import { DarkTheme, DefaultTheme, ThemeProvider as NavigationProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from './ThemeContext'; // Siguraduhing tama ang path na ito

function RootLayoutContent() {
  const { isDarkMode } = useTheme();

  return (
    <NavigationProvider value={isDarkMode ? DarkTheme : DefaultTheme}>
      <Stack initialRouteName="splash">
        {/* Splash at Login Screens */}
        <Stack.Screen name="splash" options={{ headerShown: false }} />
        <Stack.Screen name="(login)" options={{ headerShown: false }} />

        {/* Dashboards - Siniguradong lahat ay naka-headerShown: false para malinis */}
        <Stack.Screen name="(home_dasborad)" options={{ headerShown: false }} />
        <Stack.Screen name="(reports_dashboard)" options={{ headerShown: false }} />
        <Stack.Screen name="(maps.dashboard)" options={{ headerShown: false }} />
        <Stack.Screen name="(ideas_dashboard)" options={{ headerShown: false }} />
        
        {/* ADMIN DASHBOARD FIX: Tinanggal ang header title/path */}
       <Stack.Screen name="(admin.dashboard)/admin.dashboard" options={{ headerShown: false }} />
       <Stack.Screen name="(admin.dashboard)/complaints.dashboard" options={{ headerShown: false }} />

        {/* Profile at Tabs */}
        <Stack.Screen name="profile" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Modals */}
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen name="edit-report" options={{ presentation: 'modal', title: 'Edit Report' }} />

        {/* Default fallback */}
        <Stack.Screen options={{ headerShown: false }} />
      </Stack>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
    </NavigationProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}