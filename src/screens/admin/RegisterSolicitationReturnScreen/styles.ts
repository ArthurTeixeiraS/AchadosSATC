import { StyleSheet } from "react-native";

import { colors } from "../../../styles/colors";
import { typography } from "../../../styles/typography";

export const styles = StyleSheet.create({
  content: {
    paddingBottom: 40,
  },

  title: {
    fontSize: 20,
    fontFamily: typography.fontFamily.bold,
    color: colors.text,
  },

  description: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  sectionTitle: {
    fontSize: 18,
    fontFamily: typography.fontFamily.bold,
    color: colors.text,
  },

  sectionHeader: {
    minHeight: 40,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  selectAll: {
    flexDirection: "row",
    alignItems: "center",
  },

  selectAllText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
  },

  selectionRow: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  toolRow: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  selectionText: {
    flex: 1,
  },

  resourceName: {
    fontSize: 15,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
  },

  resourceMeta: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  summaryText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.medium,
    color: colors.text,
  },
});
