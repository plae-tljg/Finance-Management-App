import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from '@/components/base/Text';
import { Card } from '@/components/base/Card';
import { PageTemplate } from '@/components/base/PageTemplate';
import { DatabaseExport } from '@/components/settings/DatabaseExport';
import { DebugTools } from '@/components/settings/DebugTools';
import { DatabaseDebug } from '@/components/settings/DatabaseDebug';
import theme from '@/theme';

export default function SettingsScreen() {
  return (
    <PageTemplate title="设置">
      <DatabaseExport />
      <DebugTools />
      <DatabaseDebug />
    </PageTemplate>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.sm,
  },
});