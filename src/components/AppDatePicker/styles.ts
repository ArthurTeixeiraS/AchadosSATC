import { StyleSheet } from "react-native";

import { colors } from "../../styles/colors";
import { typography } from "../../styles/typography";

export const styles = StyleSheet.create({
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontFamily: typography.fontFamily.medium,
    color: colors.text,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.white,

    paddingHorizontal: 14,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  value: {
    fontSize: 15,
    fontFamily: typography.fontFamily.regular,
    color: colors.text,
  },

  placeholder: {
    color: colors.textSecondary,
  },
});