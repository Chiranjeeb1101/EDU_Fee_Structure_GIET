import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import paymentService from '../../services/payment.service';

export default function PaymentScreen({ route, navigation }) {
  const { feeStatus } = route.params;
  const [amount, setAmount] = useState(feeStatus?.remaining_fee?.toString() || '');
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    if (numAmount > Number(feeStatus.remaining_fee)) {
      Alert.alert('Overpayment', `You cannot pay more than the remaining fee of ₹${feeStatus.remaining_fee}`);
      return;
    }

    setLoading(true);
    try {
      const { data } = await paymentService.createCheckoutSession(numAmount);
      
      // Open Stripe Checkout URL in the local browser
      await paymentService.openCheckoutPayment(data.session_url);

      // We go back to dashboard. Depending on DeepLink config, it might close automatically
      Alert.alert(
        'Payment Initiated', 
        'Please complete the payment in the browser. The dashboard will update once Stripe verifies it.'
      );
      navigation.goBack();
    } catch (error) {
      Alert.alert('Payment Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fee Payment</Text>
      
      <View style={styles.infoBox}>
        <Text style={styles.infoLabel}>Total Fee:</Text>
        <Text style={styles.infoValue}>₹{feeStatus?.total_fee}</Text>
        
        <Text style={styles.infoLabel}>Remaining Fee:</Text>
        <Text style={[styles.infoValue, { color: 'red' }]}>₹{feeStatus?.remaining_fee}</Text>
      </View>

      <Text style={styles.label}>Enter amount to pay today (₹):</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
        placeholder="E.g. 50000"
      />

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handlePayment}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Proceed to Pay</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f9f9f9' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  infoBox: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 20, elevation: 2 },
  infoLabel: { fontSize: 14, color: '#666', marginTop: 10 },
  infoValue: { fontSize: 18, fontWeight: 'bold' },
  label: { fontSize: 16, marginBottom: 10 },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 8, fontSize: 18, borderWidth: 1, borderColor: '#ddd', marginBottom: 30 },
  button: { backgroundColor: '#28a745', padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#8cd29b' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' }
});
