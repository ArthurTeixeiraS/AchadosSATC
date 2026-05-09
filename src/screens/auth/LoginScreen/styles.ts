import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#3A3A3A",
    justifyContent: "center",
    padding: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 28,
    paddingVertical: 48,
    minHeight: "92%",
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 36,
  },
  logoTitle: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#007A3D",
    letterSpacing: 1,
  },
  logoSubtitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#004732",
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  forgotText: {
    color: "#007A4D",
    fontWeight: "700",
    marginBottom: 24,
  },
  errorText: {
    color: "#B00020",
    marginBottom: 16,
    fontWeight: "600",
  },
});