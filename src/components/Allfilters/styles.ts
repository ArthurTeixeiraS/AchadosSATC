import { StyleSheet } from "react-native";
import { colors } from "../../styles/colors";
import { typography } from "../../styles/typography";

import { colors } from "../../styles/colors";
import { typography } from "../../styles/typography";

export const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 8,
    marginTop: 5,
  },

  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },

  activeFilter: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  filterText: {
    color: colors.text,
    fontFamily: typography.fontFamily.medium,
    fontSize: 14,
  },

  activeFilterText: {
    color: colors.white,
  },
});