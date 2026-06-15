import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { FAB, Text } from "react-native-paper";

import { AppAlert } from "../../../components/AppAlert";
import { AppCard } from "../../../components/AppCard";
import { EmptyState } from "../../../components/EmptyState";
import {
  ActiveListFilters,
  AppListFilter,
  FilterDefinition,
  normalizeFilterText,
  SortDefinition,
  useListFilter,
} from "../../../components/AppListFilter";
import { Loading } from "../../../components/Loading";
import { ScreenContainer } from "../../../components/ScreenContainer";
import { useManualRefresh } from "../../../hooks/useManualRefresh";
import {
  Chave,
  listarChaves,
} from "../../../services/chave/chaveServices";
import { colors } from "../../../styles/colors";
import { styles } from "./styles";

const keySorts: readonly SortDefinition<Chave>[] = [
  {
    key: "code-asc",
    label: "Código de A a Z",
    compare: (a, b) => a.codigo.localeCompare(b.codigo),
  },
  {
    key: "code-desc",
    label: "Código de Z a A",
    compare: (a, b) => b.codigo.localeCompare(a.codigo),
  },
  {
    key: "location-asc",
    label: "Localização de A a Z",
    compare: (a, b) => a.localizacao.localeCompare(b.localizacao),
  },
];

const keyFilters: readonly FilterDefinition<Chave>[] = [
  {
    key: "status",
    label: "Status",
    type: "select",
    options: [
      { label: "Ativa", value: "ATIVA" },
      { label: "Arquivada", value: "ARQUIVADA" },
    ],
    predicate: (item, value) =>
      value === "ARQUIVADA" ? item.isArquivado : !item.isArquivado,
  },
  {
    key: "codigo",
    label: "Código",
    type: "text",
    predicate: (item, value) =>
      normalizeFilterText(item.codigo).includes(
        normalizeFilterText(value)
      ),
  },
  {
    key: "localizacao",
    label: "Localização",
    type: "text",
    predicate: (item, value) =>
      normalizeFilterText(item.localizacao).includes(
        normalizeFilterText(value)
      ),
  },
];

function searchKey(item: Chave, search: string) {
  return [
    item.codigo,
    item.localizacao,
    item.descricao,
  ].some((value) => normalizeFilterText(value).includes(search));
}

export function KeysListScreen() {
  const navigation = useNavigation<any>();
  const [keys, setKeys] = useState<Chave[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] =
    useState<ActiveListFilters>({ status: "ATIVA" });
  const [activeSort, setActiveSort] = useState("code-asc");

  const fetchKeys = useCallback(async () => {
    const data = await listarChaves();
    setKeys(data);
    setError(null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadKeys() {
        try {
          setLoading(true);
          const data = await listarChaves();

          if (active) {
            setKeys(data);
            setError(null);
          }
        } catch (loadError) {
          console.log("Erro ao listar chaves:", loadError);

          if (active) {
            setError("Não foi possível carregar o inventário de chaves.");
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      }

      void loadKeys();

      return () => {
        active = false;
      };
    }, [])
  );

  const filteredKeys = useListFilter({
    data: keys,
    search,
    filters: keyFilters,
    activeFilters,
    sorts: keySorts,
    activeSort,
    searchPredicate: searchKey,
  });
  const { refreshing, refresh } = useManualRefresh({
    onRefresh: fetchKeys,
    errorMessage: "Não foi possível atualizar o inventário de chaves.",
  });
  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={refresh}
      colors={[colors.primary]}
      tintColor={colors.primary}
    />
  );
  const emptyMessage = useMemo(
    () =>
      keys.length
        ? "Tente alterar a busca ou os filtros aplicados."
        : "Cadastre uma chave para começar.",
    [keys.length]
  );

  if (loading) {
    return <Loading message="Carregando chaves..." />;
  }

  return (
    <ScreenContainer>
      {!!error && <AppAlert variant="error" message={error} />}

      <AppListFilter
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por código, localização ou descrição"
        filters={keyFilters}
        activeFilters={activeFilters}
        onFiltersChange={setActiveFilters}
        sorts={keySorts}
        activeSort={activeSort}
        onSortChange={setActiveSort}
      />

      {filteredKeys.length === 0 ? (
        <ScrollView
          alwaysBounceVertical
          style={styles.emptyList}
          contentContainerStyle={styles.emptyListContent}
          refreshControl={refreshControl}
        >
          <AppCard>
            <EmptyState
              icon="key"
              title="Nenhuma chave encontrada"
              message={emptyMessage}
            />
          </AppCard>
        </ScrollView>
      ) : (
        <FlatList
          data={filteredKeys}
          keyExtractor={(item) => item.id}
          refreshControl={refreshControl}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                navigation.navigate("KeyDetails", {
                  chaveId: item.id,
                })
              }
            >
              <AppCard style={styles.card}>
                <View style={styles.cardContent}>
                  <View style={styles.cardIconWrapper}>
                    <Feather
                      name="key"
                      size={20}
                      color={colors.primary}
                    />
                  </View>

                  <View style={styles.cardText}>
                    <Text style={styles.cardTitle}>{item.codigo}</Text>
                    <Text style={styles.cardSubtitle}>
                      {item.localizacao}
                    </Text>
                    <Text style={styles.cardDescription} numberOfLines={1}>
                      {item.descricao}
                    </Text>
                  </View>

                  <View style={styles.cardEnd}>
                    <Text
                      style={[
                        styles.status,
                        item.isArquivado && styles.archivedStatus,
                      ]}
                    >
                      {item.isArquivado ? "Arquivada" : "Ativa"}
                    </Text>
                    <Feather
                      name="chevron-right"
                      size={18}
                      color={colors.textSecondary}
                    />
                  </View>
                </View>
              </AppCard>
            </TouchableOpacity>
          )}
        />
      )}

      <FAB
        icon="plus"
        color={colors.white}
        style={styles.fab}
        onPress={() => navigation.navigate("KeyCreate")}
      />
    </ScreenContainer>
  );
}
