import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

const { width } = Dimensions.get('window');

type TabType = 'reminder' | 'broadcast';

interface Student {
  id: string;
  college_id_number: string;
  stream: string;
  year: number;
  remaining_fee: number;
  users?: { full_name: string; email: string; personal_email?: string };
}

export function AdminEmailScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<TabType>('reminder');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [filterStream, setFilterStream] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/students');
      setStudents(res.data.data);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Filter students
  const filteredStudents = students.filter((s) => {
    if (activeTab === 'reminder' && Number(s.remaining_fee) <= 0) return false;
    if (filterStream && !s.stream?.toLowerCase().includes(filterStream.toLowerCase())) return false;
    if (filterYear && String(s.year) !== filterYear) return false;
    return true;
  });

  const toggleSelect = (id: string) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    const allIds = filteredStudents.map((s) => s.id);
    setSelectedStudents((prev) =>
      prev.length === allIds.length ? [] : allIds
    );
  };

  const sendReminders = async () => {
    setSending(true);
    setResult(null);
    try {
      const payload: any = {};
      if (selectedStudents.length > 0) payload.studentIds = selectedStudents;
      if (dueDate) payload.dueDate = dueDate;

      const res = await api.post('/admin/email/reminder', payload);
      setResult(res.data.data);
      Alert.alert('Success', res.data.message);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to send reminders');
    } finally {
      setSending(false);
    }
  };

  const sendBroadcast = async () => {
    if (!broadcastSubject.trim() || !broadcastMessage.trim()) {
      Alert.alert('Missing Fields', 'Please enter both subject and message.');
      return;
    }
    setSending(true);
    setResult(null);
    try {
      const payload: any = { subject: broadcastSubject, message: broadcastMessage };
      if (selectedStudents.length > 0) payload.studentIds = selectedStudents;

      const res = await api.post('/admin/email/broadcast', payload);
      setResult(res.data.data);
      Alert.alert('Success', res.data.message);
      setBroadcastSubject('');
      setBroadcastMessage('');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to send broadcast');
    } finally {
      setSending(false);
    }
  };

  const renderStudentCard = (student: Student) => {
    const isSelected = selectedStudents.includes(student.id);
    const hasEmail = !!(student.users?.personal_email || student.users?.email);

    return (
      <TouchableOpacity
        key={student.id}
        style={[styles.studentCard, isSelected && styles.studentCardSelected, !hasEmail && styles.studentCardNoEmail]}
        onPress={() => hasEmail && toggleSelect(student.id)}
        activeOpacity={hasEmail ? 0.7 : 1}
      >
        <View style={styles.studentCheckbox}>
          <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
            {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
        </View>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName} numberOfLines={1}>
            {student.users?.full_name || 'N/A'}
          </Text>
          <Text style={styles.studentMeta}>
            {student.college_id_number} • {student.stream} Year {student.year}
          </Text>
          {!hasEmail && (
            <Text style={styles.noEmailText}>No email on file</Text>
          )}
        </View>
        {activeTab === 'reminder' && (
          <View style={styles.feeTag}>
            <Text style={styles.feeTagText}>₹{Number(student.remaining_fee).toLocaleString('en-IN')}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>📧 Email Center</Text>
          <View style={{ width: 36 }} />
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'reminder' && styles.tabActive]}
          onPress={() => { setActiveTab('reminder'); setSelectedStudents([]); setResult(null); }}
        >
          <Ionicons name="alarm-outline" size={18} color={activeTab === 'reminder' ? '#f59e0b' : '#64748b'} />
          <Text style={[styles.tabText, activeTab === 'reminder' && styles.tabTextActive]}>Reminders</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'broadcast' && styles.tabActive]}
          onPress={() => { setActiveTab('broadcast'); setSelectedStudents([]); setResult(null); }}
        >
          <Ionicons name="megaphone-outline" size={18} color={activeTab === 'broadcast' ? '#3b82f6' : '#64748b'} />
          <Text style={[styles.tabText, activeTab === 'broadcast' && styles.tabTextActive]}>Broadcast</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Result Banner */}
        {result && (
          <View style={styles.resultBanner}>
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            <Text style={styles.resultText}>
              Sent: {result.sent} • Failed: {result.failed} • Total: {result.total}
            </Text>
          </View>
        )}

        {/* Broadcast Form */}
        {activeTab === 'broadcast' && (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Compose Message</Text>
            <TextInput
              style={styles.input}
              placeholder="Subject"
              placeholderTextColor="#64748b"
              value={broadcastSubject}
              onChangeText={setBroadcastSubject}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Message body..."
              placeholderTextColor="#64748b"
              value={broadcastMessage}
              onChangeText={setBroadcastMessage}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>
        )}

        {/* Reminder Due Date */}
        {activeTab === 'reminder' && (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Due Date (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 31 Mar 2026"
              placeholderTextColor="#64748b"
              value={dueDate}
              onChangeText={setDueDate}
            />
          </View>
        )}

        {/* Filters */}
        <View style={styles.filterRow}>
          <TextInput
            style={[styles.input, styles.filterInput]}
            placeholder="Stream filter"
            placeholderTextColor="#64748b"
            value={filterStream}
            onChangeText={setFilterStream}
          />
          <TextInput
            style={[styles.input, styles.filterInput]}
            placeholder="Year"
            placeholderTextColor="#64748b"
            value={filterYear}
            onChangeText={setFilterYear}
            keyboardType="numeric"
          />
        </View>

        {/* Select All */}
        <View style={styles.selectAllRow}>
          <TouchableOpacity style={styles.selectAllBtn} onPress={selectAll}>
            <Ionicons
              name={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0 ? 'checkbox' : 'square-outline'}
              size={20}
              color="#3b82f6"
            />
            <Text style={styles.selectAllText}>
              {selectedStudents.length === filteredStudents.length && filteredStudents.length > 0
                ? 'Deselect All'
                : 'Select All'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.countText}>
            {selectedStudents.length > 0
              ? `${selectedStudents.length} selected`
              : `${filteredStudents.length} students`}
          </Text>
        </View>

        {/* Student List */}
        {loading ? (
          <ActivityIndicator size="large" color="#3b82f6" style={{ padding: 40 }} />
        ) : (
          filteredStudents.map(renderStudentCard)
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Send Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.sendBtn,
            activeTab === 'reminder' ? styles.sendBtnReminder : styles.sendBtnBroadcast,
            sending && styles.sendBtnDisabled,
          ]}
          onPress={activeTab === 'reminder' ? sendReminders : sendBroadcast}
          disabled={sending}
        >
          {sending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons
                name={activeTab === 'reminder' ? 'alarm' : 'send'}
                size={20}
                color="#fff"
              />
              <Text style={styles.sendBtnText}>
                {activeTab === 'reminder'
                  ? `Send Reminders${selectedStudents.length > 0 ? ` (${selectedStudents.length})` : ' (All)'}`
                  : `Send Broadcast${selectedStudents.length > 0 ? ` (${selectedStudents.length})` : ' (All)'}`}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: 16, paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  tabContainer: { flexDirection: 'row', marginHorizontal: 20, marginTop: 16, backgroundColor: '#1e293b', borderRadius: 12, padding: 4 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, gap: 6 },
  tabActive: { backgroundColor: '#0f172a' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  tabTextActive: { color: '#f1f5f9' },
  content: { flex: 1, paddingHorizontal: 20, marginTop: 16 },
  formSection: { marginBottom: 16 },
  sectionTitle: { color: '#94a3b8', fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#1e293b', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: '#f1f5f9', fontSize: 14, borderWidth: 1, borderColor: '#334155' },
  textArea: { minHeight: 120, textAlignVertical: 'top' },
  filterRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  filterInput: { flex: 1 },
  selectAllRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingVertical: 8 },
  selectAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  selectAllText: { color: '#3b82f6', fontSize: 14, fontWeight: '600' },
  countText: { color: '#64748b', fontSize: 13 },
  studentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#334155' },
  studentCardSelected: { borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.08)' },
  studentCardNoEmail: { opacity: 0.5 },
  studentCheckbox: { marginRight: 12 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#475569', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  studentInfo: { flex: 1 },
  studentName: { color: '#f1f5f9', fontSize: 15, fontWeight: '600' },
  studentMeta: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  noEmailText: { color: '#ef4444', fontSize: 11, marginTop: 2, fontStyle: 'italic' },
  feeTag: { backgroundColor: 'rgba(245,158,11,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  feeTagText: { color: '#f59e0b', fontSize: 13, fontWeight: '700' },
  resultBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(16,185,129,0.1)', padding: 14, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)' },
  resultText: { color: '#10b981', fontSize: 14, fontWeight: '600' },
  bottomBar: { paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 30 : 20, paddingTop: 12, backgroundColor: '#0f172a', borderTopWidth: 1, borderTopColor: '#1e293b' },
  sendBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 14 },
  sendBtnReminder: { backgroundColor: '#f59e0b' },
  sendBtnBroadcast: { backgroundColor: '#3b82f6' },
  sendBtnDisabled: { opacity: 0.6 },
  sendBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
