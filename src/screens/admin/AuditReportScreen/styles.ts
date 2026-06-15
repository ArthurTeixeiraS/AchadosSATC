import { StyleSheet } from "react-native";

import { colors } from "../../../styles/colors";
import { typography } from "../../../styles/typography";

export const styles = StyleSheet.create({
  alert: {
    marginHorizontal: 16,
    marginTop: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    marginBottom: 0,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F5EE",
  },
  titleArea: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
  },
  code: {
    marginTop: 3,
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
  },
  legacyBadge: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    backgroundColor: "#FFF4D6",
  },
  legacyBadgeText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.warning,
  },
  summary: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: typography.fontFamily.medium,
    color: colors.text,
  },
  details: {
    marginTop: 10,
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  reason: {
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
    color: colors.error,
  },
  items: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  changes: {
    marginTop: 10,
    padding: 10,
    borderRadius: 9,
    gap: 4,
    backgroundColor: colors.background,
  },
  changeText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  relatedText: {
    marginTop: 10,
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
  },
  openRow: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 5,
  },
  openText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.primary,
  },
  emptyList: {
    flex: 1,
  },
  emptyListContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
});
