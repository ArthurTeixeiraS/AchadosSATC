import { StyleSheet } from "react-native";

import { colors } from "../../../styles/colors";
import { typography } from "../../../styles/typography";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  screenContent: {
    paddingBottom: 0,
  },

  searchInput: {
    marginBottom: 0,
  },

  listContent: {
    paddingTop: 0,
    paddingBottom: 16,
  },

  toolCard: {
    marginTop: 10,
  },

  toolHeader: {
    gap: 14,
  },

  toolInfo: {},

  toolName: {
    fontSize: 17,
    fontFamily: typography.fontFamily.bold,
    color: colors.text,
  },

  toolDescription: {
    marginTop: 4,
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  toolAvailability: {
    marginTop: 6,
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
    color: colors.secondary,
  },

  toolAvailabilityError: {
    color: colors.error,
  },

  addButton: {
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  addButtonDisabled: {
    backgroundColor: colors.border,
    opacity: 0.7,
  },

  addButtonText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.white,
  },

  bottomSummary: {
    backgroundColor: colors.surface,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  summaryTitle: {
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
    color: colors.text,
  },

  summaryCount: {
    fontSize: 13,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.primary,
  },

  summaryEmpty: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  summaryItem: {
    marginTop: 10,
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
    color: colors.text,
  },

  summaryMore: {
    marginTop: 8,
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },

  summaryButtons: {
    marginTop: 16,
    gap: 10,
  },
});
