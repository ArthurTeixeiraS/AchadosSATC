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
    ...typography.subtitle1,
    color: colors.text,
    marginBottom: 4,
  },
  resourceDescription: {
    ...typography.body2,
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
    ...typography.caption,
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
    ...typography.caption,
    color: colors.error,
    fontWeight: "600",
    textTransform: "uppercase",
  },
});
