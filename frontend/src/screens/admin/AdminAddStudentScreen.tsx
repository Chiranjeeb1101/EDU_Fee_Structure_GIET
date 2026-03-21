import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { AdminGlowingBackground } from '../../components/layout/AdminGlowingBackground';
import api from '../../services/api';

const { width } = Dimensions.get('window');

const InputField = ({ icon, placeholder, value, onChangeText, secureTextEntry, keyboardType }: any) => (
  <View style={styles.inputContainer}>
    <MaterialIcons name={icon} size={20} color={colors.textSecondary} style={styles.inputIcon} />
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor={colors.textSecondary}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      autoCapitalize="none"
    />
  </View>
);

export const AdminAddStudentScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    college_id_number: '',
    registration_number: '',
    personal_email: '',
    password: '',
    course_type: 'B.Tech',
    stream: 'CSE',
    year: '1',
    accommodation: 'day_scholar',
    student_phone: '',
    parent_name: '',
    parent_whatsapp: '',
  });

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) score++;
    return score;
  };
  const strengthLabels = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const strengthColors = ['transparent', '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'];
  const passwordStrength = getPasswordStrength(form.password);

  const handleRegister = async () => {
    // Validation
    if (!form.full_name || !form.college_id_number || !form.password || !form.course_type || !form.stream || !form.year || !form.accommodation) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    
    // Normalize and validate College ID
    const cleanId = form.college_id_number.trim().toUpperCase();
    const idRegex = /^[A-Z0-9]+$/;
    if (!idRegex.test(cleanId) || cleanId.length < 5 || cleanId.length > 20) {
      Alert.alert('Invalid College ID', 'College ID must be 5-20 alphanumeric characters without spaces or special characters.');
      return;
    }

    // Validate Registration Number if provided
    if (form.registration_number.trim() && !idRegex.test(form.registration_number.trim().toUpperCase())) {
      Alert.alert('Invalid Registration Number', 'Registration Number must be alphanumeric format.');
      return;
    }

    // Validate Email if provided
    if (form.personal_email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.personal_email.trim())) {
        Alert.alert('Invalid Email', 'Please enter a valid email address.');
        return;
      }
      const blockedDomains = ['test.com', 'example.com', 'demo.com', 'fake.com', 'temp.com', 'mailinator.com', 'guerrillamail.com', 'yopmail.com', 'sharklasers.com', 'trashmail.com'];
      const emailDomain = form.personal_email.trim().split('@')[1]?.toLowerCase();
      if (blockedDomains.includes(emailDomain)) {
        Alert.alert('Invalid Email', 'Disposable or demo email addresses are not allowed.');
        return;
      }
    }

    if (form.password.length < 8) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters with uppercase, lowercase, number, and special character.');
      return;
    }
    if (passwordStrength < 5) {
      Alert.alert('Weak Password', 'Password must include uppercase, lowercase, number, and special character.');
      return;
    }
    if (form.student_phone && form.student_phone.replace(/\D/g, '').length !== 10) {
      Alert.alert('Error', 'Student phone must be exactly 10 digits.');
      return;
    }
    if (form.parent_whatsapp && form.parent_whatsapp.replace(/\D/g, '').length !== 10) {
      Alert.alert('Error', 'Parent WhatsApp must be exactly 10 digits.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        college_id_number: form.college_id_number.trim().toUpperCase(),
        registration_number: form.registration_number.trim().toUpperCase(),
        personal_email: form.personal_email.trim().toLowerCase(),
      };
      const response = await api.post('/auth/register', payload);
      if (response.data.success) {
        Alert.alert('Success', 'Student account generated successfully.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.message || error.message || 'Registration failed';
      Alert.alert('Error', errMsg);
    } finally {
      setLoading(false);
    }
  };

  const SelectionPill = ({ label, options, selected, onSelect }: any) => (
    <View style={styles.selectionGroup}>
      <Text style={styles.selectionLabel}>{label}</Text>
      <View style={styles.pillContainer}>
        {options.map((opt: string) => (
          <TouchableOpacity
            key={opt}
            style={[styles.pill, selected === opt && styles.pillActive]}
            onPress={() => onSelect(opt)}
          >
            <Text style={[styles.pillText, selected === opt && styles.pillTextActive]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <AdminGlowingBackground showParticles={false}>
        <SafeAreaView style={styles.safeArea}>
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <MaterialIcons name="arrow-back-ios" size={20} color={colors.white} />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Add Student</Text>
              <Text style={styles.headerSub}>GENERATE NEW ACCOUNT</Text>
            </View>
            <View style={{ width: 44 }} />
          </View>

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Account Credentials</Text>
                <InputField icon="person" placeholder="Full Name" value={form.full_name} onChangeText={(text: string) => setForm({...form, full_name: text})} />
                <InputField icon="badge" placeholder="College ID Number (User ID)" value={form.college_id_number} onChangeText={(text: string) => setForm({...form, college_id_number: text})} />
                <InputField icon="assignment-ind" placeholder="Registration Number (Optional)" value={form.registration_number} onChangeText={(text: string) => setForm({...form, registration_number: text})} />
                <InputField icon="email" placeholder="Personal Email (Optional)" keyboardType="email-address" value={form.personal_email} onChangeText={(text: string) => setForm({...form, personal_email: text})} />
                <InputField icon="lock" placeholder="Password (min 8 chars)" value={form.password} onChangeText={(text: string) => setForm({...form, password: text})} />
                {form.password.length > 0 && (
                  <View style={styles.strengthContainer}>
                    <View style={styles.strengthBarTrack}>
                      <View style={[styles.strengthBarFill, { width: `${(passwordStrength / 5) * 100}%` as any, backgroundColor: strengthColors[passwordStrength] }]} />
                    </View>
                    <Text style={[styles.strengthLabel, { color: strengthColors[passwordStrength] }]}>{strengthLabels[passwordStrength]}</Text>
                  </View>
                )}
              </View>

              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Academic Details</Text>
                <SelectionPill 
                  label="Course Type" 
                  options={['B.Tech', 'M.Tech', 'BCA', 'MCA']} 
                  selected={form.course_type} 
                  onSelect={(val: string) => setForm({...form, course_type: val})} 
                />
                
                <SelectionPill 
                  label="Stream" 
                  options={['CSE', 'ECE', 'ME', 'CE', 'EEE']} 
                  selected={form.stream} 
                  onSelect={(val: string) => setForm({...form, stream: val})} 
                />

                <SelectionPill 
                  label="Year" 
                  options={['1', '2', '3', '4']} 
                  selected={form.year} 
                  onSelect={(val: string) => setForm({...form, year: val})} 
                />

                <SelectionPill 
                  label="Accommodation" 
                  options={['day_scholar', 'hosteler']} 
                  selected={form.accommodation} 
                  onSelect={(val: string) => setForm({...form, accommodation: val})} 
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Contact (Optional)</Text>
                <InputField icon="phone" placeholder="Student Phone (10 digits)" keyboardType="phone-pad" value={form.student_phone} onChangeText={(text: string) => setForm({...form, student_phone: text.replace(/\D/g, '').slice(0, 10)})} />
                <InputField icon="family-restroom" placeholder="Parent Name" value={form.parent_name} onChangeText={(text: string) => setForm({...form, parent_name: text})} />
                <InputField icon="phone-android" placeholder="Parent WhatsApp (10 digits)" keyboardType="phone-pad" value={form.parent_whatsapp} onChangeText={(text: string) => setForm({...form, parent_whatsapp: text.replace(/\D/g, '').slice(0, 10)})} />
              </View>

              <TouchableOpacity 
                style={[styles.submitBtn, loading && { opacity: 0.7 }]} 
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <>
                    <MaterialIcons name="person-add-alt-1" size={20} color={colors.white} style={{ marginRight: 8 }} />
                    <Text style={styles.submitText}>Generate Student Account</Text>
                  </>
                )}
              </TouchableOpacity>

            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </AdminGlowingBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundDark },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 8,
  },
  headerTitle: { color: colors.white, fontSize: 24, fontWeight: '800', textAlign: 'center' },
  headerSub: { color: colors.adminPrimary, fontSize: 10, fontWeight: '800', letterSpacing: 2, textAlign: 'center', marginTop: 4 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 100, paddingTop: 10 },
  formSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: { color: colors.white, fontSize: 16, fontWeight: '700', marginBottom: 16 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    height: 56,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: colors.white, fontSize: 15 },
  selectionGroup: { marginBottom: 16 },
  selectionLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' },
  pillContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  pillActive: {
    backgroundColor: 'rgba(14, 165, 233, 0.2)', // adminPrimary mix
    borderColor: colors.adminPrimary,
  },
  pillText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  pillTextActive: { color: colors.white, fontWeight: '700' },
  submitBtn: {
    flexDirection: 'row',
    backgroundColor: colors.adminPrimary,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: colors.adminPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 8,
    paddingHorizontal: 4,
    gap: 10,
  },
  strengthBarTrack: {
    flex: 1,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  strengthLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    minWidth: 60,
    textAlign: 'right',
  },
});
