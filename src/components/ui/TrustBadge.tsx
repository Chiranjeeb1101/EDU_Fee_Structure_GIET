import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { GlassCard } from './GlassCard';
import { colors } from '../../theme/colors';

interface TrustBadgeProps {
  iconName: keyof typeof MaterialIcons.glyphMap;
  label: string;
}

export const TrustBadge: React.FC<TrustBadgeProps> = ({ iconName, label }) => {
  return (
    <GlassCard style={styles.badge}>
      <MaterialIcons name={iconName} size={20} color={colors.primary} />
      <Text style={styles.label}>{label}</Text>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginRight: 12,
    marginBottom: 12,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 12,
  },
});
