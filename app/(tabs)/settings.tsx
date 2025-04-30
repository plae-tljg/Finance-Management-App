import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';
import { DatabaseDebug } from '@/components/settings/DatabaseDebug';
import { DebugTools } from '@/components/settings/DebugTools';
import { DatabaseExport } from '@/components/settings/DatabaseExport';

export default function SettingsScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }}>
        <DatabaseExport />
        <DebugTools />
        <DatabaseDebug />
      </ScrollView>
    </SafeAreaView>
  );
} 