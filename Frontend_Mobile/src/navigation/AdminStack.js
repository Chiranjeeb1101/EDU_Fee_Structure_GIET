import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import FeeStructuresScreen from '../screens/admin/FeeStructuresScreen'; // <-- Check import path

const Tab = createBottomTabNavigator();

export default function AdminStack() {
  return (
    <Tab.Navigator>
      <Tab.Screen 
        name="AdminDashboard" 
        component={AdminDashboardScreen}
        options={{ title: 'Overview', tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen 
        name="FeeStructures" 
        component={FeeStructuresScreen}
        options={{ title: 'Manage Fees', tabBarLabel: 'Fees' }}
      />
    </Tab.Navigator>
  );
}
