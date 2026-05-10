import { StyleSheet } from "react-native";

import { colors } from "../../../styles/colors";
import { typography } from "../../../styles/typography";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    justifyContent: "center",
    padding: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 28,
    paddingVertical: 48,
    minHeight: "92%",
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 36,
  },
  logoTitle: {
    fontSize: 42,
    fontFamily: typography.fontFamily.bold,
    color: colors.greenMedium,
    letterSpacing: 1,
  },
  logoSubtitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },
  label: {
    fontSize: 14,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
    marginBottom: 8,
  },
  forgotText: {
    color: colors.secondary,
    fontFamily: typography.fontFamily.semiBold,
    marginBottom: 24,
  },
  errorText: {
    color: colors.error,
    marginBottom: 16,
    fontFamily: typography.fontFamily.semiBold,
  },
});