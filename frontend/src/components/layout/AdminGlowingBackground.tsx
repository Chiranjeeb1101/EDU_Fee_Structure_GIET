import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import { colors } from '../../theme/colors';

const { width, height } = Dimensions.get('window');

interface AdminGlowingBackgroundProps {
  children: React.ReactNode;
  showParticles?: boolean;
}

export const AdminGlowingBackground: React.FC<AdminGlowingBackgroundProps> = ({ children, showParticles = true }) => {
  const particleAnims = [...Array(4)].map(() => useRef(new Animated.Value(0)).current);

  useEffect(() => {
    if (showParticles) {
      particleAnims.forEach((anim, i) => {
        const duration = 15000 + i * 5000; // 15-30s float duration
        Animated.loop(
          Animated.timing(anim, {
            toValue: 1,
            duration,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ).start();
      });
    }
  }, [showParticles, particleAnims]);

  return (
    <View style={styles.container}>
      {/* Background Gradient Base */}
      <View style={styles.backgroundBase} />
      
      {/* Glowing Orbs for Admin (Teal/Emerald theme instead of deep purple) */}
      <View style={[styles.orb, styles.orbTopLeft]} />
      <View style={[styles.orb, styles.orbBottomRight]} />

      {/* Floating Particles Layer */}
      {showParticles && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
         {/* Particles are removed from Admin layout to keep it more professional and less "gamer", 
             or we just render a very subtle version with lower opacity */}
          {particleAnims.map((anim, i) => {
            const translateY = anim.interpolate({
              inputRange: [0, 1],
              outputRange: [height, -100], // Float up from bottom to top
            });

            const baseConfigs = [
              { left: '10%', size: 3, startTop: '80%' },
              { left: '30%', size: 5, startTop: '60%' },
              { left: '70%', size: 4, startTop: '90%' },
              { left: '80%', size: 3, startTop: '40%' },
            ];

            return (
              <Animated.View
                key={`particle-${i}`}
                style={[
                  styles.particle,
                  {
                    width: baseConfigs[i].size,
                    height: baseConfigs[i].size,
                    left: baseConfigs[i].left as any,
                    top: baseConfigs[i].startTop as any,
                    transform: [{ translateY }],
                  },
                ]}
              />
            );
          })}
        </View>
      )}
      
      {/* Content */}
      <View style={styles.contentContainer}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.adminBackground,
  },
  backgroundBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0f172a', // Slate 900
    opacity: 0.9,
  },
  orb: {
    position: 'absolute',
    borderRadius: 9999,
    opacity: 0.12,
  },
  orbTopLeft: {
    width: width * 0.9,
    height: width * 0.9,
    backgroundColor: colors.adminPrimary, // Sky blue glow
    top: -height * 0.1,
    left: -width * 0.4,
  },
  orbBottomRight: {
    width: width,
    height: width,
    backgroundColor: colors.success, // Emerald green glow
    bottom: -height * 0.1,
    right: -width * 0.3,
  },
  particle: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderRadius: 9999,
    opacity: 0.15, // much subtler than student app
  },
  contentContainer: {
    flex: 1,
    zIndex: 10,
  },
});
