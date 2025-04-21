/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { useColorScheme as _useColorScheme } from 'react-native';

const Colors = {
  primary: {
    light: '#FFFFFF',
    dark: '#000000'
  }
};

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.primary
) {
  const theme = _useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors.primary[theme];
  }
}
