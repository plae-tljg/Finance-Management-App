import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AppStateScreenProps {
  isLoading?: boolean;
  error?: string | null;
  debugInfo?: string[];
  onRetry?: () => void;
}

export const AppStateScreen: React.FC<AppStateScreenProps> = ({
  isLoading = false,
  error = null,
  debugInfo = [],
  onRetry
}) => {
  const insets = useSafeAreaInsets();

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <ActivityIndicator size="large" color="#f4511e" />
        <Text style={styles.loadingText}>正在初始化应用...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.debugTitle}>调试信息:</Text>
        {debugInfo.map((info, index) => (
          <Text key={index} style={styles.debugText}>{info}</Text>
        ))}
        {onRetry && (
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={onRetry}
          >
            <Text style={styles.retryButtonText}>重试</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
    padding: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#f4511e',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    margin: 20,
  },
  debugTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  retryButton: {
    backgroundColor: '#f4511e',
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 