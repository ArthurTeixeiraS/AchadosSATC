import { StyleSheet } from "react-native";
import { colors } from "../../../styles/colors";
import { typography } from "../../../styles/typography";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenContent: {
    padding: 16,
    paddingBottom: 0,
  },
  searchInput: {
    marginBottom: 16,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  emptyListContent: {
    justifyContent: "center",
  },
  emptyCard: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  resourceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  resourceName: {
    fontSize: 17,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
    flex: 0,
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
  archivedStatus: {
    color: colors.error,
  },
});
