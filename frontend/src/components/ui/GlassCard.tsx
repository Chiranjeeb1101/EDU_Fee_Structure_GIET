import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, style }) => {
  return (
    <View style={[styles.glassContainer, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  glassContainer: {
    backgroundColor: colors.glassBackground,
    borderColor: colors.borderLight,
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    // Currently relying on rgba background as React Native doesn't support backdrop-filter out of the box
    // To achieve true blur, 'expo-blur' can be wrapped later if requested.
  },
});
