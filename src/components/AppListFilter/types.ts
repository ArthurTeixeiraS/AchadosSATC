export type ListFilterType = "text" | "number" | "select" | "date";

export type ListFilterOption = {
  label: string;
  value: string;
};

export type FilterDefinition<T> = {
  key: string;
  label: string;
  type: ListFilterType;
  placeholder?: string;
  options?: readonly ListFilterOption[];
  predicate: (item: T, value: string) => boolean;
  formatValue?: (value: string) => string;
};

export type SortDefinition<T> = {
  key: string;
  label: string;
  compare: (a: T, b: T) => number;
};

export type ActiveListFilters = Record<string, string>;
