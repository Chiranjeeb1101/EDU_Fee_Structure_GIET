import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, Animated, Dimensions, Platform, Alert, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import { GlowingBackground } from '../../components/layout/GlowingBackground';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';

const { height } = Dimensions.get('window');

type Role = 'student' | 'admin' | null;

export const LoginScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { login } = useAuth();
  
  const [role, setRole] = useState<Role>(null);
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [idValue, setIdValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Animation Values
  const selectionScale = useRef(new Animated.Value(1)).current;
  const selectionOpacity = useRef(new Animated.Value(1)).current;
  
  const formTranslateY = useRef(new Animated.Value(height * 0.5)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;

  const headerOpacity = useRef(new Animated.Value(1)).current;
  const headerScale = useRef(new Animated.Value(1)).current;

  // Error shake animation
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Load saved credentials on mount
  useEffect(() => {
    const loadSavedCreds = async () => {
      const saved = await authService.getSavedCredentials();
      if (saved) {
        setIdValue(saved.collegeId);
        setPasswordValue(saved.password);
        setRememberMe(true);
      }
    };
    loadSavedCreds();
  }, []);

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleRoleSelect = (selectedRole: Role) => {
    setRole(selectedRole);
    setErrorMsg('');
    // Animate Selection Out & Header Shrink
    Animated.parallel([
      Animated.timing(selectionScale, { toValue: 0.95, duration: 400, useNativeDriver: true }),
      Animated.timing(selectionOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
      Animated.timing(headerOpacity, { toValue: 0.5, duration: 500, useNativeDriver: true }),
      Animated.timing(headerScale, { toValue: 0.95, duration: 500, useNativeDriver: true }),
    ]).start(() => {
      // Animate Form In
      Animated.parallel([
        Animated.timing(formTranslateY, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(formOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleBack = () => {
    setErrorMsg('');
    // Animate Form Out
    Animated.parallel([
      Animated.timing(formTranslateY, { toValue: height * 0.5, duration: 500, useNativeDriver: true }),
      Animated.timing(formOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => {
      setRole(null);
      // Animate Selection In & Header Grow
      Animated.parallel([
        Animated.timing(selectionScale, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(selectionOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(headerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(headerScale, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]).start();
    });
  };

  // ─── Validation ────────────────────────────────────────────────
  const validate = (): boolean => {
    if (!idValue.trim()) {
      setErrorMsg('Please enter your College ID');
      triggerShake();
      return false;
    }
    if (idValue.trim().length < 3) {
      setErrorMsg('College ID must be at least 3 characters');
      triggerShake();
      return false;
    }
    if (!passwordValue) {
      setErrorMsg('Please enter your password');
      triggerShake();
      return false;
    }
    if (passwordValue.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      triggerShake();
      return false;
    }
    return true;
  };

  // ─── Login Handler ─────────────────────────────────────────────
  const handleLogin = async () => {
    setErrorMsg('');
    if (!validate()) return;

    setIsLoading(true);
    try {
      const result = await login(idValue.trim(), passwordValue, rememberMe);
      
      if (result.success) {
        // Navigate to Dashboard
        if (role === 'student') {
          (navigation as any).reset({
            index: 0,
            routes: [{ name: 'MainTabs', params: { screen: 'Dashboard' } }],
          });
        }
        // Admin flow can be added later
      } else {
        setErrorMsg(result.message);
        triggerShake();
      }
    } catch (error: any) {
      setErrorMsg('Connection error. Please check your internet.');
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  const activeColor = role === 'admin' ? colors.violetAccent : colors.primary;
  const idPlaceholder = role === 'admin' ? 'Admin ID / Email' : 'Student ID / Registration No';

  return (
    <GlowingBackground>
      <SafeAreaView style={styles.safeArea}>
        
        <View style={styles.container}>
          
          {/* Brand Header */}
          <Animated.View style={[styles.headerContainer, { opacity: headerOpacity, transform: [{ scale: headerScale }] }]}>
            <View style={styles.iconWrapper}>
              <MaterialIcons name="account-balance-wallet" size={32} color={colors.primary} />
            </View>
            <Text style={styles.brandTitle}>EDU-Fee</Text>
            <Text style={styles.brandSubtitle}>THE FUTURE OF FEE MANAGEMENT</Text>
          </Animated.View>

          <View style={styles.contentArea}>
            
            {/* Role Selection View */}
            <Animated.View 
              style={[
                styles.selectionView, 
                { opacity: selectionOpacity, transform: [{ scale: selectionScale }], zIndex: role ? 0 : 10 }
              ]}
              pointerEvents={role ? 'none' : 'auto'}
            >
              <View style={styles.cardsRow}>
                {/* Student Card */}
                <TouchableOpacity 
                  style={[styles.roleCard, styles.studentCardBorder]} 
                  onPress={() => handleRoleSelect('student')}
                  activeOpacity={0.8}
                >
                  <View style={styles.iconContainerBox}>
                    <View style={[styles.iconInnerBg, styles.studentBg]} />
                    <MaterialIcons name="school" size={40} color={colors.primary} />
                  </View>
                  <Text style={styles.roleTitle}>Student</Text>
                  <Text style={styles.roleDesc}>Pay fees & access portal</Text>
                </TouchableOpacity>

                {/* Admin Card */}
                <TouchableOpacity 
                  style={[styles.roleCard, styles.adminCardBorder]} 
                  onPress={() => handleRoleSelect('admin')}
                  activeOpacity={0.8}
                >
                  <View style={styles.iconContainerBox}>
                    <View style={[styles.iconInnerBg, styles.adminBg]} />
                    <MaterialIcons name="admin-panel-settings" size={40} color={colors.violetAccent} />
                  </View>
                  <Text style={styles.roleTitle}>Admin</Text>
                  <Text style={styles.roleDesc}>Manage institution fees</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Login Form Panel */}
            <Animated.View 
              style={[
                styles.formPanel, 
                { opacity: formOpacity, transform: [{ translateY: formTranslateY }], zIndex: role ? 10 : 0 }
              ]}
              pointerEvents={role ? 'auto' : 'none'}
            >
              {activeColor && (
                <View style={[styles.accentBar, { backgroundColor: activeColor }]} />
              )}
              
              <View style={styles.formHeader}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                  <MaterialIcons name="arrow-back" size={20} color={colors.textSecondary} />
                  <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
                <View style={[styles.roleBadge, { backgroundColor: `${activeColor}20`, borderColor: `${activeColor}40` }]}>
                  <Text style={[styles.roleBadgeText, { color: activeColor }]}>
                    {role === 'student' ? 'STUDENT' : 'ADMIN'}
                  </Text>
                </View>
              </View>

              <Animated.View style={[styles.formBody, { transform: [{ translateX: shakeAnim }] }]}>
                
                {/* Error Message */}
                {errorMsg ? (
                  <View style={styles.errorContainer}>
                    <MaterialIcons name="error-outline" size={18} color="#ff6b6b" />
                    <Text style={styles.errorText}>{errorMsg}</Text>
                  </View>
                ) : null}

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{idPlaceholder}</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialIcons name="person" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                    <TextInput 
                      style={[styles.input, { borderColor: errorMsg && !idValue.trim() ? '#ff6b6b' : idValue ? activeColor : 'rgba(255,255,255,0.1)' }]} 
                      placeholder="Enter your credentials"
                      placeholderTextColor="#6b7280"
                      value={idValue}
                      onChangeText={(t) => { setIdValue(t); setErrorMsg(''); }}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isLoading}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialIcons name="lock" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                    <TextInput 
                      style={[styles.input, { borderColor: errorMsg && !passwordValue ? '#ff6b6b' : passwordValue ? activeColor : 'rgba(255,255,255,0.1)' }]} 
                      placeholder="••••••••"
                      placeholderTextColor="#6b7280"
                      secureTextEntry={!isPasswordVisible}
                      value={passwordValue}
                      onChangeText={(t) => { setPasswordValue(t); setErrorMsg(''); }}
                      editable={!isLoading}
                    />
                    <TouchableOpacity 
                      style={styles.visibilityToggle}
                      onPress={() => setPasswordVisible(!isPasswordVisible)}
                    >
                      <MaterialIcons name={isPasswordVisible ? "visibility" : "visibility-off"} size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.formOptionsRow}>
                  <TouchableOpacity style={styles.rememberRow} onPress={() => setRememberMe(!rememberMe)} activeOpacity={0.8}>
                    <View style={[styles.checkbox, rememberMe && { backgroundColor: activeColor, borderColor: activeColor }]}>
                      {rememberMe && <MaterialIcons name="check" size={12} color={colors.white} />}
                    </View>
                    <Text style={styles.rememberText}>Remember me</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                    <Text style={[styles.forgotText, { color: activeColor }]}>Forgot Password?</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity 
                  style={[styles.loginBtn, { backgroundColor: isLoading ? `${activeColor}80` : activeColor }]} 
                  activeOpacity={0.8}
                  onPress={handleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator size="small" color={colors.white} />
                      <Text style={[styles.loginBtnText, { marginLeft: 10 }]}>Logging in...</Text>
                    </View>
                  ) : (
                    <Text style={styles.loginBtnText}>Login to Portal</Text>
                  )}
                </TouchableOpacity>

                {role === 'student' && (
                  <View style={{ marginTop: 24, width: '100%' }}>
                    <View style={styles.signupContainer}>
                      <Text style={styles.signupText}>Don't have an account? </Text>
                      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                        <Text style={[styles.signupLink, { color: activeColor }]}>Create a new account</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

              </Animated.View>

              <View style={styles.supportContainer}>
                <TouchableOpacity style={styles.supportBtn} onPress={() => navigation.navigate('SupportCenter')}>
                  <MaterialIcons name="chat-bubble" size={18} color={activeColor} />
                  <Text style={styles.supportBtnText}>Chat with support</Text>
                </TouchableOpacity>
              </View>

            </Animated.View>

          </View>
        </View>

        <Text style={styles.footerText}>© 2026 EDU-Fee Systems. All rights reserved.</Text>
      </SafeAreaView>
    </GlowingBackground>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: -80,
  },
  iconWrapper: {
    padding: 16,
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.3)',
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -1,
  },
  brandSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    fontWeight: '600',
    letterSpacing: 2,
  },
  contentArea: {
    width: '100%',
    position: 'relative',
    height: 480,
  },
  
  // Selection View
  selectionView: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: 16,
  },
  roleCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  studentCardBorder: {
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  adminCardBorder: {
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconContainerBox: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    overflow: 'hidden',
  },
  iconInnerBg: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.2,
  },
  studentBg: { backgroundColor: colors.primary },
  adminBg: { backgroundColor: colors.violetAccent },
  roleTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 4,
  },
  roleDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Form Panel
  formPanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 28,
    overflow: 'hidden',
    paddingBottom: 0,
  },
  accentBar: {
    height: 6,
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
    marginTop: 6,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  formBody: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  input: {
    backgroundColor: 'rgba(2, 6, 23, 0.4)',
    borderWidth: 1,
    borderRadius: 16,
    color: colors.white,
    paddingVertical: 14,
    paddingLeft: 48,
    paddingRight: 16,
    fontSize: 16,
  },
  visibilityToggle: {
    position: 'absolute',
    right: 16,
    zIndex: 1,
    padding: 4,
  },
  formOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(15, 23, 42, 1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  rememberText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loginBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signupText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  signupLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  supportContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  supportBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  supportBtnText: {
    color: '#cbd5e1',
    fontWeight: '500',
    fontSize: 14,
    marginLeft: 10,
  },
  footerText: {
    position: 'absolute',
    bottom: 24,
    width: '100%',
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 12,
  },
});
