import { StyleSheet } from "react-native";

import { typography } from "../../styles/typography";

export const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10
  },

  title: {
    fontFamily: typography.fontFamily.bold
  },

  message: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
  },
});