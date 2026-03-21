import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Platform, LayoutAnimation, UIManager, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import { colors } from '../../theme/colors';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const INITIAL_NOTIFICATIONS = [
  {
    id: '1',
    title: "Tuition Fee Reminder",
    desc: "Your semester 4 tuition fee is due in 3 days. Please complete the payment to avoid late charges.",
    time: "2 hours ago",
    isNew: true,
    icon: "event-busy",
    color: colors.error,
    section: "Today"
  },
  {
    id: '2',
    title: "System Maintenance",
    desc: "The portal will be down for scheduled maintenance from 2 AM to 4 AM tonight.",
    time: "5 hours ago",
    isNew: true,
    icon: "settings",
    color: colors.tertiary,
    section: "Today"
  },
  {
    id: '3',
    title: "Receipt Generated",
    desc: "Your payment of ₹15,000 for Hostel Maintenance has been confirmed. Receipt is ready to download.",
    time: "2 days ago",
    isNew: false,
    icon: "receipt-long",
    color: colors.secondary,
    section: "Earlier this week"
  },
  {
    id: '4',
    title: "Welcome to Luminous",
    desc: "Your student account has been successfully verified. ID card is now active.",
    time: "4 days ago",
    isNew: false,
    icon: "verified-user",
    color: colors.primary,
    section: "Earlier this week"
  }
];

const NotificationItem = ({ item, onDelete, onRead }: any) => (
  <TouchableOpacity 
    style={[styles.notifItem, item.isNew ? styles.notifItemNew : null]}
    activeOpacity={0.8}
    onPress={() => item.isNew && onRead && onRead(item.id)}
  >
    <View style={[styles.notifIconBox, { backgroundColor: `${item.color}1A` }]}>
      <MaterialIcons name={item.icon} size={20} color={item.color} />
      {item.isNew && <View style={styles.newBadge} />}
    </View>
    <View style={styles.notifContent}>
      <Text style={styles.notifTitle}>{item.title}</Text>
      <Text style={styles.notifDesc}>{item.desc}</Text>
      <Text style={styles.notifTime}>{item.time}</Text>
    </View>
    <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.deleteBtn}>
      <MaterialIcons name="close" size={16} color={colors.textSecondary} />
    </TouchableOpacity>
  </TouchableOpacity>
);

export const NotificationScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  useEffect(() => {
    const loadNotifs = async () => {
      try {
        const stored = await AsyncStorage.getItem('notifications_state');
        if (stored) {
          setNotifications(JSON.parse(stored));
        }
      } catch (err) {}
    };
    loadNotifs();
  }, []);

  const persistNotifs = async (newNotifs: any[]) => {
    setNotifications(newNotifs);
    try {
      await AsyncStorage.setItem('notifications_state', JSON.stringify(newNotifs));
    } catch (err) {}
  };

  const handleRead = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const updated = notifications.map(n => n.id === id ? { ...n, isNew: false } : n);
    persistNotifs(updated);
  };

  const handleDelete = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    persistNotifs(notifications.filter(n => n.id !== id));
  };

  const handleClearAll = () => {
    Alert.alert(
      "Clear All Notifications",
      "Are you sure you want to delete all notifications?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear All", 
          style: "destructive", 
          onPress: () => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            persistNotifs([]);
          } 
        }
      ]
    );
  };

  const todayNotifs = notifications.filter(n => n.section === "Today");
  const earlierNotifs = notifications.filter(n => n.section === "Earlier this week");

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => (navigation as any).navigate('MainTabs', { screen: 'Dashboard' })} style={styles.iconButton}>
            <MaterialIcons name="arrow-back" size={20} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity style={styles.iconButton} onPress={handleClearAll} disabled={notifications.length === 0}>
            <MaterialIcons name="clear-all" size={24} color={notifications.length === 0 ? colors.textSecondary : colors.error} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="notifications-none" size={64} color="rgba(255,255,255,0.1)" />
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptyDesc}>You have no new notifications.</Text>
            </View>
          ) : (
            <>
              {todayNotifs.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Today</Text>
                  {todayNotifs.map(n => <NotificationItem key={n.id} item={n} onDelete={handleDelete} onRead={handleRead} />)}
                </>
              )}

              {earlierNotifs.length > 0 && (
                <>
                  <Text style={[styles.sectionTitle, { marginTop: todayNotifs.length > 0 ? 24 : 0 }]}>Earlier this week</Text>
                  {earlierNotifs.map(n => <NotificationItem key={n.id} item={n} onDelete={handleDelete} onRead={handleRead} />)}
                </>
              )}
            </>
          )}

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
    backgroundColor: '#13192b',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 24,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  notifItem: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: 'rgba(30, 37, 59, 0.3)',
    borderRadius: 24,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  notifItemNew: {
    backgroundColor: 'rgba(30, 37, 59, 0.8)',
    borderColor: 'rgba(144, 171, 255, 0.2)',
  },
  notifIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  newBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: '#1e253b',
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  notifDesc: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 8,
  },
  notifTime: {
    color: colors.primary, // dim primary
    opacity: 0.6,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  deleteBtn: {
    padding: 8,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDesc: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
});
