import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, Alert, Dimensions, ActivityIndicator } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export const BioLockScreen = () => {
  const navigation = useNavigation();
  const { user, logout, setBioVerified } = useAuth();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Automatically trigger biometrics on mount
    authenticate();
  }, []);

  const authenticate = async () => {
    try {
      setIsAuthenticating(true);
      setErrorMessage(null);

      // 1. Check if hardware is available
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        Alert.alert(
          'Biometrics Not Available',
          'Your device does not support biometric authentication or no biometrics are enrolled.',
          [{ text: 'Use Password', onPress: handleFallback }]
        );
        return;
      }

      // 2. Authenticate
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verify your identity to continue',
        fallbackLabel: 'Use Password',
        disableDeviceFallback: false,
      });

      if (result.success) {
        // Success -> Satisfaction of biometrics will trigger App.tsx re-render
        setBioVerified(true);
      } else {
        setErrorMessage('Authentication Failed');
      }
    } catch (error) {
      console.error('Biometric Error:', error);
      setErrorMessage('An error occurred during authentication');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleFallback = async () => {
    // Logout will clear token and trigger App.tsx to show Auth stack
    await logout();
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#090e1c', '#13192b']} style={StyleSheet.absoluteFill} />
      
      {/* Animated Glow Globes */}
      <View style={[styles.glow, { top: -100, left: -50, backgroundColor: colors.primary + '33' }]} />
      <View style={[styles.glow, { bottom: -100, right: -50, backgroundColor: colors.secondary + '33' }]} />

      <View style={styles.content}>
        <View style={styles.header}>
          <Image 
            source={{ uri: user?.profile_picture || 'https://lh3.googleusercontent.com/a/ACg8ocL8z0P5n8l1_R5p8Z6X9N3B0W=s96-c' }} 
            style={styles.avatar} 
          />
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.nameText}>{user?.full_name || 'Student'}</Text>
        </View>

        <View style={styles.lockContainer}>
          <View style={styles.glassCircle}>
            <TouchableOpacity 
              onPress={authenticate} 
              disabled={isAuthenticating}
              style={styles.bioButton}
            >
              <MaterialIcons 
                name={Platform.OS === 'ios' ? 'face' : 'fingerprint'} 
                size={80} 
                color={isAuthenticating ? colors.primary : colors.white} 
              />
            </TouchableOpacity>
          </View>
          
          {isAuthenticating ? (
            <View style={styles.statusRow}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.statusText}>Verifying identity...</Text>
            </View>
          ) : (
            <Text style={styles.hintText}>Tap to Unlock</Text>
          )}

          {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
        </View>

        <TouchableOpacity style={styles.fallbackBtn} onPress={handleFallback}>
          <Text style={styles.fallbackText}>Sign in with Password</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footerText}>SECURE ACCESS • POWERED BY EDU-FEE</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  glow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.5,
  },
  content: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 40,
    justifyContent: 'space-between',
    height: '70%',
  },
  header: {
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 20,
  },
  welcomeText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    fontWeight: '500',
  },
  nameText: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '800',
    marginTop: 4,
  },
  lockContainer: {
    alignItems: 'center',
    width: '100%',
  },
  glassCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: { elevation: 20 },
    }),
  },
  bioButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  hintText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 1,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 20,
  },
  fallbackBtn: {
    marginTop: 40,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  fallbackText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  footerText: {
    position: 'absolute',
    bottom: 40,
    color: 'rgba(255,255,255,0.2)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
});
