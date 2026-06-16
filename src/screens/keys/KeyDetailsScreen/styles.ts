import { StyleSheet } from "react-native";
import { colors } from "../../../styles/colors";
import { radius } from "../../../styles/radius";
import { spacing } from "../../../styles/spacing";
import { typography } from "../../../styles/typography";

export const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 16,
  },
  codeText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1F2937",
  },
  dotStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  infoSection: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#9CA3AF",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  sectionValue: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 22,
  },
  divider: {
    marginVertical: 16,
    backgroundColor: "#F3F4F6",
  },
  actionsWrapper: {
    marginTop: 8,
    gap: 12,
  },
  movementCard: {
    backgroundColor: colors.white,
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
  btnEditar: {
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  btnSecondary: {
    borderRadius: 8,
    backgroundColor: "#FFF",
    borderWidth: 1,
  },
});
