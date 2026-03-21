import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { AdminGlowingBackground } from '../../components/layout/AdminGlowingBackground';
import { useAuth } from '../../context/AuthContext';
import adminService, { AdminStats } from '../../services/adminService';

const { width } = Dimensions.get('window');

const KPICard = ({ title, value, icon, color }: any) => (
  <View style={styles.kpiCard}>
    <View style={[styles.kpiIconBox, { backgroundColor: `${color}1A` }]}>
      <MaterialIcons name={icon} size={24} color={color} />
    </View>
    <Text style={styles.kpiValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    <Text style={styles.kpiTitle}>{title}</Text>
  </View>
);

const QuickAction = ({ icon, label, color, onPress }: any) => (
  <TouchableOpacity style={[styles.actionCard, { borderLeftColor: color }]} onPress={onPress}>
    <View style={[styles.actionIconBg, { backgroundColor: `${color}1A` }]}>
      <MaterialIcons name={icon} size={24} color={color} />
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

export const AdminDashboardScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [])
  );

  const fetchStats = async () => {
    try {
      const data = await adminService.getAdminStats();
      setStats(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch admin stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: 15 }}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AdminGlowingBackground showParticles={false}>
        <SafeAreaView style={styles.safeArea}>
          
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Welcome, Admin</Text>
              <Text style={styles.adminName}>{user?.full_name || 'Administrator'}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity style={styles.profileBadge} onPress={() => (navigation as any).navigate('AdminNotifications')}>
                <MaterialIcons name="notifications" size={22} color={colors.adminPrimary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.profileBadge} onPress={() => (navigation as any).navigate('AdminSettings')}>
                <MaterialIcons name="admin-panel-settings" size={24} color={colors.violetAccent} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            {/* KPI Grid */}
            <View style={styles.kpiGrid}>
              <KPICard title="Total Students" value={stats?.total_students || 0} icon="people" color={colors.primary} />
              <KPICard title="Total Collected" value={`₹${stats?.total_collected?.toLocaleString() || 0}`} icon="account-balance-wallet" color={colors.success} />
              <KPICard title="Pending Fees" value={`₹${stats?.total_pending?.toLocaleString() || 0}`} icon="pending-actions" color={colors.warning} />
              <KPICard title="Fee Structures" value={stats?.active_fee_structures || 0} icon="account-tree" color={colors.violetAccent} />
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActionsScroll}>
                <QuickAction 
                  icon="person-add" 
                  label="Add Student" 
                  color={colors.primary} 
                  onPress={() => (navigation as any).navigate('AdminAddStudent')} 
                />
                <QuickAction 
                  icon="receipt" 
                  label="Fee Rules" 
                  color={colors.violetAccent} 
                  onPress={() => (navigation as any).navigate('AdminFeeStructure')} 
                />
                <QuickAction 
                  icon="bar-chart" 
                  label="Reports" 
                  color={colors.success} 
                  onPress={() => (navigation as any).navigate('AdminAnalytics')} 
                />
              </ScrollView>
            </View>

            {/* Recent Payments */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Payments</Text>
                <TouchableOpacity onPress={() => (navigation as any).navigate('AdminPayments')}>
                  <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.listContainer}>
                {stats?.recent_payments?.length === 0 ? (
                  <Text style={{ color: colors.textSecondary, textAlign: 'center', marginVertical: 20 }}>No recent payments.</Text>
                ) : (
                  stats?.recent_payments?.map((tx, idx) => (
                    <View key={idx} style={styles.txCard}>
                      <View style={styles.txLeft}>
                        <View style={[styles.txIconBox, { backgroundColor: `${colors.success}1A` }]}>
                          <MaterialIcons name="check-circle" size={20} color={colors.success} />
                        </View>
                        <View>
                          <Text style={styles.txName}>{tx.students?.users?.full_name || 'Student'}</Text>
                          <Text style={styles.txDate}>{new Date(tx.created_at).toLocaleDateString()}</Text>
                        </View>
                      </View>
                      <Text style={styles.txAmount}>+₹{tx.amount.toLocaleString()}</Text>
                    </View>
                  ))
                )}
              </View>
            </View>

          </ScrollView>
        </SafeAreaView>
      </AdminGlowingBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  greeting: { color: colors.textSecondary, fontSize: 13, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
  adminName: { color: colors.white, fontSize: 24, fontWeight: '800', marginTop: 4 },
  profileBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 100 },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  kpiIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  kpiValue: { color: colors.white, fontSize: 20, fontWeight: '800', marginBottom: 4 },
  kpiTitle: { color: colors.textSecondary, fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  section: { marginBottom: 32, paddingHorizontal: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { color: colors.white, fontSize: 18, fontWeight: '700' },
  seeAll: { color: colors.violetAccent, fontSize: 13, fontWeight: '600' },
  quickActionsScroll: { gap: 16, paddingRight: 24 },
  actionCard: {
    width: 140,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderLeftWidth: 4,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    marginRight: 16,
  },
  actionIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionLabel: { color: colors.white, fontSize: 14, fontWeight: '600' },
  listContainer: { gap: 12 },
  txCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
  },
  txLeft: { flexDirection: 'row', alignItems: 'center' },
  txIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txName: { color: colors.white, fontSize: 14, fontWeight: '600', marginBottom: 2 },
  txDate: { color: colors.textSecondary, fontSize: 11 },
  txAmount: { color: colors.success, fontSize: 16, fontWeight: '700' },
});
