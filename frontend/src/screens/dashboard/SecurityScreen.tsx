import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import authService from '../../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SecurityScreen = () => {
  const navigation = useNavigation();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Load 2FA state
  React.useEffect(() => {
    const load2FA = async () => {
      const saved = await AsyncStorage.getItem('user_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        setTwoFactorEnabled(parsed.twoFactorEnabled ?? false);
      }
    };
    load2FA();
  }, []);

  const handleToggle2FA = async () => {
    const newVal = !twoFactorEnabled;
    setTwoFactorEnabled(newVal);
    try {
      const current = await AsyncStorage.getItem('user_settings');
      const settings = current ? JSON.parse(current) : {};
      settings.twoFactorEnabled = newVal;
      await AsyncStorage.setItem('user_settings', JSON.stringify(settings));
      Alert.alert(newVal ? "2FA Enabled" : "2FA Disabled", `Two-factor authentication has been ${newVal ? 'enabled' : 'disabled'} for your account.`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "All password fields are required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "New password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const response = await authService.changePassword(oldPassword, newPassword);
      if (response.success) {
        Alert.alert("Success", "Your password has been changed successfully.");
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        Alert.alert("Error", response.message || "Failed to change password.");
      }
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back-ios" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Security Settings</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* 2FA Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Two-Factor Authentication</Text>
            <View style={styles.glassCard}>
              <View style={styles.row}>
                <View style={styles.iconContainer}>
                  <MaterialIcons name="verified-user" size={24} color={colors.primary} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.cardLabel}>Enable 2FA</Text>
                  <Text style={styles.cardSublabel}>Secure your account with an extra layer of protection.</Text>
                </View>
                <TouchableOpacity onPress={handleToggle2FA} activeOpacity={0.8}>
                   <View style={[styles.toggleBg, twoFactorEnabled ? styles.toggleBgActive : styles.toggleBgInactive]}>
                      <View style={[styles.toggleThumb, twoFactorEnabled && styles.toggleThumbActive]} />
                   </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Change Password Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Change Password</Text>
            <View style={styles.glassCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Current Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter current password"
                  placeholderTextColor={colors.textSecondary + '80'}
                  secureTextEntry
                  value={oldPassword}
                  onChangeText={setOldPassword}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>New Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter new password"
                  placeholderTextColor={colors.textSecondary + '80'}
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm New Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm new password"
                  placeholderTextColor={colors.textSecondary + '80'}
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>

              <TouchableOpacity 
                style={[styles.saveBtn, loading && { opacity: 0.7 }]} 
                onPress={handleChangePassword}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveBtnText}>Update Password</Text>}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.infoBox}>
            <MaterialIcons name="info-outline" size={20} color={colors.primary} />
            <Text style={styles.infoText}>We recommend choosing a strong password that you don't use elsewhere.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  glassCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  cardSublabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  toggleBg: {
    width: 46,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: 'center',
  },
  toggleBgActive: {
    backgroundColor: colors.primary,
  },
  toggleBgInactive: {
    backgroundColor: colors.surfaceVariant,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.white,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    height: 50,
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 15,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  saveBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.primary + '08',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 10,
    lineHeight: 18,
  },
});

export default SecurityScreen;
