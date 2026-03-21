import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { AdminGlowingBackground } from '../../components/layout/AdminGlowingBackground';
import adminService from '../../services/adminService';

export const AdminFeeStructureScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [feeStructures, setFeeStructures] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [course, setCourse] = useState('');
  const [stream, setStream] = useState('');
  const [year, setYear] = useState('');

  useEffect(() => {
    fetchFeeStructures();
  }, []);

  const fetchFeeStructures = async () => {
    setLoading(true);
    try {
      const data = await adminService.getFeeStructures();
      setFeeStructures(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch fee structures.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Fee Structure', 'Are you sure you want to delete this fee structure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await adminService.deleteFeeStructure(id);
          fetchFeeStructures();
        } catch (error) {
          Alert.alert('Error', 'Failed to delete fee structure. It might be assigned to students.');
        }
      }}
    ]);
  };

  const handleCreate = async () => {
    if (!title || !amount || !course || !stream || !year) {
      Alert.alert('Validation Error', 'Please fill all fields.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await adminService.createFeeStructure({
        title,
        total_amount: Number(amount),
        currency: 'INR',
        course_type: course,
        stream,
        year: Number(year)
      });
      setModalVisible(false);
      setTitle(''); setAmount(''); setCourse(''); setStream(''); setYear('');
      fetchFeeStructures();
    } catch (error) {
      Alert.alert('Error', 'Failed to create fee structure.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <Text style={styles.headerTitle}>Fee Policies</Text>
              <Text style={styles.headerSub}>MANAGE INSTITUTIONAL STRUCTURES</Text>
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
              <MaterialIcons name="add" size={24} color={colors.white} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {loading ? (
              <ActivityIndicator size="large" color={colors.adminPrimary} style={{ marginTop: 40 }} />
            ) : feeStructures.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="receipt-long" size={48} color={colors.textSecondary} />
                <Text style={styles.emptyText}>No fee structures created yet.</Text>
              </View>
            ) : (
              feeStructures.map(fee => (
                <View key={fee.id} style={styles.feeCard}>
                  <View style={styles.feeHeader}>
                    <View style={styles.feeTitleRow}>
                      <View style={[styles.iconBox, { backgroundColor: 'rgba(14, 165, 233, 0.1)' }]}>
                        <MaterialIcons name="receipt" size={20} color={colors.adminPrimary} />
                      </View>
                      <View>
                        <Text style={styles.feeTitle}>{fee.title}</Text>
                        <Text style={styles.feeId}>ID: {fee.id.substring(0, 8).toUpperCase()}</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => handleDelete(fee.id)} style={styles.deleteBtn}>
                      <MaterialIcons name="delete-outline" size={22} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.feeDetails}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Total Fee</Text>
                      <Text style={styles.detailValue}>₹{Number(fee.total_amount).toLocaleString()}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Target Group</Text>
                      <Text style={styles.detailValueText}>{fee.course_type} {fee.stream}</Text>
                      <Text style={styles.detailValueText}>Year {fee.year}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          {/* Create Modal */}
          <Modal visible={modalVisible} animationType="slide" transparent>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>New Fee Structure</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                      <MaterialIcons name="close" size={24} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.modalInputLabel}>STRATEGY TITLE</Text>
                      <TextInput style={styles.input} placeholder="e.g. B.Tech CS 2026 Batch" placeholderTextColor="#6b7280" value={title} onChangeText={setTitle} />
                    </View>
                    
                    <View style={styles.inputGroup}>
                      <Text style={styles.modalInputLabel}>TOTAL AMOUNT (₹)</Text>
                      <TextInput style={styles.input} placeholder="e.g. 150000" placeholderTextColor="#6b7280" keyboardType="numeric" value={amount} onChangeText={setAmount} />
                    </View>

                    <View style={styles.rowInputs}>
                      <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.modalInputLabel}>COURSE</Text>
                        <TextInput style={styles.input} placeholder="B.Tech" placeholderTextColor="#6b7280" value={course} onChangeText={setCourse} />
                      </View>
                      <View style={{ width: 12 }} />
                      <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.modalInputLabel}>STREAM</Text>
                        <TextInput style={styles.input} placeholder="CSE" placeholderTextColor="#6b7280" value={stream} onChangeText={setStream} />
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.modalInputLabel}>ACADEMIC YEAR</Text>
                      <TextInput style={styles.input} placeholder="1, 2, 3 or 4" placeholderTextColor="#6b7280" keyboardType="numeric" value={year} onChangeText={setYear} maxLength={1} />
                    </View>

                    <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} disabled={isSubmitting}>
                      {isSubmitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.submitBtnText}>Publish Structure</Text>}
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              </View>
            </KeyboardAvoidingView>
          </Modal>

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
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.adminPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.adminPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 100, paddingTop: 10 },
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: colors.textSecondary, textAlign: 'center', marginTop: 16, fontSize: 15 },
  feeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  feeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  feeTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  feeTitle: { color: colors.white, fontSize: 16, fontWeight: '700', marginBottom: 2 },
  feeId: { color: colors.textMuted, fontSize: 10, fontWeight: '600', letterSpacing: 1 },
  deleteBtn: { padding: 8 },
  feeDetails: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.2)', 
    padding: 16, 
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  detailItem: { flex: 1 },
  divider: { width: 1, height: '60%', backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 16 },
  detailLabel: { color: colors.textSecondary, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700', marginBottom: 6 },
  detailValue: { color: colors.success, fontSize: 18, fontWeight: '900' },
  detailValueText: { color: colors.white, fontSize: 13, fontWeight: '600', marginBottom: 2 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  modalTitle: { color: colors.white, fontSize: 22, fontWeight: '800' },
  inputGroup: { marginBottom: 20 },
  modalInputLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 10, marginLeft: 4 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    color: colors.white,
    padding: 16,
    fontSize: 16,
  },
  rowInputs: { flexDirection: 'row', justifyContent: 'space-between' },
  submitBtn: {
    backgroundColor: colors.adminPrimary,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 40,
    shadowColor: colors.adminPrimary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  submitBtnText: { color: colors.white, fontSize: 16, fontWeight: '800', letterSpacing: 1 },
});
