import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, Platform, Alert, Modal, TextInput, KeyboardAvoidingView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileListItem = ({ icon, title, subtitle, colorClass, showToggle, toggleActive, onPress }: any) => (
  <TouchableOpacity style={styles.listItem} activeOpacity={0.8} onPress={onPress}>
    <View style={styles.liLeft}>
      <View style={[styles.iconBox, { backgroundColor: colorClass }]}>
        <MaterialIcons name={icon} size={24} color={colorClass.replace('/10', '').replace('0.1)', '1)')} />
      </View>
      <View style={styles.liTextContainer}>
        <Text style={styles.liTitle}>{title}</Text>
        {subtitle && <Text style={styles.liSubtitle}>{subtitle}</Text>}
      </View>
    </View>
    {showToggle ? (
      <View style={[styles.toggleBg, toggleActive ? styles.toggleBgActive : styles.toggleBgInactive]}>
        <View style={[styles.toggleThumb, toggleActive && styles.toggleThumbActive]} />
      </View>
    ) : (
      <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
    )}
  </TouchableOpacity>
);

export const ProfileScreen = () => {
  const navigation = useNavigation();
  const { logout, user, updateUser } = useAuth();
  
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Toggle States
  const [pushNotif, setPushNotif] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(false);

  // Load persistence
  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        const saved = await AsyncStorage.getItem('user_settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          setPushNotif(parsed.pushNotif ?? true);
          setEmailAlerts(parsed.emailAlerts ?? false);
        }
      } catch (e) {
        console.warn('Failed to load settings', e);
      }
    };
    loadSettings();
  }, []);

  // Save persistence helper
  const saveSetting = async (key: string, value: boolean) => {
    try {
      const current = await AsyncStorage.getItem('user_settings');
      const settings = current ? JSON.parse(current) : {};
      settings[key] = value;
      await AsyncStorage.setItem('user_settings', JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save setting', e);
    }
  };

  const togglePushNotif = () => {
    const newVal = !pushNotif;
    setPushNotif(newVal);
    saveSetting('pushNotif', newVal);
  };

  const toggleEmailAlerts = () => {
    const newVal = !emailAlerts;
    setEmailAlerts(newVal);
    saveSetting('emailAlerts', newVal);
  };

  // Edit Modal States
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(user?.full_name || '');
  const [editEmail, setEditEmail] = useState(user?.personal_email || user?.email || '');
  const [editPhone, setEditPhone] = useState(user?.student_phone || '');
  const [editImage, setEditImage] = useState<string | null>(null);
  const [editImageBase64, setEditImageBase64] = useState<string | null>(null);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled) {
      setEditImage(result.assets[0].uri);
      setEditImageBase64(result.assets[0].base64 ? `data:image/jpeg;base64,${result.assets[0].base64}` : null);
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert("Error", "Name cannot be empty");
      return;
    }

    setIsUpdating(true);
    try {
      const result = await updateUser({
        full_name: editName,
        personal_email: editEmail,
        student_phone: editPhone,
        profile_picture: editImageBase64 || undefined
      });

      if (result.success) {
        setEditModalVisible(false);
        setEditImage(null);
        setEditImageBase64(null);
        Alert.alert("Success", "Profile updated successfully!");
      } else {
        Alert.alert("Error", result.message);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            (navigation as any).reset({ index: 0, routes: [{ name: 'Welcome' }] });
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => (navigation as any).navigate('MainTabs', { screen: 'Dashboard' })} style={styles.iconBtn}>
            <MaterialIcons name="arrow-back" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <MaterialIcons name="account-circle" size={24} color={colors.primary} />
            <Text style={styles.headerTitle}>EDU-Fee</Text>
          </View>
          <View style={styles.iconSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Profile Header */}
          <View style={styles.profileSection}>
            <TouchableOpacity style={styles.avatarWrapper} onPress={pickImage}>
              <View style={styles.avatarGlow} />
              <View style={styles.avatarBorder}>
                <Image 
                  source={{ uri: editImage || user?.profile_picture || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAP7c6BKhlg06MLobhj0M2A7aFjdsRXxVarCJoKlNsWM69F4glA_7JmXiOr86Is6g70T3DWr2XUvQK5JF0gMKLqTnC8UpACxoqSMF57ee8uFohF0juMeRgX5Vs_R0ASSMl9VdiWbL31t2Di2XVUIdLX2gm7x30ykuZQmjZS195IF9VBecZyLR8d_UXVknhN0CLwIvBdnTHwzjGeCau0dcM5XqEimb3wzc9S_kX6BDbc3PIdy48DR3qsjv8m5o1O8hd00g9LI8mOWJw' }} 
                  style={styles.avatarImg} 
                />
              </View>
              <View style={styles.editBadge}>
                <MaterialIcons name="camera-alt" size={16} color={colors.white} />
              </View>
            </TouchableOpacity>
            <Text style={styles.profileName}>{user?.full_name || 'Alex Rivera'}</Text>
            <Text style={styles.profileId}>Registration ID: {user?.college_id_number || '2026-XXXX-XXXX'}</Text>
          </View>

          {/* Settings List */}
          <View style={styles.listSection}>
            <ProfileListItem 
              icon="person" 
              title="Edit Personal Details" 
              subtitle="Name, Email, Phone, Address"
              colorClass="rgba(144, 171, 255, 0.1)" // primary dim
              onPress={() => setEditModalVisible(true)}
            />
            <ProfileListItem 
              icon="badge" 
              title="Digital Identity Card" 
              subtitle="View your verified student ID"
              colorClass="rgba(71, 196, 255, 0.1)" // tertiary dim
              onPress={() => (navigation as any).navigate('DigitalIdentityCard')}
            />
            <ProfileListItem 
              icon="payments" 
              title="Manage Payments" 
              subtitle="Saved cards, UPI IDs, limits"
              colorClass="rgba(175, 136, 255, 0.1)" // secondary dim
              onPress={() => (navigation as any).navigate('PaymentMethods')}
            />
            
            <Text style={styles.sectionLabel}>PREFERENCES & SECURITY</Text>
            
            <View style={styles.nestedCard}>
              <View style={styles.nestedHeader}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(71, 196, 255, 0.1)' }]}>
                  <MaterialIcons name="notifications" size={24} color={colors.tertiary} />
                </View>
                <View style={styles.liTextContainer}>
                  <Text style={styles.liTitle}>Notifications</Text>
                  <Text style={styles.liSubtitle}>Alerts and preference sync</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
              <View style={styles.infoIconBg}>
                <MaterialIcons name="badge" size={18} color={colors.primary} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>COLLEGE ID</Text>
                <Text style={styles.infoValue}>{user?.college_id_number || 'Not Set'}</Text>
              </View>
            </View>

            {user?.registration_number && (
              <View style={styles.infoRow}>
                <View style={styles.infoIconBg}>
                  <MaterialIcons name="assignment-ind" size={18} color={colors.primary} />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>REGISTRATION NO</Text>
                  <Text style={styles.infoValue}>{user.registration_number}</Text>
                </View>
              </View>
            )}
              <View style={styles.nestedContent}>
                <TouchableOpacity style={styles.nestedRow} onPress={togglePushNotif} activeOpacity={0.8}>
                  <Text style={styles.nestedRowText}>Push Notifications</Text>
                  <View style={[styles.toggleBg, pushNotif ? styles.toggleBgActive : styles.toggleBgInactive]}>
                    <View style={[styles.toggleThumb, pushNotif && styles.toggleThumbActive]} />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.nestedRow} onPress={toggleEmailAlerts} activeOpacity={0.8}>
                  <Text style={styles.nestedRowText}>Email Alerts</Text>
                  <View style={[styles.toggleBg, emailAlerts ? styles.toggleBgActive : styles.toggleBgInactive]}>
                    <View style={[styles.toggleThumb, emailAlerts && styles.toggleThumbActive]} />
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            <ProfileListItem 
              icon="security" 
              title="Security" 
              subtitle="Password reset"
              colorClass="rgba(255, 113, 108, 0.1)" // error dim
              onPress={() => (navigation as any).navigate('Security')}
            />
            <ProfileListItem 
              icon="help" 
              title="Support & Help" 
              subtitle="FAQs, Contact support, Privacy"
              colorClass="rgba(166, 170, 191, 0.1)" // surface variant dim
              onPress={() => Alert.alert("Support Center", "The support portal is being upgraded. Please contact support@edu-fee.com for immediate help.")}
            />
          </View>

          {/* Logout */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <MaterialIcons name="logout" size={20} color={colors.error} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>

      {/* Edit Profile Modal */}
      <Modal visible={isEditModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.closeBtn}>
                <MaterialIcons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>FULL NAME</Text>
                <TextInput style={styles.input} value={editName} onChangeText={setEditName} placeholder="Alex Rivera" placeholderTextColor="rgba(255,255,255,0.3)" />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                <TextInput style={styles.input} value={editEmail} onChangeText={setEditEmail} placeholder="alex@example.com" placeholderTextColor="rgba(255,255,255,0.3)" keyboardType="email-address" autoCapitalize="none" />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>PHONE NUMBER</Text>
                <TextInput style={styles.input} value={editPhone} onChangeText={setEditPhone} placeholder="+1 (555) 000-0000" placeholderTextColor="rgba(255,255,255,0.3)" keyboardType="phone-pad" />
              </View>

              <TouchableOpacity 
                style={[styles.saveBtn, (isUpdating || !editName.trim()) && { opacity: 0.7 }]} 
                onPress={handleSaveProfile}
                disabled={isUpdating || !editName.trim()}
              >
                <Text style={styles.saveBtnText}>{isUpdating ? "Saving..." : "Save Changes"}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      
      {/* Background decoration elements could go here if needed, keeping it simple for now */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090e1c' },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    height: Platform.OS === 'android' ? 80 : 64,
    paddingTop: Platform.OS === 'android' ? 30 : 10,
    backgroundColor: '#0d1323',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(49,107,243,0.3)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      android: { elevation: 8 },
    }),
  },
  iconBtn: {
    padding: 8,
    backgroundColor: 'rgba(30,37,59,0.4)',
    borderRadius: 20,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  iconSpacer: { width: 40 },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 24,
  },
  avatarGlow: {
    position: 'absolute',
    inset: -8,
    borderRadius: 100,
    backgroundColor: colors.primary,
    opacity: 0.2,
  },
  avatarBorder: {
    padding: 4,
    borderWidth: 2,
    borderColor: 'rgba(144, 171, 255, 0.2)',
    borderRadius: 60,
    backgroundColor: '#13192b',
  },
  avatarImg: {
    width: 104,
    height: 104,
    borderRadius: 52,
  },
  editBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: colors.primary,
    padding: 6,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#090e1c',
  },
  profileName: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  profileId: {
    color: 'rgba(144, 171, 255, 0.8)',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 14, 28, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#13192b',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.white,
  },
  closeBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
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
    backgroundColor: 'rgba(30,37,59,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    color: colors.white,
    fontSize: 15,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  saveBtnText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 1,
  },
  listSection: {
    gap: 16,
  },
  listItem: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  liLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liTextContainer: {
    gap: 4,
  },
  liTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  liSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 24,
    marginLeft: 8,
    marginBottom: 8,
  },
  nestedCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 20,
  },
  nestedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  nestedContent: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 16,
    gap: 16,
  },
  nestedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nestedRowText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  toggleBg: {
    width: 40,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 2,
    justifyContent: 'center',
  },
  toggleBgActive: {
    backgroundColor: 'rgba(144, 171, 255, 0.2)',
  },
  toggleBgInactive: {
    backgroundColor: '#434759',
  },
  toggleThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#242b43',
  },
  toggleThumbActive: {
    backgroundColor: colors.primary,
    transform: [{ translateX: 20 }],
  },
  logoutBtn: {
    marginTop: 40,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 30,
    backgroundColor: '#1e253b',
    borderWidth: 1,
    borderColor: 'rgba(255, 113, 108, 0.2)',
    gap: 8,
  },
  logoutText: {
    color: colors.error,
    fontWeight: '800',
    fontSize: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    gap: 16,
  },
  infoIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextContainer: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  infoValue: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});
