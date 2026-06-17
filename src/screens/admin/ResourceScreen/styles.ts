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
    paddingBottom: 88,
  },

  resourceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  resourceName: {
    fontSize: 17,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
    flex: 0,
  },

  resourceNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    flex: 1,
  },

  imageIcon: {
    marginLeft: 6,
  },

  resourceActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  cardContent: {
  },

  resourceType: {
    fontSize: 12,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.primary,
    textAlign: "right",
  },

  resourceDescription: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  resourceStatus: {
    marginTop: 12,
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
    color: colors.secondary,
  },

  periodHint: {
    marginHorizontal: 16,
    marginBottom: 12,
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },

  periodAvailability: {
    marginTop: 6,
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
  },

  periodAvailabilityUnavailable: {
    color: colors.error,
  },

  fab: {
    position: "absolute",
    right: 16,
    backgroundColor: colors.primary,
    borderRadius: 999,
  },
});
