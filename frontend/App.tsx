import 'react-native-url-polyfill/auto';
import React from 'react';
import { StatusBar, StyleSheet, View, Text, Platform, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from './src/context/ThemeContext';
import { UserProvider, useUser } from './src/context/UserContext';
import { ToastProvider } from './src/components/Toast';
import { TransactionProvider } from './src/context/TransactionContext';
import { SubscriptionProvider } from './src/context/SubscriptionContext';

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
import MPINScreen from './src/screens/MPINScreen';
import AddSubscriptionScreen from './src/screens/AddSubscriptionScreen';
import BudgetSettingsScreen from './src/screens/BudgetSettingsScreen';
import BudgetFormScreen from './src/screens/BudgetFormScreen';
import AddGoalScreen from './src/screens/AddGoalScreen';
import SetSalaryScreen from './src/screens/SetSalaryScreen';
import PWAInstallPrompt from './src/components/PWAInstallPrompt';

import QuickActionModal from './src/components/QuickActionModal';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';

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

const linking = {
  prefixes: ['expensio://', 'https://expensio.app'],
  config: {
    screens: {
      Login: 'login',
      Onboarding: 'onboarding',
      Main: {
        screens: {
          Home: 'home',
          Expenses: 'expenses',
          Goals: 'goals',
          Split: 'friends',
        },
      },
      Profile: 'profile',
      AddTransaction: 'add-transaction',
      AddExpense: 'add-expense',
      Notifications: 'notifications',
      TotalExpense: 'total-expense',
      GroupDetails: 'group/:id',
      FriendDetails: 'friend/:id',
      CreateGroup: 'create-group',
      AddFriend: 'add-friend',
      MPIN: 'mpin',
      SetSalary: 'set-salary',
    },
  },
};

const AppContent = () => {
  const { user, loading, hasOnboarded, completeOnboarding, login, logout } = useUser();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#FF7043" />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking as any}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            {!hasOnboarded && (
              <Stack.Screen name="Onboarding">
                {(props) => <OnboardingScreen {...props} onComplete={completeOnboarding} />}
              </Stack.Screen>
            )}
            <Stack.Screen name="Login">
              {(props) => <LoginScreen {...props} onLoginSuccess={login} />}
            </Stack.Screen>
          </>
        ) : (
          <>
            <Stack.Screen name="Main">
              {() => <MainTabs onLogout={logout} />}
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
            <Stack.Screen name="AddSubscription" component={AddSubscriptionScreen} />
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen name="BudgetSettings" component={BudgetSettingsScreen} />
            <Stack.Screen
              name="BudgetForm"
              component={BudgetFormScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen name="AddGoal" component={AddGoalScreen} />
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
            <Stack.Screen
              name="MPIN"
              component={MPINScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen name="Profile">
              {(props) => <ProfileScreen {...props} onLogout={logout} />}
            </Stack.Screen>
            <Stack.Screen
              name="SetSalary"
              component={SetSalaryScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const AppWithTheme = () => {
  const { user } = useUser();
  return (
    <ThemeProvider userEmail={user?.email}>
      <StatusBar barStyle={user ? undefined : "dark-content"} />
      {Platform.OS === 'web' && <PWAInstallPrompt />}
      <AppContent />
    </ThemeProvider>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <UserProvider>
          <ToastProvider>
            <TransactionProvider>
              <SubscriptionProvider>
                <AppWithTheme />
              </SubscriptionProvider>
            </TransactionProvider>
          </ToastProvider>
        </UserProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

export default App;
