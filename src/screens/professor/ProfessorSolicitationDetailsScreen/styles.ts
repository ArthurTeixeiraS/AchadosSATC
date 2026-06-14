import { StyleSheet } from "react-native";

import { colors } from "../../../styles/colors";
import { typography } from "../../../styles/typography";

export const styles = StyleSheet.create({
  content: {
    paddingBottom: 40,
  },

  code: {
    fontSize: 20,
    fontFamily: typography.fontFamily.bold,
    color: colors.text,
    marginBottom: 20,
  },

  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 16,
  },

  infoColumn: {
    width: "50%",
    paddingRight: 12,
  },

  infoLabel: {
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginBottom: 4,
  },

  infoValue: {
    fontSize: 15,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
  },

  statusValue: {
    fontSize: 15,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.primary,
  },

  overdueAlertContainer: {
    marginTop: 14,
  },

  observationBox: {
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 14,
  },

  observationText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.text,
  },

  sectionTitle: {
    fontSize: 18,
    fontFamily: typography.fontFamily.bold,
    color: colors.text,
    marginBottom: 16,
  },

  resourceGroupTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
    marginTop: 8,
    marginBottom: 8,
  },

  resourceItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  resourceName: {
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
    color: colors.text,
  },

  resourceMeta: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  quantityRow: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.background,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },

  quantityText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.regular,
    color: colors.text,
  },

  quantityStrong: {
    fontFamily: typography.fontFamily.bold,
    color: colors.text,
  },

  availableStrong: {
    fontFamily: typography.fontFamily.bold,
    color: colors.secondary,
  },

  returnStatus: {
    alignSelf: "flex-start",
    marginTop: 8,
    fontSize: 13,
    fontFamily: typography.fontFamily.semiBold,
  },

  returnedStatus: {
    color: colors.success,
  },

  approvedItemStatus: {
    alignSelf: "flex-start",
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    color: colors.success,
    backgroundColor: "#F0FDF4",
    fontSize: 12,
    fontFamily: typography.fontFamily.semiBold,
  },

  pendingStatus: {
    color: colors.warning,
  },

  buttonContainer: {
    marginTop: 20,
    gap: 12,
  },
});
