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

  menuOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  menuBox: {
    position: "absolute",
    right: 16,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    minWidth: 140,
    overflow: "hidden",
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  menuItemText: {
    fontSize: 14,
    color: colors.text,
  },

  menuDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
});
