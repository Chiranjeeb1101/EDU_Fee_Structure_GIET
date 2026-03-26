import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Dimensions, LayoutAnimation, Platform, Modal, Pressable, Image, TextInput, Animated, Easing } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import { colors } from '../../theme/colors';
import { GlowingBackground } from '../../components/layout/GlowingBackground';
import { useAuth } from '../../context/AuthContext';
import studentService, { DashboardData } from '../../services/studentService';
import paymentService from '../../services/paymentService';
import { MaterialIcons } from '@expo/vector-icons';
import { UIManager } from 'react-native';

const { width } = Dimensions.get('window');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const QuickAction = ({ icon, label, subLabel, color, onPress }: { icon: any, label: string, subLabel: string, color: string, onPress: () => void }) => (
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
  const { user, profileImageTimestamp } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  // Fee Toggle State
  const [showPending, setShowPending] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);
  const autoRotateRef = useRef<any>(null);
  const manualOverrideRef = useRef(false);

  // Payment State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // ─── ANIMATED FEE CARD ──────────────────────────────────────
  const flipAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  // Glow pulse for auto-cycle indicator
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Animate the flip transition
  const animateFlip = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(flipAnim, { toValue: 0, duration: 250, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.92, duration: 250, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
    ]).start(() => {
      callback();
      Animated.parallel([
        Animated.spring(flipAnim, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
      ]).start();
    });
  };

  // Auto-rotate every 3 seconds
  useEffect(() => {
    autoRotateRef.current = setInterval(() => {
      if (!manualOverrideRef.current) {
        animateFlip(() => setShowPending(prev => !prev));
      }
    }, 3000);
    return () => { if (autoRotateRef.current) clearInterval(autoRotateRef.current); };
  }, []);

  // Manual tap toggle — resets auto timer
  const handleToggleFeeView = () => {
    // Stop auto-rotate temporarily
    manualOverrideRef.current = true;
    if (autoRotateRef.current) clearInterval(autoRotateRef.current);

    animateFlip(() => setShowPending(prev => !prev));

    // Resume auto-rotate after 6 seconds of inactivity
    setTimeout(() => {
      manualOverrideRef.current = false;
      autoRotateRef.current = setInterval(() => {
        animateFlip(() => setShowPending(prev => !prev));
      }, 3000);
    }, 6000);
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Auto-refresh when returning from PaymentWebView
  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [])
  );

  const handleInitiatePayment = async () => {
    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0.');
      return;
    }
    const feeStatus = dashboardData?.fee_status || { total_fee: 0, paid_fee: 0, remaining_fee: 0 };
    if (amt > feeStatus.remaining_fee) {
      Alert.alert('Invalid Amount', 'You cannot pay more than the remaining fee.');
      return;
    }

    try {
      setIsProcessingPayment(true);
      const res = await paymentService.createCheckoutSession(amt);
      
      if (res.success && res.data.session_url) {
        setShowPaymentModal(false);
        // Navigate to in-app PaymentWebView instead of opening external browser
        navigation.navigate('PaymentWebView' as any, { checkoutUrl: res.data.session_url });
      } else {
        Alert.alert('Payment Failed', 'Could not initiate secure checkout.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to start payment process.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const openPaymentModal = () => {
    const feeStatus = dashboardData?.fee_status || { total_fee: 0, paid_fee: 0, remaining_fee: 0 };
    if (feeStatus.remaining_fee <= 0) {
      Alert.alert('All Clear!', 'You have no pending fees to pay.');
      return;
    }
    setPaymentAmount(feeStatus.remaining_fee.toString());
    setShowPaymentModal(true);
  };

  const fetchDashboard = async () => {
    try {
      const data = await studentService.getDashboardData();
      setDashboardData(data);
    } catch (error: any) {
      // 401 errors are handled silently by the API interceptor (auto-logout).
      // Only show the alert for genuinely unexpected errors (network down, server crash, etc).
      const status = error?.response?.status;
      if (status !== 401) {
        console.error('Dashboard fetch failed:', error);
        Alert.alert('Error', 'Failed to sync dashboard data with server.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: 15 }}>Syncing with campus server...</Text>
      </View>
    );
  }

  const feeStatus = dashboardData?.fee_status || { total_fee: 0, paid_fee: 0, remaining_fee: 0 };
  const progressPercent = feeStatus.total_fee > 0 ? Math.round((feeStatus.paid_fee / feeStatus.total_fee) * 100) : 0;

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
                {dashboardData && dashboardData.unread_notifications_count > 0 && (
                  <View style={styles.unreadDot} />
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.profileBadge}
                onPress={() => navigation.navigate('Profile')}
              >
                 <Text style={styles.profileName}>{user?.full_name?.split(' ')[0] || 'Student'}</Text>
                <Image 
                  source={{ uri: (user?.profile_picture ? (user.profile_picture.startsWith('data:image') ? user.profile_picture : `${user.profile_picture}?t=${profileImageTimestamp}`) : 'https://lh3.googleusercontent.com/aida-public/AB6AXuBMe6_91oLoeN243c8bK58RQU7-i4a7SQ1kaBILzLHQRMEPGIHLn_jMwJ5hRGtUrzj99fKhh6ReA78MsjTreR0iJmwpqBiKXVuYW6ZV_CDRp52TO3UrVuqEKFfqKgXRvgIUqVWcLjX_8E8VzSpKNxeyo88I6AMuTTPOa1mPFFLFLGq4PKhVVyhLpaPxPffWSgqIRt3CyQinLQWqe1fIg5CG5XMPoeQvaOIWx97AtFzLKamFywaAUT11_Ur2pido-qGJHdc_CsGpPAg') }} 
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
                <TouchableOpacity 
                  activeOpacity={0.9} 
                  style={styles.feeTop} 
                  onPress={handleToggleFeeView}
                  onLongPress={() => setShowBreakdownModal(true)}
                  delayLongPress={500}
                >
                  <Animated.View style={{
                    opacity: flipAnim,
                    transform: [
                      { scale: scaleAnim },
                      { perspective: 800 },
                      { rotateX: flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['90deg', '0deg'] }) },
                    ],
                  }}>
                    <Text style={[styles.feeTitle, showPending && { color: colors.error }]}>
                      {showPending ? 'PENDING DUE' : 'TOTAL DUE'}
                    </Text>
                    <Text style={[styles.feeAmount, showPending && { color: colors.error }]}>
                      ₹{showPending ? feeStatus.remaining_fee.toLocaleString() : feeStatus.total_fee.toLocaleString()}
                    </Text>
                    <View style={styles.feeToggleHint}>
                      <Animated.View style={[styles.autoRotateDot, { opacity: pulseAnim, backgroundColor: showPending ? colors.error : colors.primary }]} />
                      <MaterialIcons name="info-outline" size={12} color={showPending ? colors.error : colors.primary} style={{ opacity: 0.8 }} />
                      <Text style={[styles.feeToggleText, showPending && { color: colors.error }]}>Hold for breakdown</Text>
                    </View>
                  </Animated.View>
                  <TouchableOpacity style={styles.payBtn} onPress={openPaymentModal}>
                    <Text style={styles.payBtnText}>Pay Now</Text>
                  </TouchableOpacity>
                </TouchableOpacity>

                {/* Academic Progress */}
                <TouchableOpacity 
                  style={styles.progressContainer} 
                  onPress={() => setShowProgressModal(true)}
                  activeOpacity={0.8}
                >
                  <View style={styles.progressTop}>
                    <Text style={styles.progressLabel}>FEE SETTLEMENT PROGRESS</Text>
                    <Text style={styles.progressValue}>{progressPercent}% Settled</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                  </View>
                  <View style={styles.progressBottom}>
                    <Text style={styles.progressDate}>Entry Base</Text>
                    <Text style={styles.progressDate}>Cleared</Text>
                  </View>
                </TouchableOpacity>
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

            {/* Fee Components / Deadlines */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Fee Breakdown & Status</Text>
                <TouchableOpacity onPress={() => setShowBreakdownModal(true)}>
                  <Text style={styles.sectionLink}>VIEW ALL</Text>
                </TouchableOpacity>
              </View>
              
              {dashboardData?.fee_breakdown && dashboardData.fee_breakdown.length > 0 ? (
                (() => {
                  let remainingPaid = feeStatus.paid_fee;
                  return dashboardData.fee_breakdown.map((item, idx) => {
                    const itemAmount = Number(item.total_fee);
                    const amountCleared = Math.min(remainingPaid, itemAmount);
                    remainingPaid = Math.max(0, remainingPaid - itemAmount);
                    const isFullyPaid = amountCleared >= itemAmount;
                    const amountPending = itemAmount - amountCleared;

                    return (
                      <DeadlineTask 
                        key={idx}
                        dateNum={isFullyPaid ? '✓' : idx + 1} 
                        dateMonth={isFullyPaid ? 'PAID' : 'DUE'} 
                        title={item.title} 
                        subtitle={isFullyPaid ? 'Payment Received' : 'Awaiting Payment'} 
                        amount={`₹${itemAmount.toLocaleString()}`} 
                        timeLabel={isFullyPaid ? 'CLEARED' : `₹${amountPending.toLocaleString()} PENDING`} 
                        isUrgent={!isFullyPaid && idx < 2} 
                      />
                    );
                  });
                })()
              ) : (
                <View style={styles.emptyBreakdown}>
                  <Text style={styles.emptyBreakdownText}>No fee components defined.</Text>
                </View>
              )}
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

          {/* Fee Breakdown Modal */}
          <Modal
            animationType="fade"
            transparent={true}
            visible={showBreakdownModal}
            onRequestClose={() => setShowBreakdownModal(false)}
          >
            <Pressable 
              style={styles.modalOverlay} 
              onPress={() => setShowBreakdownModal(false)}
            >
              <View style={styles.breakdownModalContent}>
                <View style={styles.modalIndicator} />
                <View style={styles.breakdownHeaderRow}>
                  <MaterialIcons name="account-balance" size={24} color={colors.primary} />
                  <Text style={styles.modalTitle}>Fee Breakdown</Text>
                </View>
                
                <ScrollView style={styles.breakdownList} showsVerticalScrollIndicator={false}>
                  {(() => {
                    let remainingPaid = feeStatus.paid_fee;
                    return dashboardData?.fee_breakdown?.map((item, idx) => {
                      const itemAmount = Number(item.total_fee);
                      const amountCleared = Math.min(remainingPaid, itemAmount);
                      remainingPaid = Math.max(0, remainingPaid - itemAmount);
                      const isFullyPaid = amountCleared >= itemAmount;
                      const amountPending = itemAmount - amountCleared;

                      return (
                        <View key={idx} style={[styles.breakdownItem, isFullyPaid && styles.breakdownItemCleared]}>
                          <View style={styles.breakdownItemLeft}>
                            <Text style={styles.breakdownItemTitle}>{item.title}</Text>
                            <Text style={styles.breakdownItemStatus}>
                              {isFullyPaid ? 'FULLY CLEARED' : amountCleared > 0 ? 'PARTIALLY SETTLED' : 'AWAITING PAYMENT'}
                            </Text>
                          </View>
                          <View style={styles.breakdownItemRight}>
                            <Text style={styles.breakdownItemAmount}>₹{itemAmount.toLocaleString()}</Text>
                            <Text style={[styles.breakdownItemPending, isFullyPaid && { color: colors.success }]}>
                              {isFullyPaid ? 'No Dues' : `₹${amountPending.toLocaleString()} Left`}
                            </Text>
                          </View>
                        </View>
                      );
                    });
                  })()}
                </ScrollView>

                <View style={styles.breakdownSummaryCard}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Total Settled</Text>
                    <Text style={[styles.summaryValue, { color: colors.success }]}>₹{feeStatus.paid_fee.toLocaleString()}</Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Net Pending</Text>
                    <Text style={[styles.summaryValue, { color: colors.error }]}>₹{feeStatus.remaining_fee.toLocaleString()}</Text>
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.closeBtn} 
                  onPress={() => setShowBreakdownModal(false)}
                >
                  <Text style={styles.closeBtnText}>DISMISS</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Modal>

          {/* Settlement Progress Modal (Original) */}
          <Modal
            animationType="fade"
            transparent={true}
            visible={showProgressModal}
            onRequestClose={() => setShowProgressModal(false)}
          >
            <Pressable 
              style={styles.modalOverlay} 
              onPress={() => setShowProgressModal(false)}
            >
              <View style={styles.modalContent}>
                <View style={styles.modalIndicator} />
                <Text style={styles.modalTitle}>Settlement Details</Text>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total Fee</Text>
                  <Text style={styles.detailValue}>₹{feeStatus.total_fee.toLocaleString()}</Text>
                </View>
                
                <View style={[styles.detailRow, { backgroundColor: 'rgba(34, 197, 94, 0.05)' }]}>
                  <Text style={[styles.detailLabel, { color: colors.success }]}>Paid Amount</Text>
                  <Text style={[styles.detailValue, { color: colors.success }]}>₹{feeStatus.paid_fee.toLocaleString()}</Text>
                </View>

                <View style={[styles.detailRow, { backgroundColor: 'rgba(239, 68, 68, 0.05)' }]}>
                  <Text style={[styles.detailLabel, { color: colors.error }]}>Remaining Due</Text>
                  <Text style={[styles.detailValue, { color: colors.error }]}>₹{feeStatus.remaining_fee.toLocaleString()}</Text>
                </View>

                <View style={styles.modalProgressSection}>
                  <View style={styles.modalProgressBarBg}>
                    <View style={[styles.modalProgressBarFill, { width: `${progressPercent}%` }]} />
                  </View>
                  <Text style={styles.modalProgressText}>{progressPercent}% of your total fee is settled.</Text>
                </View>

                <TouchableOpacity 
                  style={styles.closeBtn} 
                  onPress={() => setShowProgressModal(false)}
                >
                  <Text style={styles.closeBtnText}>CLOSE BREAKDOWN</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Modal>

          {/* Premium Payment Modal */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={showPaymentModal}
            onRequestClose={() => !isProcessingPayment && setShowPaymentModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.premiumPaymentModal}>
                {/* Drag Indicator */}
                <View style={styles.dragIndicator} />
                
                <View style={styles.modalHeaderRow}>
                  <View>
                    <Text style={styles.paymentTitle}>Secure Checkout</Text>
                    <Text style={styles.paymentSubTitle}>Enter amount to proceed</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.closeIconBtn}
                    onPress={() => !isProcessingPayment && setShowPaymentModal(false)}
                  >
                    <MaterialIcons name="close" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                
                {/* Input Area */}
                <View style={styles.premiumInputCard}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <TextInput
                    style={styles.premiumAmountInput}
                    value={paymentAmount}
                    onChangeText={setPaymentAmount}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    editable={!isProcessingPayment}
                    autoFocus={true}
                    selectionColor={colors.primary}
                  />
                </View>
                
                <View style={styles.balanceInfoRow}>
                  <Text style={styles.balanceInfoLabel}>Maximum Limit</Text>
                  <Text style={styles.balanceInfoValue}>₹{feeStatus.remaining_fee.toLocaleString()}</Text>
                </View>

                {/* Transaction Details Breakdown */}
                <View style={styles.transactionBreakdown}>
                  <Text style={styles.breakdownHeader}>TRANSACTION DETAILS</Text>
                  
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Paying Amount</Text>
                    <Text style={styles.breakdownValue}>₹{parseFloat(paymentAmount) > 0 ? parseFloat(paymentAmount).toLocaleString() : '0'}</Text>
                  </View>
                  
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Processing Fee</Text>
                    <Text style={styles.breakdownValueFree}>Free</Text>
                  </View>
                  
                  <View style={styles.breakdownDivider} />
                  
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownTotalLabel}>Total Settlement</Text>
                    <Text style={styles.breakdownTotalValue}>₹{parseFloat(paymentAmount) > 0 ? parseFloat(paymentAmount).toLocaleString() : '0'}</Text>
                  </View>
                </View>

                {/* Secure Trust Badges */}
                <View style={styles.trustBadgesRow}>
                  <View style={styles.trustBadge}>
                    <MaterialIcons name="security" size={14} color={colors.textSecondary} />
                    <Text style={styles.trustBadgeText}>256-bit Encrypted</Text>
                  </View>
                  <View style={styles.trustBadge}>
                    <MaterialIcons name="verified-user" size={14} color={colors.textSecondary} />
                    <Text style={styles.trustBadgeText}>PCI DSS Compliant</Text>
                  </View>
                </View>

                {/* Pay Button */}
                <TouchableOpacity 
                  style={[styles.premiumPayBtn, isProcessingPayment && { opacity: 0.7 }]} 
                  onPress={handleInitiatePayment}
                  disabled={isProcessingPayment}
                  activeOpacity={0.8}
                >
                  {isProcessingPayment ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <ActivityIndicator color={colors.white} size="small" style={{ marginRight: 10 }} />
                      <Text style={styles.premiumPayBtnText}>Initiating Gateway...</Text>
                    </View>
                  ) : (
                    <Text style={styles.premiumPayBtnText}>
                      Pay ₹{parseFloat(paymentAmount) > 0 ? parseFloat(paymentAmount).toLocaleString() : '0'} Now
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Powered by Stripe */}
                <View style={styles.poweredByStripe}>
                  <MaterialIcons name="lock" size={12} color={colors.success} style={{ marginRight: 4 }} />
                  <Text style={styles.poweredText}>Powered securely by <Text style={styles.stripeBrand}>Stripe</Text></Text>
                </View>
              </View>
            </View>
          </Modal>


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
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    backgroundColor: colors.primary,
    opacity: 0.2,
    borderRadius: 36,
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
  autoRotateDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  payBtn: {
    backgroundColor: colors.primary,
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
  facePlusText: { color: colors.white, fontSize: 10, fontWeight: '700' },
  insightBlob: { position: 'absolute', bottom: -20, right: -20, width: 60, height: 60, borderRadius: 30, backgroundColor: colors.tertiary, opacity: 0.1 },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#161b2e',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 30,
    paddingTop: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  summaryItem: {
    paddingVertical: 12,
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  summaryDivider: {
    width: 1,
    height: '60%',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  emptyBreakdown: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  emptyBreakdownText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  breakdownModalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    width: '100%',
    maxHeight: '80%',
  },
  breakdownHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  breakdownList: {
    marginBottom: 20,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  breakdownItemCleared: {
    borderColor: 'rgba(34, 197, 94, 0.2)',
    backgroundColor: 'rgba(34, 197, 94, 0.05)',
  },
  breakdownItemLeft: {
    flex: 1,
  },
  breakdownItemTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  breakdownItemStatus: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  breakdownItemRight: {
    alignItems: 'flex-end',
  },
  breakdownItemAmount: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  breakdownItemPending: {
    color: colors.error,
    fontSize: 10,
    fontWeight: '800',
  },
  breakdownSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 12,
    marginBottom: 24,
  },
  modalIndicator: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 25,
  },
  modalTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 20,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  detailLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  detailValue: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  modalProgressSection: {
    marginTop: 10,
    marginBottom: 25,
    alignItems: 'center',
  },
  modalProgressBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
    marginBottom: 12,
  },
  modalProgressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  modalProgressText: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  closeBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  closeBtnText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1.5,
  },
  // Premium Payment Modal Styles
  premiumPaymentModal: {
    backgroundColor: '#0d1323',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    minHeight: 450,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  paymentTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  paymentSubTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  closeIconBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
  },
  premiumInputCard: {
    backgroundColor: 'rgba(30, 37, 59, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(144, 171, 255, 0.2)',
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  currencySymbol: {
    color: colors.textSecondary,
    fontSize: 32,
    fontWeight: '800',
    marginRight: 8,
  },
  premiumAmountInput: {
    color: colors.white,
    fontSize: 40,
    fontWeight: '800',
    textAlign: 'center',
    minWidth: 100,
  },
  balanceInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  balanceInfoLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  balanceInfoValue: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '800',
  },
  transactionBreakdown: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  breakdownHeader: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  breakdownLabel: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  breakdownValue: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  breakdownValueFree: {
    color: colors.success,
    fontSize: 14,
    fontWeight: '800',
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: 12,
  },
  breakdownTotalLabel: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  breakdownTotalValue: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  trustBadgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  trustBadgeText: {
    color: colors.textSecondary,
    fontSize: 10,
    marginLeft: 6,
    fontWeight: '600',
  },
  premiumPayBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  premiumPayBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  poweredByStripe: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  poweredText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  stripeBrand: {
    color: colors.white,
    fontWeight: '800',
  },
});
