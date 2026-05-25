import { StyleSheet } from "react-native";

import { colors } from "../../../styles/colors";
import { typography } from "../../../styles/typography";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    height: 56,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 12,
  },

  headerTitle: {
    fontSize: 18,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
  },

  content: {
    padding: 16,
    paddingBottom: 40,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },

  label: {
    fontSize: 14,
    fontFamily: typography.fontFamily.medium,
    color: colors.text,
    marginBottom: 8,
  },

  shiftContainer: {
    flexDirection: "row",
    gap: 8,
  },

  shiftButton: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },

  shiftButtonActive: {
    backgroundColor: colors.primary,
  },

  shiftText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.medium,
    color: colors.text,
  },

  shiftTextActive: {
    color: colors.white,
  },

  warningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: "#FFF8E1",
    borderWidth: 1,
    borderColor: "#FACC15",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },

  warningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: typography.fontFamily.regular,
    color: "#7C2D12",
  },

  warningStrong: {
    fontFamily: typography.fontFamily.bold,
    color: "#7C2D12",
  },

  buttonContainer: {
    marginTop: 18,
    gap: 10,
  },
});