import { StyleSheet } from "react-native";

import { colors } from "../../../styles/colors";
import { typography } from "../../../styles/typography";

export const styles = StyleSheet.create({
  tabs: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
    padding: 4,
    borderRadius: 14,
    backgroundColor: colors.border,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 8,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.white,
  },
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
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  cardTitleArea: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
  },
  cardSubtitle: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  reservedBadge: {
    backgroundColor: "#E8F5EE",
  },
  withdrawnBadge: {
    backgroundColor: "#FFF4D6",
  },
  badgeText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.primary,
  },
  historyBadge: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  historyBadgeText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textSecondary,
  },
  overdueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 12,
    padding: 9,
    borderRadius: 9,
    backgroundColor: "#FDECEC",
  },
  overdueText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
    color: colors.error,
  },
  resourcesText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
    color: colors.text,
  },
  details: {
    marginTop: 12,
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
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
