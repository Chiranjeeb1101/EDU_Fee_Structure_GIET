import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, KeyboardAvoidingView, ScrollView, Platform, Alert, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import { GlowingBackground } from '../../components/layout/GlowingBackground';
import { colors } from '../../theme/colors';
import resetService from '../../services/resetService';

export const ResetPasswordCompletionScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ResetPasswordCompletion'>>();
  const [requestId, setRequestId] = useState(route.params?.requestId || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFinalize = async () => {
    if (!requestId.trim() || !newPassword.trim()) {
      Alert.alert('Error', 'Please fill all fields.');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await resetService.finalizeReset(requestId.trim(), newPassword);
      Alert.alert('Success', 'Password reset successfully! You can now login.', [
        { text: 'Login Now', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to reset password. Ensure your request was approved.';
      Alert.alert('Reset Failed', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GlowingBackground showParticles={false}>
      <SafeAreaView style={styles.safeArea}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Set New Password</Text>
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            
            <View style={styles.cardContainer}>
              <View style={styles.glassCard}>
                
                <View style={styles.iconContainer}>
                  <View style={styles.iconGlow} />
                  <View style={styles.iconCircle}>
                    <MaterialIcons name="security" size={48} color={colors.primary} />
                  </View>
                </View>

                <Text style={styles.title}>Complete Reset</Text>
                <Text style={styles.subtitle}>
                  Enter the Request ID provided or used during your request, and set your new secure password.
                </Text>

                <View style={styles.formContainer}>
                   <Text style={styles.inputLabel}>REQUEST ID (OR COLLEGE ID)</Text>
                   <View style={styles.inputWrapper}>
                    <MaterialIcons name="tag" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                    <TextInput 
                      style={styles.input}
                      placeholder="Enter ID"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      value={requestId}
                      onChangeText={setRequestId}
                    />
                  </View>

                  <Text style={styles.inputLabel}>NEW PASSWORD</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialIcons name="lock" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                    <TextInput 
                      style={styles.input}
                      placeholder="New Password"
                      secureTextEntry
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      value={newPassword}
                      onChangeText={setNewPassword}
                    />
                  </View>

                  <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialIcons name="lock-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                    <TextInput 
                      style={styles.input}
                      placeholder="Confirm Password"
                      secureTextEntry
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                    />
                  </View>

                  <TouchableOpacity 
                    style={[styles.submitButton, isLoading && { opacity: 0.7 }]} 
                    onPress={handleFinalize}
                    disabled={isLoading}
                  >
                    {isLoading ? <ActivityIndicator color="#00266e" /> : <Text style={styles.submitText}>Save Password</Text>}
                  </TouchableOpacity>
                </View>

              </View>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GlowingBackground>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, height: 64, marginTop: Platform.OS === 'android' ? 40 : 10 },
  backButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(30,37,59,0.5)' },
  headerTitle: { marginLeft: 16, fontSize: 18, fontWeight: '700', color: colors.primary },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  cardContainer: { width: '100%', alignItems: 'center' },
  glassCard: { width: '100%', maxWidth: 400, backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 24, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  iconContainer: { marginBottom: 32, alignItems: 'center' },
  iconGlow: { position: 'absolute', width: 120, height: 120, backgroundColor: 'rgba(144, 171, 255, 0.1)', borderRadius: 60 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#181f33', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  title: { fontSize: 24, fontWeight: '800', color: colors.white, marginBottom: 8 },
  subtitle: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginBottom: 30 },
  formContainer: { width: '100%' },
  inputLabel: { fontSize: 10, fontWeight: '600', color: colors.textSecondary, letterSpacing: 1, marginBottom: 6 },
  inputWrapper: { position: 'relative', justifyContent: 'center', marginBottom: 20 },
  inputIcon: { position: 'absolute', left: 16, zIndex: 1 },
  input: { width: '100%', backgroundColor: '#181f33', borderRadius: 12, paddingVertical: 14, paddingLeft: 46, color: colors.white },
  submitButton: { width: '100%', backgroundColor: colors.primary, borderRadius: 30, paddingVertical: 16, alignItems: 'center', marginTop: 10 },
  submitText: { color: '#00266e', fontWeight: '800', fontSize: 16 },
});
