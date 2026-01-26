import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ExpensesScreen from './src/screens/ExpensesScreen';
import AddExpenseScreen from './src/screens/AddExpenseScreen';
import SplitBillScreen from './src/screens/SplitBillScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AddTransactionScreen from './src/screens/AddTransactionScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ... (keep CustomTabBarButton and MainTabs as is) ...

// Custom Tab Bar Button for FAB
const CustomTabBarButton = ({ children, onPress }: any) => (
  <TouchableOpacity
    style={{
      top: -20,
      justifyContent: 'center',
      alignItems: 'center',
      ...styles.shadow,
    }}
    onPress={onPress}
  >
    <View style={{
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: '#FF7043',
      // Orange gradient feel or solid
    }}>
      {children}
    </View>
  </TouchableOpacity>
);

const MainTabs = ({ onLogout }: { onLogout: () => void }) => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 25,
          left: 20,
          right: 20,
          elevation: 0,
          backgroundColor: '#ffffff',
          borderRadius: 15,
          height: 90,
          ...styles.shadow,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="home-outline" size={24} color={focused ? '#FF7043' : '#9CA3AF'} />
              {focused && <View style={styles.activeDot} />}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Expenses"
        component={ExpensesScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="card-outline" size={24} color={focused ? '#FF7043' : '#9CA3AF'} />
              {focused && <View style={styles.activeDot} />}
            </View>
          ),
        }}
      />

      {/* FAB Button - Opens Add Expense */}
      <Tab.Screen
        name="Add"
        component={AddExpenseScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Icon name="add" size={30} color="#fff" />
          ),
          tabBarButton: (props) => (
            <CustomTabBarButton {...props} />
          ),
          tabBarStyle: { display: 'none' } // Hide tab bar on Add Screen if preferred, or modal
        }}
      />

      <Tab.Screen
        name="Split"
        component={SplitBillScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="calendar-outline" size={24} color={focused ? '#FF7043' : '#9CA3AF'} />
              {focused && <View style={styles.activeDot} />}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        children={(props) => <ProfileScreen {...props} onLogout={onLogout} />}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="settings-outline" size={24} color={focused ? '#FF7043' : '#9CA3AF'} />
              {focused && <View style={styles.activeDot} />}
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function App() {
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Check storage on app load
  useEffect(() => {
    const checkStorage = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        const storedOnboarding = await AsyncStorage.getItem('hasOnboarded');

        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
        if (storedOnboarding) {
          setHasOnboarded(true); // Assuming 'true' string or existence logic
        }
      } catch (e) {
        console.error('Failed to load storage', e);
      } finally {
        setLoading(false);
      }
    };

    checkStorage();
  }, []);

  const handleLoginSuccess = async (userData: any) => {
    setUser(userData);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    await AsyncStorage.setItem('hasOnboarded', 'true');
  };

  const handleOnboardingComplete = async () => {
    setHasOnboarded(true);
    await AsyncStorage.setItem('hasOnboarded', 'true');
  };

  const handleLogout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('user');
    // Optional: Keep onboarding state
    // await AsyncStorage.removeItem('hasOnboarded'); 
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#FF7043" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>


          {/* Authentication Flow */}
          {!user ? (
            <>
              {/* Only show Onboarding if not done */}
              {!hasOnboarded && (
                <Stack.Screen name="Onboarding">
                  {(props) => <OnboardingScreen {...props} onComplete={handleOnboardingComplete} />}
                </Stack.Screen>
              )}
              <Stack.Screen name="Login">
                {(props) => <LoginScreen {...props} onLoginSuccess={handleLoginSuccess} />}
              </Stack.Screen>
            </>
          ) : (
            /* Main App Flow */
            <>
              <Stack.Screen name="Main">
                {() => <MainTabs onLogout={handleLogout} />}
              </Stack.Screen>
              <Stack.Screen
                name="AddTransaction"
                component={AddTransactionScreen}
                options={{ presentation: 'modal' }}
              />
            </>
          )}

        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#7F5DF0',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 5,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FF7043',
    marginTop: 4,
  }
});

export default App;
