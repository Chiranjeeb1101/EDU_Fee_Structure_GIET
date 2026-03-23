import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Animated, Easing, Platform, TouchableOpacity } from 'react-native';
import { GlowingBackground } from '../../components/layout/GlowingBackground';
import { GradientButton } from '../../components/ui/GradientButton';
import { TrustBadge } from '../../components/ui/TrustBadge';
import { colors } from '../../theme/colors';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';

export const WelcomeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Main float animations
  const floatLeftWallet = useRef(new Animated.Value(0)).current;
  const floatRightModels = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  // 3 Bouncing coins on the right side
  const bounceAnims = [...Array(3)].map(() => useRef(new Animated.Value(0)).current);
  
  // 4 Flying coins creating a continuous stream from left to right
  const flyingAnims = [...Array(4)].map(() => useRef(new Animated.Value(0)).current);

  useEffect(() => {
    const createContinuousFloat = (animValue: Animated.Value, duration: number, distance: number, delay: number = 0) => {
      Animated.sequence([
        Animated.delay(delay),
        Animated.loop(
          Animated.sequence([
            Animated.timing(animValue, {
              toValue: -distance,
              duration: duration / 2,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0,
              duration: duration / 2,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    };

    // Main elements floating
    createContinuousFloat(floatLeftWallet, 6000, 15, 0);
    createContinuousFloat(floatRightModels, 7000, 20, 500);

    // Bouncing coins on the right side
    bounceAnims.forEach((anim, index) => {
      createContinuousFloat(anim, 3000 + (index * 800), 8 + (index * 2), index * 400);
    });

    // Flying trajectory coins
    flyingAnims.forEach((anim, i) => {
      Animated.sequence([
        Animated.delay(i * 1200), // Stagger each flying coin by 1.2s
        Animated.loop(
          Animated.timing(anim, {
            toValue: 1,
            duration: 4800, // Total flight time 4.8s
            easing: Easing.inOut(Easing.ease), // Smooth parabolic speed
            useNativeDriver: true,
          })
        ),
      ]).start();
    });

    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 40000, 
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [bounceAnims, flyingAnims, floatLeftWallet, floatRightModels, spinAnim]);

  const spinInterpolate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <GlowingBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
          
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logoBox}>
                <View style={styles.logoInner} />
                <MaterialIcons name="account-balance-wallet" size={20} color={colors.primary} />
              </View>
              <Text style={styles.logoText}>EDU-Fee</Text>
            </View>
          </View>

          {/* Hero Isometric Illustration Container */}
          <View style={styles.heroContainer}>
             
             {/* Spinning Dashed Ring Background */}
             <Animated.View style={[styles.aura, { transform: [{ rotate: spinInterpolate }] }]} />
             
             {/* -------------------- LEFT WALLET SECITON -------------------- */}
             <Animated.View style={[styles.walletCardLeft, { transform: [{ translateY: floatLeftWallet }, { rotate: '-12deg' }] }]}>
               <View style={styles.walletHeader}>
                 <View style={styles.progressTrack}>
                   <View style={styles.progressFill} />
                 </View>
               </View>
               
               <View style={styles.walletVerifiedRow}>
                 <View style={styles.circleOuterBlue}>
                   <View style={styles.circleInnerBlue}>
                     <MaterialIcons name="check" size={10} color={colors.white} />
                   </View>
                 </View>
                 <View style={styles.darkThickPill} />
               </View>

               <View style={styles.walletDivider} />

               <View style={styles.walletDimmedRow}>
                 <View style={[styles.circleOuterBlue, { opacity: 0.6 }]}>
                   <MaterialIcons name="analytics" size={14} color={colors.electricBlue} />
                 </View>
               </View>
             </Animated.View>
             
             {/* -------------------- FLYING COINS STREAM -------------------- */}
             {flyingAnims.map((anim, index) => {
               const translateX = anim.interpolate({
                 inputRange: [0, 1],
                 outputRange: [0, 140], // Distance from left wallet to right models
               });
               
               const translateY = anim.interpolate({
                 inputRange: [0, 0.5, 1],
                 outputRange: [0, -30, -5], // Curve: go up middle, then drop slightly to hit the right models
               });

               const opacity = anim.interpolate({
                 inputRange: [0, 0.1, 0.8, 1],
                 outputRange: [0, 1, 1, 0], // Fade in at left, fade out at right
               });

               const scale = anim.interpolate({
                 inputRange: [0, 0.5, 1],
                 outputRange: [0.5, 1.2, 0.6], // Small at start, big in middle, small at end
               });

               return (
                 <Animated.View
                   key={`flying-${index}`}
                   style={[
                     styles.coinStyle,
                     styles.flyingBase,
                     {
                       opacity,
                       transform: [{ translateX }, { translateY }, { scale }],
                     },
                   ]}
                 >
                   <Text style={styles.coinText}>$</Text>
                 </Animated.View>
               );
             })}


             {/* -------------------- RIGHT MODELS CONTAINER -------------------- */}
             <View style={styles.rightGlowBlur} />
             
             <Animated.View style={[styles.rightModelsContainer, { transform: [{ translateY: floatRightModels }, { rotate: '12deg' }] }]}>
                
                {/* 1. Main Calendar/Grid Window */}
                <View style={styles.gridWindow}>
                  <View style={styles.windowHeaderBar}>
                    <View style={styles.windowDot} /><View style={styles.windowDot} /><View style={styles.windowDot} />
                  </View>
                  <View style={styles.gridContent}>
                    {[1,2,3,4,5,6].map(i => <View key={i} style={styles.gridSquare} />)}
                  </View>
                </View>

                {/* 2. Overlapping Vertical Column Window */}
                <View style={styles.verticalWindow}>
                  <View style={styles.vIconCircle}>
                    <View style={styles.vIconInnerCircle} />
                  </View>
                  <View style={styles.vLineDark} />
                  <View style={styles.vLineDark} />
                  <View style={styles.vLineDark} />
                  <View style={[styles.vLineDark, { width: '50%' }]} />
                </View>

                {/* 3. Bottom Horizontal Window */}
                <View style={styles.bottomWindow}>
                  <View style={styles.bIconCircle}>
                    <MaterialIcons name="school" size={12} color={colors.white} />
                  </View>
                  <View style={styles.bLinesContainer}>
                    <View style={styles.bLineDark} />
                    <View style={[styles.bLineDark, { width: '60%', marginTop: 6 }]} />
                  </View>
                </View>

                {/* Static Bouncing Coins (3 coins scattered on right boundaries) */}
                <Animated.View style={[styles.coinStyle, styles.coinRight1, { transform: [{ translateY: bounceAnims[0] }] }]}><Text style={styles.coinText}>$</Text></Animated.View>
                <Animated.View style={[styles.coinStyle, styles.coinRight2, { transform: [{ translateY: bounceAnims[1] }] }]}><Text style={styles.coinText}>$</Text></Animated.View>
                <Animated.View style={[styles.coinStyle, styles.coinRight3, { transform: [{ translateY: bounceAnims[2] }] }]}><Text style={styles.coinText}>$</Text></Animated.View>

             </Animated.View>

          </View>

          {/* Text Content */}
          <View style={styles.textContent}>
            <Text style={styles.title}>
              EDU-Fee <Text style={styles.titleGradient}>Management</Text>
            </Text>
            <Text style={styles.subtitle}>
              Pay smarter. Track faster. Never miss a deadline.
            </Text>
          </View>

          <View style={styles.actionContainer}>
            <GradientButton 
              title="Get Started" 
              icon="arrow-forward" 
              onPress={() => navigation.navigate('Login')}
              style={styles.button}
            />
            <TouchableOpacity 
              style={styles.supportLink} 
              onPress={() => navigation.navigate('SupportCenter')}
              activeOpacity={0.7}
            >
              <MaterialIcons name="headset-mic" size={20} color={colors.primary} />
              <Text style={styles.supportText}>Contact Support</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.badgesContainer}>
            <TrustBadge iconName="security" label="256-bit Secure" />
            <TrustBadge iconName="receipt-long" label="Instant Receipts" />
            <TrustBadge iconName="query-stats" label="Real-time Tracking" />
          </View>

        </ScrollView>
      </SafeAreaView>
    </GlowingBackground>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 50 : 30, 
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    paddingTop: 40, 
    paddingBottom: 24,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  logoBox: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoInner: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(28, 92, 242, 0.2)',
    borderRadius: 8,
    transform: [{ rotate: '45deg' }],
    borderWidth: 1,
    borderColor: 'rgba(28, 92, 242, 0.5)',
  },
  logoText: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroContainer: {
    height: 360, 
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
    position: 'relative',
    overflow: 'visible',
  },
  aura: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(28, 92, 242, 0.3)',
    borderStyle: 'dashed',
    zIndex: 0,
  },

  /* ---------------- LEFT WALLET STYLES ---------------- */
  walletCardLeft: {
    position: 'absolute',
    left: '0%',
    top: '10%',
    width: 155,
    height: 240,
    backgroundColor: '#0a0d1e', 
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(28, 92, 242, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.9,
    shadowRadius: 20,
    elevation: 8,
    zIndex: 2,
  },
  walletHeader: {
    height: 50,
    backgroundColor: '#11152d',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  progressTrack: {
    height: 4,
    width: '100%',
    backgroundColor: '#1c3475', 
    borderRadius: 2,
  },
  progressFill: {
    height: 4,
    width: '70%',
    backgroundColor: colors.primary, 
    borderRadius: 2,
  },
  walletVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#080918',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.02)',
  },
  circleOuterBlue: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(28, 92, 242, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(28, 92, 242, 0.1)',
  },
  circleInnerBlue: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkThickPill: {
    width: 60,
    height: 10,
    backgroundColor: '#1b1f3b',
    borderRadius: 6,
    marginLeft: 16,
  },
  walletDivider: {
    height: 1,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  walletDimmedRow: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },

  /* ---------------- FLYING COIN BASE ---------------- */
  flyingBase: {
    position: 'absolute',
    top: '40%', 
    left: '25%', // Starts near the verified checkmark area on left wallet
    zIndex: 10,
  },

  /* ---------------- RIGHT GLASS WINDOWS ---------------- */
  rightGlowBlur: {
    position: 'absolute',
    right: '0%',
    top: '20%',
    width: 150,
    height: 200,
    backgroundColor: 'rgba(16, 185, 129, 0.1)', 
    borderRadius: 100,
  },
  rightModelsContainer: {
    position: 'absolute',
    right: '5%',
    top: '15%',
    width: 190,
    height: 250,
    zIndex: 1,
  },
  gridWindow: {
    position: 'absolute',
    top: 20,
    left: 0,
    width: 130,
    height: 110,
    backgroundColor: 'rgba(24, 34, 60, 0.8)', 
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
  },
  windowHeaderBar: {
    height: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  windowDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginRight: 4,
  },
  gridContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    justifyContent: 'space-between',
  },
  gridSquare: {
    width: 30,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 6,
    marginBottom: 8,
  },
  verticalWindow: {
    position: 'absolute',
    top: 0,
    right: 15,
    width: 50,
    height: 160,
    backgroundColor: 'rgba(24, 60, 70, 0.7)', 
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 10,
    alignItems: 'center',
    zIndex: 5,
  },
  vIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  vIconInnerCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  vLineDark: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    marginBottom: 8,
  },
  bottomWindow: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    width: 140,
    height: 70,
    backgroundColor: 'rgba(30, 41, 80, 0.7)', 
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  bIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(28, 92, 242, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bLinesContainer: {
    flex: 1,
  },
  bLineDark: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 3,
  },

  /* ---------------- COINS STYLES ---------------- */
  coinStyle: {
    position: 'absolute',
    width: 24,
    height: 24,
    backgroundColor: '#f59e0b', 
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: '#fde68a', 
    zIndex: 10,
  },
  coinText: {
    color: '#451a03', 
    fontSize: 12,
    fontWeight: '900',
  },
  coinRight1: { bottom: '0%', left: '-10%' },    
  coinRight2: { top: '30%', right: '5%' },   
  coinRight3: { top: '65%', right: '35%' },   

  /* ---------------- BOTTOM CONTENT ---------------- */
  textContent: {
    alignItems: 'center',
    marginBottom: 36,
  },
  title: {
    fontSize: 38,
    fontWeight: '900',
    color: colors.white,
    textAlign: 'center',
    lineHeight: 46,
    marginBottom: 16,
  },
  titleGradient: {
    color: colors.violetAccent,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 24,
  },
  actionContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  button: {
    width: '100%',
    maxWidth: 320,
    marginBottom: 20,
  },
  supportLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  supportText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
});
