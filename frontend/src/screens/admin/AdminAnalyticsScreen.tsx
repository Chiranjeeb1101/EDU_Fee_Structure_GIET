import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, Alert, Dimensions, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { AdminGlowingBackground } from '../../components/layout/AdminGlowingBackground';
import adminService, { AdminStats } from '../../services/adminService';

const { width } = Dimensions.get('window');

export const AdminAnalyticsScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await adminService.getAdminStats();
      setStats(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch analytics data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.violetAccent} />
        <Text style={{ color: colors.textSecondary, marginTop: 15 }}>Compiling Reports...</Text>
      </View>
    );
  }

  const totalExpected = (stats.total_collected || 0) + (stats.total_pending || 0);
  const collectionRate = totalExpected > 0 ? ((stats.total_collected / totalExpected) * 100).toFixed(1) : '0';
  const pendingRate = totalExpected > 0 ? ((stats.total_pending / totalExpected) * 100).toFixed(1) : '0';

  return (
    <View style={styles.container}>
      <AdminGlowingBackground showParticles={false}>
        <SafeAreaView style={styles.safeArea}>
          
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <MaterialIcons name="arrow-back" size={24} color={colors.white} />
            </TouchableOpacity>
            <View style={{ marginLeft: 8 }}>
              <Text style={styles.headerTitle}>Analytics</Text>
              <Text style={styles.headerSub}>INSTITUTIONAL PERFORMANCE</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            {/* Overview Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(56, 189, 248, 0.1)' }]}>
                  <MaterialIcons name="insights" size={20} color={colors.adminPrimary} />
                </View>
                <Text style={styles.cardTitle}>Collection Efficiency</Text>
              </View>
              <View style={styles.largeDataRow}>
                <Text style={styles.massiveText}>{collectionRate}%</Text>
                <Text style={styles.subText}>Funds Recovered</Text>
              </View>
              
              {/* Visual Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={[styles.progressSegment, { width: `${collectionRate}%` as any, backgroundColor: colors.success }]} />
                <View style={[styles.progressSegment, { width: `${pendingRate}%` as any, backgroundColor: colors.warning }]} />
              </View>

              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
                  <Text style={styles.legendText}>Collected: ₹{stats.total_collected.toLocaleString()}</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
                  <Text style={styles.legendText}>Pending: ₹{stats.total_pending.toLocaleString()}</Text>
                </View>
              </View>
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <View style={[styles.statIconBox, { backgroundColor: 'rgba(37, 99, 235, 0.1)' }]}>
                  <MaterialIcons name="groups" size={24} color={colors.primary} />
                </View>
                <Text style={styles.statValue}>{stats.total_students}</Text>
                <Text style={styles.statLabel}>Total Students</Text>
              </View>
              <View style={styles.statBox}>
                <View style={[styles.statIconBox, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                  <MaterialIcons name="dynamic-form" size={24} color={colors.violetAccent} />
                </View>
                <Text style={styles.statValue}>{stats.active_fee_structures}</Text>
                <Text style={styles.statLabel}>Fee Models</Text>
              </View>
            </View>

            {/* Projection Card (Visual Logic) */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                  <MaterialIcons name="trending-up" size={20} color={colors.success} />
                </View>
                <Text style={styles.cardTitle}>Monthly Volume</Text>
              </View>
              <Text style={styles.cardSubText}>Historical revenue distribution (mock data)</Text>
              <View style={styles.chartArea}>
                {[45, 65, 52, 85, 58, 92].map((h, i) => (
                  <View key={i} style={styles.barColumn}>
                    <View style={[styles.barFill, { height: `${h}%`, backgroundColor: i === 5 ? colors.success : 'rgba(139, 92, 246, 0.4)' }]} />
                    <Text style={styles.barLabel}>{['Jan','Feb','Mar','Apr','May','Jun'][i]}</Text>
                  </View>
                ))}
              </View>
            </View>

          </ScrollView>
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
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerTitle: { color: colors.white, fontSize: 28, fontWeight: '800' },
  headerSub: { color: colors.adminPrimary, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginTop: 4 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 100 },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { color: colors.white, fontSize: 16, fontWeight: '700', marginLeft: 12 },
  cardSubText: { color: colors.textSecondary, fontSize: 12, marginBottom: 20 },
  largeDataRow: { alignItems: 'center', marginBottom: 24 },
  massiveText: { color: colors.white, fontSize: 56, fontWeight: '900', letterSpacing: -1 },
  subText: { color: colors.textMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, fontWeight: '700' },
  progressContainer: {
    height: 8,
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressSegment: { height: '100%' },
  legendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.1)', padding: 12, borderRadius: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  legendText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  statBox: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
  },
  statIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statValue: { color: colors.white, fontSize: 28, fontWeight: '900', marginBottom: 4 },
  statLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  chartArea: {
    height: 160,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
  },
  barColumn: { width: '12%', height: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  barFill: {
    width: '100%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  barLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '800', marginTop: 10 },
});
