import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '@/components/base/Text';
import { Card } from '@/components/base/Card';
import { PageTemplate } from '@/components/base/PageTemplate';
import { DatabaseExport } from '@/components/settings/DatabaseExport';
import { DebugTools } from '@/components/settings/DebugTools';
import { DatabaseDebug } from '@/components/settings/DatabaseDebug';
import theme from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function SettingsScreen() {
  return (
    <PageTemplate title="设置">
      <TouchableOpacity onPress={() => router.push('/settings/web-mode')}>
        <Card style={styles.menuCard}>
          <View style={styles.menuRow}>
            <Ionicons name="globe-outline" size={22} color={theme.colors.primary} />
            <Text style={styles.menuTitle}>Web 模式</Text>
            <Text variant="caption" style={styles.menuSubtitle}>
              通过局域网在浏览器中访问本机财务数据
            </Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.colors.textSecondary}
              style={styles.menuChevron}
            />
          </View>
        </Card>
      </TouchableOpacity>
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
  menuCard: {
    marginBottom: theme.spacing.lg,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  menuTitle: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  menuSubtitle: {
    flexBasis: '100%',
    marginLeft: 30 + theme.spacing.sm,
    marginTop: 2,
    color: theme.colors.textSecondary,
  },
  menuChevron: {
    marginLeft: 'auto',
  },
});