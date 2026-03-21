import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { AdminGlowingBackground } from '../../components/layout/AdminGlowingBackground';
import adminService from '../../services/adminService';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'due_reminder' | 'new_student' | 'payment' | 'info';
  time: string;
  read: boolean;
}

export const AdminNotificationsScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      generateNotifications();
    }, [])
  );

  const generateNotifications = async () => {
    try {
      // Fetch real data and generate smart notifications
      const [stats, students] = await Promise.all([
        adminService.getAdminStats(),
        adminService.getStudents(),
      ]);

      const notifs: NotificationItem[] = [];

      // Students with dues
      const studentsWithDues = students.filter((s: any) => Number(s.remaining_fee) > 0);
      if (studentsWithDues.length > 0) {
        notifs.push({
          id: 'dues_summary',
          title: 'Pending Fee Dues',
          message: `${studentsWithDues.length} student(s) have pending fee dues totaling ₹${stats.total_pending?.toLocaleString() || 0}`,
          type: 'due_reminder',
          time: 'Today',
          read: false,
        });

        // Individual top due students
        const topDues = studentsWithDues
          .sort((a: any, b: any) => Number(b.remaining_fee) - Number(a.remaining_fee))
          .slice(0, 3);
        
        topDues.forEach((s: any, idx: number) => {
          notifs.push({
            id: `due_${idx}`,
            title: `${s.users?.full_name || 'Student'} - Fee Due`,
            message: `₹${Number(s.remaining_fee).toLocaleString()} pending · ${s.course_type} ${s.stream} Year ${s.year}`,
            type: 'due_reminder',
            time: 'Action needed',
            read: false,
          });
        });
      }

      // Collection summary
      if (stats.total_collected > 0) {
        notifs.push({
          id: 'collection',
          title: 'Collection Summary',
          message: `Total ₹${stats.total_collected.toLocaleString()} collected from ${stats.total_students} students.`,
          type: 'payment',
          time: 'This period',
          read: true,
        });
      }

      // Recent payments
      if (stats.recent_payments?.length > 0) {
        stats.recent_payments.slice(0, 3).forEach((p: any, idx: number) => {
          notifs.push({
            id: `payment_${idx}`,
            title: 'Payment Received',
            message: `₹${p.amount?.toLocaleString()} from ${p.students?.users?.full_name || 'Student'}`,
            type: 'payment',
            time: new Date(p.created_at).toLocaleDateString(),
            read: true,
          });
        });
      }

      // New student count
      notifs.push({
        id: 'total_students',
        title: 'Student Enrollment',
        message: `${stats.total_students} students currently enrolled across ${stats.active_fee_structures} fee structures.`,
        type: 'info',
        time: 'Overview',
        read: true,
      });

      setNotifications(notifs);
    } catch (error) {
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    generateNotifications();
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'due_reminder': return { icon: 'warning', color: colors.warning };
      case 'new_student': return { icon: 'person-add', color: colors.primary };
      case 'payment': return { icon: 'payment', color: colors.success };
      default: return { icon: 'info', color: colors.adminPrimary };
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.adminPrimary} />
        <Text style={{ color: colors.textSecondary, marginTop: 15 }}>Loading Notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AdminGlowingBackground showParticles={false}>
        <SafeAreaView style={styles.safeArea}>
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <MaterialIcons name="arrow-back" size={24} color={colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Notifications</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.adminPrimary} />}
          >
            {notifications.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="notifications-none" size={48} color={colors.textSecondary} />
                <Text style={styles.emptyText}>No notifications</Text>
              </View>
            ) : (
              notifications.map((notif) => {
                const { icon, color } = getIconForType(notif.type);
                return (
                  <View key={notif.id} style={[styles.notifCard, !notif.read && styles.notifCardUnread]}>
                    <View style={[styles.notifIconBox, { backgroundColor: `${color}1A` }]}>
                      <MaterialIcons name={icon as any} size={22} color={color} />
                    </View>
                    <View style={styles.notifContent}>
                      <View style={styles.notifHeader}>
                        <Text style={styles.notifTitle} numberOfLines={1}>{notif.title}</Text>
                        {!notif.read && <View style={styles.unreadDot} />}
                      </View>
                      <Text style={styles.notifMessage} numberOfLines={2}>{notif.message}</Text>
                      <Text style={styles.notifTime}>{notif.time}</Text>
                    </View>
                  </View>
                );
              })
            )}
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
  headerTitle: { color: colors.white, fontSize: 18, fontWeight: '700' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 100 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: colors.textSecondary, fontSize: 16, marginTop: 12 },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 14,
  },
  notifCardUnread: {
    backgroundColor: 'rgba(14, 165, 233, 0.04)',
    borderColor: 'rgba(14, 165, 233, 0.15)',
  },
  notifIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifContent: { flex: 1 },
  notifHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  notifTitle: { color: colors.white, fontSize: 14, fontWeight: '700', flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.adminPrimary, marginLeft: 8 },
  notifMessage: { color: colors.textSecondary, fontSize: 13, lineHeight: 18, marginBottom: 6 },
  notifTime: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
});
