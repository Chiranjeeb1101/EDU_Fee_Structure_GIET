import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, Platform, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsItem = ({ icon, title, showToggle, toggleActive, onToggle, colorClass, onPress }: any) => (
  <TouchableOpacity style={styles.settingsItem} onPress={onToggle || onPress} activeOpacity={showToggle || onPress ? 0.8 : 0.2}>
    <View style={styles.siLeft}>
      <MaterialIcons name={icon} size={20} color={colors.textSecondary} />
      <Text style={styles.siTitle}>{title}</Text>
    </View>
    {showToggle ? (
      <View style={[styles.toggleBg, toggleActive && styles.toggleBgActive]}>
        <View style={[styles.toggleThumb, toggleActive && styles.toggleThumbActive]} />
      </View>
    ) : (
      <View style={styles.chevronBox}>
        <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
      </View>
    )}
  </TouchableOpacity>
);

export const SettingsScreen = () => {
  const navigation = useNavigation();
  const { logout, user, isBioEnabled, toggleBiometrics } = useAuth(); // fetch user for display

  // Toggle States
  const [reminders, setReminders] = React.useState(true);
  const [confirmations, setConfirmations] = React.useState(true);
  const [newsletter, setNewsletter] = React.useState(false);
  const [whatsapp, setWhatsapp] = React.useState(true);

  // Load persistence
  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        const saved = await AsyncStorage.getItem('user_settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          setReminders(parsed.reminders ?? true);
          setConfirmations(parsed.confirmations ?? true);
          setNewsletter(parsed.newsletter ?? false);
          setWhatsapp(parsed.whatsapp ?? true);
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

  const toggleReminder = () => {
    const newVal = !reminders;
    setReminders(newVal);
    saveSetting('reminders', newVal);
  };

  const toggleConfirmation = () => {
    const newVal = !confirmations;
    setConfirmations(newVal);
    saveSetting('confirmations', newVal);
  };

  const toggleNewsletter = () => {
    const newVal = !newsletter;
    setNewsletter(newVal);
    saveSetting('newsletter', newVal);
  };

  const toggleWhatsapp = () => {
    const newVal = !whatsapp;
    setWhatsapp(newVal);
    saveSetting('whatsapp', newVal);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
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
            <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>SETTINGS</Text>
          <View style={styles.iconSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarGlow} />
              <Image 
                source={{ uri: user?.profile_picture || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBMe6_91oLoeN243c8bK58RQU7-i4a7SQ1kaBILzLHQRMEPGIHLn_jMwJ5hRGtUrzj99fKhh6ReA78MsjTreR0iJmwpqBiKXVuYW6ZV_CDRp52TO9UrVuqEKFfqKgXRvgIUqVWcLjX_8E8VzSpKNxeyo88I6AMuTTPOa1mPFFLFLGq4PKhVVyhLpaPxPffWSgqIRt3CyQinLQWqe1fIg5CG5XMPoeQvaOIWx97AtFzLKamFywaAUT11_Ur2pido-qGJHdc_CsGpPAg' }} 
                style={styles.avatarImg} 
              />
              <View style={styles.editBadge}>
                <MaterialIcons name="edit" size={14} color={colors.white} />
              </View>
            </View>
            <Text style={styles.profileName}>{user?.full_name || 'Student Name'}</Text>
            <Text style={styles.profileEmail}>{user?.personal_email || user?.email || 'email@example.com'}</Text>
            <TouchableOpacity 
              style={styles.editProfileBtn}
              onPress={() => (navigation as any).navigate('Profile')}
            >
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Account Settings */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeader}>ACCOUNT SETTINGS</Text>
            <View style={styles.grid2Col}>
              <TouchableOpacity style={[styles.glassCard, styles.colSpan2]} activeOpacity={0.8} onPress={() => Alert.alert("Linked Accounts", "Securely connect your institutional or personal bank accounts for instant fee settlements.")}>
                <View style={styles.accLeft}>
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(144, 171, 255, 0.1)' }]}>
                    <MaterialIcons name="account-balance" size={24} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={styles.cardTitle}>Linked Bank Accounts</Text>
                    <Text style={styles.cardSub}>2 Accounts connected</Text>
                  </View>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.glassCardSq} activeOpacity={0.8} onPress={() => (navigation as any).navigate('PaymentMethods')}>
                <View style={[styles.iconBoxSq, { backgroundColor: 'rgba(175, 136, 255, 0.1)' }]}>
                  <MaterialIcons name="payments" size={24} color={colors.secondary} />
                </View>
                <View>
                  <Text style={styles.cardTitle}>Payment Methods</Text>
                  <Text style={styles.cardSub}>Visa •••• 4242</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.glassCardSq} activeOpacity={0.8} onPress={() => Alert.alert("Currency Configuration", "Multi-currency support is coming soon for international payments.")}>
                <View style={[styles.iconBoxSq, { backgroundColor: 'rgba(71, 196, 255, 0.1)' }]}>
                  <MaterialIcons name="currency-exchange" size={24} color={colors.tertiary} />
                </View>
                <View>
                  <Text style={styles.cardTitle}>Currency Config</Text>
                  <Text style={styles.cardSub}>INR (₹)</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Preferences */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeader}>PREFERENCES</Text>
            <View style={styles.listContainer}>
              <SettingsItem icon="notifications-active" title="Due Date Reminders" showToggle toggleActive={reminders} onToggle={toggleReminder} />
              <View style={styles.divider} />
              <SettingsItem icon="check-circle" title="Payment Confirmation" showToggle toggleActive={confirmations} onToggle={toggleConfirmation} />
              <View style={styles.divider} />
              <SettingsItem icon="mail" title="Newsletter" showToggle toggleActive={newsletter} onToggle={toggleNewsletter} />
            </View>
          </View>

          {/* Security */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeader}>SECURITY</Text>
            <View style={styles.listContainerDk}>
              <SettingsItem icon="face" title="WhatsApp Notification" showToggle toggleActive={whatsapp} onToggle={toggleWhatsapp} />
              <View style={styles.divider} />
              <SettingsItem icon="lock" title="Change Password" onPress={() => (navigation as any).navigate('Security')} />
              <View style={styles.divider} />
              <SettingsItem 
                icon="fingerprint" 
                title="Biometric Security" 
                showToggle 
                toggleActive={isBioEnabled} 
                onToggle={() => toggleBiometrics(!isBioEnabled)} 
              />
              <View style={styles.divider} />
              <SettingsItem icon="verified-user" title="Two-Factor Auth" onPress={() => (navigation as any).navigate('Security')} />
            </View>
          </View>

          {/* Logout */}
          <View style={styles.logoutSection}>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <MaterialIcons name="logout" size={20} color={colors.error} />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
            <Text style={styles.versionText}>SMARTFEE V2.4.0 • KINETIC NEBULA</Text>
          </View>

        </ScrollView>
      </SafeAreaView>
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
  },
  iconBtn: {
    padding: 8,
    backgroundColor: 'rgba(30,37,59,0.4)',
    borderRadius: 20,
  },
  headerTitle: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 2,
  },
  iconSpacer: {
    width: 40,
  },
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
    marginBottom: 16,
  },
  avatarGlow: {
    position: 'absolute',
    inset: -8,
    borderRadius: 100,
    backgroundColor: colors.primary,
    opacity: 0.3,
  },
  avatarImg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: '#1e253b',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#316bf3',
    padding: 6,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#090e1c',
  },
  profileName: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  profileEmail: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  editProfileBtn: {
    marginTop: 16,
    backgroundColor: '#316bf3',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: '#316bf3',
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  editProfileText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  sectionBlock: {
    marginBottom: 32,
  },
  sectionHeader: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 12,
    marginLeft: 8,
  },
  grid2Col: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  glassCard: {
    backgroundColor: 'rgba(30, 37, 59, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  colSpan2: {
    width: '100%',
  },
  glassCardSq: {
    backgroundColor: 'rgba(30, 37, 59, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'space-between',
  },
  accLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    padding: 12,
    borderRadius: 24,
    marginRight: 16,
  },
  iconBoxSq: {
    padding: 12,
    borderRadius: 24,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  cardTitle: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 4,
  },
  cardSub: {
    color: colors.textSecondary,
    fontSize: 10,
  },
  listContainer: {
    backgroundColor: '#0d1323',
    borderRadius: 16,
    overflow: 'hidden',
  },
  listContainerDk: {
    backgroundColor: 'rgba(30, 37, 59, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  siLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  siTitle: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  toggleBg: {
    width: 48,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1e253b',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleBgActive: {
    backgroundColor: '#316bf3',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.textSecondary,
  },
  toggleThumbActive: {
    backgroundColor: '#fff',
    transform: [{ translateX: 24 }],
  },
  chevronBox: {},
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  logoutSection: {
    paddingTop: 16,
    paddingBottom: 40,
    alignItems: 'center',
  },
  logoutBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 113, 108, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 113, 108, 0.2)',
    gap: 8,
    marginBottom: 24,
  },
  logoutText: {
    color: colors.error,
    fontWeight: '800',
    fontSize: 14,
  },
  versionText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
});
