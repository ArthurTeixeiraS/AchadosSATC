import { StyleSheet } from "react-native";

import { colors } from "../../../styles/colors";
import { typography } from "../../../styles/typography";

export const styles = StyleSheet.create({
  actions: {
    minHeight: 44,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  counter: {
    flexShrink: 1,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.medium,
    fontSize: 13,
  },

  markAllButton: {
    flexShrink: 0,
    minHeight: 36,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 8,
    backgroundColor: "#E8F5EE",
  },

  markAllButtonDisabled: {
    opacity: 0.45,
  },

  markAllButtonText: {
    color: colors.primary,
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 12,
  },

  errorText: {
    marginBottom: 10,
    color: colors.error,
    fontFamily: typography.fontFamily.medium,
    fontSize: 13,
  },

  listContent: {
    paddingBottom: 24,
    gap: 10,
  },

  notificationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },

  unreadCard: {
    borderWidth: 1,
    borderColor: "#A6D5C3",
    backgroundColor: "#F0FDF7",
  },

  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },

  unreadIconContainer: {
    backgroundColor: "#DDF5E9",
  },

  notificationContent: {
    flex: 1,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  title: {
    flex: 1,
    color: colors.text,
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 15,
  },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.greenMedium,
  },

  message: {
    marginTop: 4,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
  },

  date: {
    marginTop: 7,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.medium,
    fontSize: 11,
  },
});
