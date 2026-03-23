import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Platform, Dimensions, Image, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { useRef } from 'react';

const { width } = Dimensions.get('window');

export const IdentityCardScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const viewShotRef = useRef<any>(null);

  const handleSaveToGallery = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant gallery access to save your identity card.');
        return;
      }

      const uri = await captureRef(viewShotRef, {
        format: 'png',
        quality: 1.0,
      });

      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Success', 'Digital Identity saved to your gallery!');
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save identity card.');
    }
  };

  const handleShareIdentity = async () => {
    try {
      const uri = await captureRef(viewShotRef, {
        format: 'png',
        quality: 1.0,
      });

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Error', 'Sharing is not available on this device');
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Share my Digital Identity',
        UTI: 'public.png',
      });
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share identity card.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Decorators */}
      <View style={[styles.bgOrb, styles.bgOrbTopRight]} />
      <View style={[styles.bgOrb, styles.bgOrbBottomLeft]} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Digital Identity</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Digital ID Card */}
          <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }}>
            <View style={styles.cardWrapper}>
              <View style={styles.cardGlow} />
              <View style={styles.cardBorder}>
                <View style={styles.cardContent}>
                  
                  {/* Card Header Top */}
                  <View style={styles.cardHeaderTop}>
                    <View style={styles.institutionInfo}>
                      <View style={styles.schoolIconBox}>
                        <MaterialIcons name="school" size={20} color="#000" />
                      </View>
                      <View>
                        <Text style={styles.instName}>EDU-Fee</Text>
                        <Text style={styles.instDesc}>GIET UNIVERSITY</Text>
                      </View>
                    </View>
                    <View style={styles.activePassBadge}>
                      <View style={styles.activeDot} />
                      <Text style={styles.activePassText}>STUDENT ID</Text>
                    </View>
                  </View>

                  {/* Profile Section */}
                  <View style={styles.profileSection}>
                    <View style={styles.avatarContainer}>
                      <View style={styles.avatarGlow}>
                        <Image 
                          source={{ uri: user?.profile_picture || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAP7c6BKhlg06MLobhj0M2A7aFjdsRXxVarCJoKlNsWM69F4glA_7JmXiOr86Is6g70T3DWr2XUvQK5JF0gMKLqTnC8UpACxoqSMF57ee8uFohF0juMeRgX5Vs_R0ASSMl9VdiWbL31t2Di2XVUIdLX2gm7x30ykuZQmjZS195IF9VBecZyLR8d_UXVknhN0CLwIvBdnTHwzjGeCau0dcM5XqEimb3wzc9S_kX6BDbc3PIdy48DR3qsjv8m5o1O8hd00g9LI8mOWJw' }} 
                          style={styles.avatarImage} 
                        />
                      </View>
                      <View style={styles.checkBadge}>
                        <MaterialIcons name="verified" size={14} color="#003b52" />
                      </View>
                    </View>
                    
                    <Text style={styles.profileName}>{user?.full_name || 'Student Name'}</Text>
                    
                    <View style={styles.regBadge}>
                      <Text style={styles.regLabel}>REG ID</Text>
                      <Text style={styles.regValue}>{user?.college_id_number || '2026-XXXX-XXXX'}</Text>
                    </View>
                  </View>

                  {/* Details Grid */}
                  <View style={styles.detailsGrid}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailLabel}>DEPARTMENT</Text>
                      <Text style={styles.detailValue} numberOfLines={2}>{user?.stream || 'N/A'}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', marginLeft: 16 }}>
                      <Text style={styles.detailLabel}>COURSE</Text>
                      <Text style={[styles.detailValue, { textTransform: 'uppercase' }]}>{user?.course_type || 'N/A'}</Text>
                    </View>
                  </View>

                  {/* QR Section */}
                  <View style={styles.qrSection}>
                    <View>
                      <View style={styles.scannerStatus}>
                        <View style={styles.scannerDot} />
                        <Text style={styles.scannerText}>SECURE SCAN</Text>
                      </View>
                      <Text style={styles.verifiedText}>Verified Campus Access</Text>
                    </View>
                    <View style={styles.qrIconBox}>
                      <MaterialIcons name="qr-code-2" size={40} color="#090e1c" />
                    </View>
                  </View>

                </View>
              </View>
            </View>
          </ViewShot>

          {/* Action Area */}
          <View style={styles.actionArea}>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleSaveToGallery}>
              <MaterialIcons name="file-download" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <Text style={styles.secondaryText}>SAVE TO GALLERY</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryButton} onPress={handleShareIdentity}>
              <MaterialIcons name="share" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <Text style={styles.secondaryText}>SHARE IDENTITY</Text>
            </TouchableOpacity>
            
            <Text style={styles.footerNote}>Digitally Verified by GIET Authority</Text>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090e1c' },
  bgOrb: { position: 'absolute', width: 500, height: 500, borderRadius: 250, opacity: 0.12 },
  bgOrbTopRight: { backgroundColor: '#6001d1', top: '-10%', right: '-15%' },
  bgOrbBottomLeft: { backgroundColor: '#316bf3', bottom: '10%', left: '-15%' },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    paddingBottom: 20,
  },
  backBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20 },
  headerTitle: { color: colors.white, fontSize: 18, fontWeight: '800' },
  scrollContent: { flexGrow: 1, padding: 24, alignItems: 'center' },
  cardWrapper: { width: '100%', maxWidth: 400, position: 'relative', marginBottom: 40 },
  cardGlow: { position: 'absolute', inset: -16, backgroundColor: 'rgba(37, 99, 235, 0.1)', borderRadius: 48 },
  cardBorder: { borderRadius: 40, padding: 2, backgroundColor: 'rgba(144, 171, 255, 0.3)' },
  cardContent: { backgroundColor: '#0d1323', borderRadius: 38, padding: 32 },
  cardHeaderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 },
  institutionInfo: { flexDirection: 'row', alignItems: 'center' },
  schoolIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  instName: { color: colors.white, fontSize: 16, fontWeight: '700' },
  instDesc: { color: colors.textSecondary, fontSize: 8, fontWeight: '800', letterSpacing: 1.5 },
  activePassBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(30, 37, 59, 0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(67, 71, 89, 0.3)' },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#47c4ff', marginRight: 6 },
  activePassText: { color: '#47c4ff', fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  profileSection: { alignItems: 'center', marginBottom: 32 },
  avatarContainer: { position: 'relative', marginBottom: 20 },
  avatarGlow: { width: 130, height: 130, borderRadius: 65, padding: 4, backgroundColor: 'rgba(37, 99, 235, 0.3)' },
  avatarImage: { width: '100%', height: '100%', borderRadius: 100, borderWidth: 2, borderColor: '#1e253b' },
  checkBadge: { position: 'absolute', bottom: 5, right: 5, backgroundColor: '#47c4ff', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#0d1323' },
  profileName: { fontSize: 28, fontWeight: '800', color: colors.white, marginBottom: 12, textAlign: 'center' },
  regBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(37, 99, 235, 0.1)', borderWidth: 1, borderColor: 'rgba(37, 99, 235, 0.2)', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  regLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginRight: 8 },
  regValue: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  detailsGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 24, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  detailLabel: { color: colors.textSecondary, fontSize: 9, fontWeight: '800', letterSpacing: 1.5, marginBottom: 6 },
  detailValue: { color: colors.white, fontSize: 12, fontWeight: '600' },
  qrSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 32, backgroundColor: 'rgba(13, 19, 35, 0.6)', padding: 16, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  scannerStatus: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  scannerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#47c4ff', marginRight: 8 },
  scannerText: { color: '#47c4ff', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  verifiedText: { color: colors.textSecondary, fontSize: 10, fontWeight: '500' },
  qrIconBox: { width: 48, height: 48, backgroundColor: '#fff', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  actionArea: { width: '100%', alignItems: 'center' },
  secondaryButton: { flexDirection: 'row', width: '100%', backgroundColor: 'rgba(30, 37, 59, 0.4)', borderWidth: 1, borderColor: 'rgba(67, 71, 89, 0.2)', paddingHorizontal: 24, paddingVertical: 16, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  secondaryText: { color: colors.textSecondary, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  footerNote: { color: 'rgba(166, 170, 191, 0.5)', fontSize: 10, fontWeight: '500' },
});
