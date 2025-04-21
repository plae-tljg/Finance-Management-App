import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, Link } from 'expo-router';
import { Text } from '@/components/base/Text';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Text style={styles.title}>
          This screen doesn't exist.
        </Text>
        <Link href="/" style={styles.link}>
          <Text>Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center' as const
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 16
  },
  link: {
    color: '#007AFF',
    textDecorationLine: 'underline' as const
  }
});
