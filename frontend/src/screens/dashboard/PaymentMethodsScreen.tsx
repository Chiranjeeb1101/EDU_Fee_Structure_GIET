import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';

const PaymentMethodsScreen = () => {
  const navigation = useNavigation();

  const [accounts, setAccounts] = useState([
    { id: '1', bank: 'HDFC Bank', accNo: '•••• 8829', type: 'Savings', isPrimary: true },
    { id: '2', bank: 'ICICI Bank', accNo: '•••• 4410', type: 'Current', isPrimary: false },
  ]);

  const [cards, setCards] = useState([
    { id: '1', brand: 'Visa', last4: '4242', expiry: '12/26', holder: 'ALEX RIVERA' },
  ]);

  const handleAddAccount = () => {
    Alert.alert("New Bank Account", "Direct bank integration is currently available for selected institutional partners. Please contact the accounts office for manual linking.");
  };

  const handleAddCard = () => {
    Alert.alert("New Card", "The secure payment gateway for card registration is under maintenance. Please try again later.");
  };

  const handleDeleteAccount = (id: string) => {
    Alert.alert(
      "Remove Account",
      "Are you sure you want to remove this bank account?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: () => setAccounts(prev => prev.filter(a => a.id !== id)) }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back-ios" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Payments</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Linked Accounts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Linked Bank Accounts</Text>
            <TouchableOpacity onPress={handleAddAccount}>
              <Text style={styles.addText}>+ Add New</Text>
            </TouchableOpacity>
          </View>
          
          {accounts.map(acc => (
            <View key={acc.id} style={styles.glassCard}>
              <View style={styles.row}>
                <View style={styles.bankIcon}>
                  <MaterialIcons name="account-balance" size={24} color={colors.primary} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.bankName}>{acc.bank}</Text>
                  <Text style={styles.accDetails}>{acc.type} • {acc.accNo}</Text>
                </View>
                {acc.isPrimary && <View style={styles.primaryBadge}><Text style={styles.primaryText}>Primary</Text></View>}
                <TouchableOpacity onPress={() => handleDeleteAccount(acc.id)}>
                  <MaterialIcons name="more-vert" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Saved Cards */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Saved Cards</Text>
            <TouchableOpacity onPress={handleAddCard}>
              <Text style={styles.addText}>+ Add New</Text>
            </TouchableOpacity>
          </View>

          {cards.map(card => (
            <View key={card.id} style={styles.cardGraphic}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardBrand}>{card.brand}</Text>
                <FontAwesome name="cc-visa" size={28} color={colors.white} />
              </View>
              <Text style={styles.cardNumber}>••••  ••••  ••••  {card.last4}</Text>
              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.cardLabel}>CARD HOLDER</Text>
                  <Text style={styles.cardValue}>{card.holder}</Text>
                </View>
                <View>
                  <Text style={styles.cardLabel}>EXPIRES</Text>
                  <Text style={styles.cardValue}>{card.expiry}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.infoBox}>
          <MaterialIcons name="security" size={20} color={colors.success} />
          <Text style={styles.infoText}>Your payment information is encrypted and stored securely using industry-standard protocols.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  addText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  glassCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bankIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  bankName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  accDetails: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  primaryBadge: {
    backgroundColor: colors.success + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 10,
  },
  primaryText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.success,
    textTransform: 'uppercase',
  },
  cardGraphic: {
    backgroundColor: '#1e293b', // Deep slate for card
    borderRadius: 20,
    padding: 24,
    height: 190,
    justifyContent: 'space-between',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardBrand: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  cardNumber: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 2,
    textAlign: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardLabel: {
    color: colors.white + '80',
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 4,
  },
  cardValue: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.success + '10',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.success + '20',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 10,
    lineHeight: 18,
  },
});

export default PaymentMethodsScreen;
