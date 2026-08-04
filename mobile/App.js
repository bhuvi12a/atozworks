// Production build - expo-dev-client not needed
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Home as HomeIcon, Calendar as CalendarIcon, UserCircle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import Screens
import HomeScreen from './screens/HomeScreen';
import ServiceDetailsScreen from './screens/ServiceDetailsScreen';
import NewBookingScreen from './screens/NewBookingScreen';
import BookingsScreen from './screens/BookingsScreen';
import PartnerRegisterScreen from './screens/PartnerRegisterScreen';
import AdminScreen from './screens/AdminScreen';
import LoginScreen from './screens/LoginScreen';
import ProfileScreen from './screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const SESSION_KEY = '@atoz_user_session';

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'HomeTab') {
            return <HomeIcon size={size} color={color} />;
          } else if (route.name === 'BookingsTab') {
            return <CalendarIcon size={size} color={color} />;
          } else if (route.name === 'ProfileTab') {
            return <UserCircle size={size} color={color} />;
          }
        },
        tabBarActiveTintColor: '#00a8e8',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeScreen} 
        options={{ title: 'Explore' }}
      />
      <Tab.Screen 
        name="BookingsTab" 
        component={BookingsScreen} 
        options={{ title: 'Bookings' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null); // null = loading

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const sessionStr = await AsyncStorage.getItem(SESSION_KEY);
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        if (session?.loggedIn && session?.phone) {
          setInitialRoute('MainTabs');
          return;
        }
      }
    } catch (e) {
      console.warn('Session check error:', e);
    }
    setInitialRoute('Login');
  };

  // Show splash loader while checking session
  if (!initialRoute) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#00a8e8" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        {/* Auth */}
        <Stack.Screen name="Login" component={LoginScreen} />

        {/* Main tabs */}
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        
        {/* Detailed stack views */}
        <Stack.Screen name="ServiceDetails" component={ServiceDetailsScreen} />
        <Stack.Screen name="NewBooking" component={NewBookingScreen} />
        <Stack.Screen name="PartnerRegister" component={PartnerRegisterScreen} />
        <Stack.Screen name="AdminPortal" component={AdminScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    height: 60,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingBottom: 8,
    paddingTop: 8,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 4,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
  }
});
