import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import api from '../../services/api';
import { useAuth } from '../../navigation/AppNavigator';

export default function LoginScreen() {
  const [collegeId, setCollegeId] = useState('GIET1234');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);
  
  const { signIn } = useAuth(); // from AppNavigator

  const handleLogin = async () => {
    if (!collegeId || !password) {
      Alert.alert('Error', 'Please enter both College ID and Password');
      return;
    }
    
    setLoading(true);
    try {
      // 1. Authenticate user
      const response = await api.post('/auth/login', {
        college_id_number: collegeId,
        password: password,
      });

      const { token, user } = response.data.data;
      
      // 2. Profile Complete Check
      // For Admins or Students who already completed it, immediately boot into the app
      // For simplicity, we check if they are a student to push them to ProfileSetupScreen. 
      // Ideally backend returns `is_profile_complete`. We assume setup is needed here to demonstrate the flow.
      if (user.role === 'student') {
        navigation.navigate('ProfileSetup', { token, user });
      } else {
        // Admin goes straight in
        signIn(token, user.role);
      }
      
    } catch (error) {
      Alert.alert(
        'Login Failed', 
        error.response?.data?.message || error.message || 'An unexpected error occurred'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Smart Fee Management</Text>
      
      <TextInput
        style={styles.input}
        placeholder="College ID Number (e.g., GIET2024001)"
        value={collegeId}
        onChangeText={setCollegeId}
        autoCapitalize="none"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      
      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#a0cbf5',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
