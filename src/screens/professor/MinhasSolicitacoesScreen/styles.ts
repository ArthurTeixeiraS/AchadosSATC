import { StyleSheet } from "react-native";

import { colors } from "../../../styles/colors";
import { typography } from "../../../styles/typography";

export const styles = StyleSheet.create({
  filterGroup: {
    marginBottom: 5,
  },

  filterTitle: {
    marginBottom: 6,
    fontSize: 13,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textSecondary,
  },

  listContent: {
    paddingBottom: 32,
  },

  card: {
    marginTop: 12,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },

  code: {
    fontSize: 18,
    fontFamily: typography.fontFamily.bold,
    color: colors.text,
  },

  date: {
    marginTop: 4,
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  badge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },

  badgeText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.primary,
  },

  badgePending: {
    backgroundColor: "#FFF7ED",
  },

  badgeReady: {
    backgroundColor: "#EFF6FF",
  },

  badgeInUse: {
    backgroundColor: "#ECFDF5",
  },

  badgeFinished: {
    backgroundColor: "#F3F4F6",
  },

  badgeRejected: {
    backgroundColor: "#FEF2F2",
  },

  overdueBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
  },

  overdueText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
    color: colors.error,
  },

  summaryBox: {
    marginTop: 14,
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.background,
  },

  summaryLabel: {
    fontSize: 12,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },

  summaryText: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
  },

  priorityBadge: {
    marginTop: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#FEF3C7",
    alignSelf: "flex-start",
  },

  priorityBadgeText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.semiBold,
    color: "#92400E",
  },
});