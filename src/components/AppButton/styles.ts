import { StyleSheet } from "react-native";

import { typography } from "../../styles/typography";

export const styles = StyleSheet.create({
  button: {
    height: 58,
    borderRadius: 29,
    marginTop: 8,
  },
  content: {
    height: 56,
    flexDirection: "row-reverse",
  },
  label: {
    fontSize: 16,
    fontFamily: typography.fontFamily.semiBold,
  },
});
