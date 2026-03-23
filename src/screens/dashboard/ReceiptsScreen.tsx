import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Dimensions, Platform, LayoutAnimation, UIManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import studentService, { PaymentHistoryItem } from '../../services/studentService';
import { ActivityIndicator, Alert, Linking } from 'react-native';
import api from '../../services/api';

const ReceiptCard = ({ title, date, amount, icon, colorHex }: any) => (
  <View style={styles.receiptCard}>
    <View style={styles.rcLeft}>
      <View style={[styles.rcIconBox, { backgroundColor: `${colorHex}1A`, borderColor: `${colorHex}33` }]}>
        <MaterialIcons name={icon} size={24} color={colorHex} />
      </View>
      <View>
        <Text style={styles.rcTitle}>{title}</Text>
        <View style={styles.rcDateObj}>
          <MaterialIcons name="calendar-today" size={12} color={colors.textSecondary} style={{ opacity: 0.6 }} />
          <Text style={styles.rcDate}>{date}</Text>
        </View>
        <Text style={[styles.rcAmount, { color: colorHex }]}>₹{amount}</Text>
      </View>
    </View>
    <View style={styles.dlBtn}>
      <MaterialIcons name="download" size={20} color={colors.textSecondary} />
    </View>
  </View>
);

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const ReceiptsScreen = () => {
  const navigation = useNavigation();
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [receipts, setReceipts] = useState<PaymentHistoryItem[]>([]);

  React.useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    try {
      const data = await studentService.getPaymentHistory();
      // Only successfully captured payments have receipts
      setReceipts(data.filter(p => p.status === 'paid'));
    } catch (error) {
      console.error('Receipts fetch failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReceipts = useMemo(() => {
    return receipts.filter(r => 
      (r.stripe_checkout_session_id?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, receipts]);

  const handleDownload = async (receiptId: string) => {
    try {
      let currentToken = token;
      if (!currentToken) {
        currentToken = await AsyncStorage.getItem('auth_token');
      }

      if (!currentToken) {
        Alert.alert('Authentication Error', 'Could not verify your session. Please login again.');
        return;
      }

      const url = `${api.defaults.baseURL}/payments/${receiptId}/receipt?token=${currentToken}`;
      console.log('Downloading receipt from:', url);
      await Linking.openURL(url);
    } catch (error) {
      console.error('Receipt download error:', error);
      Alert.alert('Error', 'Failed to open receipt download link.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Decorative Orbs */}
      <View style={[styles.orb, styles.orbTop]} />
      <View style={[styles.orb, styles.orbBottom]} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => (navigation as any).navigate('MainTabs', { screen: 'Dashboard' })} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle}>Receipts</Text>
            <Text style={styles.headerSub}>DIGITAL LEDGER</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Search */}
          <View style={styles.searchBox}>
            <MaterialIcons name="search" size={20} color="rgba(148, 163, 184, 0.6)" style={styles.searchIcon} />
            <TextInput 
              style={styles.searchInput}
              placeholder="Search receipts..."
              placeholderTextColor="rgba(148, 163, 184, 0.4)"
              value={searchQuery}
              onChangeText={(text) => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setSearchQuery(text);
              }}
            />
          </View>

          {/* List Header */}
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>TRANSACTION HISTORY</Text>
            <View style={styles.badgeCount}>
              <Text style={styles.badgeCountText}>{filteredReceipts.length} {filteredReceipts.length === 1 ? 'ITEM' : 'ITEMS'}</Text>
            </View>
          </View>

          <View style={styles.listContainer}>
            {loading ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
            ) : filteredReceipts.length === 0 ? (
              <Text style={{ color: 'rgba(148, 163, 184, 0.6)', textAlign: 'center', marginTop: 40 }}>{searchQuery ? 'No matching receipts.' : 'No digital receipts available yet.'}</Text>
            ) : (
              filteredReceipts.map(r => (
                <TouchableOpacity key={r.id} onPress={() => handleDownload(r.id)} activeOpacity={0.8}>
                   <ReceiptCard 
                    title={r.stripe_checkout_session_id ? `Receipt: ${r.stripe_checkout_session_id.substring(0, 10)}...` : 'Institutional Receipt'}
                    date={new Date(r.created_at).toLocaleDateString()} 
                    amount={r.amount.toLocaleString()} 
                    icon="receipt" 
                    colorHex="#60A5FA" 
                  />
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Footer Verification */}
          <View style={styles.footerInfo}>
            <View style={styles.footerIconBox}>
              <MaterialIcons name="verified-user" size={24} color="rgba(59, 130, 246, 0.5)" />
            </View>
            <Text style={styles.footerText}>
              ALL RECEIPTS ARE ENCRYPTED WITH SHA-256 LUMINA PROTOCOL
            </Text>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0F1E' }, // Background start
  orb: {
    position: 'absolute',
    borderRadius: 200,
    opacity: 0.1,
  },
  orbTop: {
    width: 400,
    height: 400,
    backgroundColor: '#2563EB',
    top: '-10%',
    left: '-10%',
  },
  orbBottom: {
    width: 350,
    height: 350,
    backgroundColor: '#8B5CF6',
    bottom: '-10%',
    right: '-10%',
  },
  safeArea: { flex: 1 },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    paddingBottom: 24,
    position: 'relative',
  },
  backBtn: {
    position: 'absolute',
    left: 24,
    top: Platform.OS === 'android' ? 40 : 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  headerTitleBox: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#60A5FA', // close to gradient
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  headerSub: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 3,
    opacity: 0.8,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 80,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 30,
    height: 56,
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  listTitle: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  badgeCount: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeCountText: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '800',
  },
  listContainer: {
    gap: 16,
  },
  receiptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 32,
    padding: 24,
  },
  rcLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rcIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  rcTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  rcDateObj: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rcDate: {
    color: 'rgba(148, 163, 184, 0.6)',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginLeft: 6,
  },
  rcAmount: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  dlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerInfo: {
    marginTop: 80,
    alignItems: 'center',
  },
  footerIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  footerText: {
    color: 'rgba(148, 163, 184, 0.5)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 3,
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 16,
  },
});
