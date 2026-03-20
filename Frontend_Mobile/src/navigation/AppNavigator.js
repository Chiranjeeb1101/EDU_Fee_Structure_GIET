import React, { useEffect, useState, createContext, useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { ActivityIndicator, View } from 'react-native';

import AuthStack from './AuthStack';
import AdminStack from './AdminStack';
import StudentStack from './StudentStack';
import api from '../services/api';

// Create a simple Auth Context
const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export default function AppNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'admin' or 'student'

  useEffect(() => {
    // Check if user is logged in
    bootstrapAsync();
  }, []);

  const bootstrapAsync = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (token) {
        setUserToken(token);
        
        // Fetch profile to verify token and get role
        const res = await api.get('/auth/profile');
        setUserRole(res.data.data.user.role);
      }
    } catch (e) {
      console.log('Restoring token failed:', e);
      // Remove invalid token
      await SecureStore.deleteItemAsync('userToken');
      setUserToken(null);
      setUserRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  const authContextValue = {
    signIn: async (token, role) => {
      await SecureStore.setItemAsync('userToken', token);
      setUserToken(token);
      setUserRole(role);
    },
    signOut: async () => {
      await SecureStore.deleteItemAsync('userToken');
      setUserToken(null);
      setUserRole(null);
    },
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      <NavigationContainer>
        {userToken == null ? (
          <AuthStack />
        ) : userRole === 'admin' ? (
          <AdminStack />
        ) : (
          <StudentStack />
        )}
      </NavigationContainer>
    </AuthContext.Provider>
  );
}
