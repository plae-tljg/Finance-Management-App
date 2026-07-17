import React from 'react';
import { ImageBackground, Platform, StyleSheet, View, ViewProps } from 'react-native';
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
  const isWeb = Platform.OS === 'web';

  return (
    <ImageBackground
      source={require('@/assets/images/amiya_background.png')}
      style={styles.background}
      resizeMode="cover"
      {...props}
    >
      {isWeb ? (
        <View
          style={[
            styles.blurOverlay,
            {
              backgroundColor: blurTint === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.6)',
            },
          ]}
        />
      ) : (
        <BlurView
          intensity={80}
          style={styles.blurOverlay}
          tint={blurTint}
        />
      )}
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