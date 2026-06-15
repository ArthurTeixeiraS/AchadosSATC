import { StyleSheet } from "react-native";
import { colors } from "../../../styles/colors";

export const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 16,
  },
  codeText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1F2937",
  },
  dotStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  infoSection: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#9CA3AF",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  sectionValue: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 22,
  },
  divider: {
    marginVertical: 16,
    backgroundColor: "#F3F4F6",
  },
  actionsWrapper: {
    marginTop: 8,
    gap: 12,
  },
  btnEditar: {
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  btnSecondary: {
    borderRadius: 8,
    backgroundColor: "#FFF",
    borderWidth: 1,
  },
});