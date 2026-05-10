import { StyleSheet } from "react-native";

import { typography } from "../../styles/typography";

export const styles = StyleSheet.create({
  button: {
    borderRadius: 28,
    marginTop: 8,
  },
  content: {
    height: 58,
    flexDirection: "row-reverse",
  },
  label: {
    fontSize: 16,
    fontFamily: typography.fontFamily.semiBold,
  },
});