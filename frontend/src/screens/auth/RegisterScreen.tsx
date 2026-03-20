import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, ScrollView, Platform, KeyboardAvoidingView, Image, Modal, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import { GlowingBackground } from '../../components/layout/GlowingBackground';
import { colors } from '../../theme/colors';
import authService, { RegisterPayload } from '../../services/authService';

export const RegisterScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [residency, setResidency] = useState<'hosteller' | 'day-scholar'>('hosteller');
  const [isPasswordVisible, setPasswordVisible] = useState(false);

  // New States for Interactivity
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileImageBase64, setProfileImageBase64] = useState<string | null>(null);
  const [course, setCourse] = useState('B.Tech');
  const [branch, setBranch] = useState('CSE');
  const [year, setYear] = useState('1st Year');
  const [activeDropdown, setActiveDropdown] = useState<'course' | 'branch' | 'year' | null>(null);

  // Form Inputs
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentWhatsapp, setParentWhatsapp] = useState('');

  // Status States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true, // Request base64 for easy upload
    });
    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
      setProfileImageBase64(result.assets[0].base64 ? `data:image/jpeg;base64,${result.assets[0].base64}` : null);
    }
  };

  const validate = () => {
    if (!fullName || !email || !password || !regNumber) {
      setErrorMsg('Name, Email, Password, and Registration Number are required.');
      return false;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return false;
    }
    setErrorMsg('');
    return true;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setIsLoading(true);

    try {
      const payload: RegisterPayload = {
        full_name: fullName.trim(),
        personal_email: email.trim(),
        password,
        college_id_number: regNumber.trim(),
        profile_picture: profileImageBase64 || undefined,
        course_type: course,
        stream: branch,
        year,
        accommodation: residency === 'hosteller' ? 'hosteler' : 'day_scholar', // Map to DB enum
        student_phone: studentPhone.trim() || undefined,
        parent_name: parentName.trim() || undefined,
        parent_whatsapp: parentWhatsapp.trim() || undefined,
      };

      const result = await authService.register(payload);
      if (result.success) {
        navigation.navigate('RegistrationSuccess');
      } else {
        setErrorMsg(result.message);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GlowingBackground showParticles={false}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Top App Bar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
            <MaterialIcons name="arrow-back" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <View style={styles.headerIconWrapper}>
              <View style={styles.headerIconBg} />
              <MaterialIcons name="account-balance-wallet" size={16} color={colors.primary} />
            </View>
            <Text style={styles.headerBrand}>EDU-FEE</Text>
          </View>
          <TouchableOpacity style={styles.iconButton}>
            <MaterialIcons name="help-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            {/* Hero Section */}
            <View style={styles.heroSection}>
              <View style={styles.heroIconContainer}>
                <View style={[styles.heroIconOutline, styles.spinAnimation]} />
                <View style={styles.heroIconInner}>
                  <MaterialIcons name="security" size={24} color={colors.white} />
                </View>
              </View>
              <Text style={styles.heroTitle}>Create Student Account</Text>
              <Text style={styles.heroSubtitle}>Join the elite financial gateway for modern learners.</Text>
            </View>

            {/* Registration Form Container */}
            <View style={styles.formContainer}>
              
              {/* Profile Image Section */}
              <View style={styles.profileSection}>
                <TouchableOpacity style={styles.profileUpload} onPress={pickImage}>
                  {profileImage ? (
                    <Image source={{ uri: profileImage }} style={styles.profileImage} />
                  ) : (
                    <MaterialIcons name="add-a-photo" size={32} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>
                <View style={styles.editBadge}>
                  <MaterialIcons name="edit" size={14} color={colors.white} />
                </View>
                <Text style={styles.uploadText}>Upload Profile Picture</Text>
              </View>

              {/* Personal Section */}
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.sectionTitle, { color: colors.primary }]}>PERSONAL DETAILS</Text>
                </View>

                {errorMsg ? (
                  <View style={styles.errorContainer}>
                    <MaterialIcons name="error-outline" size={18} color="#ff6b6b" />
                    <Text style={styles.errorText}>{errorMsg}</Text>
                  </View>
                ) : null}

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>FULL NAME</Text>
                  <TextInput style={styles.input} placeholder="e.g. Alex Rivera" placeholderTextColor="rgba(255,255,255,0.3)" value={fullName} onChangeText={setFullName} editable={!isLoading} />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                  <TextInput style={styles.input} placeholder="alex.rivera@edu.com" placeholderTextColor="rgba(255,255,255,0.3)" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} editable={!isLoading} />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>SECURE PASSWORD</Text>
                  <View style={styles.passwordWrapper}>
                    <TextInput style={[styles.input, { paddingRight: 48 }]} placeholder="••••••••••••" placeholderTextColor="rgba(255,255,255,0.3)" secureTextEntry={!isPasswordVisible} value={password} onChangeText={setPassword} editable={!isLoading} />
                    <TouchableOpacity style={styles.visibilityToggle} onPress={() => setPasswordVisible(!isPasswordVisible)}>
                      <MaterialIcons name={isPasswordVisible ? 'visibility' : 'visibility-off'} size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>RESIDENCY TYPE</Text>
                  <View style={styles.toggleContainer}>
                    <TouchableOpacity 
                      style={[styles.toggleBtn, residency === 'hosteller' && styles.toggleBtnActive]}
                      onPress={() => setResidency('hosteller')}
                    >
                      <Text style={[styles.toggleText, residency === 'hosteller' && styles.toggleTextActive]}>HOSTELLER</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.toggleBtn, residency === 'day-scholar' && styles.toggleBtnActive]}
                      onPress={() => setResidency('day-scholar')}
                    >
                      <Text style={[styles.toggleText, residency === 'day-scholar' && styles.toggleTextActive]}>DAY SCHOLAR</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Academic Section */}
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.dot, { backgroundColor: colors.violetAccent }]} />
                  <Text style={[styles.sectionTitle, { color: colors.violetAccent }]}>ACADEMIC CREDENTIALS</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>REGISTRATION NUMBER</Text>
                  <TextInput style={styles.input} placeholder="2026-XXXX" placeholderTextColor="rgba(255,255,255,0.3)" value={regNumber} onChangeText={setRegNumber} editable={!isLoading} />
                </View>

                {/* Simulated Dropdowns */}
                <View style={styles.rowInputs}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>COURSE</Text>
                    <TouchableOpacity style={styles.dropdownBtn} onPress={() => setActiveDropdown('course')}>
                      <Text style={styles.dropdownText}>{course}</Text>
                      <MaterialIcons name="expand-more" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.space} />
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>BRANCH</Text>
                    <TouchableOpacity style={styles.dropdownBtn} onPress={() => setActiveDropdown('branch')}>
                      <Text style={styles.dropdownText}>{branch}</Text>
                      <MaterialIcons name="expand-more" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>YEAR</Text>
                  <TouchableOpacity style={styles.dropdownBtn} onPress={() => setActiveDropdown('year')}>
                    <Text style={styles.dropdownText}>{year}</Text>
                    <MaterialIcons name="expand-more" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Contact Section */}
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.dot, { backgroundColor: '#34D399' }]} />
                  <Text style={[styles.sectionTitle, { color: '#34D399' }]}>EMERGENCY CONTACTS</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>STUDENT PHONE</Text>
                  <TextInput style={styles.input} placeholder="+1 (555) 000-0000" placeholderTextColor="rgba(255,255,255,0.3)" keyboardType="phone-pad" value={studentPhone} onChangeText={setStudentPhone} editable={!isLoading} />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>PARENT NAME</Text>
                  <TextInput style={styles.input} placeholder="Guardian Full Name" placeholderTextColor="rgba(255,255,255,0.3)" value={parentName} onChangeText={setParentName} editable={!isLoading} />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: '#34D399' }]}>PARENT WHATSAPP</Text>
                  <View style={styles.whatsappWrapper}>
                    <MaterialIcons name="chat" size={20} color="#34D399" style={styles.whatsappIcon} />
                    <TextInput 
                      style={[styles.input, styles.whatsappInput]} 
                      placeholder="+1 (555) WhatsApp" 
                      placeholderTextColor="rgba(255,255,255,0.3)" 
                      keyboardType="phone-pad" 
                      value={parentWhatsapp}
                      onChangeText={setParentWhatsapp}
                      editable={!isLoading}
                    />
                  </View>
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity 
                style={[styles.submitBtn, isLoading && { opacity: 0.7 }]} 
                activeOpacity={0.8}
                onPress={handleRegister}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <>
                    <Text style={styles.submitText}>CREATE ACCOUNT</Text>
                    <MaterialIcons name="arrow-forward" size={16} color={colors.white} style={{ marginLeft: 8 }} />
                  </>
                )}
              </TouchableOpacity>

              <Text style={styles.termsText}>
                By registering, you agree to our{'\n'}
                <Text style={{ color: colors.primary, textDecorationLine: 'underline' }}>Terms of Sovereignty</Text>
              </Text>

            </View>

          </ScrollView>
        </KeyboardAvoidingView>

        {/* Custom Select Modal */}
        <Modal visible={activeDropdown !== null} transparent animationType="fade">
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setActiveDropdown(null)}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select {activeDropdown?.toUpperCase()}</Text>
              <ScrollView>
                {activeDropdown === 'course' && ['B.Tech', 'MBA', 'MCA', 'M.Tech', 'Diploma'].map((opt) => (
                  <TouchableOpacity key={opt} style={styles.modalOption} onPress={() => { setCourse(opt); setActiveDropdown(null); }}>
                    <Text style={[styles.modalOptionText, course === opt && { color: colors.primary }]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
                {activeDropdown === 'branch' && ['CSE', 'Mechanical', 'EE', 'ME', 'ECE'].map((opt) => (
                  <TouchableOpacity key={opt} style={styles.modalOption} onPress={() => { setBranch(opt); setActiveDropdown(null); }}>
                    <Text style={[styles.modalOptionText, branch === opt && { color: colors.primary }]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
                {activeDropdown === 'year' && ['1st Year', '2nd Year', '3rd Year', '4th Year'].map((opt) => (
                  <TouchableOpacity key={opt} style={styles.modalOption} onPress={() => { setYear(opt); setActiveDropdown(null); }}>
                    <Text style={[styles.modalOptionText, year === opt && { color: colors.primary }]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

      </SafeAreaView>
    </GlowingBackground>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    height: 70,
    marginTop: Platform.OS === 'android' ? 40 : 10,
    backgroundColor: 'rgba(10,15,30,0.6)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconWrapper: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerIconBg: {
    position: 'absolute',
    width: 32,
    height: 32,
    backgroundColor: 'rgba(37,99,235,0.2)',
    borderRadius: 8,
    transform: [{ rotate: '45deg' }],
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.5)',
  },
  headerBrand: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  keyboardView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 60,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  heroIconOutline: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(37,99,235,0.4)',
  },
  spinAnimation: {
    // In a real app we'd use Animated.loop for the border
    transform: [{ rotate: '0deg' }], 
  },
  heroIconInner: {
    width: 56,
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '45deg' }],
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.5)',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: -1,
    marginBottom: 10,
    textAlign: 'center',
  },
  heroSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 40,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  profileUpload: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  editBadge: {
    position: 'absolute',
    bottom: 30,
    right: '35%',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: '#0A0F1E',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  uploadText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  sectionBlock: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
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
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginLeft: 4,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingVertical: 16,
    color: colors.white,
    fontSize: 15,
  },
  passwordWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  visibilityToggle: {
    position: 'absolute',
    right: 20,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 6,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 20,
  },
  toggleBtnActive: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  toggleTextActive: {
    color: colors.white,
  },
  rowInputs: {
    flexDirection: 'row',
  },
  space: {
    width: 16,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  dropdownText: {
    color: colors.white,
    fontSize: 15,
  },
  whatsappWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  whatsappIcon: {
    position: 'absolute',
    left: 20,
    zIndex: 1,
  },
  whatsappInput: {
    borderColor: 'rgba(52, 211, 153, 0.2)', // Emerald tint
    paddingLeft: 50,
  },
  submitBtn: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: 30,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  submitText: {
    color: colors.white,
    fontWeight: '800',
    letterSpacing: 1.5,
    fontSize: 14,
  },
  termsText: {
    color: colors.textSecondary,
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 24,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 54, // slightly less than container to fit inside border
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 14, 28, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(30,37,59,0.95)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 1.5,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  modalOptionText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
