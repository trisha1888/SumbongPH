import { DarkTheme, DefaultTheme, ThemeProvider as NavigationProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from './ThemeContext';

function RootLayoutContent() {
  const { isDarkMode } = useTheme();

  return (
    <NavigationProvider value={isDarkMode ? DarkTheme : DefaultTheme}>
      <Stack initialRouteName="index">
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(login)" options={{ headerShown: false }} />
        <Stack.Screen name="(home_dasborad)" options={{ headerShown: false }} />
        <Stack.Screen name="(reports_dashboard)" options={{ headerShown: false }} />
        <Stack.Screen name="(maps.dashboard)" options={{ headerShown: false }} />
        <Stack.Screen name="(ideas_dashboard)" options={{ headerShown: false }} />
        <Stack.Screen name="(category.dashboard)" options={{ headerShown: false }} />
        <Stack.Screen name="(admin.dashboard)" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen name="edit-report" options={{ presentation: 'modal', title: 'Edit Report' }} />
        <Stack.Screen name="new-suggestion" options={{ presentation: 'modal', title: 'New Suggestion' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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