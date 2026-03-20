import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Platform, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import { GlowingBackground } from '../../components/layout/GlowingBackground';
import { colors } from '../../theme/colors';

export const SupportCenterScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <GlowingBackground showParticles={true}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Top App Bar */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
              <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Support Center</Text>
          </View>
          <TouchableOpacity style={styles.iconButton}>
            <MaterialIcons name="help-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.cardContainer}>
            <View style={styles.glassCard}>
              
              {/* 3D Geometric Icon Container */}
              <View style={styles.iconContainerBox}>
                <View style={styles.rectGlow} />
                <View style={styles.rotatedBox}>
                  <View style={styles.counterRotatedInner}>
                    <MaterialIcons name="verified-user" size={48} color={colors.white} />
                  </View>
                </View>
                {/* Exclamation Badge */}
                <View style={styles.errorBadge}>
                  <MaterialIcons name="priority-high" size={20} color={colors.white} />
                </View>
              </View>

              <Text style={styles.title}>Verification Issue?</Text>
              <Text style={styles.subtitle}>
                We're having trouble verifying your student email address. This usually happens if the link expired or your network is unstable.
              </Text>

              {/* Troubleshooting Steps */}
              <View style={styles.stepsContainer}>
                <Text style={styles.stepsTitle}>TROUBLESHOOTING STEPS</Text>
                
                <View style={styles.stepItem}>
                  <View style={styles.stepNumberCirc}>
                    <Text style={styles.stepNumber}>1</Text>
                  </View>
                  <Text style={styles.stepText}>Check your spam folder</Text>
                </View>

                <View style={styles.stepItem}>
                  <View style={styles.stepNumberCirc}>
                    <Text style={styles.stepNumber}>2</Text>
                  </View>
                  <Text style={styles.stepText}>Ensure you're using your official university ID</Text>
                </View>

                <View style={styles.stepItem}>
                  <View style={styles.stepNumberCirc}>
                    <Text style={styles.stepNumber}>3</Text>
                  </View>
                  <Text style={styles.stepText}>Wait 5 minutes and try again</Text>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.actionContainer}>
                <TouchableOpacity 
                  style={styles.primaryButton} 
                  activeOpacity={0.8}
                  onPress={() => Linking.openURL('mailto:support@edufee.com?subject=Verification Problem')}
                >
                  <MaterialIcons name="email" size={20} color="#00266e" style={{ marginRight: 8 }} />
                  <Text style={styles.primaryText}>Email Support</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.primaryButton, { backgroundColor: colors.secondary, shadowColor: colors.secondary, marginTop: 12 }]} 
                  activeOpacity={0.8}
                  onPress={() => Linking.openURL('tel:+918140000000')}
                >
                  <MaterialIcons name="phone" size={20} color="#00266e" style={{ marginRight: 8 }} />
                  <Text style={styles.primaryText}>Call Helpline</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Login')} activeOpacity={0.8}>
                   <Text style={styles.secondaryText}>Go Back to Login</Text>
                </TouchableOpacity>
              </View>

            </View>
          </View>
        </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    height: 64,
    marginTop: Platform.OS === 'android' ? 40 : 10,
    backgroundColor: '#0d1323',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  headerTitle: {
    marginLeft: 16,
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
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
    maxWidth: 440,
    backgroundColor: 'rgba(30, 37, 59, 0.4)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  iconContainerBox: {
    position: 'relative',
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
    width: 128,
    height: 128,
  },
  rectGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    backgroundColor: 'rgba(144, 171, 255, 0.3)',
    borderRadius: 30,
    filter: 'blur(20px)',
  },
  rotatedBox: {
    width: 100,
    height: 100,
    backgroundColor: colors.primary, // Using primary gradient replacement
    borderRadius: 24,
    transform: [{ rotate: '12deg' }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterRotatedInner: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    transform: [{ rotate: '-12deg' }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ff716c',
    borderWidth: 4,
    borderColor: '#1e253b',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.white,
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 8,
  },
  stepsContainer: {
    width: '100%',
    backgroundColor: '#0d1323',
    borderRadius: 16,
    padding: 24,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(67, 71, 89, 0.2)',
  },
  stepsTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.electricBlue,
    letterSpacing: 2,
    marginBottom: 24,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepNumberCirc: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e253b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumber: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  stepText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
  actionContainer: {
    width: '100%',
    gap: 16,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  primaryText: {
    color: '#00266e',
    fontWeight: '800',
    fontSize: 16,
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
  },
  secondaryText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
});
