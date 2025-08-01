import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, StyleSheet } from 'react-native';
import { DatabaseDebug } from '@/components/settings/DatabaseDebug';
import { DebugTools } from '@/components/settings/DebugTools';
import { DatabaseExport } from '@/components/settings/DatabaseExport';

export default function SettingsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <DatabaseExport />
        <DebugTools />
        <DatabaseDebug />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  content: {
    flex: 1,
    paddingHorizontal: 8,
  },
}); 