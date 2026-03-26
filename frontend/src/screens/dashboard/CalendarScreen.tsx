import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Dimensions, Platform, LayoutAnimation, UIManager, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import studentService, { CalendarEvent } from '../../services/studentService';

const { width } = Dimensions.get('window');

const CalendarDay = ({ day, isPrevMonth, isActive, isCritical, hasReminder, onPress }: any) => {
  if (isPrevMonth) {
    return (
      <View style={styles.dayCell}>
        <Text style={styles.dayTextPrev}>{day}</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.dayCell} activeOpacity={0.8} onPress={onPress}>
      {isActive && <View style={styles.dayActiveBg} />}
      <Text style={[styles.dayText, isActive && styles.dayTextActive]}>{day}</Text>
      {isActive && <View style={styles.dayActiveDot} />}
      {!isActive && isCritical && <View style={styles.dayCriticalDot} />}
      {!isActive && hasReminder && <View style={styles.dayReminderDot} />}
      {!isActive && !isCritical && !hasReminder && day === '1' && <View style={styles.dayInfoDot} />}
    </TouchableOpacity>
  );
};

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const CalendarScreen = () => {
  const navigation = useNavigation();
  
  // States handling month and selected day. Initializing to Current real Date
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());
  const [reminders, setReminders] = useState<Record<string, string>>({}); // dateKey -> notificationId
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  // Persistence Key
  const REMINDERS_KEY = 'STUDENT_CALENDAR_REMINDERS';

  useEffect(() => {
    loadReminders();
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const data = await studentService.getCalendarEvents();
      setEvents(data);
    } catch (e) {
      console.error('Failed to fetch calendar events');
    } finally {
      setIsLoading(false);
    }
  };

  const loadReminders = async () => {
    try {
      const stored = await AsyncStorage.getItem(REMINDERS_KEY);
      if (stored) setReminders(JSON.parse(stored));
    } catch (e) {
      console.error('Failed to load reminders');
    }
  };

  const saveReminders = async (updated: Record<string, string>) => {
    try {
      await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(updated));
      setReminders(updated);
    } catch (e) {
      console.error('Failed to save reminders');
    }
  };

  const getDateKey = (day: number) => {
    const d = new Date(year, monthIndex, day);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    let day = new Date(year, month, 1).getDay(); // 0 is Sunday
    return day === 0 ? 6 : day - 1; // Make Monday 0, Sunday 6
  };

  const { prevDays, currDays, year, monthStr, monthIndex } = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const mStr = currentDate.toLocaleString('default', { month: 'long' });
    
    const daysInCurr = getDaysInMonth(y, m);
    const firstDay = getFirstDayOfMonth(y, m);
    const daysInPrev = getDaysInMonth(y, m - 1);

    const prevArr = Array.from({ length: firstDay }, (_, i) => daysInPrev - firstDay + i + 1);
    const currArr = Array.from({ length: daysInCurr }, (_, i) => i + 1);

    return { prevDays: prevArr, currDays: currArr, year: y, monthStr: mStr, monthIndex: m };
  }, [currentDate]);

  const handlePrevMonth = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCurrentDate(new Date(year, monthIndex - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCurrentDate(new Date(year, monthIndex + 1, 1));
    setSelectedDay(null);
  };

  const handleDayPress = (day: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    setSelectedDay(day);
  };

  const handleSetReminder = async () => {
    if (!selectedDay) return;
    
    const dateKey = getDateKey(selectedDay);
    const existingId = reminders[dateKey];

    // Deep importing specific functions from expo-notifications/build to avoid
    // the forbidden push token listener in the index side-effect.
    const { requestPermissionsAsync } = require('expo-notifications/build/NotificationPermissions');
    const { scheduleNotificationAsync } = require('expo-notifications/build/scheduleNotificationAsync');
    const { cancelScheduledNotificationAsync } = require('expo-notifications/build/cancelScheduledNotificationAsync');
    const { SchedulableTriggerInputTypes } = require('expo-notifications/build/Notifications.types');
    
    const Notifications = {
      requestPermissionsAsync,
      scheduleNotificationAsync,
      cancelScheduledNotificationAsync,
      SchedulableTriggerInputTypes
    };

    if (existingId) {
      // Logic to Remove Reminder
      Alert.alert(
        "Existing Reminder",
        "A reminder is already set for this day. Do you want to cancel it?",
        [
          { text: "Keep It", style: "cancel" },
          { text: "Cancel Reminder", style: "destructive", onPress: async () => {
            await Notifications.cancelScheduledNotificationAsync(existingId);
            const updated = { ...reminders };
            delete updated[dateKey];
            saveReminders(updated);
            Alert.alert("Cancelled", "The reminder has been removed.");
          }}
        ]
      );
      return;
    }

    // Request Permissions
    setIsRequesting(true);
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Notifications are required to set reminders.');
      setIsRequesting(false);
      return;
    }

    // Schedule Notification
    const scheduleDate = new Date(year, monthIndex, selectedDay, 9, 0, 0); // 9:00 AM
    
    // If date is in the past, offer a test notification (5 seconds from now) for demo purposes
    // but ideally, we should prevent past reminders.
    if (scheduleDate <= new Date()) {
      Alert.alert(
        "Past Date",
        "This date has already passed. Would you like to set a test reminder for 10 seconds from now?",
        [
          { text: "No", style: "cancel" },
          { text: "Yes, Test It", onPress: async () => {
            const id = await Notifications.scheduleNotificationAsync({
              content: {
                title: "⏰ CAMPUS REMINDER",
                body: `You set a test reminder for ${selectedDay} ${monthStr}. Time to check your tasks!`,
                data: { day: selectedDay, month: monthStr },
              },
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: 10,
              },
            });
            const updated = { ...reminders, [dateKey]: id };
            saveReminders(updated);
            Alert.alert("Success", "Test reminder set for 10 seconds!");
          }}
        ]
      );
      setIsRequesting(false);
      return;
    }

    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "⏰ CAMPUS REMINDER",
          body: `Don't forget your scheduled task for today, ${selectedDay} ${monthStr}!`,
          data: { day: selectedDay, month: monthStr },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: scheduleDate,
        },
      });

      const updated = { ...reminders, [dateKey]: id };
      saveReminders(updated);
      Alert.alert("Reminder Set", `Notification scheduled for ${selectedDay} ${monthStr} at 9:00 AM.`);
    } catch (e) {
      Alert.alert("Error", "Could not schedule notification.");
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => (navigation as any).navigate('MainTabs', { screen: 'Dashboard' })} style={styles.iconBtn}>
            <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Fee Calendar</Text>
          <TouchableOpacity style={styles.iconBtn}>
            <MaterialIcons name="more-vert" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Month Selector */}
          <View style={styles.monthSelector}>
            <TouchableOpacity style={styles.monthNavBtn} onPress={handlePrevMonth}>
              <MaterialIcons name="chevron-left" size={24} color={colors.primary} />
            </TouchableOpacity>
            <View style={styles.monthCenter}>
              <Text style={styles.monthTitle}>{monthStr} {year}</Text>
              <Text style={styles.monthSub}>ACADEMIC YEAR {year}-{String(year + 1).slice(-2)}</Text>
            </View>
            <TouchableOpacity style={styles.monthNavBtn} onPress={handleNextMonth}>
              <MaterialIcons name="chevron-right" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarContainer}>
            <View style={styles.calendarGlow} />
            
            {/* Weekdays */}
            <View style={styles.weekdaysRow}>
              {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day, idx) => (
                <Text key={day} style={[styles.weekdayText, idx >= 5 && { color: colors.secondary }]}>{day}</Text>
              ))}
            </View>

            {/* Days */}
            <View style={styles.daysGrid}>
              {prevDays.map(d => <CalendarDay key={`p-${d}`} day={d.toString()} isPrevMonth />)}
              {currDays.map(d => {
                const dateKey = getDateKey(d);
                const dayEvents = events.filter(e => e.event_date === dateKey);
                const isCritical = dayEvents.some(e => e.type === 'critical');
                const hasReminder = !!reminders[dateKey];
                return (
                  <CalendarDay 
                    key={`c-${d}`} 
                    day={d.toString()} 
                    isActive={d === selectedDay}
                    isCritical={isCritical} 
                    hasReminder={hasReminder}
                    onPress={() => handleDayPress(d)}
                  />
                );
              })}
            </View>
          </View>

          {/* Selected Date Details */}
          {selectedDay ? (
            <View style={styles.detailsSection}>
               <View style={styles.detailsHeader}>
                 <Text style={styles.detailsTitle}>{selectedDay} {monthStr} Details</Text>
               </View>

                <View style={styles.detailsCard}>
                  {events
                    .filter(e => e.event_date === getDateKey(selectedDay))
                    .map((evt, idx) => (
                      <View key={evt.id} style={{ marginBottom: idx < events.filter(e => e.event_date === getDateKey(selectedDay)).length - 1 ? 16 : 0 }}>
                        <View style={styles.detailsCardTop}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.cardLabel}>CATEGORY</Text>
                            <Text style={styles.cardValTitle}>{evt.title}</Text>
                            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>{evt.description}</Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.cardLabel}>AMOUNT</Text>
                            <Text style={styles.cardValAmount}>{evt.amount ? `₹${evt.amount.toLocaleString()}` : '—'}</Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  
                  {events.filter(e => e.event_date === getDateKey(selectedDay)).length === 0 && (
                    <View style={styles.detailsCardTop}>
                      <View>
                        <Text style={styles.cardLabel}>CATEGORY</Text>
                        <Text style={styles.cardValTitle}>Generic Task</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.cardLabel}>AMOUNT</Text>
                        <Text style={styles.cardValAmount}>—</Text>
                      </View>
                    </View>
                  )}

                  <View style={styles.detailsCardActions}>
                    <TouchableOpacity 
                      style={[styles.payNowBtn, reminders[getDateKey(selectedDay)] && { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary }]} 
                      onPress={handleSetReminder}
                      disabled={isRequesting}
                    >
                      <Text style={[styles.payNowText, reminders[getDateKey(selectedDay)] && { color: colors.primary }]}>
                        {reminders[getDateKey(selectedDay)] ? 'CANCEL REMINDER' : 'SET REMINDER'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionCircleBtn}>
                      <MaterialIcons name="event" size={20} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
               </View>
            </View>
          ) : (
            <View style={[styles.detailsSection, { alignItems: 'center', paddingVertical: 20 }]}>
              <MaterialIcons name="event-available" size={32} color={colors.textSecondary} style={{ marginBottom: 8 }} />
              <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>Select a date to view details</Text>
            </View>
          )}

          {/* Additional Alerts */}
          <View style={styles.alertCard}>
            <View style={styles.alertIconBox}>
              <MaterialIcons name="event-repeat" size={24} color={colors.tertiary} />
            </View>
            <View>
              <Text style={styles.alertSub}>NEXT PAYMENT CYCLE</Text>
              <Text style={styles.alertTitle}>Check Notifications</Text>
            </View>
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
    padding: 8,
  },
  headerTitle: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0d1323',
    padding: 16,
    borderRadius: 24,
    marginBottom: 32,
  },
  monthNavBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e253b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthCenter: {
    alignItems: 'center',
  },
  monthTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  monthSub: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 4,
  },
  calendarContainer: {
    backgroundColor: 'rgba(30, 37, 59, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 32,
    padding: 24,
    marginBottom: 32,
    overflow: 'hidden',
  },
  calendarGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 150,
    height: 150,
    backgroundColor: 'rgba(144, 171, 255, 0.1)',
    borderRadius: 75,
  },
  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayTextPrev: {
    color: 'rgba(112, 117, 136, 0.3)',
    fontWeight: '600',
  },
  dayText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  dayTextActive: {
    color: '#000',
    fontWeight: '800',
    zIndex: 10,
  },
  dayActiveBg: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.6,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  dayActiveDot: {
    position: 'absolute',
    bottom: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.error,
    shadowColor: colors.error,
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  dayCriticalDot: {
    position: 'absolute',
    bottom: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.error,
  },
  dayInfoDot: {
    position: 'absolute',
    bottom: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.tertiary,
  },
  dayReminderDot: {
    position: 'absolute',
    bottom: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  detailsSection: {
    marginBottom: 32,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  detailsTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
  },
  criticalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  criticalText: {
    color: colors.error,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  detailsCard: {
    backgroundColor: 'rgba(30, 37, 59, 0.4)',
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
    borderRadius: 24,
    padding: 24,
  },
  detailsCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  cardLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  cardValTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
  },
  cardValAmount: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '800',
  },
  detailsCardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  payNowBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    height: 48,
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  payNowText: {
    color: '#000',
    fontWeight: '800',
    letterSpacing: 1,
    fontSize: 14,
  },
  actionCircleBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1e253b',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertCard: {
    backgroundColor: '#181f33',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  alertIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(71, 196, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertSub: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 4,
  },
  alertTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
  },
});
