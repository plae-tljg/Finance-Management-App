import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@/components/base/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export function DebugTools() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text variant="title" style={styles.title}>调试工具</Text>
      
      <View style={styles.toolsContainer}>
        <TouchableOpacity 
          style={styles.toolButton}
          onPress={() => router.push('/debug/sql-terminal')}
        >
          <Ionicons name="terminal" size={24} color="#007AFF" />
          <Text style={styles.toolText}>SQL 终端</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.toolButton}
          onPress={() => router.push('/debug/log-viewer')}
        >
          <Ionicons name="document-text" size={24} color="#007AFF" />
          <Text style={styles.toolText}>调试日志</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    marginBottom: 16,
  },
  toolsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  toolButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  toolText: {
    fontSize: 16,
    color: '#333',
  },
}); 