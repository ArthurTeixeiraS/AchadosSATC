import { StyleSheet } from "react-native";

import { colors } from "../../../styles/colors";
import { typography } from "../../../styles/typography";

export const styles = StyleSheet.create({
    image: {
        width: "100%",
        height: 320,
        borderRadius: 20,
        marginTop: 16,
        marginBottom: 4,
    },

    sectionTitle: {
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

    deleteButton: {
        borderColor: colors.error,
        borderWidth: 1,
        borderRadius: 28,
        marginTop: 8,
    },

    infoValue: {
        fontSize: 16,
        fontFamily: typography.fontFamily.semiBold,
        color: colors.text,
    },

    statusText: {
        fontSize: 16,
        fontFamily: typography.fontFamily.semiBold,
        color: colors.secondary,
    },
});