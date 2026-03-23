import React, { useEffect, useState, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, LayoutAnimation, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { AdminGlowingBackground } from '../../components/layout/AdminGlowingBackground';
import adminService from '../../services/adminService';

const FilterBadge = ({ label, active, onPress }: any) => (
  <TouchableOpacity 
    style={[styles.filterBadge, active && styles.filterBadgeActive]} 
    onPress={onPress}
  >
    <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
  </TouchableOpacity>
);

export const AdminPaymentsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const navigation = useNavigation();

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const data = await adminService.getAllPayments();
      setPayments(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch payments database.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterPress = (filter: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveFilter(filter);
  };

  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      const studentName = payment.students?.users?.full_name?.toLowerCase() || '';
      const txId = payment.transaction_id?.toLowerCase() || '';
      const matchesSearch = studentName.includes(searchQuery.toLowerCase()) || txId.includes(searchQuery.toLowerCase());

      let matchesFilter = true;
      if (activeFilter !== 'All') {
        const status = payment.status?.toLowerCase();
        if (activeFilter === 'Captured') matchesFilter = status === 'captured' || status === 'succeeded';
        if (activeFilter === 'Pending') matchesFilter = status === 'pending' || status === 'requires_action';
        if (activeFilter === 'Failed') matchesFilter = status === 'failed';
      }

      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, activeFilter, payments]);

  // Aggregated totals
  const totalVolume = useMemo(() => {
    return filteredPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }, [filteredPayments]);

  return (
    <View style={styles.container}>
      <AdminGlowingBackground showParticles={false}>
        <SafeAreaView style={styles.safeArea}>
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <MaterialIcons name="arrow-back" size={24} color={colors.white} />
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>Ledger</Text>
              <Text style={styles.headerSub}>GLOBAL TRANSACTIONS</Text>
            </View>
            <View style={styles.volumeBadge}>
              <Text style={styles.volumeText}>₹{totalVolume.toLocaleString()}</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            {/* Search */}
            <View style={styles.searchBox}>
              <MaterialIcons name="search" size={22} color={colors.adminPrimary} style={styles.searchIcon} />
              <TextInput 
                style={styles.searchInput}
                placeholder="Search name or ID..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={(text) => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setSearchQuery(text);
                }}
              />
            </View>

            {/* Filters */}
            <View style={styles.filtersWrapper}>
              <FilterBadge label="All" active={activeFilter === 'All'} onPress={() => handleFilterPress('All')} />
              <FilterBadge label="Captured" active={activeFilter === 'Captured'} onPress={() => handleFilterPress('Captured')} />
              <FilterBadge label="Pending" active={activeFilter === 'Pending'} onPress={() => handleFilterPress('Pending')} />
              <FilterBadge label="Failed" active={activeFilter === 'Failed'} onPress={() => handleFilterPress('Failed')} />
            </View>

            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>{filteredPayments.length} GLOBAL RECORDS</Text>
            </View>

            <View style={styles.listContainer}>
              {loading ? (
                <ActivityIndicator size="large" color={colors.adminPrimary} style={{ marginTop: 40 }} />
              ) : filteredPayments.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialIcons name="history" size={48} color={colors.textSecondary} />
                  <Text style={styles.emptyText}>No matching records.</Text>
                </View>
              ) : (
                filteredPayments.map(payment => {
                  const status = payment.status?.toLowerCase();
                  const isSuccess = status === 'captured' || status === 'succeeded';
                  const isPending = status === 'pending' || status === 'requires_payment_method';
                  
                  let statusColor = colors.textSecondary;
                  if (isSuccess) statusColor = colors.success;
                  else if (isPending) statusColor = colors.warning;
                  else statusColor = colors.error;

                  return (
                    <View key={payment.id} style={styles.txCard}>
                      <View style={styles.cardHeader}>
                        <View style={styles.cardInfo}>
                          <Text style={styles.studentName}>{payment.students?.users?.full_name || 'Anonymous'}</Text>
                          <Text style={styles.txId}>{payment.transaction_id || 'System Credit'}</Text>
                        </View>
                        <Text style={styles.txAmount}>₹{payment.amount.toLocaleString()}</Text>
                      </View>
                      
                      <View style={styles.cardMeta}>
                        <View style={styles.metaItem}>
                          <MaterialIcons name="schedule" size={14} color={colors.textMuted} />
                          <Text style={styles.metaText}>{new Date(payment.created_at).toLocaleDateString()} {new Date(payment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                        </View>
                        <View style={[styles.statusBadge, { borderColor: statusColor, backgroundColor: `${statusColor}1A` }]}>
                          <Text style={[styles.statusText, { color: statusColor }]}>{status?.toUpperCase() || 'UNKNOWN'}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerInfo: { flex: 1, marginLeft: 8 },
  headerTitle: { color: colors.white, fontSize: 24, fontWeight: '800' },
  headerSub: { color: colors.adminPrimary, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginTop: 4 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  volumeBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  volumeText: { color: colors.success, fontSize: 15, fontWeight: '900' },
  
  scrollContent: { paddingHorizontal: 24, paddingBottom: 100 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 18,
    height: 52,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, color: colors.white, fontSize: 14, fontWeight: '500' },
  
  filtersWrapper: { flexDirection: 'row', marginBottom: 24, flexWrap: 'wrap', gap: 10 },
  filterBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    height: 38,
    justifyContent: 'center',
  },
  filterBadgeActive: { backgroundColor: 'rgba(2, 132, 199, 0.2)', borderColor: colors.adminPrimary },
  filterText: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  filterTextActive: { color: colors.adminPrimary },
  
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingLeft: 4,
  },
  listTitle: { color: colors.textSecondary, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  
  listContainer: { gap: 12 },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: colors.textMuted, fontSize: 14, marginTop: 12, fontWeight: '600' },
  txCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 18,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  cardInfo: { flex: 1, paddingRight: 16 },
  studentName: { color: colors.white, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  txId: { color: colors.textMuted, fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  txAmount: { color: colors.white, fontSize: 20, fontWeight: '900' },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: colors.textSecondary, fontSize: 11, fontWeight: '600' },
  
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  statusText: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
});
