import { StyleSheet } from "react-native";

import { colors } from "../../styles/colors";
import { typography } from "../../styles/typography";

export const styles = StyleSheet.create({
  title: {
    marginTop: 0,
    fontSize: 24,
    fontFamily: typography.fontFamily.bold,
    color: colors.text,
  },
  subtitle: {
    marginTop: 0,
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
});