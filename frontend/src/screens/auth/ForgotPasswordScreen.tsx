import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import { GlowingBackground } from '../../components/layout/GlowingBackground';
import { colors } from '../../theme/colors';

export const ForgotPasswordScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

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
                    <MaterialIcons name="lock-reset" size={48} color={colors.primary} />
                  </View>
                </View>

                {/* Typography Output */}
                <Text style={styles.title}>Forgot Password?</Text>
                <Text style={styles.subtitle}>
                  No worries, it happens. Enter your registered email or student ID to reset your password.
                </Text>

                {/* Form Elements */}
                <View style={styles.formContainer}>
                  <Text style={styles.inputLabel}>EMAIL OR STUDENT ID</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialIcons name="mail" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                    <TextInput 
                      style={styles.input}
                      placeholder="e.g. name@university.edu"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      autoCapitalize="none"
                    />
                  </View>

                  <TouchableOpacity style={styles.submitButton} activeOpacity={0.8}>
                    <Text style={styles.submitText}>Send Reset Link</Text>
                  </TouchableOpacity>
                </View>

                {/* Footer Link */}
                <TouchableOpacity style={styles.footerLink} onPress={() => navigation.goBack()}>
                  <MaterialIcons name="arrow-back" size={16} color={colors.violetAccent} />
                  <Text style={styles.footerLinkText}>Back to Login</Text>
                </TouchableOpacity>

              </View>

              {/* Decorative Info Card */}
              <View style={styles.infoCard}>
                <MaterialIcons name="info" size={20} color={colors.electricBlue} style={styles.infoIcon} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoTitle}>SECURITY TIP</Text>
                  <Text style={styles.infoDesc}>Ensure you have access to your primary academic inbox before requesting a link.</Text>
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
