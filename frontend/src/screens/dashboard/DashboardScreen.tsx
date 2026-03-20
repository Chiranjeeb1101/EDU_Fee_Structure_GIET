import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, Dimensions, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import { colors } from '../../theme/colors';
import { GlowingBackground } from '../../components/layout/GlowingBackground';

const { width } = Dimensions.get('window');

const QuickAction = ({ icon, label, subLabel, color, onPress }: { icon: keyof typeof MaterialIcons.glyphMap, label: string, subLabel: string, color: string, onPress: () => void }) => (
  <TouchableOpacity style={[styles.actionCard, { borderLeftColor: color }]} onPress={onPress}>
    <View style={[styles.actionIconBg, { backgroundColor: `${color}1A` }]}>
      <MaterialIcons name={icon} size={24} color={color} />
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
    <Text style={styles.actionSub}>{subLabel}</Text>
  </TouchableOpacity>
);

const DeadlineTask = ({ dateNum, dateMonth, title, subtitle, amount, timeLabel, isUrgent }: any) => (
  <TouchableOpacity style={styles.deadlineCard}>
    <View style={[styles.dateBox, isUrgent ? styles.dateBoxUrgent : styles.dateBoxNormal]}>
      <Text style={[styles.dateNum, isUrgent && { color: colors.error }]}>{dateNum}</Text>
      <Text style={[styles.dateMonth, isUrgent && { color: colors.error }]}>{dateMonth}</Text>
    </View>
    <View style={styles.deadlineContent}>
      <Text style={styles.deadlineTitle}>{title}</Text>
      <Text style={styles.deadlineSub}>{subtitle}</Text>
    </View>
    <View style={styles.deadlineRight}>
      <View style={[styles.timeBadge, isUrgent ? styles.timeBadgeUrgent : styles.timeBadgeNormal]}>
        <Text style={[styles.timeLabel, isUrgent ? { color: colors.error } : { color: colors.textSecondary }]}>{timeLabel}</Text>
      </View>
      <Text style={styles.deadlineAmount}>{amount}</Text>
    </View>
  </TouchableOpacity>
);

export const DashboardScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={styles.container}>
      <GlowingBackground showParticles={false}>
        <SafeAreaView style={styles.safeArea}>
          
          {/* Top Bar */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <MaterialIcons name="account-balance-wallet" size={24} color={colors.primary} />
              <Text style={styles.brandTitle}>EDU-FEE</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.bellButton} onPress={() => navigation.navigate('Notification')}>
                <MaterialIcons name="notifications" size={24} color={colors.textSecondary} />
                <View style={styles.unreadDot} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.profileBadge}
                onPress={() => navigation.navigate('Profile')}
              >
                <Text style={styles.profileName}>Alex</Text>
                <Image 
                  source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBMe6_91oLoeN243c8bK58RQU7-i4a7SQ1kaBILzLHQRMEPGIHLn_jMwJ5hRGtUrzj99fKhh6ReA78MsjTreR0iJmwpqBiKXVuYW6ZV_CDRp52TO9UrVuqEKFfqKgXRvgIUqVWcLjX_8E8VzSpKNxeyo88I6AMuTTPOa1mPFFLFLGq4PKhVVyhLpaPxPffWSgqIRt3CyQinLQWqe1fIg5CG5XMPoeQvaOIWx97AtFzLKamFywaAUT11_Ur2pido-qGJHdc_CsGpPAg' }} 
                  style={styles.profileImage} 
                />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            {/* Featured Card: Fee Overview */}
            <View style={styles.featuredCardWrapper}>
              <View style={styles.featuredGlow} />
              <View style={styles.featuredCard}>
                <View style={styles.feeTop}>
                  <View>
                    <Text style={styles.feeTitle}>TOTAL DUE</Text>
                    <Text style={styles.feeAmount}>₹140,000</Text>
                    <View style={styles.feeToggleHint}>
                      <MaterialIcons name="touch-app" size={10} color={colors.primary} style={{ opacity: 0.6 }} />
                      <Text style={styles.feeToggleText}>Tap to toggle view</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.payBtn}>
                    <Text style={styles.payBtnText}>Pay Now</Text>
                  </TouchableOpacity>
                </View>

                {/* Academic Progress */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressTop}>
                    <Text style={styles.progressLabel}>ACADEMIC YEAR PROGRESS</Text>
                    <Text style={styles.progressValue}>65% Complete</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: '65%' }]} />
                  </View>
                  <View style={styles.progressBottom}>
                    <Text style={styles.progressDate}>Aug 2023</Text>
                    <Text style={styles.progressDate}>May 2024</Text>
                  </View>
                </View>
                {/* 3D Decor Blob */}
                <View style={styles.decorBlob} />
              </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActionsScroll}>
                <QuickAction icon="history" label="History" subLabel="TRANSACTIONS" color={colors.primary} onPress={() => navigation.navigate('History')} />
                <QuickAction icon="receipt-long" label="Receipts" subLabel="DOWNLOADS" color={colors.secondary} onPress={() => navigation.navigate('Receipts')} />
                <QuickAction icon="calendar-month" label="Calendar" subLabel="SCHEDULES" color={colors.tertiary} onPress={() => navigation.navigate('Calendar')} />
                <QuickAction icon="folder-open" label="Documents" subLabel="CERTIFICATES" color="#7b9cff" onPress={() => navigation.navigate('Documents')} />
              </ScrollView>
            </View>

            {/* Upcoming Deadlines */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Upcoming Deadlines</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Calendar')}>
                  <Text style={styles.sectionLink}>VIEW CALENDAR</Text>
                </TouchableOpacity>
              </View>
              
              <DeadlineTask 
                dateNum="15" dateMonth="Aug" 
                title="Tuition Fee" subtitle="Study • Sem 4 Enrollment" 
                amount="₹12,500" timeLabel="DUE IN 3 DAYS" isUrgent={true} 
              />
              <DeadlineTask 
                dateNum="01" dateMonth="Sep" 
                title="Hostel Fee" subtitle="Quarterly Maintenance" 
                amount="₹2,500" timeLabel="IN 2 WEEKS" isUrgent={false} 
              />
            </View>

            {/* Smart Insight */}
            <View style={[styles.section, { marginBottom: 100 }]}>
              <View style={styles.insightCard}>
                <Text style={styles.insightTitle}>Smart Insight</Text>
                <Text style={styles.insightDesc}>
                  You've saved <Text style={{ color: colors.tertiary, fontWeight: '700' }}>₹1,200</Text> this semester by using early-bird payments.
                </Text>
                
                <View style={styles.insightBottom}>
                  <View style={styles.insightIconRow}>
                    <MaterialIcons name="auto-awesome" size={14} color={colors.tertiary} />
                    <Text style={styles.insightSubLabel}>NEXT DISCOUNT ELIGIBILITY</Text>
                  </View>
                  <View style={styles.facesRow}>
                    <View style={[styles.faceCircle, { backgroundColor: 'rgba(144, 171, 255, 0.2)', zIndex: 3 }]} />
                    <View style={[styles.faceCircle, { backgroundColor: 'rgba(175, 136, 255, 0.2)', marginLeft: -12, zIndex: 2 }]} />
                    <View style={[styles.faceCircle, { backgroundColor: 'rgba(71, 196, 255, 0.2)', marginLeft: -12, zIndex: 1 }]} />
                    <View style={[styles.faceCircle, { backgroundColor: '#1e253b', marginLeft: -12 }, styles.facePlus]}>
                      <Text style={styles.facePlusText}>+2</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.insightBlob} />
              </View>
            </View>

          </ScrollView>

        </SafeAreaView>
      </GlowingBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090e1c' },
  safeArea: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    height: Platform.OS === 'android' ? 80 : 64,
    paddingTop: Platform.OS === 'android' ? 30 : 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(9, 14, 28, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginLeft: 8,
    textTransform: 'uppercase',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bellButton: {
    padding: 8,
    marginRight: 16,
  },
  unreadDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    backgroundColor: colors.error,
    borderRadius: 4,
  },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181f33',
    paddingVertical: 4,
    paddingLeft: 12,
    paddingRight: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  profileName: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    marginRight: 8,
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderColor: colors.primary,
    borderWidth: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 32,
  },
  featuredCardWrapper: {
    position: 'relative',
    marginBottom: 32,
  },
  featuredGlow: {
    position: 'absolute',
    inset: -4,
    backgroundColor: colors.primary,
    opacity: 0.2,
    borderRadius: 36,
    filter: 'blur(20px)', // doesn't work exact in RN, simulating with absolute overlay
  },
  featuredCard: {
    backgroundColor: 'rgba(30,37,59,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 32,
    padding: 24,
    overflow: 'hidden',
  },
  feeTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  feeTitle: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 4,
  },
  feeAmount: {
    color: colors.white,
    fontSize: 36,
    fontWeight: '800',
  },
  feeToggleHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  feeToggleText: {
    color: 'rgba(144, 171, 255, 0.6)',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginLeft: 4,
  },
  payBtn: {
    backgroundColor: colors.primary, // should be gradient but fallback to solid primary
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 0 },
  },
  payBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 14,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '800',
  },
  progressValue: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#000',
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressDate: {
    color: '#707588',
    fontSize: 8,
    letterSpacing: 1,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  decorBlob: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 150,
    height: 150,
    backgroundColor: 'rgba(175, 136, 255, 0.1)',
    borderRadius: 75,
    zIndex: -1,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
    marginLeft: 4,
  },
  quickActionsScroll: {
    paddingRight: 24,
  },
  actionCard: {
    width: 120,
    backgroundColor: 'rgba(30,37,59,0.4)',
    borderLeftWidth: 4,
    borderRadius: 24,
    padding: 20,
    marginRight: 16,
  },
  actionIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionLabel: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  actionSub: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionLink: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  deadlineCard: {
    backgroundColor: '#0d1323',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  dateBoxUrgent: {
    backgroundColor: 'rgba(255, 113, 108, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 113, 108, 0.2)',
  },
  dateBoxNormal: {
    backgroundColor: '#1e253b',
    borderWidth: 1,
    borderColor: 'rgba(67, 71, 89, 0.2)',
  },
  dateNum: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 18,
  },
  dateMonth: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  deadlineContent: {
    flex: 1,
  },
  deadlineTitle: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  deadlineSub: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  deadlineRight: {
    alignItems: 'flex-end',
  },
  timeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginBottom: 4,
  },
  timeBadgeUrgent: {
    backgroundColor: 'rgba(159, 5, 25, 0.3)',
  },
  timeBadgeNormal: {
    backgroundColor: '#1e253b',
  },
  timeLabel: {
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  deadlineAmount: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  insightCard: {
    backgroundColor: 'rgba(30, 37, 59, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 32,
    padding: 24,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 160,
  },
  insightTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  insightDesc: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 20,
  },
  insightBottom: {
    marginTop: 24,
  },
  insightIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  insightSubLabel: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginLeft: 8,
  },
  facesRow: {
    flexDirection: 'row',
  },
  faceCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#090e1c',
  },
  facePlus: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  facePlusText: {
    color: colors.white,
    fontSize: 8,
    fontWeight: '800',
  },
  insightBlob: {
    position: 'absolute',
    bottom: -40,
    right: -40,
    width: 100,
    height: 100,
    backgroundColor: 'rgba(144, 171, 255, 0.2)',
    borderRadius: 50,
  },
});
