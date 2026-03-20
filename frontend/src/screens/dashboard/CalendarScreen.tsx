import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Dimensions, Platform, LayoutAnimation, UIManager } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';

const { width } = Dimensions.get('window');

const CalendarDay = ({ day, isPrevMonth, isActive, isCritical, onPress }: any) => {
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
      {!isActive && !isCritical && day === '1' && <View style={styles.dayInfoDot} />}
    </TouchableOpacity>
  );
};

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const CalendarScreen = () => {
  const navigation = useNavigation();
  
  // States handling month and selected day. Initializing to August 2026
  const [currentDate, setCurrentDate] = useState(new Date(2026, 7, 15));
  const [selectedDay, setSelectedDay] = useState<number | null>(15);

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
                // Mocking some critical days and info days
                const isCritical = (d === 15 && monthIndex === 7); // Aug 15th
                return (
                  <CalendarDay 
                    key={`c-${d}`} 
                    day={d.toString()} 
                    isActive={d === selectedDay}
                    isCritical={isCritical} 
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
                 {selectedDay === 15 && monthIndex === 7 && (
                   <View style={styles.criticalBadge}>
                     <MaterialIcons name="warning" size={12} color={colors.error} style={{ marginRight: 4 }} />
                     <Text style={styles.criticalText}>CRITICAL DEADLINE</Text>
                   </View>
                 )}
               </View>

               <View style={styles.detailsCard}>
                  <View style={styles.detailsCardTop}>
                    <View>
                      <Text style={styles.cardLabel}>CATEGORY</Text>
                      <Text style={styles.cardValTitle}>{selectedDay === 15 && monthIndex === 7 ? 'Pending Due' : 'No Events'}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.cardLabel}>AMOUNT</Text>
                      <Text style={styles.cardValAmount}>{selectedDay === 15 && monthIndex === 7 ? '₹15,000' : '—'}</Text>
                    </View>
                  </View>

                  {selectedDay === 15 && monthIndex === 7 && (
                    <View style={styles.detailsCardActions}>
                      <TouchableOpacity style={styles.payNowBtn}>
                        <Text style={styles.payNowText}>PAY NOW</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionCircleBtn}>
                        <MaterialIcons name="notifications" size={20} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionCircleBtn}>
                        <MaterialIcons name="chat" size={20} color={colors.tertiary} />
                      </TouchableOpacity>
                    </View>
                  )}
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
              <Text style={styles.alertTitle}>October 01, 2026</Text>
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
