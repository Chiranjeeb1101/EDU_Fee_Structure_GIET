import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, Alert, Dimensions, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
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
        <Text style={{ color: colors.textSecondary, marginTop: 15 }}>Analyzing Institution Data...</Text>
      </View>
    );
  }

  const totalExpected = (stats.total_collected || 0) + (stats.total_pending || 0);
  const collectionRate = totalExpected > 0 ? ((stats.total_collected / totalExpected) * 100).toFixed(1) : '0';

  // Chart Mappings
  const chartConfig = {
    backgroundGradientFrom: '#1E1E2E',
    backgroundGradientTo: '#1E1E2E',
    color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
  };

  const lineData = {
    labels: stats.monthly_revenue.length > 0 ? stats.monthly_revenue.map(m => m.month) : ['No Data'],
    datasets: [{
      data: stats.monthly_revenue.length > 0 ? stats.monthly_revenue.map(m => m.amount / 1000) : [0], // in K
      color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
      strokeWidth: 2
    }]
  };

  const pieData = stats.collection_by_stream.length > 0 
    ? stats.collection_by_stream.map((s, i) => ({
        name: s.name,
        population: s.amount,
        color: ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'][i % 5],
        legendFontColor: '#A1A1AA',
        legendFontSize: 12,
      }))
    : [{ name: 'N/A', population: 1, color: '#333', legendFontColor: '#666', legendFontSize: 12 }];

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
              <Text style={styles.headerSub}>INSTITUTIONAL FINANCIAL INTELLIGENCE</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            {/* KPI Overview */}
            <View style={styles.kpiRow}>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiLabel}>COLLECTED</Text>
                <Text style={[styles.kpiValue, { color: colors.success }]}>₹{(stats.total_collected / 100000).toFixed(2)}L</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiLabel}>PENDING</Text>
                <Text style={[styles.kpiValue, { color: colors.warning }]}>₹{(stats.total_pending / 100000).toFixed(2)}L</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiLabel}>EFFICIENCY</Text>
                <Text style={[styles.kpiValue, { color: colors.adminPrimary }]}>{collectionRate}%</Text>
              </View>
            </View>

            {/* Monthly Trend Chart */}
            <View style={styles.sectionCard}>
              <View style={styles.cardHeader}>
                <MaterialIcons name="show-chart" size={20} color={colors.violetAccent} />
                <Text style={styles.cardTitle}>Monthly Revenue Trend (₹'000)</Text>
              </View>
              <LineChart
                data={lineData}
                width={width - 48}
                height={200}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
              />
            </View>

            {/* Stream Distribution Chart */}
            <View style={styles.sectionCard}>
              <View style={styles.cardHeader}>
                <MaterialIcons name="pie-chart" size={20} color={colors.success} />
                <Text style={styles.cardTitle}>Revenue by Stream</Text>
              </View>
              <PieChart
                data={pieData}
                width={width - 48}
                height={200}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </View>

            {/* Status Breakdown Bar Chart */}
            <View style={styles.sectionCard}>
              <View style={styles.cardHeader}>
                <MaterialIcons name="bar-chart" size={20} color={colors.warning} />
                <Text style={styles.cardTitle}>Payment Status Distribution</Text>
              </View>
              <BarChart
                data={{
                  labels: ['Paid', 'Pending', 'Failed'],
                  datasets: [{
                    data: [
                      stats.status_distribution.success,
                      stats.status_distribution.pending,
                      stats.status_distribution.failed
                    ]
                  }]
                }}
                width={width - 48}
                height={220}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1) => `rgba(245, 158, 11, ${opacity})`,
                }}
                style={styles.chart}
                fromZero
              />
            </View>

            {/* Detailed Table Placeholder */}
            <View style={styles.statsCard}>
              <Text style={styles.statsTitle}>Stream-wise Summary</Text>
              {stats.collection_by_stream.map((item, idx) => (
                <View key={idx} style={styles.statLine}>
                  <Text style={styles.statName}>{item.name}</Text>
                  <Text style={styles.statAmt}>₹{item.amount.toLocaleString()}</Text>
                </View>
              ))}
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
  headerSub: { color: colors.adminPrimary, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginTop: 4, textTransform: 'uppercase' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 100 },
  kpiRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  kpiBox: { 
    width: (width - 64) / 3, 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    borderRadius: 16, 
    padding: 12, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  kpiLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '700', marginBottom: 4 },
  kpiValue: { fontSize: 16, fontWeight: '900' },
  sectionCard: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden'
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingLeft: 8 },
  cardTitle: { color: colors.white, fontSize: 14, fontWeight: '700', marginLeft: 10 },
  chart: {
    borderRadius: 16,
    marginVertical: 8,
  },
  statsCard: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statsTitle: { color: colors.white, fontSize: 18, fontWeight: '800', marginBottom: 20 },
  statLine: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: 'rgba(255,255,255,0.05)' 
  },
  statName: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  statAmt: { color: colors.white, fontSize: 14, fontWeight: '700' },
});
