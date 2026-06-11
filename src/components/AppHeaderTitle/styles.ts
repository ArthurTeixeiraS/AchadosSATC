import { StyleSheet } from "react-native";

import { colors } from "../../styles/colors";
import { typography } from "../../styles/typography";

export const styles = StyleSheet.create({
  container: {
    marginLeft: 12,
  },

  title: {
    fontSize: 17,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
  },

  subtitle: {
    marginTop: 1,
    fontSize: 11,
    fontFamily: typography.fontFamily.regular,
    color: "rgba(255, 255, 255, 0.82)",
  },
});
