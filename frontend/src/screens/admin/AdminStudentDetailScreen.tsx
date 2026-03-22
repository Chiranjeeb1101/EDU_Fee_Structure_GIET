import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Linking, Image, Platform, TextInput, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { AdminGlowingBackground } from '../../components/layout/AdminGlowingBackground';
import adminService from '../../services/adminService';

export const AdminStudentDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { studentId } = route.params as { studentId: string };
  
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [feeStructures, setFeeStructures] = useState<any[]>([]);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchStudentDetail();
  }, [studentId]);

  const fetchStudentDetail = async () => {
    try {
      const data = await adminService.getStudentById(studentId);
      setStudent(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch student details.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = async () => {
    setEditForm({
      full_name: student.users?.full_name || '',
      personal_email: student.users?.personal_email || '',
      course_type: student.course_type || '',
      stream: student.stream || '',
      year: student.year?.toString() || '',
      accommodation: student.accommodation || '',
      remaining_fee: student.remaining_fee?.toString() || '0',
      total_fee: student.total_fee?.toString() || '0',
    });
    setShowEdit(true);
    
    // Fetch available fee structures
    try {
      const structures = await adminService.getFeeStructures();
      setFeeStructures(structures);
    } catch (error) {
      console.error('Failed to fetch structures', error);
    }
  };

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const updates = {
        full_name: editForm.full_name,
        personal_email: editForm.personal_email,
        course_type: editForm.course_type,
        stream: editForm.stream,
        year: parseInt(editForm.year) || null,
        accommodation: editForm.accommodation,
        remaining_fee: parseFloat(editForm.remaining_fee) || 0,
        total_fee: parseFloat(editForm.total_fee) || 0,
      };
      await adminService.updateStudent(studentId, updates);
      Alert.alert('Success', 'Student details updated');
      setShowEdit(false);
      fetchStudentDetail();
    } catch (error) {
      Alert.alert('Error', 'Failed to update student');
    } finally {
      setUpdating(false);
    }
  };

  const SelectionPill = ({ label, options, selected, onSelect }: any) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.pillContainer}>
        {options.map((opt: string) => (
          <TouchableOpacity
            key={opt}
            style={[styles.pill, selected === opt && styles.pillActive]}
            onPress={() => onSelect(opt)}
          >
            <Text style={[styles.pillText, selected === opt && styles.pillTextActive]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const handleDelete = () => {
    // ... no changes here
    Alert.alert(
      'Delete Student',
      `Are you sure you want to permanently delete ${student?.users?.full_name || 'this student'}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminService.deleteStudent(studentId);
              Alert.alert('Deleted', 'Student account has been removed.');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete student.');
            }
          },
        },
      ]
    );
  };

  const handleEmail = () => {
    if (student?.users?.personal_email) {
      Linking.openURL(`mailto:${student.users.personal_email}`);
    } else {
      Alert.alert('No Email', 'This student has no email on file.');
    }
  };

  const handlePhone = () => {
    if (student?.users?.phone_number) {
      Linking.openURL(`tel:${student.users.phone_number}`);
    } else if (student?.student_phone) {
      Linking.openURL(`tel:${student.student_phone}`);
    } else {
      Alert.alert('No Phone', 'This student has no phone number on file.');
    }
  };

  const handleSMS = () => {
    const phone = student?.users?.phone_number || student?.student_phone;
    if (phone) {
      Linking.openURL(`sms:${phone}`);
    } else {
      Alert.alert('No Phone', 'This student has no phone number on file.');
    }
  };

  const handleDueReminder = () => {
    const phone = student?.parent_whatsapp || student?.users?.phone_number || student?.student_phone;
    const name = student?.users?.full_name || 'Student';
    const message = `Dear ${name}, this is a reminder from GIET University. Your pending fee balance is ₹${remainingFee.toLocaleString()}. Please clear your dues at the earliest. Thank you.`;
    if (phone) {
      Linking.openURL(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`);
    } else {
      Alert.alert('No Contact', 'No WhatsApp number available for this student.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: 15 }}>Loading Profile...</Text>
      </View>
    );
  }

  if (!student) return null;

  const totalFee = Number(student.total_fee) || 0;
  const remainingFee = Number(student.remaining_fee) || 0;
  const paidAmount = totalFee - remainingFee;
  const progressPercent = totalFee > 0 ? (paidAmount / totalFee) * 100 : 0;
  const hasDues = remainingFee > 0;

  return (
    <View style={styles.container}>
      <AdminGlowingBackground showParticles={false}>
        <SafeAreaView style={styles.safeArea}>
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <MaterialIcons name="arrow-back" size={24} color={colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Student Profile</Text>
            <TouchableOpacity style={styles.editBtn} onPress={openEditModal}>
              <MaterialIcons name="edit" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            {/* Profile Hero */}
            <View style={styles.heroSection}>
              <View style={styles.avatarContainer}>
                {student.users?.profile_picture ? (
                  <Image source={{ uri: student.users.profile_picture }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>{student.users?.full_name?.charAt(0) || 'S'}</Text>
                  </View>
                )}
                <View style={[styles.statusDot, { backgroundColor: hasDues ? colors.warning : colors.success }]} />
              </View>
              <Text style={styles.heroName}>{student.users?.full_name}</Text>
              <Text style={styles.heroId}>{student.college_id_number}</Text>
              <View style={styles.contactRow}>
                <TouchableOpacity onPress={handlePhone} style={styles.contactBtn}>
                  <MaterialIcons name="phone" size={16} color={colors.success} />
                  <Text style={styles.contactLabel}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleEmail} style={styles.contactBtn}>
                  <MaterialIcons name="email" size={16} color={colors.primary} />
                  <Text style={styles.contactLabel}>Email</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSMS} style={styles.contactBtn}>
                  <MaterialIcons name="sms" size={16} color={colors.warning} />
                  <Text style={styles.contactLabel}>SMS</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDueReminder} style={[styles.contactBtn, { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.3)' }]}>
                  <MaterialIcons name="notification-important" size={16} color={colors.success} />
                  <Text style={[styles.contactLabel, { color: colors.success }]}>Reminder</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Academic Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Academic Information</Text>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Course</Text>
                  <Text style={styles.infoValue}>{student.course_type} ({student.stream})</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Year of Study</Text>
                  <Text style={styles.infoValue}>Year {student.year}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Accommodation</Text>
                  <Text style={[styles.infoValue, {textTransform: 'capitalize'}]}>{student.accommodation}</Text>
                </View>
              </View>
            </View>

            {/* Fee Status */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Fee Status</Text>
              <View style={styles.feeCard}>
                <View style={styles.feeHeader}>
                  <Text style={styles.feeLabel}>Total Fee</Text>
                  <Text style={styles.feeTotal}>₹{totalFee.toLocaleString()}</Text>
                </View>
                
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${progressPercent}%`, backgroundColor: hasDues ? colors.warning : colors.success }]} />
                </View>

                <View style={styles.feeBreakdown}>
                  <View>
                    <Text style={styles.breakdownLabel}>Paid Amount</Text>
                    <Text style={[styles.breakdownValue, { color: colors.success }]}>₹{paidAmount.toLocaleString()}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.breakdownLabel}>Remaining Dues</Text>
                    <Text style={[styles.breakdownValue, { color: hasDues ? colors.error : colors.textSecondary }]}>₹{remainingFee.toLocaleString()}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Payment History */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment History</Text>
              <View style={styles.listContainer}>
                {!student.payments || student.payments.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No payment history found.</Text>
                  </View>
                ) : (
                  student.payments.map((tx: any, idx: number) => (
                    <View key={idx} style={styles.txCard}>
                      <View style={styles.txLeft}>
                        <View style={[styles.txIconBox, { backgroundColor: `${colors.success}1A` }]}>
                          <MaterialIcons name="receipt" size={20} color={colors.success} />
                        </View>
                        <View>
                          <Text style={styles.txName}>{tx.transaction_id || 'Cash Payment'}</Text>
                          <Text style={styles.txDate}>{new Date(tx.created_at).toLocaleDateString()}</Text>
                        </View>
                      </View>
                      <Text style={styles.txAmount}>₹{tx.amount.toLocaleString()}</Text>
                    </View>
                  ))
                )}
              </View>
            </View>

            {/* Delete Student */}
            <View style={styles.section}>
              <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                <MaterialIcons name="delete-forever" size={20} color={colors.error} />
                <Text style={styles.deleteBtnText}>Delete Student Account</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>

          {/* Edit Modal */}
          <Modal visible={showEdit} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Edit Student Details</Text>
                  <TouchableOpacity onPress={() => setShowEdit(false)}>
                    <MaterialIcons name="close" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  
                  {/* Personal Identity Fields */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Full Name</Text>
                    <TextInput 
                      style={styles.input} 
                      value={editForm.full_name} 
                      onChangeText={t => setEditForm({...editForm, full_name: t})} 
                      placeholder="Student Full Name"
                      placeholderTextColor={colors.textSecondary} 
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Personal Email</Text>
                    <TextInput 
                      style={styles.input} 
                      value={editForm.personal_email} 
                      onChangeText={t => setEditForm({...editForm, personal_email: t})} 
                      placeholder="Personal Email Address"
                      placeholderTextColor={colors.textSecondary} 
                    />
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Fee Structure Assignment</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.feeSelector}>
                      {feeStructures.map(s => (
                        <TouchableOpacity 
                          key={s.id} 
                          style={[styles.feeOption, editForm.fee_structure_id === s.id && styles.feeOptionActive]}
                          onPress={() => setEditForm({
                            ...editForm, 
                            fee_structure_id: s.id,
                            course_type: s.course_type,
                            stream: s.stream,
                            year: s.year.toString()
                          })}
                        >
                          <Text style={[styles.feeOptionText, editForm.fee_structure_id === s.id && styles.feeOptionTextActive]}>{s.title}</Text>
                          <Text style={styles.feeOptionSub}>₹{(s.total_fee || 0).toLocaleString()}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  <SelectionPill 
                    label="Course Type" 
                    options={['B.Tech', 'M.Tech', 'BCA', 'MCA']} 
                    selected={editForm.course_type} 
                    onSelect={(val: string) => setEditForm({...editForm, course_type: val})} 
                  />
                  
                  <SelectionPill 
                    label="Stream" 
                    options={['CSE', 'ECE', 'ME', 'CE', 'EEE']} 
                    selected={editForm.stream} 
                    onSelect={(val: string) => setEditForm({...editForm, stream: val})} 
                  />

                  <SelectionPill 
                    label="Year" 
                    options={['1', '2', '3', '4']} 
                    selected={editForm.year} 
                    onSelect={(val: string) => setEditForm({...editForm, year: val})} 
                  />

                  <SelectionPill 
                    label="Accommodation" 
                    options={['day_scholar', 'hosteler']} 
                    selected={editForm.accommodation} 
                    onSelect={(val: string) => setEditForm({...editForm, accommodation: val})} 
                  />

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Total Fee Amount (₹)</Text>
                    <TextInput 
                      style={styles.input} 
                      value={editForm.total_fee} 
                      onChangeText={t => setEditForm({...editForm, total_fee: t})} 
                      keyboardType="numeric" 
                      placeholderTextColor={colors.textSecondary} 
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Remaining Fee Balance (₹)</Text>
                    <TextInput 
                      style={styles.input} 
                      value={editForm.remaining_fee} 
                      onChangeText={t => setEditForm({...editForm, remaining_fee: t})} 
                      keyboardType="numeric" 
                      placeholderTextColor={colors.textSecondary} 
                    />
                  </View>

                  <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate} disabled={updating}>
                    {updating ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          </Modal>

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
  headerTitle: { color: colors.white, fontSize: 18, fontWeight: '700' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 100 },
  heroSection: { alignItems: 'center', marginBottom: 32 },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)' },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(37, 99, 235, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: colors.primary, fontSize: 36, fontWeight: '800' },
  statusDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.background,
  },
  heroName: { color: colors.white, fontSize: 24, fontWeight: '800', marginBottom: 4 },
  heroId: { color: colors.textSecondary, fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', letterSpacing: 1 },
  contactRow: { flexDirection: 'row', gap: 12, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' },
  contactBtn: {
    width: 70,
    height: 60,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  contactLabel: { color: colors.textSecondary, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  section: { marginBottom: 32 },
  sectionTitle: { color: colors.white, fontSize: 18, fontWeight: '700', marginBottom: 16 },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { color: colors.textSecondary, fontSize: 14 },
  infoValue: { color: colors.white, fontSize: 14, fontWeight: '600' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 12 },
  feeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
  },
  feeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  feeLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  feeTotal: { color: colors.white, fontSize: 24, fontWeight: '800' },
  progressTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden', marginBottom: 16 },
  progressFill: { height: '100%', borderRadius: 4 },
  feeBreakdown: { flexDirection: 'row', justifyContent: 'space-between' },
  breakdownLabel: { color: colors.textSecondary, fontSize: 12, marginBottom: 4 },
  breakdownValue: { fontSize: 16, fontWeight: '700' },
  listContainer: { gap: 12 },
  emptyState: { padding: 20, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 16 },
  emptyStateText: { color: colors.textSecondary, fontSize: 14 },
  txCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
  },
  txLeft: { flexDirection: 'row', alignItems: 'center' },
  txIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txName: { color: colors.white, fontSize: 14, fontWeight: '600', marginBottom: 2 },
  txDate: { color: colors.textSecondary, fontSize: 11 },
  txAmount: { color: colors.success, fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { color: colors.white, fontSize: 20, fontWeight: '800' },
  inputGroup: { marginBottom: 16 },
  inputLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 16,
    color: colors.white,
    fontSize: 15,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  saveBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  feeSelector: {
    marginTop: 4,
    marginBottom: 8,
  },
  feeOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginRight: 10,
    minWidth: 140,
  },
  feeOptionActive: {
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    borderColor: colors.primary,
  },
  feeOptionText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  feeOptionTextActive: {
    color: colors.primary,
  },
  feeOptionSub: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
  },
  deleteBtnText: { color: colors.error, fontSize: 14, fontWeight: '700' },
  pillContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  pillActive: {
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
    borderColor: colors.primary,
  },
  pillText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  pillTextActive: { color: colors.white, fontWeight: '700' },
});
