import { StyleSheet } from "react-native";
import { colors } from "../../../styles/colors";
import { typography } from "../../../styles/typography";
import { spacing } from "../../../styles/spacing";
import { radius } from "../../../styles/radius";
import { shadows } from "../../../styles/shadow";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl * 2,
    gap: spacing.md,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  greeting: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.regular,
  },
  userName: {
    fontSize: 18,
    color: colors.text,
    fontFamily: typography.fontFamily.bold,
  },

  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.card,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
    color: colors.text,
    flex: 1,
  },
  countBadge: {
    backgroundColor: colors.warning,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  countBadgeRed: {
    backgroundColor: colors.error,
  },
  countBadgeGreen: {
    backgroundColor: colors.greenMedium,
  },
  countBadgeText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.regular,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: spacing.sm,
  },

  solCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  solCardAtrasada: {
    borderColor: colors.error,
    backgroundColor: "#FEF2F2",
  },
  solCardLeft: {
    flex: 1,
    gap: 2,
  },
  solCardTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
  },
  solCardSub: {
    fontSize: 12,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  solCardResources: {
    fontSize: 12,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
    marginTop: 4,
  },
  solCardBadge: {
    backgroundColor: colors.warning + "20",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    marginLeft: spacing.sm,
  },
  solCardBadgeOrange: {
    backgroundColor: "#FFEDD5", 
  },
  solCardBadgeGreen: {
    backgroundColor: colors.greenMedium + "20",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    marginLeft: spacing.sm,
  },
  solCardBadgeText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.bold,
    color: colors.text,
  },
  atrasadaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  atrasadaText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.bold,
    color: colors.error,
  },

  shortcutsTitle: {
    fontSize: 13,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: spacing.sm,
    marginBottom: -spacing.xs,
  },
  shortcutsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  shortcutCard: {
    width: "48%",
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: "flex-start",
    gap: spacing.sm,
    ...shadows.card,
  },
  shortcutIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  shortcutLabel: {
    fontSize: 13,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
  },

  showMoreContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.xs,
  },
  showMoreText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.primary,
  },
});
