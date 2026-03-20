import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Dimensions, Platform, LayoutAnimation, UIManager } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';

const { width } = Dimensions.get('window');

const FilterBadge = ({ label, active, onPress }: { label: string, active?: boolean, onPress: () => void }) => (
  <TouchableOpacity style={[styles.filterBadge, active && styles.filterBadgeActive]} onPress={onPress}>
    <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
  </TouchableOpacity>
);

const TransactionItem = ({ title, date, id, amount, status, icon, iconColor, statusColor }: any) => (
  <View style={styles.transactionCard}>
    <View style={styles.txLeft}>
      <View style={[styles.txIconBox, { backgroundColor: `${iconColor}1A`, borderColor: `${iconColor}33` }]}>
        <MaterialIcons name={icon} size={24} color={iconColor} />
      </View>
      <View>
        <Text style={styles.txTitle}>{title}</Text>
        <Text style={styles.txMeta}>{date} • #{id}</Text>
      </View>
    </View>
    <View style={styles.txRight}>
      <Text style={styles.txAmount}>₹{amount}</Text>
      <View style={[styles.statusBadge, { backgroundColor: `${statusColor}1A`, borderColor: `${statusColor}33` }]}>
        <Text style={[styles.statusText, { color: statusColor }]}>{status}</Text>
      </View>
    </View>
    <View style={[styles.cardAccentLine, { backgroundColor: iconColor }]} />
  </View>
);

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const MOCK_TRANSACTIONS = [
  {
    id: "SMF-88312", title: "Late Fine - Exam Registration", date: "Nov 18, 2024", amount: "500", status: "Pending",
    icon: "error-outline", iconColor: colors.tertiary, statusColor: colors.tertiary, category: "Exam"
  },
  {
    id: "SMF-88245", title: "Library Annual Fee", date: "Nov 15, 2024", amount: "2,500", status: "Due",
    icon: "library-books", iconColor: colors.error, statusColor: colors.error, category: "Library"
  },
  {
    id: "SMF-88201", title: "Hostel Fee - Quarter 4", date: "Nov 10, 2024", amount: "45,000", status: "Pending",
    icon: "domain", iconColor: colors.tertiary, statusColor: colors.tertiary, category: "Dues"
  },
  {
    id: "SMF-77109", title: "Semester Exam Fee", date: "Oct 10, 2023", amount: "1,200", status: "Failed",
    icon: "edit-calendar", iconColor: colors.error, statusColor: colors.error, category: "Semester Fee"
  }
];

export const HistoryScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All Fees');

  const filteredTransactions = useMemo(() => {
    return MOCK_TRANSACTIONS.filter(tx => {
      const matchesSearch = tx.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            tx.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = activeFilter === 'All Fees' || 
                            (activeFilter === 'Dues' && (tx.status === 'Due' || tx.status === 'Pending')) ||
                            tx.category === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, activeFilter]);

  const handleFilterPress = (filter: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveFilter(filter);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => (navigation as any).navigate('MainTabs', { screen: 'Dashboard' })} style={styles.iconBtn}>
            <MaterialIcons name="arrow-back" size={20} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>History</Text>
          <TouchableOpacity style={styles.iconBtn}>
            <MaterialIcons name="calendar-today" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Search Area */}
          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <MaterialIcons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
              <TextInput 
                style={styles.searchInput}
                placeholder="Search fee transactions..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={(text) => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setSearchQuery(text);
                }}
              />
            </View>
            <TouchableOpacity style={styles.filterBtn}>
              <MaterialIcons name="filter-list" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Filters */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll} contentContainerStyle={{ paddingRight: 24 }}>
            {['All Fees', 'Dues', 'Semester Fee', 'Library', 'Exam'].map(filter => (
              <FilterBadge 
                key={filter} 
                label={filter} 
                active={activeFilter === filter} 
                onPress={() => handleFilterPress(filter)} 
              />
            ))}
          </ScrollView>

          {/* Transaction List */}
          <View style={styles.txList}>
            {filteredTransactions.length === 0 ? (
              <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 20 }}>No transactions found.</Text>
            ) : (
              filteredTransactions.map(tx => (
                <TransactionItem 
                  key={tx.id}
                  title={tx.title}
                  date={tx.date} id={tx.id} amount={tx.amount} status={tx.status}
                  icon={tx.icon} iconColor={tx.iconColor} statusColor={tx.statusColor}
                />
              ))
            )}
          </View>

          {/* Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>TOTAL FEE PAID (YEARLY)</Text>
              <Text style={styles.summaryAmount}>₹1,200.00</Text>
            </View>
            <MaterialIcons name="analytics" size={48} color={colors.white} style={styles.summaryIcon} />
            <View style={styles.summaryGlow} />
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090e1c' },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    height: Platform.OS === 'android' ? 80 : 64,
    paddingTop: Platform.OS === 'android' ? 30 : 10,
    backgroundColor: 'rgba(9, 14, 28, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 37, 59, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scrollContent: {
    paddingVertical: 24,
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 20,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181f33',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.white,
    fontSize: 14,
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(30, 37, 59, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(144, 171, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersScroll: {
    paddingLeft: 24,
    marginBottom: 24,
  },
  filterBadge: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 37, 59, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(71, 196, 255, 0.2)',
    marginRight: 12,
  },
  filterBadgeActive: {
    backgroundColor: '#316bf3',
    borderColor: '#316bf3',
  },
  filterText: {
    color: colors.tertiary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  filterTextActive: {
    color: colors.white,
  },
  txList: {
    paddingHorizontal: 24,
    gap: 16,
  },
  transactionCard: {
    backgroundColor: 'rgba(30, 37, 59, 0.4)',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  txLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  txIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginRight: 16,
  },
  txTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    paddingRight: 10,
  },
  txMeta: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardAccentLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  summaryCard: {
    margin: 24,
    height: 120,
    backgroundColor: '#181f33', // Gradient fallback
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  summaryContent: {
    zIndex: 10,
  },
  summaryLabel: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
  },
  summaryAmount: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '800',
  },
  summaryIcon: {
    opacity: 0.2,
    zIndex: 10,
  },
  summaryGlow: {
    position: 'absolute',
    right: -40,
    bottom: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(144, 171, 255, 0.1)',
  },
});
