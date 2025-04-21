import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';
import { DatabaseDebug } from '@/components/settings/DatabaseDebug';
import { DebugTools } from '@/components/settings/DebugTools';

export default function SettingsScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }}>
        <DebugTools />
        <DatabaseDebug />
      </ScrollView>
    </SafeAreaView>
  );
} 