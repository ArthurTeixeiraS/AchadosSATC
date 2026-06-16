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
    gap: 12,
  },
  resourceCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resourceInfo: {
    flex: 1,
    marginRight: 16,
  },
  resourceName: {
    fontSize: 16,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
    marginBottom: 4,
  },
  resourceDescription: {
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  resourceBadges: {
    flexDirection: "row",
    gap: 8,
  },
  resourceTypeBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resourceTypeBadgeText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    textTransform: "capitalize",
  },
  resourceStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  resourceStatusArchived: {
    backgroundColor: colors.error + "20", // 20% opacity
  },
  resourceStatusArchivedText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.error,
    textTransform: "uppercase",
  },
});
