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

    searchInput: {
        marginBottom: 0,
        borderColor: colors.border,
    },

    screenContent: {
        paddingBottom: 0,
    },

    listContent: {
        paddingTop: 0,
        paddingBottom: 16,
    },

    machineCard: {
        marginTop: 10,
    },

    machineName: {
        fontSize: 17,
        fontFamily: typography.fontFamily.bold,
        color: colors.text,
    },

    machineLaboratory: {
        marginTop: 4,
        fontSize: 14,
        fontFamily: typography.fontFamily.regular,
        color: colors.textSecondary,
    },

    machineStatus: {
        marginTop: 2,
        fontSize: 13,
        fontFamily: typography.fontFamily.medium,
        color: colors.secondary,
    },

    machineStatusUnavailable: {
        color: colors.error,
    },

    machineButton: {
        marginTop: 14,
        height: 40,
        borderRadius: 10,
        backgroundColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 8,
    },

    machineButtonSelected: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.primary,
    },

    machineButtonDisabled: {
        backgroundColor: colors.border,
        opacity: 0.7,
    },

    machineButtonText: {
        fontSize: 14,
        fontFamily: typography.fontFamily.semiBold,
        color: colors.white,
    },

    machineButtonTextSelected: {
        color: colors.primary,
    },

    bottomSummary: {
        backgroundColor: colors.surface,
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },

    summaryHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    summaryTitle: {
        fontSize: 16,
        fontFamily: typography.fontFamily.bold,
        color: colors.text,
    },

    summaryCount: {
        fontSize: 13,
        fontFamily: typography.fontFamily.semiBold,
        color: colors.primary,
    },

    summaryEmpty: {
        marginTop: 12,
        fontSize: 14,
        fontFamily: typography.fontFamily.regular,
        color: colors.textSecondary,
    },

    summaryItem: {
        marginTop: 10,
        fontSize: 14,
        fontFamily: typography.fontFamily.regular,
        color: colors.text,
    },

    summaryMore: {
        marginTop: 8,
        fontSize: 13,
        fontFamily: typography.fontFamily.medium,
        color: colors.textSecondary,
    },

    summaryButtons: {
        marginTop: 16,
        gap: 10,
    },
});
