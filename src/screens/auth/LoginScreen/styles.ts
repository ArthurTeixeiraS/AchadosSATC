import { StyleSheet } from "react-native";

import { colors } from "../../../styles/colors";
import { typography } from "../../../styles/typography";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 28,
    paddingVertical: 48,
    minHeight: "100%",
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 36,
  },
  logo: {
    width: 220,
    height: 120,
  },
  label: {
    fontSize: 14,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
    marginBottom: 8,
  },
  errorText: {
    color: colors.error,
    marginBottom: 16,
    fontFamily: typography.fontFamily.semiBold,
  },
});