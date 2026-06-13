import { StyleSheet } from "react-native";

import { colors } from "../../../styles/colors";
import { typography } from "../../../styles/typography";

export const styles = StyleSheet.create({
  emptyList: {
    flex: 1,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  listContent: {
    paddingBottom: 40,
  },

  overdueSection: {
    marginTop: 14,
    gap: 10,
  },

  groupCard: {
    marginTop: 12,
  },

  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  groupDate: {
    fontSize: 17,
    fontFamily: typography.fontFamily.bold,
    color: colors.text,
  },

  groupCount: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  groupItems: {
    marginTop: 12,
    gap: 10,
  },

  solicitationCard: {
    marginTop: 0,
    backgroundColor: colors.background,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },

  cardMainInfo: {
    flex: 1,
  },

  solicitationCode: {
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
    color: colors.text,
  },

  professorName: {
    marginTop: 4,
    fontSize: 14,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
  },

  dateText: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  badgeContainer: {
    alignItems: "flex-end",
    gap: 6,
  },

  priorityBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#FEF3C7",
  },

  priorityBadgeText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.semiBold,
    color: "#92400E",
  },

  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#ECFDF5",
  },

  statusBadgeText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.secondary,
  },

  changePendingStatusBadge: {
    backgroundColor: "#FFF8E1",
    borderWidth: 1,
    borderColor: "#F59E0B",
  },

  changePendingStatusBadgeText: {
    color: "#92400E",
  },

  itemSummary: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  itemSummaryText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },

  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  detailsText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.primary,
  },
});
