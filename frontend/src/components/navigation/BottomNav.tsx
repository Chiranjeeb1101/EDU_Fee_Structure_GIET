import React, { useEffect, useRef, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { NavContext } from '../../../App';

const { width } = Dimensions.get('window');
const TAB_BAR_MARGIN = 16; // The horizontal margin of the tab bar itself (from wrapper padding)
const TAB_BAR_WIDTH = width - TAB_BAR_MARGIN * 2;
const TAB_WIDTH = TAB_BAR_WIDTH / 5;
const INDICATOR_SIZE = 50; 

export function BottomNav({ state, descriptors, navigation }: BottomTabBarProps) {
  const { isNavVisible } = useContext(NavContext);
  const slideAnim = useRef(new Animated.Value(state.index * TAB_WIDTH)).current;
  const hideAnim = useRef(new Animated.Value(0)).current;

  // Active Tab animation
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: state.index * TAB_WIDTH,
      tension: 60,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, [state.index]);

  // Hide/Show Navbar animation
  useEffect(() => {
    Animated.spring(hideAnim, {
      toValue: isNavVisible ? 0 : 120, // push down by 120px when hidden
      tension: 50,
      friction: 9,
      useNativeDriver: true,
    }).start();
  }, [isNavVisible]);

  return (
    <Animated.View style={[styles.tabContainerWrapper, { transform: [{ translateY: hideAnim }] }]}>
      <View style={styles.tabContainer}>
        {/* Animated Water Drop Indicator Background */}
        <Animated.View 
          style={[
            styles.indicatorWrapper,
            { transform: [{ translateX: slideAnim }] }
          ]}
        >
          <View style={styles.waterDrop} />
        </Animated.View>

        {/* Tab Buttons */}
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          
          let iconName: keyof typeof MaterialIcons.glyphMap = 'home';
          if (route.name === 'History') iconName = 'payments';
          if (route.name === 'Receipts') iconName = 'receipt-long';
          if (route.name === 'Dashboard') iconName = 'home';
          if (route.name === 'Documents') iconName = 'description';
          if (route.name === 'Settings') iconName = 'settings';

          let label = route.name;
          if (route.name === 'History') label = 'Pay';
          if (route.name === 'Dashboard') label = 'Home';
          if (route.name === 'Documents') label = 'Docs';
          if (route.name === 'Receipts') label = 'Rcpt';
          if (route.name === 'Settings') label = 'Config';

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={index}
              onPress={onPress}
              style={styles.tabButton}
              activeOpacity={1} // Disable default opacity feedback since we have animations
            >
              <AnimatedIcon iconName={iconName} isFocused={isFocused} />
              <AnimatedLabel label={label} isFocused={isFocused} />
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
}

// Inner Component strictly for Icon pop-up animation
const AnimatedIcon = ({ iconName, isFocused }: { iconName: any, isFocused: boolean }) => {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: isFocused ? -22 : 0, // Pop up out of the navbar
      tension: 70,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [isFocused]);

  return (
    <Animated.View style={[styles.iconContainer, { transform: [{ translateY }] }]}>
      <MaterialIcons 
        name={iconName} 
        size={24} 
        color={isFocused ? colors.white : colors.textSecondary} 
        style={styles.iconDropShadow}
      />
    </Animated.View>
  );
};

// Inner Component strictly for Label fade/slide up
const AnimatedLabel = ({ label, isFocused }: { label: string, isFocused: boolean }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    if (isFocused) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: -8, // Slide up to replace where the icon was
          tension: 60,
          friction: 10,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 10, // Hide downwards
          tension: 60,
          friction: 10,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isFocused]);

  return (
    <Animated.View style={[styles.labelWrapper, { opacity, transform: [{ translateY }] }]}>
      <Text style={styles.tabLabel} numberOfLines={1}>{label}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  tabContainerWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: TAB_BAR_MARGIN,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    backgroundColor: 'transparent',
  },
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(9, 14, 28, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 40,
    height: 72,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  indicatorWrapper: {
    position: 'absolute',
    top: -15, // Float above the navbar slightly
    left: 0,
    width: TAB_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  waterDrop: {
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    backgroundColor: colors.primary, // Luminous blue marker
    // Create a water drop pointing downwards using border radii
    borderTopLeftRadius: INDICATOR_SIZE / 2,
    borderTopRightRadius: INDICATOR_SIZE / 2,
    borderBottomLeftRadius: INDICATOR_SIZE / 2,
    borderBottomRightRadius: 8, 
    transform: [{ rotate: '45deg' }],
    // Intense glow effect matching the Luminous Ledger vibe
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 15,
  },
  tabButton: {
    width: TAB_WIDTH,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1, // Stay above the sliding indicator
  },
  iconContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDropShadow: {
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  labelWrapper: {
    position: 'absolute',
    bottom: 12,
  },
  tabLabel: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
