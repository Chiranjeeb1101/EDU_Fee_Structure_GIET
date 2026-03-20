import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import api from '../../services/api';
import notificationService from '../../services/notification.service';
import { useAuth } from '../../navigation/AppNavigator';

export default function StudentDashboardScreen({ navigation }) {
  const [feeStatus, setFeeStatus] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { signOut } = useAuth();

  useEffect(() => {
    fetchDashboard();
    setupNotifications();
  }, []);

  const setupNotifications = async () => {
    // Scaffold out the notification permission
    const token = await notificationService.registerForPushNotificationsAsync();
    console.log('Mobile Token Setup Completed:', token);
  };

  const fetchDashboard = async () => {
    try {
      const resp = await api.get('/students/dashboard');
      setFeeStatus(resp.data.data.fee_status);
      setPayments(resp.data.data.payment_history);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !feeStatus) {
    return <ActivityIndicator size="large" style={{flex: 1}} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.summaryCard}>
        <Text style={styles.totalText}>Total Fee: ₹{feeStatus.total_fee}</Text>
        <Text style={styles.paidText}>Paid Amount: ₹{feeStatus.paid_fee}</Text>
        <Text style={styles.remainingText}>Remaining: ₹{feeStatus.remaining_fee}</Text>
        
        {Number(feeStatus.remaining_fee) > 0 ? (
          <TouchableOpacity 
            style={styles.payButton}
            onPress={() => navigation.navigate('Payment', { feeStatus })}
          >
            <Text style={styles.payText}>Pay Now</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.successText}>All Fees Cleared! 🎉</Text>
        )}
      </View>

      <Text style={styles.historyTitle}>Payment History</Text>
      <FlatList
        data={payments}
        keyExtractor={p => p.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.historyItem} 
            onPress={() => navigation.navigate('Receipt', { payment: item })}
          >
            <Text>Amount: ₹{item.amount}</Text>
            <Text style={{color: item.status === 'paid' ? 'green' : 'orange'}}>
              Status: {item.status.toUpperCase()}
            </Text>
            <Text>Date: {new Date(item.created_at).toLocaleDateString()}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text>No payments found.</Text>}
      />

      <Button title="Logout" color="#ff4444" onPress={signOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#f5f5f5' },
  summaryCard: { backgroundColor: '#fff', padding: 20, borderRadius: 10, elevation: 3, marginBottom: 20 },
  totalText: { fontSize: 16, marginBottom: 5 },
  paidText: { fontSize: 16, color: 'green', marginBottom: 5 },
  remainingText: { fontSize: 18, fontWeight: 'bold', color: 'red', marginBottom: 15 },
  payButton: { backgroundColor: '#007bff', padding: 15, borderRadius: 8, alignItems: 'center' },
  payText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  successText: { color: 'green', fontWeight: 'bold', fontSize: 16, textAlign: 'center' },
  historyTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  historyItem: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, elevation: 1 }
});
