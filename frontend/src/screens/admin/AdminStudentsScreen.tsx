import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, LayoutAnimation, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
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

export const AdminStudentsScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const streams = ['All', 'CSE', 'ECE', 'ME', 'CE', 'EEE'];
  const statuses = ['All', 'Has Dues', 'Cleared'];

  // Re-fetch students whenever this screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchStudents();
    }, [])
  );

  const fetchStudents = async () => {
    try {
      const data = await adminService.getStudents();
      setStudents(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch students.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterPress = (filter: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveFilter(filter);
  };

  const filteredStudents = useMemo(() => {
    const filtered = students.filter((student: any) => {
      const matchesSearch = student.users?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            student.college_id_number.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStream = activeFilter === 'All' || student.stream === activeFilter;
      const remainingFee = Number(student.remaining_fee) || 0;
      const matchesStatus = statusFilter === 'All' || 
                            (statusFilter === 'Has Dues' && remainingFee > 0) ||
                            (statusFilter === 'Cleared' && remainingFee <= 0);
      return matchesSearch && matchesStream && matchesStatus;
    });
    return filtered;
  }, [searchQuery, activeFilter, statusFilter, students]);

  // Extract unique streams for filters
  // const filterOptions = useMemo(() => {
  //   const streams = new Set(students.map(s => s.stream).filter(Boolean));
  //   return ['All', 'Dues', ...Array.from(streams)];
  // }, [students]);

  return (
    <View style={styles.container}>
      <AdminGlowingBackground showParticles={false}>
        <SafeAreaView style={styles.safeArea}>
          
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Student Directory</Text>
              <Text style={styles.headerSub}>MANAGE ENROLLMENTS</Text>
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={() => (navigation as any).navigate('AdminAddStudent')}>
              <MaterialIcons name="person-add" size={24} color={colors.white} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            {/* Search */}
            <View style={styles.searchBox}>
              <MaterialIcons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
              <TextInput 
                style={styles.searchInput}
                placeholder="Search by name or Roll No..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={(text) => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setSearchQuery(text);
                }}
              />
            </View>

            {/* Filter Pills - Stream */}
            <View>
              <Text style={styles.filterGroupLabel}>Stream</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
                {streams.map((stream) => (
                  <FilterBadge key={stream} label={stream} active={activeFilter === stream} onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setActiveFilter(stream);
                  }} />
                ))}
              </ScrollView>
            </View>

            {/* Filter Pills - Status */}
            <View>
              <Text style={styles.filterGroupLabel}>Payment Status</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
                {statuses.map((status) => (
                  <FilterBadge key={status} label={status} active={statusFilter === status} onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setStatusFilter(status);
                  }} />
                ))}
              </ScrollView>
            </View>

            {/* Student List */}
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>REGISTERED STUDENTS</Text>
              <View style={styles.badgeCount}>
                <Text style={styles.badgeCountText}>{filteredStudents.length}</Text>
              </View>
            </View>

            <View style={styles.listContainer}>
              {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
              ) : filteredStudents.length === 0 ? (
                <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 40 }}>No students found.</Text>
              ) : (
                filteredStudents.map(student => {
                  const totalFee = Number(student.fee_structures?.total_amount) || 0;
                  const remainingFee = Number(student.remaining_fee) || 0;
                  const hasDues = remainingFee > 0;
                  
                  return (
                    <TouchableOpacity 
                      key={student.id} 
                      style={styles.studentCard}
                      onPress={() => (navigation as any).navigate('AdminStudentDetail', { studentId: student.id })}
                    >
                      <View style={styles.cardHeader}>
                        <View style={styles.cardInfo}>
                          <Text style={styles.studentName}>{student.users?.full_name || 'Unknown Student'}</Text>
                          <Text style={styles.studentId}>{student.college_id_number}</Text>
                        </View>
                        <View style={styles.financialBadgeContainer}>
                          <View style={[styles.statusBadge, { borderColor: hasDues ? colors.warning : colors.success, backgroundColor: hasDues ? `${colors.warning}1A` : `${colors.success}1A` }]}>
                            <Text style={[styles.statusText, { color: hasDues ? colors.warning : colors.success }]}>
                              {hasDues ? 'HAS DUES' : 'CLEARED'}
                            </Text>
                          </View>
                        </View>
                      </View>
                      
                      <View style={styles.financialRow}>
                        <View style={styles.financialItem}>
                          <Text style={styles.financialLabel}>Total Fee</Text>
                          <Text style={styles.financialValue}>₹{totalFee.toLocaleString()}</Text>
                        </View>
                        <View style={styles.financialItem}>
                          <Text style={styles.financialLabel}>Pending Due</Text>
                          <Text style={[styles.financialValue, { color: hasDues ? colors.error : colors.success }]}>₹{remainingFee.toLocaleString()}</Text>
                        </View>
                      </View>

                      <View style={styles.cardMeta}>
                        <View style={styles.metaItem}>
                          <MaterialIcons name="school" size={14} color={colors.textSecondary} />
                          <Text style={styles.metaText}>{student.course_type} ({student.stream})</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <MaterialIcons name="calendar-today" size={14} color={colors.textSecondary} />
                          <Text style={styles.metaText}>Year {student.year}</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <MaterialIcons name="apartment" size={14} color={colors.textSecondary} />
                          <Text style={styles.metaText}>{student.accommodation === 'hosteler' ? 'Hostel' : 'Day'}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
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
  container: { flex: 1, backgroundColor: colors.background },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerTitle: { color: colors.white, fontSize: 28, fontWeight: '800' },
  headerSub: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 2, marginTop: 4 },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 100 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    height: 52,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, color: colors.white, fontSize: 14 },
  filtersScroll: { marginBottom: 24, maxHeight: 40 },
  filterGroupLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 },
  filterBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginRight: 10,
    height: 36,
    justifyContent: 'center',
  },
  filterBadgeActive: { backgroundColor: 'rgba(37, 99, 235, 0.2)', borderColor: colors.primary },
  filterText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  filterTextActive: { color: colors.primary },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  listTitle: { color: colors.textSecondary, fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  badgeCount: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeCountText: { color: colors.white, fontSize: 10, fontWeight: '800' },
  listContainer: { gap: 16 },
  studentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  cardInfo: { flex: 1, paddingRight: 16 },
  studentName: { color: colors.white, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  studentId: { color: colors.textSecondary, fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  financialBadgeContainer: { alignItems: 'flex-end' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, marginBottom: 8 },
  statusText: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  financialRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 12 },
  financialItem: { flex: 1 },
  financialLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  financialValue: { color: colors.white, fontSize: 14, fontWeight: '700' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: colors.textSecondary, fontSize: 12, fontWeight: '500' },
});
