import React, { useState } from "react";
import {ScrollView,TouchableOpacity,Text,View,} from "react-native";

import { styles } from "./styles";

type AllFiltersProps = {
  filters: string[];
};

export function AllFilters({
  filters,
}: AllFiltersProps) {

  const [selectedFilter, setSelectedFilter] =
    useState(filters[0]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {filters.map((filter) => {
        const isActive =
          selectedFilter === filter;

        return (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterButton,

              isActive &&
                styles.activeFilter,
            ]}
            onPress={() =>
              setSelectedFilter(filter)
            }
          >
            <Text
              style={[
                styles.filterText,

                isActive &&
                  styles.activeFilterText,
              ]}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}