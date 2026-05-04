import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

// Écrans principaux
import HomeScreen from '../screens/main/HomeScreen';
import ParkingScreen from '../screens/main/ParkingScreen';
import NavigationScreen from '../screens/main/NavigationScreen';
import AlertsScreen from '../screens/main/AlertsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import ImpactScreen from '../screens/main/ImpactScreen';

// Écrans détails
import ParkingDetailScreen from '../screens/parking/ParkingDetailScreen';
import ReservationScreen from '../screens/parking/ReservationScreen';
import PaymentScreen from '../screens/parking/PaymentScreen';
import RouteDetailScreen from '../screens/navigation/RouteDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Stack Navigator pour Parking
const ParkingStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ParkingList" component={ParkingScreen} />
    <Stack.Screen name="ParkingDetail" component={ParkingDetailScreen} />
    <Stack.Screen name="Reservation" component={ReservationScreen} />
    <Stack.Screen name="Payment" component={PaymentScreen} />
  </Stack.Navigator>
);

// Stack Navigator pour Navigation
const NavigationStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="NavigationMain" component={NavigationScreen} />
    <Stack.Screen name="RouteDetail" component={RouteDetailScreen} />
  </Stack.Navigator>
);

// Stack Navigator pour Profil
const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProfileMain" component={ProfileScreen} />
  </Stack.Navigator>
);

const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Parking':
              iconName = focused ? 'car' : 'car-outline';
              break;
            case 'Navigation':
              iconName = focused ? 'navigate' : 'navigate-outline';
              break;
            case 'Impact':
              iconName = focused ? 'analytics' : 'analytics-outline';
              break;
            case 'Alerts':
              iconName = focused ? 'notifications' : 'notifications-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'ellipse';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.grayLight,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ tabBarLabel: 'Accueil' }}
      />
      <Tab.Screen 
        name="Parking" 
        component={ParkingStack}
        options={{ tabBarLabel: 'Parking' }}
      />
      <Tab.Screen 
        name="Navigation" 
        component={NavigationStack}
        options={{ tabBarLabel: 'Itinéraire' }}
      />
      <Tab.Screen 
        name="Impact" 
        component={ImpactScreen}
        options={{ tabBarLabel: 'Impact' }}
      />
      <Tab.Screen 
        name="Alerts" 
        component={AlertsScreen}
        options={{ tabBarLabel: 'Alertes' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStack}
        options={{ tabBarLabel: 'Profil' }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
