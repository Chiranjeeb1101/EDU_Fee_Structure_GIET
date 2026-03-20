import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import api from '../../services/api';

export default function ReceiptScreen({ route }) {
  const { payment } = route.params;
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const fileUri = `${FileSystem.documentDirectory}Receipt-${payment.id}.pdf`;
      const token = await api.defaults.headers.Authorization || ''; // Needs actual token fetch or API interceptor doesn't apply to FileSystem
      
      // FileSystem doesn't use axios interceptors, so we fetch token manually
      const secureToken = await require('expo-secure-store').getItemAsync('userToken');

      const downloadedFile = await FileSystem.downloadAsync(
        `${require('../../config/env').default.API_BASE_URL}/payments/${payment.id}/receipt`, 
        fileUri,
        {
          headers: {
            Authorization: `Bearer ${secureToken}`
          }
        }
      );
      
      console.log('Downloaded to:', downloadedFile.uri);
      
      // Open file using sharing intent
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloadedFile.uri);
      } else {
        Alert.alert('Info', 'Receipt downloaded to: ' + downloadedFile.uri);
      }

    } catch (e) {
      Alert.alert('Download Error', e.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transaction Details</Text>
      
      <View style={styles.card}>
        <Text style={styles.label}>Transaction ID:</Text>
        <Text style={styles.value}>{payment.id}</Text>

        <Text style={styles.label}>Stripe Ref:</Text>
        <Text style={styles.value}>{payment.stripe_payment_intent_id || 'N/A'}</Text>

        <Text style={styles.label}>Amount:</Text>
        <Text style={styles.value}>₹{payment.amount}</Text>

        <Text style={styles.label}>Status:</Text>
        <Text style={styles.value}>{payment.status.toUpperCase()}</Text>

        <Text style={styles.label}>Date:</Text>
        <Text style={styles.value}>{new Date(payment.created_at).toLocaleString()}</Text>
      </View>

      {payment.status === 'paid' && (
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleDownload}
          disabled={downloading}
        >
          {downloading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Download Receipt</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f0f2f5' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 10, elevation: 3, marginBottom: 30 },
  label: { fontSize: 14, color: '#666', marginTop: 15 },
  value: { fontSize: 16, fontWeight: '500', color: '#333' },
  button: { backgroundColor: '#007bff', padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' }
});
