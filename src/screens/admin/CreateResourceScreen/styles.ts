import { StyleSheet } from "react-native";

import { colors } from "../../../styles/colors";
import { typography } from "../../../styles/typography";

export const styles = StyleSheet.create({
  errorText: {
    color: colors.error,
    fontFamily: typography.fontFamily.semiBold,
    marginBottom: 16,
  },

  imageSection: {
    marginBottom: 22,
  },

  imagePicker: {
    height: 180,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderStyle: "dashed",
  },

  imagePreview: {
    width: "100%",
    height: "100%",
  },

  imageText: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },

  imageOptions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },

  imageOptionButton: {
    flex: 1,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  imageOptionText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.primary,
  },
});