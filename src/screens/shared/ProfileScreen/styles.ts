import { StyleSheet } from "react-native";

import { colors } from "../../../styles/colors";
import { typography } from "../../../styles/typography";

export const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    marginBottom: 24,
  },

  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  avatarText: {
    color: colors.white,
    fontSize: 36,
    fontFamily: typography.fontFamily.bold,
  },

  name: {
    fontSize: 22,
    fontFamily: typography.fontFamily.bold,
    color: colors.text,
    textAlign: "center",
  },

  role: {
    marginTop: 4,
    fontSize: 15,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },

  cardTitle: {
    fontSize: 18,
    fontFamily: typography.fontFamily.bold,
    color: colors.text,
    marginBottom: 16,
  },

  infoItem: {
    marginBottom: 16,
  },

  infoLabel: {
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginBottom: 4,
  },

  infoValue: {
    fontSize: 16,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
  },

  statusActive: {
    fontSize: 16,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.secondary,
  },
});