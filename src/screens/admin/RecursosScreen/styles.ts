import { StyleSheet } from "react-native";

import { colors } from "../../../styles/colors";
import { typography } from "../../../styles/typography";

export const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 24,
  },

  resourceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },

  resourceName: {
    fontSize: 17,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
    flex: 1,
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

  resourceType: {
    fontSize: 12,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.primary,
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

  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    backgroundColor: colors.primary,
    borderRadius: 999,
  },
});