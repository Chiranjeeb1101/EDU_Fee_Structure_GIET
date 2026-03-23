import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { AdminGlowingBackground } from '../../components/layout/AdminGlowingBackground';
import resetService, { ResetRequest } from '../../services/resetService';

export const AdminResetRequestsScreen = () => {
  const navigation = useNavigation();
  const [requests, setRequests] = useState<ResetRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchRequests = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const data = await resetService.getPendingRequests();
      setRequests(data);
    } catch (error) {
      console.error('Fetch requests failed:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(() => fetchRequests(false), 15000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await resetService.updateRequestStatus(id, status);
      // Removed alert to make it feel ultra-fast. The list just updates!
      fetchRequests(false);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update request.');
    }
  };

  const renderItem = ({ item }: { item: ResetRequest }) => (
    <View style={styles.requestCard}>
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
           <View style={styles.avatarContainer}>
             <View style={styles.avatarGlow} />
             <View style={styles.avatar}>
               <Text style={styles.avatarText}>{item.students.users.full_name.charAt(0)}</Text>
             </View>
           </View>
           <View style={styles.userTextInfo}>
             <Text style={styles.userName} numberOfLines={1}>{item.students.users.full_name}</Text>
             <View style={styles.idBadge}>
               <MaterialIcons name="badge" size={12} color={colors.textSecondary} />
               <Text style={styles.userId}>{item.students.college_id_number}</Text>
             </View>
           </View>
        </View>
        <View style={styles.timeBadge}>
           <MaterialIcons name="schedule" size={12} color={colors.violetAccent} />
           <Text style={styles.timeText}>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>
      </View>

      <Text style={styles.requestReason}>Requested a password reset link.</Text>

      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.rejectBtn]} 
          onPress={() => handleAction(item.id, 'rejected')}
          activeOpacity={0.7}
        >
          <MaterialIcons name="close" size={20} color="#FF4D4D" />
          <Text style={styles.rejectText}>Decline</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionBtn, styles.approveBtn]} 
          onPress={() => handleAction(item.id, 'approved')}
          activeOpacity={0.7}
        >
          <MaterialIcons name="check-circle" size={20} color="#fff" />
          <Text style={styles.approveText}>Approve Reset</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <AdminGlowingBackground showParticles={true}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <MaterialIcons name="arrow-back" size={24} color={colors.white} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
               <Text style={styles.title}>Access Requests</Text>
               <Text style={styles.subtitle}>Manage pending password resets</Text>
            </View>
            <View style={styles.badge}>
                <Text style={styles.badgeText}>{requests.length}</Text>
            </View>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
               <ActivityIndicator size="large" color={colors.adminPrimary} />
               <Text style={styles.loadingText}>Fetching secure requests...</Text>
            </View>
          ) : (
            <FlatList
              data={requests}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={isRefreshing} onRefresh={() => fetchRequests(true)} tintColor={colors.adminPrimary} />
              }
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconContainer}>
                     <View style={styles.emptyIconGlow} />
                     <MaterialIcons name="shield" size={64} color={colors.adminPrimary} />
                  </View>
                  <Text style={styles.emptyTitle}>Security Clear</Text>
                  <Text style={styles.emptySubtitle}>No pending password reset requests at the moment. You're all caught up!</Text>
                </View>
              }
            />
          )}
        </SafeAreaView>
      </AdminGlowingBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.adminBackground },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 45 : 10, paddingBottom: 20 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  headerTitleContainer: { flex: 1 },
  title: { fontSize: 22, fontWeight: '800', color: colors.white },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  badge: { backgroundColor: 'rgba(255, 77, 77, 0.15)', borderWidth: 1, borderColor: 'rgba(255, 77, 77, 0.3)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginLeft: 10 },
  badgeText: { color: '#FF4D4D', fontSize: 14, fontWeight: '800' },
  listContent: { paddingHorizontal: 24, paddingBottom: 100, paddingTop: 10 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: colors.textSecondary, marginTop: 16, fontSize: 14, letterSpacing: 1 },
  requestCard: { 
    backgroundColor: 'rgba(255, 255, 255, 0.02)', 
    borderRadius: 24, 
    padding: 20, 
    marginBottom: 16, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 5,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  userInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatarContainer: { position: 'relative', marginRight: 16 },
  avatarGlow: { position: 'absolute', width: 48, height: 48, borderRadius: 24, backgroundColor: colors.adminPrimary, opacity: 0.2, transform: [{ scale: 1.2 }] },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  avatarText: { color: colors.adminPrimary, fontWeight: '800', fontSize: 20 },
  userTextInfo: { flex: 1, paddingRight: 10 },
  userName: { color: 'white', fontWeight: '800', fontSize: 17, marginBottom: 4 },
  idBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  userId: { color: colors.textSecondary, fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  timeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(139, 92, 246, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  timeText: { color: colors.violetAccent, fontSize: 11, fontWeight: '700' },
  requestReason: { color: colors.textMuted, fontSize: 14, marginBottom: 20, paddingHorizontal: 4 },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 16, gap: 8 },
  rejectBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255, 77, 77, 0.3)' },
  approveBtn: { backgroundColor: '#00D09E', shadowColor: '#00D09E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  rejectText: { color: '#FF4D4D', fontWeight: '800', fontSize: 15 },
  approveText: { color: '#ffffff', fontWeight: '800', fontSize: 15 },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyIconContainer: { position: 'relative', marginBottom: 24, justifyContent: 'center', alignItems: 'center' },
  emptyIconGlow: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: colors.adminPrimary, opacity: 0.15, transform: [{ scale: 1.5 }] },
  emptyTitle: { color: 'white', fontSize: 22, fontWeight: '800', marginBottom: 8 },
  emptySubtitle: { color: colors.textSecondary, textAlign: 'center', fontSize: 14, lineHeight: 22, paddingHorizontal: 30 },
});
