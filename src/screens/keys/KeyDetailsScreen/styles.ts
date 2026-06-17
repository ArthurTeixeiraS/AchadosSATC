import { StyleSheet } from "react-native";
import { colors } from "../../../styles/colors";
import { radius } from "../../../styles/radius";
import { spacing } from "../../../styles/spacing";
import { typography } from "../../../styles/typography";

export const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  codeText: {
    fontSize: 22,
    fontFamily: typography.fontFamily.bold,
    color: colors.text,
  },
  statusRow: {
    marginTop: spacing.xs,
    flexDirection: "row",
    alignItems: "center",
  },
  dotStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  availableDot: {
    backgroundColor: colors.success,
  },
  borrowedDot: {
    backgroundColor: colors.warning,
  },
  archivedDot: {
    backgroundColor: colors.error,
  },
  statusText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  sectionTitle: {
    marginBottom: spacing.md,
    fontSize: 18,
    fontFamily: typography.fontFamily.bold,
    color: colors.text,
  },
  infoItem: {
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    marginBottom: spacing.xs,
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  sectionValue: {
    fontSize: 16,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
    lineHeight: 22,
  },
  divider: {
    marginVertical: spacing.md,
    backgroundColor: colors.border,
  },
  actionsCard: {
    gap: spacing.sm,
  },
  btnSecondary: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  historyListContent: {
    paddingBottom: spacing.xl,
  },
  movementHistoryCard: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  movementCard: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  movementHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  movementTitle: {
    flex: 1,
    fontSize: 15,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
  },
  movementSubtitle: {
    fontSize: 13,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  movementMeta: {
    fontSize: 12,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  movementStatusBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#ECFDF5",
  },
  openMovementStatusBadge: {
    backgroundColor: "#FFF8E1",
    borderWidth: 1,
    borderColor: colors.warning,
  },
  movementStatus: {
    fontSize: 12,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.primary,
  },
  borrowedStatus: {
    color: colors.warning,
  },
  selectedCard: {
    borderColor: colors.primary,
    backgroundColor: "#EFF6F4",
  },
  timelineRow: {
    flexDirection: "row",
  },
  timelineMarkerColumn: {
    width: 28,
    alignItems: "center",
  },
  timelineMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  timelineConnector: {
    flex: 1,
    width: 2,
    minHeight: 48,
    backgroundColor: colors.border,
  },
  timelineContent: {
    flex: 1,
    paddingLeft: 10,
    paddingBottom: 22,
  },
  lastTimelineContent: {
    paddingBottom: 0,
  },
  timelineHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  timelineTitle: {
    flex: 1,
    fontSize: 15,
    fontFamily: typography.fontFamily.bold,
    color: colors.text,
  },
  timelineDate: {
    fontSize: 12,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  timelineActor: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
  },
  timelineDetail: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
});
