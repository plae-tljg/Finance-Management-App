export const colors = {
  primary: '#007AFF',
  primaryLight: '#4DA3FF',
  primaryDark: '#0055CC',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  danger: '#FF3B30',
  income: '#34C759',
  expense: '#FF3B30',
  background: 'rgba(20, 20, 30, 0.85)',
  backgroundLight: 'rgba(20, 20, 30, 0.7)',
  surface: 'rgba(255, 255, 255, 0.92)',
  surfaceDark: 'rgba(255, 255, 255, 0.75)',
  card: 'rgba(255, 255, 255, 0.9)',
  text: '#1a1a2e',
  textSecondary: '#4a4a5e',
  textTertiary: '#8a8a9e',
  border: 'rgba(100, 100, 120, 0.3)',
  borderLight: 'rgba(100, 100, 120, 0.15)',
  divider: 'rgba(100, 100, 120, 0.3)',
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.4)',
  white: '#FFFFFF',
  black: '#000000',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  title: 28,
};

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
};

export const theme = {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  shadows,
};

export type Theme = typeof theme;
export default theme;