import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';

export interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export function Card({ style, children, ...props }: CardProps) {
  return (
    <View style={[styles.base, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  }
});