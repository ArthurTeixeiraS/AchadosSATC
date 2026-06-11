import { StyleSheet } from "react-native";

import { colors } from "../../styles/colors";
import { typography } from "../../styles/typography";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },

  scrollContent: {
    paddingTop: 0,
  },

  header: {
    width: "100%",
    paddingHorizontal: 24,
    paddingBottom: 28,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },

  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    alignItems: "center",
    justifyContent: "center",
  },

  userInfo: {
    flex: 1,
  },

  userName: {
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
  },

  userRole: {
    marginTop: 2,
    fontSize: 13,
    fontFamily: typography.fontFamily.regular,
    color: "rgba(255, 255, 255, 0.82)",
  },

  items: {
    paddingTop: 20,
  },

  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  logoutLabel: {
    fontFamily: typography.fontFamily.semiBold,
    color: colors.error,
  },
});
