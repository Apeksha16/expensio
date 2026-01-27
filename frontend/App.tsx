
import React, { useState, useEffect } from 'react';
import { StatusBar, StyleSheet, View, Text, Platform, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { logout } from './src/services/auth';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ExpensesScreen from './src/screens/ExpensesScreen';
import AddExpenseScreen from './src/screens/AddExpenseScreen';
import SplitBillScreen from './src/screens/SplitBillScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AddTransactionScreen from './src/screens/AddTransactionScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import TotalExpenseScreen from './src/screens/TotalExpenseScreen';
import GroupDetailsScreen from './src/screens/GroupDetailsScreen';
import FriendDetailsScreen from './src/screens/FriendDetailsScreen';
import GoalsScreen from './src/screens/GoalsScreen';
import CreateGroupScreen from './src/screens/CreateGroupScreen';
import AddFriendScreen from './src/screens/AddFriendScreen';
import PWAInstallPrompt from './src/components/PWAInstallPrompt';

// Types
interface User {
  email: string;
  name?: string;
  photo?: string;
  id?: string;
}

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

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

// Custom Tab Bar Button for FAB
interface CustomTabBarButtonProps {
  children: React.ReactNode;
  onPress?: (e: any) => void;
}

const CustomTabBarButton = ({ children, onPress }: CustomTabBarButtonProps) => (
  <TouchableOpacity
    style={{
      top: -30, // Raise FAB significantly to float halfway
      justifyContent: 'center',
      alignItems: 'center',
      ...styles.shadow,
    }}
    onPress={onPress}
  >
    <View style={{
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: '#FF7043',
      borderWidth: 4,
      borderColor: '#fff', // White border to blend with tab bar
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {children}
    </View>
  </TouchableOpacity>
);

import QuickActionModal from './src/components/QuickActionModal';
import { useNavigation } from '@react-navigation/native';

const MainTabs = ({ onLogout }: { onLogout: () => void }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation<any>();

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            elevation: 10,
            backgroundColor: '#ffffff',
            height: 80,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            borderTopWidth: 0,
            paddingBottom: 10,
          },
        }}
      >
        <Tab.Screen
          name="Home"
          component={DashboardScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="home" size={28} color={focused ? '#FF7043' : '#9CA3AF'} />
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
                <Icon name="stats-chart" size={28} color={focused ? '#FF7043' : '#9CA3AF'} />
                {focused && <View style={styles.activeDot} />}
              </View>
            ),
          }}
        />

        {/* FAB Button - Opens Quick Action Modal */}
        <Tab.Screen
          name="Add"
          component={View} // Dummy component
          listeners={{
            tabPress: (e) => {
              e.preventDefault(); // Prevent navigation
              setModalVisible(true);
            },
          }}
          options={{
            tabBarIcon: ({ focused }) => (
              <Icon name="add" size={32} color="#fff" />
            ),
            tabBarButton: (props) => (
              <CustomTabBarButton {...props} onPress={() => setModalVisible(true)} />
            ),
            tabBarStyle: { display: 'none' }
          }}
        />

        <Tab.Screen
          name="Goals"
          component={GoalsScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="trophy-outline" size={26} color={focused ? '#FF7043' : '#9CA3AF'} />
                {focused && <View style={styles.activeDot} />}
              </View>
            ),
          }}
        />

        <Tab.Screen
          name="Split"
          component={SplitBillScreen} // This serves as the 'Friends' tab
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="people-outline" size={28} color={focused ? '#FF7043' : '#9CA3AF'} />
                {focused && <View style={styles.activeDot} />}
              </View>
            ),
          }}
        />


      </Tab.Navigator>

      <QuickActionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onNavigate={(screen) => navigation.navigate(screen)}
      />
    </>
  );
}

function App() {
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [user, setUser] = useState<User | null>(null);
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
          setHasOnboarded(true);
        }
      } catch (e) {
        console.error('Failed to load storage', e);
      } finally {
        setLoading(false);
      }
    };

    checkStorage();
  }, []);

  const handleLoginSuccess = async (userData: User) => {
    setUser(userData);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    await AsyncStorage.setItem('hasOnboarded', 'true');
  };

  const handleOnboardingComplete = async () => {
    setHasOnboarded(true);
    await AsyncStorage.setItem('hasOnboarded', 'true');
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    await AsyncStorage.removeItem('user');
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
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar barStyle="dark-content" />
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
                <Stack.Screen
                  name="AddExpense"
                  component={AddExpenseScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="Notifications"
                  component={NotificationsScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="TotalExpense"
                  component={TotalExpenseScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="GroupDetails"
                  component={GroupDetailsScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="FriendDetails"
                  component={FriendDetailsScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="CreateGroup"
                  component={CreateGroupScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="AddFriend"
                  component={AddFriendScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen name="Profile">
                  {(props) => <ProfileScreen {...props} onLogout={handleLogout} />}
                </Stack.Screen>
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
        {Platform.OS === 'web' && <PWAInstallPrompt />}
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

export default App;
