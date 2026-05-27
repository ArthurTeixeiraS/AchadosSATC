import { StyleSheet } from "react-native";

import { colors } from "../../../styles/colors";
import { typography } from "../../../styles/typography";

export const styles = StyleSheet.create({
  content: {
    paddingBottom: 40,
  },

  sectionTitle: {
    fontSize: 18,
    fontFamily: typography.fontFamily.bold,
    color: colors.text,
    marginBottom: 16,
  },

  infoItem: {
    marginBottom: 16,
  },

  infoLabel: {
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginBottom: 4,
  },

  infoValue: {
    fontSize: 16,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
  },

  listItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  listItemTitle: {
    fontSize: 15,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
  },

  listItemSubtitle: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  buttonContainer: {
    marginTop: 20,
    gap: 12,
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