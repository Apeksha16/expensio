
/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState } from 'react';
import { StatusBar, StyleSheet, useColorScheme, View, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LoginScreen from './src/screens/LoginScreen';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [user, setUser] = useState<any>(null);

  const onLoginSuccess = (userData: any) => {
    console.log('Login Success:', userData);
    setUser(userData);
  };

  const onLogout = () => {
    setUser(null);
  };

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      {user ? (
        <View style={styles.container}>
          <Text style={styles.text}>Welcome {user.email || 'User'}</Text>
          <Text style={styles.text} onPress={onLogout}>Logout</Text>
        </View>
      ) : (
        <LoginScreen onLoginSuccess={onLoginSuccess} />
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 20,
    color: '#000',
    marginBottom: 20,
  }
});

export default App;
