import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StudentDashboardScreen from '../screens/student/StudentDashboardScreen';
import PaymentScreen from '../screens/payment/PaymentScreen';
import ReceiptScreen from '../screens/student/ReceiptScreen';

const Stack = createNativeStackNavigator();

export default function StudentStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Dashboard" 
        component={StudentDashboardScreen}
        options={{ title: 'My Dashboard' }}
      />
      <Stack.Screen 
        name="Payment" 
        component={PaymentScreen}
        options={{ title: 'Pay Fees' }}
      />
      <Stack.Screen 
        name="Receipt" 
        component={ReceiptScreen}
        options={{ title: 'Payment Receipt' }}
      />
    </Stack.Navigator>
  );
}
