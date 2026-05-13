import { StyleSheet } from "react-native";

import { colors } from "../../styles/colors";
import { typography } from "../../styles/typography";

export const styles = StyleSheet.create({
  input: {
    marginBottom: 22,
    backgroundColor: colors.background,
    fontFamily: typography.fontFamily.regular,
  },

  multilineInput: {
    minHeight: 110,
    textAlignVertical: "top",
  },

  outline: {
    borderRadius: 24,
    borderWidth: 1,
  },
});