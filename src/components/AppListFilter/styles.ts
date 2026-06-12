import { StyleSheet } from "react-native";

import { colors } from "../../styles/colors";
import { radius } from "../../styles/radius";
import { spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";

export const styles = StyleSheet.create({
  container: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    marginBottom: 0,
  },
  filterButton: {
    width: 54,
    height: 54,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  filterCount: {
    position: "absolute",
    top: 5,
    right: 5,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  filterCountText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
  },
  appliedArea: {
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
  },
  chips: {
    flexGrow: 1,
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  chip: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#E8F5EE",
  },
  chipText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.primary,
  },
  sortChip: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortChipText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  modal: {
    marginHorizontal: spacing.md,
    maxHeight: "88%",
    borderRadius: radius.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  modalBody: {
    flexShrink: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: typography.fontFamily.bold,
    color: colors.text,
  },
  modalSubtitle: {
    marginTop: spacing.xs,
    fontSize: 13,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  modalContent: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  modalScroll: {
    flexShrink: 1,
  },
  textField: {
    marginBottom: spacing.xs,
  },
  fieldLabel: {
    marginBottom: spacing.sm,
    fontSize: 14,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
  },
  modalInput: {
    marginBottom: spacing.md,
  },
  dateField: {
    marginBottom: spacing.md,
  },
  checkboxField: {
    minHeight: 58,
    marginBottom: spacing.md,
    paddingVertical: spacing.xs,
    paddingRight: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    flexDirection: "row",
    alignItems: "center",
  },
  checkboxText: {
    flex: 1,
  },
  checkboxLabel: {
    fontSize: 14,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
  },
  checkboxDescription: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  modalActions: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  clearButton: {
    width: 54,
    height: 54,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.error,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButton: {
    width: 220,
    maxWidth: "70%",
  },
});
