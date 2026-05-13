import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 8,
    height: 40,
    marginTop: 5,
  },

  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D0D5DD",
    backgroundColor: "#FFF",
  },

  activeFilter: {
    backgroundColor: "#00875F",
    borderColor: "#00875F",
  },

  filterText: {
    color: "#344054",
    fontWeight: "500",
    fontSize: 14,
  },

  activeFilterText: {
    color: "#FFF",
  },
});