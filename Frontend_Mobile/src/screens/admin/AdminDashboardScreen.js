import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import api from '../../services/api';
import { useAuth } from '../../navigation/AppNavigator';

export default function AdminDashboardScreen() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { signOut } = useAuth();

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      // Basic metrics calculated by fetching all students for this college Admin
      const response = await api.get('/admin/students');
      setStudents(response.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = students.reduce((sum, s) => sum + Number(s.paid_fee), 0);
  const pendingPayments = students.reduce((sum, s) => sum + Number(s.remaining_fee), 0);
  const expectedTotal = totalRevenue + pendingPayments;
  
  const defaulters = students.filter(s => Number(s.remaining_fee) > 0);
  
  const recoveryRate = expectedTotal === 0 ? 0 : Math.round((totalRevenue / expectedTotal) * 100);

  if (loading) {
    return <ActivityIndicator size="large" style={{flex: 1}} />;
  }

  return (
    <View style={styles.container}>
      {/* ANALYTICS AREA */}
      <View style={styles.analyticsCard}>
        <Text style={styles.sectionTitle}>Overview Analytics</Text>
        
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>Fee Recovery Rate</Text>
          <Text style={styles.progressValue}>{recoveryRate}%</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${recoveryRate}%` }]} />
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statTitle}>Expected</Text>
            <Text style={styles.statValue}>₹{expectedTotal.toLocaleString()}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statTitle}>Collected</Text>
            <Text style={[styles.statValue, {color:'green'}]}>₹{totalRevenue.toLocaleString()}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statTitle}>Deficit</Text>
            <Text style={[styles.statValue, {color:'red'}]}>₹{pendingPayments.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.defaultersContainer}>
        <Text style={styles.sectionTitle}>Defaulters ({defaulters.length} out of {students.length} students)</Text>
        <FlatList
          data={defaulters}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.listItem}>
              <Text style={styles.studentName}>{item.user_id}</Text>
              <Text style={styles.studentRemaining}>Pending: ₹{item.remaining_fee.toLocaleString()}</Text>
            </View>
          )}
        />
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#f0f2f5' },
  analyticsCard: { backgroundColor: '#fff', padding: 20, borderRadius: 10, elevation: 2, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 14, color: '#555', fontWeight: '500' },
  progressValue: { fontSize: 16, fontWeight: 'bold', color: '#007bff' },
  progressBarBg: { height: 10, backgroundColor: '#e0e0e0', borderRadius: 5, overflow: 'hidden', marginBottom: 20 },
  progressBarFill: { height: '10%', height: 10, backgroundColor: '#007bff', borderRadius: 5 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: { flex: 1, alignItems: 'center' },
  statTitle: { fontSize: 12, color: '#888', marginBottom: 5 },
  statValue: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  
  defaultersContainer: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 15 },
  listItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  studentName: { fontSize: 16, fontWeight: '500' },
  studentRemaining: { color: 'red', marginTop: 5 },
  logoutButton: { marginTop: 20, padding: 15, backgroundColor: '#ff4444', alignItems: 'center', borderRadius: 8 },
  logoutText: { color: '#fff', fontWeight: 'bold' }
});
