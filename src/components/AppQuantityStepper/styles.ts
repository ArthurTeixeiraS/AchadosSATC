import { StyleSheet } from "react-native";

import { colors } from "../../styles/colors";
import { typography } from "../../styles/typography";

export const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  stepButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  stepButtonDisabled: {
    opacity: 0.5,
  },

  value: {
    minWidth: 24,
    textAlign: "center",
    fontSize: 16,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
  },

  removeButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
});