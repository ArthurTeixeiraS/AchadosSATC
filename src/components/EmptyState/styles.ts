import { StyleSheet } from "react-native";

import { colors } from "../../styles/colors";
import { typography } from "../../styles/typography";

export const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },

  title: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
    textAlign: "center",
  },

  message: {
    marginTop: 4,
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: "center",
  },
});