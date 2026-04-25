import React from 'react';
import { ImageBackground, StyleSheet, View, ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';

interface BackgroundImageProps extends ViewProps {
  children: React.ReactNode;
  overlay?: boolean;
  overlayColor?: string;
  overlayOpacity?: number;
  blurTint?: 'light' | 'dark';
}

export function BackgroundImage({
  children,
  overlay = true,
  overlayColor = '#000000',
  overlayOpacity = 0.05,
  blurTint = 'light',
  style,
  ...props
}: BackgroundImageProps) {
  return (
    <ImageBackground
      source={require('@/assets/images/amiya_background.png')}
      style={styles.background}
      resizeMode="cover"
      {...props}
    >
      <BlurView
        intensity={80}
        style={styles.blurOverlay}
        tint={blurTint}
      />
      {overlay && (
        <View
          style={[
            styles.overlay,
            { backgroundColor: overlayColor, opacity: overlayOpacity },
          ]}
        />
      )}
      <View style={[styles.content, style]}>{children}</View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
  },
});