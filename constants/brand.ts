import { Platform } from 'react-native';

export const brandFontFamily = Platform.select({
  ios: 'Arial Rounded MT Bold',
  android: 'sans-serif-condensed',
  web: 'Arial Black',
  default: 'System',
});

export const brandType = {
  fontFamily: brandFontFamily,
  fontWeight: '900' as const,
  letterSpacing: 0,
};
