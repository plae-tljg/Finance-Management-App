import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Card } from '@/components/base/Card';
import { Text } from '@/components/base/Text';
import theme from '@/theme';

export interface HeaderCardProps extends ViewProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAccessory?: React.ReactNode;
}

export function HeaderCard({ title, showBack = true, onBack, rightAccessory, style, ...props }: HeaderCardProps) {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <Card style={[styles.header, style]} {...props}>
      <View style={styles.content}>
        {showBack && (
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
        <Text variant="title" style={[styles.title, !showBack && styles.titleNoBack]}>
          {title}
        </Text>
        {rightAccessory && <View style={styles.rightAccessory}>{rightAccessory}</View>}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: theme.spacing.xs,
    marginLeft: -theme.spacing.xs,
  },
  title: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  titleNoBack: {
    marginLeft: 0,
  },
  rightAccessory: {
    marginLeft: theme.spacing.sm,
  },
});