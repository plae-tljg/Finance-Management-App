import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '@/components/base/Text';

// 创建一个全局的日志存储
const globalLogs: string[] = [];

// 重写 console.log
const originalConsoleLog = console.log;
console.log = (...args) => {
  const logMessage = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ');
  
  globalLogs.push(logMessage);
  originalConsoleLog.apply(console, args);
};

export function DebugLogViewer() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isAutoScroll, setIsAutoScroll] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setLogs([...globalLogs]);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const clearLogs = () => {
    globalLogs.length = 0;
    setLogs([]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="title" style={styles.title}>调试日志</Text>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={styles.button}
            onPress={clearLogs}
          >
            <Text style={styles.buttonText}>清除日志</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, isAutoScroll && styles.activeButton]}
            onPress={() => setIsAutoScroll(!isAutoScroll)}
          >
            <Text style={[styles.buttonText, isAutoScroll && styles.activeButtonText]}>
              自动滚动
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.logsContainer}
        contentContainerStyle={styles.logsContent}
        ref={ref => {
          if (ref && isAutoScroll) {
            ref.scrollToEnd({ animated: true });
          }
        }}
      >
        {logs.map((log, index) => (
          <Text key={index} style={styles.logText}>
            {log}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    fontSize: 16,
    color: '#333',
  },
  activeButtonText: {
    color: '#fff',
  },
  logsContainer: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
  },
  logsContent: {
    paddingBottom: 16,
  },
  logText: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
}); 