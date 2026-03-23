import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, KeyboardAvoidingView, ScrollView, Platform, Alert, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import { GlowingBackground } from '../../components/layout/GlowingBackground';
import { colors } from '../../theme/colors';
import resetService from '../../services/resetService';

export const ForgotPasswordScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [collegeId, setCollegeId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [existingRequest, setExistingRequest] = useState<any>(null);

  const handleResetRequest = async () => {
    if (!collegeId.trim()) {
      Alert.alert('Error', 'Please enter your College ID.');
      return;
    }

    setIsLoading(true);
    setExistingRequest(null);
    try {
      const result = await resetService.requestReset(collegeId.trim());
      
      if (result.alreadyExists) {
        setExistingRequest(result.data);
        if (result.data.status === 'approved') {
          Alert.alert('Approved!', 'Your request has been approved by the Admin. You can now set your new password.');
        } else if (result.data.status === 'pending') {
          Alert.alert('Pending', 'Your request is still waiting for Admin approval.');
        } else if (result.data.status === 'rejected') {
          Alert.alert('Rejected', 'Your request was rejected by the Admin. Please contact the office.');
        }
      } else {
        setIsSuccess(true);
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to send request. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GlowingBackground showParticles={false}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Top App Bar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recovery</Text>
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            <View style={styles.cardContainer}>
              <View style={styles.glassCard}>
                
                {/* Icon glowing section */}
                <View style={styles.iconContainer}>
                  <View style={styles.iconGlow} />
                  <View style={styles.iconCircle}>
                    <MaterialIcons 
                      name={isSuccess ? "mark-email-read" : "lock-reset"} 
                      size={48} 
                      color={isSuccess ? colors.success : colors.primary} 
                    />
                  </View>
                </View>

                {/* Typography Output */}
                <Text style={styles.title}>
                  {existingRequest?.status === 'approved' ? "Request Approved!" : (isSuccess ? "Request Sent!" : "Forgot Password?")}
                </Text>
                <Text style={styles.subtitle}>
                  {existingRequest?.status === 'approved' 
                    ? "Great news! The Admin has approved your reset request. Tap the button below to set your new password."
                    : (isSuccess 
                        ? "Your reset request has been sent to the GIET Admin. Please check back later or visit the Admin office for approval."
                        : "No worries, it happens. Enter your registered College ID to request a password reset from the Admin."
                      )
                  }
                </Text>

                {/* Form Elements */}
                {!isSuccess && !existingRequest ? (
                  <View style={styles.formContainer}>
                    <Text style={styles.inputLabel}>COLLEGE ID NUMBER</Text>
                    <View style={styles.inputWrapper}>
                      <MaterialIcons name="badge" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                      <TextInput 
                        style={styles.input}
                        placeholder="e.g. 2401326..."
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        autoCapitalize="characters"
                        value={collegeId}
                        onChangeText={setCollegeId}
                      />
                    </View>

                    <TouchableOpacity 
                      style={[styles.submitButton, isLoading && { opacity: 0.7 }]} 
                      activeOpacity={0.8}
                      onPress={handleResetRequest}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#00266e" />
                      ) : (
                        <Text style={styles.submitText}>Submit Request</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                   <View style={styles.formContainer}>
                      {existingRequest?.status === 'approved' && (
                        <TouchableOpacity 
                          style={[styles.submitButton, { backgroundColor: colors.success, marginBottom: 12 }]} 
                          onPress={() => navigation.navigate('ResetPasswordCompletion', { requestId: existingRequest.id })}
                        >
                           <Text style={[styles.submitText, { color: 'white' }]}>Set New Password Now</Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity style={styles.submitButton} onPress={() => navigation.goBack()}>
                        <Text style={styles.submitText}>Back to Login</Text>
                      </TouchableOpacity>
                   </View>
                )}

                {/* Footer Link */}
                {!isSuccess && (
                  <TouchableOpacity style={styles.footerLink} onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={16} color={colors.violetAccent} />
                    <Text style={styles.footerLinkText}>Back to Login</Text>
                  </TouchableOpacity>
                )}

              </View>

              {/* Decorative Info Card */}
              <View style={styles.infoCard}>
                <MaterialIcons name="info" size={20} color={colors.electricBlue} style={styles.infoIcon} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoTitle}>SYSTEM INFO</Text>
                  <Text style={styles.infoDesc}>
                    Password resets require manual approval by the GIET Administration for security.
                  </Text>
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
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    height: 64,
    marginTop: Platform.OS === 'android' ? 40 : 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(30,37,59,0.5)',
  },
  headerTitle: {
    marginLeft: 16,
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  cardContainer: {
    width: '100%',
    alignItems: 'center',
  },
  glassCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    backgroundColor: 'rgba(144, 171, 255, 0.2)',
    borderRadius: 60,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#181f33',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.white,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  formContainer: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 1.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
    marginBottom: 24,
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  input: {
    width: '100%',
    backgroundColor: '#181f33',
    borderRadius: 12,
    paddingVertical: 16,
    paddingLeft: 48,
    paddingRight: 16,
    color: colors.white,
    fontSize: 16,
  },
  submitButton: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  submitText: {
    color: '#00266e',
    fontWeight: '800',
    fontSize: 16,
  },
  footerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
  },
  footerLinkText: {
    color: colors.violetAccent,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 16,
    marginTop: 48,
    borderLeftWidth: 4,
    borderLeftColor: colors.electricBlue,
    width: '100%',
    maxWidth: 400,
  },
  infoIcon: {
    marginRight: 16,
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.electricBlue,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  infoDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
