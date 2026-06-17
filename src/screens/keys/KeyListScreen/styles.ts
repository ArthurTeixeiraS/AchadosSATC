import { StyleSheet } from "react-native";

import { colors } from "../../../styles/colors";
import { typography } from "../../../styles/typography";

export const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyList: {
    flex: 1,
  },
  emptyListContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 96,
  },
  card: {
    marginBottom: 0,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardIconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
  },
  cardSubtitle: {
    marginTop: 2,
    fontSize: 13,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  cardDescription: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  cardEnd: {
    alignItems: "flex-end",
    gap: 8,
  },
  historyShortcut: {
    height: 48,
    width: 48,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  status: {
    fontSize: 12,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.success,
  },
  archivedStatus: {
    color: colors.error,
  },
  borrowedStatus: {
    color: colors.warning,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    backgroundColor: colors.primary,
  },
});
