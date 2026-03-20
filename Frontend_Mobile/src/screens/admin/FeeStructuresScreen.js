import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput, ScrollView } from 'react-native';
import api from '../../services/api';

export default function FeeStructuresScreen() {
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Form states
  const [courseType, setCourseType] = useState('B.Tech');
  const [stream, setStream] = useState('CSE');
  const [year, setYear] = useState('1');
  const [accommodation, setAccommodation] = useState('day_scholar');
  const [totalFee, setTotalFee] = useState('');
  const [academicYear, setAcademicYear] = useState('2025-26');

  useEffect(() => {
    fetchStructures();
  }, []);

  const fetchStructures = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/fee-structures');
      setStructures(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!totalFee) {
      Alert.alert('Error', 'Please enter a total fee amount');
      return;
    }
    setCreating(true);
    try {
      await api.post('/admin/fee-structures', {
        course_type: courseType,
        stream,
        year: parseInt(year, 10),
        accommodation,
        total_fee: parseInt(totalFee, 10),
        academic_year: academicYear
      });
      Alert.alert('Success', 'Fee structure created!');
      setTotalFee('');
      fetchStructures();
    } catch (e) {
      Alert.alert('Details Error', e.response?.data?.message || e.message);
    } finally {
      setCreating(false);
    }
  };

  const deleteStructure = async (id) => {
    try {
      await api.delete(`/admin/fee-structures/${id}`);
      fetchStructures();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      
      <View style={styles.createCard}>
        <Text style={styles.cardTitle}>New Fee Structure</Text>
        
        <View style={styles.row}>
          <TextInput style={[styles.input, {flex: 1, marginRight: 5}]} placeholder="Course (B.Tech)" value={courseType} onChangeText={setCourseType} />
          <TextInput style={[styles.input, {flex: 1, marginLeft: 5}]} placeholder="Stream (CSE)" value={stream} onChangeText={setStream} />
        </View>
        <View style={styles.row}>
          <TextInput style={[styles.input, {flex: 1, marginRight: 5}]} keyboardType="numeric" placeholder="Year (1)" value={year} onChangeText={setYear} />
          <TextInput style={[styles.input, {flex: 1, marginLeft: 5}]} placeholder="Hostel/Day" value={accommodation} onChangeText={setAccommodation} />
        </View>
        <View style={styles.row}>
          <TextInput style={[styles.input, {flex: 1, marginRight: 5}]} placeholder="Academic Year" value={academicYear} onChangeText={setAcademicYear} />
          <TextInput style={[styles.input, {flex: 1, marginLeft: 5, borderColor: '#007bff'}]} keyboardType="numeric" placeholder="Total Fee (₹)" value={totalFee} onChangeText={setTotalFee} />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleCreate} disabled={creating}>
          {creating ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Structure</Text>}
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Active Structures ({structures.length})</Text>
      
      {loading ? <ActivityIndicator size="large" /> : (
        <FlatList
          data={structures}
          scrollEnabled={false}
          keyExtractor={s => s.id}
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <View>
                <Text style={styles.itemTitle}>{item.course_type} - {item.stream} (Year {item.year})</Text>
                <Text style={styles.itemSub}>{item.accommodation} | {item.academic_year}</Text>
                <Text style={styles.itemFee}>Total Fee: ₹{item.total_fee}</Text>
              </View>
              <TouchableOpacity onPress={() => deleteStructure(item.id)}>
                <Text style={{color: 'red', fontWeight: 'bold'}}>DEL</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
      <View style={{height:40}}/>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#f0f2f5' },
  createCard: { backgroundColor: '#fff', padding: 15, borderRadius: 10, elevation: 2, marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 6, backgroundColor: '#f9f9f9' },
  button: { backgroundColor: '#007bff', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 5 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  itemCard: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemTitle: { fontSize: 16, fontWeight: 'bold' },
  itemSub: { color: '#666', marginTop: 3 },
  itemFee: { color: '#28a745', fontWeight: 'bold', marginTop: 5 }
});
