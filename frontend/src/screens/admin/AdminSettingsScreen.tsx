import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, TextInput, Modal, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { AdminGlowingBackground } from '../../components/layout/AdminGlowingBackground';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const SettingItem = ({ icon, title, subtitle, onPress, color, danger }: any) => (
  <TouchableOpacity style={[styles.settingItem, danger && styles.settingItemDanger]} onPress={onPress}>
    <View style={[styles.settingIconBox, { backgroundColor: danger ? 'rgba(239,68,68,0.1)' : `${color || colors.adminPrimary}1A` }]}>
      <MaterialIcons name={icon} size={22} color={danger ? colors.error : (color || colors.adminPrimary)} />
    </View>
    <View style={styles.settingInfo}>
      <Text style={[styles.settingTitle, danger && { color: colors.error }]}>{title}</Text>
      {subtitle ? <Text style={styles.settingSubtitle}>{subtitle}</Text> : null}
    </View>
    <MaterialIcons name="chevron-right" size={22} color={danger ? colors.error : colors.textSecondary} />
  </TouchableOpacity>
);

export const AdminSettingsScreen = () => {
  const navigation = useNavigation();
  const { logout, user } = useAuth();
  
  // Profile Edit state
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    personal_email: user?.personal_email || '',
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Password Reset state
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
          await logout();
          (navigation as any).reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }
      }
    ]);
  };

  const handleProfileSave = async () => {
    if (!profileForm.full_name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    setProfileLoading(true);
    try {
      await api.put('/auth/profile', profileForm);
      Alert.alert('Success', 'Profile updated successfully');
      setShowProfileEdit(false);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!passwordForm.old_password || !passwordForm.new_password) {
      Alert.alert('Error', 'All password fields are required');
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    if (passwordForm.new_password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    setPasswordLoading(true);
    try {
      await api.put('/auth/change-password', {
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password,
      });
      Alert.alert('Success', 'Password changed successfully');
      setShowPasswordReset(false);
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <AdminGlowingBackground showParticles={false}>
        <SafeAreaView style={styles.safeArea}>
          
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <MaterialIcons name="arrow-back" size={24} color={colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Admin Settings</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

            {/* Profile Card */}
            <View style={styles.profileCard}>
              <View style={styles.avatar}>
                <MaterialIcons name="admin-panel-settings" size={40} color={colors.adminPrimary} />
              </View>
              <Text style={styles.name}>{user?.full_name || 'Administrator'}</Text>
              <Text style={styles.email}>{user?.personal_email || 'admin@giet.edu'}</Text>
              <Text style={styles.roleBadgeText}>ADMINISTRATOR</Text>
            </View>

            {/* Settings List */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account</Text>
              <SettingItem 
                icon="person" 
                title="Edit Profile" 
                subtitle="Update your name and email" 
                color={colors.primary}
                onPress={() => {
                  setProfileForm({
                    full_name: user?.full_name || '',
                    personal_email: user?.personal_email || '',
                  });
                  setShowProfileEdit(true);
                }}
              />
              <SettingItem 
                icon="lock" 
                title="Change Password" 
                subtitle="Update your login password" 
                color={colors.violetAccent}
                onPress={() => setShowPasswordReset(true)}
              />
              <SettingItem 
                icon="notifications" 
                title="Notifications" 
                subtitle="View all alerts and reminders" 
                color={colors.warning}
                onPress={() => (navigation as any).navigate('AdminNotifications')}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>System</Text>
              <SettingItem 
                icon="info" 
                title="About" 
                subtitle="EDUFee v1.0 · GIET University" 
                color={colors.textSecondary}
                onPress={() => Alert.alert('EDUFee', 'Version 1.0\nAdmin Panel\nGIET University')}
              />
              <SettingItem 
                icon="logout" 
                title="Sign Out" 
                danger
                onPress={handleLogout}
              />
            </View>

          </ScrollView>

          {/* Profile Edit Modal */}
          <Modal visible={showProfileEdit} animationType="slide" transparent>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Edit Profile</Text>
                    <TouchableOpacity onPress={() => setShowProfileEdit(false)}>
                      <MaterialIcons name="close" size={24} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Full Name</Text>
                    <TextInput 
                      style={styles.input} 
                      value={profileForm.full_name} 
                      onChangeText={t => setProfileForm({...profileForm, full_name: t})} 
                      placeholderTextColor={colors.textSecondary}
                      placeholder="Enter your name"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Email</Text>
                    <TextInput 
                      style={styles.input} 
                      value={profileForm.personal_email} 
                      onChangeText={t => setProfileForm({...profileForm, personal_email: t})} 
                      placeholderTextColor={colors.textSecondary}
                      placeholder="Enter your email"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>

                  <TouchableOpacity style={styles.saveBtn} onPress={handleProfileSave} disabled={profileLoading}>
                    {profileLoading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </Modal>

          {/* Password Reset Modal */}
          <Modal visible={showPasswordReset} animationType="slide" transparent>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Change Password</Text>
                    <TouchableOpacity onPress={() => setShowPasswordReset(false)}>
                      <MaterialIcons name="close" size={24} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Current Password</Text>
                    <TextInput 
                      style={styles.input} 
                      value={passwordForm.old_password} 
                      onChangeText={t => setPasswordForm({...passwordForm, old_password: t})} 
                      secureTextEntry
                      placeholderTextColor={colors.textSecondary}
                      placeholder="Enter current password"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>New Password</Text>
                    <TextInput 
                      style={styles.input} 
                      value={passwordForm.new_password} 
                      onChangeText={t => setPasswordForm({...passwordForm, new_password: t})} 
                      secureTextEntry
                      placeholderTextColor={colors.textSecondary}
                      placeholder="Enter new password"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Confirm New Password</Text>
                    <TextInput 
                      style={styles.input} 
                      value={passwordForm.confirm_password} 
                      onChangeText={t => setPasswordForm({...passwordForm, confirm_password: t})} 
                      secureTextEntry
                      placeholderTextColor={colors.textSecondary}
                      placeholder="Confirm new password"
                    />
                  </View>

                  <TouchableOpacity style={styles.saveBtn} onPress={handlePasswordReset} disabled={passwordLoading}>
                    {passwordLoading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveBtnText}>Update Password</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </Modal>

        </SafeAreaView>
      </AdminGlowingBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.adminBackground },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerTitle: { color: colors.white, fontSize: 18, fontWeight: '700' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 100 },
  profileCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24,
    padding: 32,
    marginBottom: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.3)',
  },
  name: { color: colors.white, fontSize: 20, fontWeight: '800', marginBottom: 4 },
  email: { color: colors.textSecondary, fontSize: 14, marginBottom: 12 },
  roleBadgeText: { 
    color: colors.adminPrimary, 
    fontSize: 10, 
    fontWeight: '800', 
    letterSpacing: 2,
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  section: { marginBottom: 24 },
  sectionTitle: { color: colors.textSecondary, fontSize: 11, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    gap: 14,
  },
  settingItemDanger: {
    backgroundColor: 'rgba(239,68,68,0.04)',
    borderColor: 'rgba(239,68,68,0.15)',
  },
  settingIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingInfo: { flex: 1 },
  settingTitle: { color: colors.white, fontSize: 15, fontWeight: '600', marginBottom: 2 },
  settingSubtitle: { color: colors.textSecondary, fontSize: 12 },
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { color: colors.white, fontSize: 20, fontWeight: '800' },
  inputGroup: { marginBottom: 16 },
  inputLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 16,
    color: colors.white,
    fontSize: 15,
  },
  saveBtn: {
    backgroundColor: colors.adminPrimary,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  saveBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
