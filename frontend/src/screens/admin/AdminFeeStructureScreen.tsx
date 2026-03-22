import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { colors } from '../../theme/colors';
import { AdminGlowingBackground } from '../../components/layout/AdminGlowingBackground';
import adminService from '../../services/adminService';

export const AdminFeeStructureScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [feeStructures, setFeeStructures] = useState<any[]>([]);
  const [metadata, setMetadata] = useState<any>({ courses: [], streams: [], years: [1,2,3,4] });
  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [course, setCourse] = useState('');
  const [stream, setStream] = useState('');
  const [year, setYear] = useState('1');
  const [accommodation, setAccommodation] = useState('both');
  const [academicYear, setAcademicYear] = useState('2025-26');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fees, meta] = await Promise.all([
        adminService.getFeeStructures(),
        adminService.getFeeMetadata()
      ]);
      setFeeStructures(fees);
      setMetadata(meta);
      
      // Set defaults if metadata exists
      if (meta.courses.length > 0 && !course) setCourse(meta.courses[0]);
      if (meta.streams.length > 0 && !stream) setStream(meta.streams[0]);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch data.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Fee Structure', 'Removing this will update the total fee for all matching students. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await adminService.deleteFeeStructure(id);
          fetchData();
        } catch (error) {
          Alert.alert('Error', 'Failed to delete fee structure.');
        }
      }}
    ]);
  };

  const handleEdit = (fee: any) => {
    setEditingId(fee.id);
    setTitle(fee.title);
    setAmount(fee.total_fee.toString());
    setCourse(fee.course_type);
    setStream(fee.stream);
    setYear(fee.year.toString());
    setAccommodation(fee.accommodation);
    setAcademicYear(fee.academic_year);
    setModalVisible(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle(''); setAmount(''); setYear('1'); setAccommodation('both'); setAcademicYear('2025-26');
    if (metadata.courses.length > 0) setCourse(metadata.courses[0]);
    if (metadata.streams.length > 0) setStream(metadata.streams[0]);
  };

  const handleCreateOrUpdate = async () => {
    if (!title || !amount || !course || !stream || !year || !accommodation || !academicYear) {
      Alert.alert('Validation Error', 'Please fill all fields.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const payload = {
        title,
        total_fee: Number(amount),
        course_type: course,
        stream,
        year: Number(year),
        accommodation,
        academic_year: academicYear
      };

      if (editingId) {
        await adminService.updateFeeStructure(editingId, payload);
      } else {
        await adminService.createFeeStructure(payload);
      }
      
      setModalVisible(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save fee structure.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Grouping Logic
  const groupedFees = feeStructures.reduce((acc: any, fee: any) => {
    const key = `${fee.course_type} - ${fee.stream}`;
    if (!acc[key]) acc[key] = { items: [], total: 0 };
    acc[key].items.push(fee);
    acc[key].total += Number(fee.total_fee);
    return acc;
  }, {});

  // Missing Configurations
  const missingConfigs = metadata.courses.flatMap((c: string) => 
    metadata.streams.map((s: string) => {
      const key = `${c} - ${s}`;
      return groupedFees[key] ? null : key;
    })
  ).filter(Boolean);

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
              <Text style={styles.headerTitle}>Fee Management</Text>
              <Text style={styles.headerSub}>STRUCTURES & POLICIES</Text>
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={() => { resetForm(); setModalVisible(true); }}>
              <MaterialIcons name="add" size={24} color={colors.white} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {loading ? (
              <ActivityIndicator size="large" color={colors.adminPrimary} style={{ marginTop: 40 }} />
            ) : Object.keys(groupedFees).length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="receipt-long" size={48} color={colors.textSecondary} />
                <Text style={styles.emptyText}>No fee structures created yet.</Text>
              </View>
            ) : (
              <>
                {Object.entries(groupedFees).map(([groupKey, group]: [string, any]) => (
                  <View key={groupKey} style={styles.groupCard}>
                    <View style={styles.groupHeader}>
                      <Text style={styles.groupHeaderTitle}>{groupKey}</Text>
                      <View style={styles.totalBadge}>
                        <Text style={styles.totalBadgeText}>Total: ₹{group.total.toLocaleString()}</Text>
                      </View>
                    </View>
                    
                    {group.items.map((fee: any) => (
                      <View key={fee.id} style={styles.feeItem}>
                        <View style={styles.feeInfoLine}>
                          <View style={styles.feeTypeTag}>
                            <Text style={styles.feeTypeTagText}>{fee.title}</Text>
                          </View>
                          <Text style={styles.feeAmountText}>₹{Number(fee.total_fee).toLocaleString()}</Text>
                        </View>
                        <View style={styles.feeMetaLine}>
                          <Text style={styles.feeMetaText}>Year {fee.year} • {fee.accommodation.replace('_', ' ')} • {fee.academic_year}</Text>
                          <View style={styles.feeActions}>
                            <TouchableOpacity onPress={() => handleEdit(fee)} style={styles.actionIconBtn}>
                              <MaterialIcons name="edit" size={18} color={colors.adminPrimary} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDelete(fee.id)} style={styles.actionIconBtn}>
                              <MaterialIcons name="delete" size={18} color={colors.error} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                ))}

                {missingConfigs.length > 0 && (
                  <View style={styles.missingSection}>
                    <Text style={styles.missingTitle}>Missing Configurations</Text>
                    <View style={styles.missingList}>
                      {missingConfigs.map((key: string) => (
                        <View key={key} style={styles.missingTag}>
                          <Text style={styles.missingTagText}>{key}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </>
            )}
          </ScrollView>

          {/* Create/Edit Modal */}
          <Modal visible={modalVisible} animationType="fade" transparent>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{editingId ? 'Edit Fee Item' : 'New Fee Item'}</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                      <MaterialIcons name="close" size={24} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.modalInputLabel}>FEE TITLE (e.g. Tution, Hostel)</Text>
                      <TextInput style={styles.input} placeholder="Enter title" placeholderTextColor="#6b7280" value={title} onChangeText={setTitle} />
                    </View>
                    
                    <View style={styles.inputGroup}>
                      <Text style={styles.modalInputLabel}>AMOUNT (₹)</Text>
                      <TextInput style={styles.input} placeholder="0.00" placeholderTextColor="#6b7280" keyboardType="numeric" value={amount} onChangeText={setAmount} />
                    </View>

                    <View style={styles.dropdownRow}>
                      <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.modalInputLabel}>COURSE</Text>
                        <View style={styles.pickerContainer}>
                          <Picker selectedValue={course} onValueChange={setCourse} style={styles.picker} dropdownIconColor={colors.white}>
                            {metadata.courses.map((c: string) => <Picker.Item key={c} label={c} value={c} />)}
                          </Picker>
                        </View>
                      </View>
                      <View style={{ width: 12 }} />
                      <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.modalInputLabel}>STREAM</Text>
                        <View style={styles.pickerContainer}>
                          <Picker selectedValue={stream} onValueChange={setStream} style={styles.picker} dropdownIconColor={colors.white}>
                            {metadata.streams.map((s: string) => <Picker.Item key={s} label={s} value={s} />)}
                          </Picker>
                        </View>
                      </View>
                    </View>

                    <View style={styles.dropdownRow}>
                      <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.modalInputLabel}>YEAR</Text>
                        <View style={styles.pickerContainer}>
                          <Picker selectedValue={year} onValueChange={setYear} style={styles.picker} dropdownIconColor={colors.white}>
                            {[1, 2, 3, 4].map(y => <Picker.Item key={y} label={`Year ${y}`} value={y.toString()} />)}
                          </Picker>
                        </View>
                      </View>
                      <View style={{ width: 12 }} />
                      <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.modalInputLabel}>ACCOMODATION</Text>
                        <View style={styles.pickerContainer}>
                          <Picker selectedValue={accommodation} onValueChange={setAccommodation} style={styles.picker} dropdownIconColor={colors.white}>
                            <Picker.Item label="All" value="both" />
                            <Picker.Item label="Hosteler" value="hosteler" />
                            <Picker.Item label="Day Scholar" value="day_scholar" />
                          </Picker>
                        </View>
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.modalInputLabel}>ACADEMIC YEAR</Text>
                      <TextInput style={styles.input} placeholder="2025-26" placeholderTextColor="#6b7280" value={academicYear} onChangeText={setAcademicYear} />
                    </View>

                    <TouchableOpacity style={styles.submitBtn} onPress={handleCreateOrUpdate} disabled={isSubmitting}>
                      {isSubmitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.submitBtnText}>{editingId ? 'Save Changes' : 'Add Fee Item'}</Text>}
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 20 },
  headerInfo: { flex: 1, marginLeft: 8 },
  headerTitle: { color: colors.white, fontSize: 24, fontWeight: '800' },
  headerSub: { color: colors.adminPrimary, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginTop: 4 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  addBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.adminPrimary, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 100, paddingTop: 10 },
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: colors.textSecondary, textAlign: 'center', marginTop: 16, fontSize: 15 },
  
  groupCard: { backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 24, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  groupHeaderTitle: { color: colors.white, fontSize: 16, fontWeight: '800' },
  totalBadge: { backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  totalBadgeText: { color: colors.success, fontSize: 12, fontWeight: '800' },
  
  feeItem: { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 16, padding: 12, marginBottom: 8 },
  feeInfoLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  feeTypeTag: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  feeTypeTagText: { color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  feeAmountText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  feeMetaLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  feeMetaText: { color: colors.textMuted, fontSize: 10, fontWeight: '600' },
  feeActions: { flexDirection: 'row' },
  actionIconBtn: { padding: 4, marginLeft: 8 },
  
  missingSection: { marginTop: 10, padding: 16 },
  missingTitle: { color: colors.textSecondary, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  missingList: { flexDirection: 'row', flexWrap: 'wrap' },
  missingTag: { backgroundColor: 'rgba(239, 68, 68, 0.05)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 8, marginBottom: 8 },
  missingTagText: { color: colors.error, fontSize: 11, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { color: colors.white, fontSize: 20, fontWeight: '800' },
  inputGroup: { marginBottom: 16 },
  modalInputLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 14, color: colors.white, padding: 12, fontSize: 15 },
  dropdownRow: { flexDirection: 'row', justifyContent: 'space-between' },
  pickerContainer: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 14, overflow: 'hidden' },
  picker: { color: colors.white, height: 50 },
  submitBtn: { backgroundColor: colors.adminPrimary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 10, marginBottom: 30 },
  submitBtnText: { color: colors.white, fontSize: 16, fontWeight: '800' },
});
