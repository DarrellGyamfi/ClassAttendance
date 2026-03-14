/**
 * ClassAttendanceApp
 */

import { NavigationContainer } from '@react-navigation/native';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './AuthContext';
import AuthStack from './AuthStack';
import MainStack from './MainStack';
import NetworkStatus from './NetworkStatus';

// Note: Firebase is initialized via @react-native-firebase/app
// No manual initialization needed with the native modules

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        {/* Loading screen placeholder */}
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <NetworkStatus />
      <NavigationContainer>
        {user ? <MainStack /> : <AuthStack />}
      </NavigationContainer>
    </View>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContainer: {
    flex: 1,
  },
});

export default App;
