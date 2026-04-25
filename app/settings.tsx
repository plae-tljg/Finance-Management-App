import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from '@/components/base/Text';
import { Card } from '@/components/base/Card';
import { HeaderCard } from '@/components/base/HeaderCard';
import { BackgroundImage } from '@/components/base/BackgroundImage';
import { DatabaseExport } from '@/components/settings/DatabaseExport';
import { DebugTools } from '@/components/settings/DebugTools';
import { DatabaseDebug } from '@/components/settings/DatabaseDebug';
import theme from '@/theme';

export default function SettingsScreen() {
  return (
    <BackgroundImage>
      <SafeAreaView style={styles.container} edges={['top']}>
        <HeaderCard title="设置" />
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <DatabaseExport />
            <DebugTools />
            <DatabaseDebug />
          </View>
        </ScrollView>
      </SafeAreaView>
    </BackgroundImage>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.sm,
  },
});