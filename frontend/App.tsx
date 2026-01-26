import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
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

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

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

const MainTabs = () => {
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
        component={ProfileScreen}
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

  // For demo, we might skip logic to show new screens
  // But let's keep the flow: Login -> (User) -> Dash

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
                  {(props) => <OnboardingScreen {...props} onComplete={() => setHasOnboarded(true)} />}
                </Stack.Screen>
              )}
              <Stack.Screen name="Login">
                {(props) => <LoginScreen {...props} onLoginSuccess={(userData) => setUser(userData)} />}
              </Stack.Screen>
            </>
          ) : (
            /* Main App Flow */
            <Stack.Screen name="Main" component={MainTabs} />
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
