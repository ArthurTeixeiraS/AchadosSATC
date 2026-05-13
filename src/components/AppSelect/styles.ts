import { StyleSheet } from "react-native";

import { colors } from "../../styles/colors";
import { typography } from "../../styles/typography";

export const styles = StyleSheet.create({
  container: {
    marginBottom: 22,
  },

  label: {
    fontSize: 14,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
    marginBottom: 8,
  },

  button: {
    borderRadius: 24,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },

  buttonContent: {
    height: 54,
    flexDirection: "row-reverse",
    justifyContent: "space-between",
  },

  buttonLabel: {
    flex: 1,
    textAlign: "left",
    fontSize: 15,
    fontFamily: typography.fontFamily.regular,
  },
});