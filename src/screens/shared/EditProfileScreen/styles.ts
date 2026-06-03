import { StyleSheet } from "react-native";

import { typography } from "../../../styles/typography";
import { colors } from "../../../styles/colors";

export const styles = StyleSheet.create({
  content: {
    padding: 24,
    paddingBottom: 40,
  },

  label: {
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: 16,
  },

  buttonWrapper: {
    marginTop: 32,
  },
});
