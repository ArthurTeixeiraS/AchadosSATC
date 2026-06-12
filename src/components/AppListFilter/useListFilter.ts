import { useMemo } from "react";

import {
  ActiveListFilters,
  FilterDefinition,
  SortDefinition,
} from "./types";

type UseListFilterParams<T> = {
  data: readonly T[];
  search: string;
  filters: readonly FilterDefinition<T>[];
  activeFilters: ActiveListFilters;
  sorts: readonly SortDefinition<T>[];
  activeSort: string;
  searchPredicate: (item: T, normalizedSearch: string) => boolean;
};

export function normalizeFilterText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function useListFilter<T>({
  data,
  search,
  filters,
  activeFilters,
  sorts,
  activeSort,
  searchPredicate,
}: UseListFilterParams<T>) {
  return useMemo(() => {
    const normalizedSearch = normalizeFilterText(search);

    const result = data.filter((item) => {
      if (normalizedSearch && !searchPredicate(item, normalizedSearch)) {
        return false;
      }

      return filters.every((definition) => {
        const value = activeFilters[definition.key];

        if (!value?.trim()) {
          return true;
        }

        return definition.predicate(item, value);
      });
    });

    const selectedSort = sorts.find((sort) => sort.key === activeSort);

    if (!selectedSort) {
      return result;
    }

    return [...result].sort(selectedSort.compare);
  }, [
    activeFilters,
    activeSort,
    data,
    filters,
    search,
    searchPredicate,
    sorts,
  ]);
}
