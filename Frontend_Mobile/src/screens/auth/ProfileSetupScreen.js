import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import api from '../../services/api';
import { useAuth } from '../../navigation/AppNavigator';

export default function ProfileSetupScreen({ route }) {
  // We passed the token and user object from the LoginScreen
  const { token, user } = route.params;
  const { signIn } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [courseType, setCourseType] = useState('B.Tech');
  const [stream, setStream] = useState('CSE');
  const [year, setYear] = useState('1');
  const [accommodation, setAccommodation] = useState('day_scholar');
  const [academicYear, setAcademicYear] = useState('2025-26');

  const handleCompleteProfile = async () => {
    if (!courseType || !stream || !year || !accommodation || !academicYear) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    
    setLoading(true);
    try {
      // Must set local auth header temporarily since AppNavigator hasn't globally stored `userToken` yet
      await api.post('/auth/complete-profile', {
        course_type: courseType,
        stream,
        year: parseInt(year, 10),
        accommodation,
        academic_year: academicYear
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      Alert.alert('Success', 'Profile completed! Proceeding to Dashboard.');
      
      // Now finally log them into the main app
      signIn(token, user.role);

    } catch (error) {
      Alert.alert('Setup Failed', error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Complete Your Profile</Text>
      <Text style={styles.subtitle}>Welcome {user?.full_name}, we need a few details to assign your fee structure.</Text>
      
      <Text style={styles.label}>Course Type (e.g. B.Tech, MCA)</Text>
      <TextInput style={styles.input} value={courseType} onChangeText={setCourseType} />
      
      <Text style={styles.label}>Stream (e.g. CSE, ECE)</Text>
      <TextInput style={styles.input} value={stream} onChangeText={setStream} />
      
      <Text style={styles.label}>Year of Study (1-4)</Text>
      <TextInput style={styles.input} value={year} onChangeText={setYear} keyboardType="numeric" />
      
      <Text style={styles.label}>Accommodation (hosteler / day_scholar)</Text>
      <TextInput style={styles.input} value={accommodation} onChangeText={setAccommodation} autoCapitalize="none" />
      
      <Text style={styles.label}>Academic Year</Text>
      <TextInput style={styles.input} value={academicYear} onChangeText={setAcademicYear} />

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleCompleteProfile}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Profile</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f9f9f9', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 30 },
  label: { fontSize: 14, marginBottom: 5, color: '#555', fontWeight: '500' },
  input: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', marginBottom: 15 },
  button: { backgroundColor: '#007bff', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  buttonDisabled: { backgroundColor: '#80bdff' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
