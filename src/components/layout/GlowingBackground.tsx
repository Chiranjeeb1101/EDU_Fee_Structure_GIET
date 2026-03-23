import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import { colors } from '../../theme/colors';

const { width, height } = Dimensions.get('window');

interface GlowingBackgroundProps {
  children: React.ReactNode;
  showParticles?: boolean;
}

export const GlowingBackground: React.FC<GlowingBackgroundProps> = ({ children, showParticles = true }) => {
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
      
      {/* Glowing Orbs (Simulated with absolute positions and opacity) */}
      <View style={[styles.orb, styles.orbTopLeft]} />
      <View style={[styles.orb, styles.orbBottomRight]} />

      {/* Floating Particles Layer */}
      {showParticles && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {particleAnims.map((anim, i) => {
            const translateY = anim.interpolate({
              inputRange: [0, 1],
              outputRange: [height, -100], // Float up from bottom to top
            });

            // Specific starting positions and sizes based on HTML design
            const baseConfigs = [
              { left: '10%', size: 4, startTop: '80%' },
              { left: '30%', size: 8, startTop: '60%' },
              { left: '70%', size: 6, startTop: '90%' },
              { left: '80%', size: 4, startTop: '40%' },
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
    backgroundColor: colors.backgroundDark,
  },
  backgroundBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0f1225', // Inner radial gradient color center
    opacity: 0.8,
  },
  orb: {
    position: 'absolute',
    borderRadius: 9999,
    opacity: 0.15,
  },
  orbTopLeft: {
    width: width * 0.8,
    height: width * 0.8,
    backgroundColor: colors.electricBlue,
    top: -height * 0.1,
    left: -width * 0.3,
  },
  orbBottomRight: {
    width: width,
    height: width,
    backgroundColor: colors.violetAccent,
    bottom: -height * 0.1,
    right: -width * 0.3,
  },
  particle: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderRadius: 9999,
    opacity: 0.3,
  },
  contentContainer: {
    flex: 1,
    zIndex: 10,
  },
});
