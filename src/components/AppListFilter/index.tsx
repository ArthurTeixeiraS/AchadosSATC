import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import {
  Button,
  Checkbox,
  Modal,
  Portal,
  Text,
  TextInput,
} from "react-native-paper";

import { AppButton } from "../AppButton";
import { AppDatePicker } from "../AppDatePicker";
import { AppInput } from "../AppInput";
import { AppSelect } from "../AppSelect";
import { colors } from "../../styles/colors";
import { styles } from "./styles";
import {
  ActiveListFilters,
  FilterDefinition,
  SortDefinition,
} from "./types";

type AppListFilterProps<T> = {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  filters: readonly FilterDefinition<T>[];
  activeFilters: ActiveListFilters;
  onFiltersChange: (filters: ActiveListFilters) => void;
  sorts?: readonly SortDefinition<T>[];
  activeSort?: string;
  onSortChange?: (sortKey: string) => void;
  extraHeaderAction?: React.ReactNode;
  leftHeaderAction?: React.ReactNode;
};

export function AppListFilter<T>({
  search,
  onSearchChange,
  searchPlaceholder,
  filters,
  activeFilters,
  onFiltersChange,
  sorts,
  activeSort,
  onSortChange,
  extraHeaderAction,
  leftHeaderAction,
}: AppListFilterProps<T>) {
  const sortOptions = sorts ?? [];
  const currentSort = activeSort ?? "";
  const [visible, setVisible] = useState(false);
  const [draftFilters, setDraftFilters] =
    useState<ActiveListFilters>(activeFilters);
  const [draftSort, setDraftSort] = useState(currentSort);

  const activeFilterEntries = filters.filter(
    (filter) => activeFilters[filter.key]?.trim()
  );

  function openModal() {
    setDraftFilters(activeFilters);
    setDraftSort(currentSort);
    setVisible(true);
  }

  function updateDraftFilter(key: string, value: string) {
    setDraftFilters((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function applyFilters() {
    const cleanedFilters = Object.fromEntries(
      Object.entries(draftFilters).filter(([, value]) => value.trim())
    );

    onFiltersChange(cleanedFilters);
    onSortChange?.(draftSort);
    setVisible(false);
  }

  function clearDraft() {
    setDraftFilters({});
    setDraftSort("");
  }

  function clearApplied() {
    onFiltersChange({});
    onSortChange?.("");
  }

  function removeFilter(key: string) {
    const nextFilters = { ...activeFilters };
    delete nextFilters[key];
    onFiltersChange(nextFilters);
  }

  function getFilterValueLabel(definition: FilterDefinition<T>, value: string) {
    if (definition.formatValue) {
      return definition.formatValue(value);
    }

    return (
      definition.options?.find((option) => option.value === value)?.label ??
      value
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        {leftHeaderAction && (
          <View style={{ marginRight: 8 }}>
            {leftHeaderAction}
          </View>
        )}

        <AppInput
          value={search}
          onChangeText={onSearchChange}
          placeholder={searchPlaceholder}
          left={<TextInput.Icon icon="magnify" />}
          style={styles.searchInput}
        />

        {extraHeaderAction && (
          <View style={{ marginLeft: 8 }}>
            {extraHeaderAction}
          </View>
        )}

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Abrir filtros e ordenação"
          style={styles.filterButton}
          onPress={openModal}
        >
          <Feather name="filter" size={20} color={colors.primary} />

          {activeFilterEntries.length > 0 && (
            <View style={styles.filterCount}>
              <Text style={styles.filterCountText}>
                {activeFilterEntries.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {(activeFilterEntries.length > 0 || currentSort) && (
        <View style={styles.appliedArea}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            {activeFilterEntries.map((definition) => (
              <TouchableOpacity
                key={definition.key}
                accessibilityRole="button"
                accessibilityLabel={`Remover filtro ${definition.label}`}
                style={styles.chip}
                onPress={() => removeFilter(definition.key)}
              >
                <Text style={styles.chipText}>
                  {definition.label}:{" "}
                  {getFilterValueLabel(
                    definition,
                    activeFilters[definition.key]
                  )}
                </Text>
                <Feather name="x" size={14} color={colors.primary} />
              </TouchableOpacity>
            ))}

            {!!currentSort && (
              <View style={styles.sortChip}>
                <Feather
                  name="list"
                  size={14}
                  color={colors.textSecondary}
                />
                <Text style={styles.sortChipText}>
                  {sortOptions.find((sort) => sort.key === currentSort)?.label}
                </Text>
              </View>
            )}
          </ScrollView>

          <Button
            compact
            mode="text"
            textColor={colors.error}
            onPress={clearApplied}
          >
            Limpar
          </Button>
        </View>
      )}

      <Portal>
        <Modal
          visible={visible}
          onDismiss={() => setVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.modalBody}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Filtros e ordenação</Text>
                <Text style={styles.modalSubtitle}>
                  Combine critérios para refinar a consulta.
                </Text>
              </View>

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Fechar filtros"
                style={styles.closeButton}
                onPress={() => setVisible(false)}
              >
                <Feather name="x" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              style={styles.modalScroll}
              contentContainerStyle={styles.modalContent}
            >
              {filters.map((definition) => {
                const value = draftFilters[definition.key] ?? "";

                if (definition.type === "select") {
                  return (
                    <AppSelect
                      key={definition.key}
                      label={definition.label}
                      value={value}
                      options={[
                        { label: "Qualquer", value: "" },
                        ...(definition.options ?? []),
                      ]}
                      onChange={(nextValue) =>
                        updateDraftFilter(definition.key, nextValue)
                      }
                    />
                  );
                }

                if (definition.type === "date") {
                  return (
                    <View key={definition.key} style={styles.dateField}>
                      <AppDatePicker
                        label={definition.label}
                        value={value}
                        allowPastDates
                        onChange={(nextValue) =>
                          updateDraftFilter(definition.key, nextValue)
                        }
                      />

                      {!!value && (
                        <Button
                          compact
                          mode="text"
                          onPress={() =>
                            updateDraftFilter(definition.key, "")
                          }
                        >
                          Limpar data
                        </Button>
                      )}
                    </View>
                  );
                }

                if (definition.type === "boolean") {
                  const checked = value === "true";

                  return (
                    <TouchableOpacity
                      key={definition.key}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked }}
                      style={styles.checkboxField}
                      onPress={() =>
                        updateDraftFilter(
                          definition.key,
                          checked ? "" : "true"
                        )
                      }
                    >
                      <Checkbox
                        status={checked ? "checked" : "unchecked"}
                      />

                      <View style={styles.checkboxText}>
                        <Text style={styles.checkboxLabel}>
                          {definition.label}
                        </Text>

                        {!!definition.placeholder && (
                          <Text style={styles.checkboxDescription}>
                            {definition.placeholder}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                }

                return (
                  <View key={definition.key} style={styles.textField}>
                    <Text style={styles.fieldLabel}>{definition.label}</Text>
                    <AppInput
                      value={value}
                      onChangeText={(nextValue) =>
                        updateDraftFilter(definition.key, nextValue)
                      }
                      placeholder={
                        definition.placeholder ??
                        `Filtrar por ${definition.label.toLowerCase()}`
                      }
                      keyboardType={
                        definition.type === "number" ? "numeric" : "default"
                      }
                      style={styles.modalInput}
                    />
                  </View>
                );
              })}

              <AppSelect
                label="Ordenar por"
                value={draftSort}
                options={[
                  { label: "Ordenação padrão", value: "" },
                  ...sortOptions.map((sort) => ({
                    label: sort.label,
                    value: sort.key,
                  })),
                ]}
                onChange={setDraftSort}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Limpar filtros e ordenação"
                style={styles.clearButton}
                onPress={clearDraft}
              >
                <Feather name="trash-2" size={20} color={colors.error} />
              </TouchableOpacity>

              <AppButton style={styles.actionButton} onPress={applyFilters}>
                Aplicar
              </AppButton>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </Portal>
    </View>
  );
}

export * from "./types";
export * from "./useListFilter";
