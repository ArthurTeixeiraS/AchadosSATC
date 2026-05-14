import React from "react";
import { ScrollView, TouchableOpacity, Text } from "react-native";

import { styles } from "./styles";

type AllFiltersProps = {
  filters: string[];
  selectedFilter: string;
  onSelectFilter: (filter: string) => void;
};

export function AllFilters({
  filters,
  selectedFilter,
  onSelectFilter,
}: AllFiltersProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {filters.map((filter) => {
        const isActive = selectedFilter === filter;

        return (
          <TouchableOpacity
            key={filter}
            style={[styles.filterButton, isActive && styles.activeFilter]}
            onPress={() => onSelectFilter(filter)}
          >
            <Text style={[styles.filterText, isActive && styles.activeFilterText]}>
              {filter}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}