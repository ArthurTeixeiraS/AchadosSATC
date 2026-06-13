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
    position: "absolute",
    right: 0,
    top: 0,
    alignItems: "flex-end",
    gap: 10,
  },

  cardContent: {
    position: "relative",
    paddingRight: 72,
  },

  editButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },

  resourceType: {
    fontSize: 12,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.primary,
    textAlign: "right",
    left: 30,
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
    backgroundColor: colors.primary,
    borderRadius: 999,
  },
});
