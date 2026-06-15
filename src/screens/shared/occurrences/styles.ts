import { StyleSheet } from "react-native";

import { colors } from "../../../styles/colors";
import { typography } from "../../../styles/typography";

export const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 96,
    gap: 12,
  },
  card: {
    marginBottom: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  flex: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  description: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.text,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#E8F5EE",
  },
  warningBadge: {
    backgroundColor: "#FFF4D6",
  },
  closedBadge: {
    backgroundColor: colors.border,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.primary,
  },
  details: {
    marginTop: 12,
    gap: 5,
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
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    backgroundColor: colors.primary,
  },
  empty: {
    flex: 1,
  },
  emptyContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
  },
  resourceSearch: {
    marginBottom: 4,
  },
  resourceList: {
    maxHeight: 300,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  actions: {
    gap: 10,
  },
  alert: {
    marginBottom: 4,
  },
  timeline: {
    gap: 10,
  },
  timelineItem: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    paddingLeft: 12,
    paddingVertical: 4,
  },
  timelineTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
  },
  timelineText: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
});
