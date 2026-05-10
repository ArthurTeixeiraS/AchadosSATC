import { MD3LightTheme } from "react-native-paper";

import { colors } from "./colors";
import { typography } from "./typography";

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
    background: colors.background,
    surface: colors.surface,
    error: colors.error,
    onPrimary: colors.white,
    onSurface: colors.text,
  },
  fonts: {
    ...MD3LightTheme.fonts,
    bodyLarge: {
      ...MD3LightTheme.fonts.bodyLarge,
      fontFamily: typography.fontFamily.regular,
    },
    bodyMedium: {
      ...MD3LightTheme.fonts.bodyMedium,
      fontFamily: typography.fontFamily.regular,
    },
    titleLarge: {
      ...MD3LightTheme.fonts.titleLarge,
      fontFamily: typography.fontFamily.bold,
    },
    labelLarge: {
      ...MD3LightTheme.fonts.labelLarge,
      fontFamily: typography.fontFamily.semiBold,
    },
  },
};