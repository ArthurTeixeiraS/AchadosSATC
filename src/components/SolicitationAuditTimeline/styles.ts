import { StyleSheet } from "react-native";

import { colors } from "../../styles/colors";
import { typography } from "../../styles/typography";

export const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontFamily: typography.fontFamily.bold,
    color: colors.text,
    marginBottom: 18,
  },

  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
  },

  loadingText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  emptyText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    paddingVertical: 8,
  },

  eventRow: {
    flexDirection: "row",
  },

  markerColumn: {
    width: 28,
    alignItems: "center",
  },

  marker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },

  connector: {
    flex: 1,
    width: 2,
    minHeight: 48,
    backgroundColor: colors.border,
  },

  eventContent: {
    flex: 1,
    paddingLeft: 10,
    paddingBottom: 22,
  },

  lastEvent: {
    paddingBottom: 0,
  },

  eventHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },

  eventTitle: {
    flex: 1,
    fontSize: 15,
    fontFamily: typography.fontFamily.bold,
    color: colors.text,
  },

  eventDate: {
    fontSize: 12,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  actorText: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
  },

  detailText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  legacyText: {
    marginTop: 6,
    fontSize: 11,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
});
