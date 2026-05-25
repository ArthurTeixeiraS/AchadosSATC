import { StyleSheet } from "react-native";

import { colors } from "../../styles/colors";
import { typography } from "../../styles/typography";

export const styles = StyleSheet.create({
  input: {
    marginBottom: 22,
    backgroundColor: colors.background,
    fontFamily: typography.fontFamily.regular,
  },
  outline: {
    borderRadius: 16,
    borderWidth: 1,
  },
});