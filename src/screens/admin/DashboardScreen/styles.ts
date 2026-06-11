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

  statsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: "center",
    gap: spacing.xs,
    ...shadows.card,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },
  statNumberRed: {
    color: colors.error,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.regular,
    textAlign: "center",
  },

  alertBox: {
    flexDirection: "row",
    backgroundColor: "#FEE2E2",
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
    alignItems: "flex-start",
  },
  alertTextWrapper: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 13,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.error,
    marginBottom: 2,
  },
  alertMessage: {
    fontSize: 12,
    fontFamily: typography.fontFamily.regular,
    color: colors.error,
  },

  sectionTitle: {
    fontSize: 13,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: spacing.xs,
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.card,
  },
  menuIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  menuTextWrapper: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
  },
  menuSubtitle: {
    fontSize: 12,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginTop: 2,
  },

  badge: {
    backgroundColor: colors.greenMedium,
    borderRadius: radius.pill,
    minWidth: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
  },
});
