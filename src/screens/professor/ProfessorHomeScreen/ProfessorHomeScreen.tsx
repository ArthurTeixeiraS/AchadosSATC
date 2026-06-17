import React, { useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useNavigation } from "@react-navigation/native";

import { AppAlert } from "../../../components/AppAlert";
import { ScreenContainer } from "../../../components/ScreenContainer";
import { useAuth } from "../../../contexts/AuthContext";
import { useSolicitationDraft } from "../../../contexts/SolicitationDraftContext";
import { useManualRefresh } from "../../../hooks/useManualRefresh";
import { createResetFiltersToken } from "../../../routes/resetFilters";
import {
  getProfessorHomeData,
  ProfessorHomeData,
} from "../../../services/solicitations/solicitationServices";
import { Solicitation } from "../../../types/Solicitation";
import { colors } from "../../../styles/colors";
import { styles } from "./styles";

export function ProfessorHomeScreen() {
  const { appUser } = useAuth();
  const { clearDraft } = useSolicitationDraft();
  const navigation = useNavigation<any>();

  const primeiroNome = appUser?.nomeCompleto?.split(" ")[0] ?? "Professor";

  const [data, setData] = useState<ProfessorHomeData>({
    pendentes: [],
    emUso: [],
    proximasAprovadas: [],
  });
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    if (appUser) {
      try {
        const homeData = await getProfessorHomeData(appUser.id);
        setData(homeData);
        setError(null);
      } catch (loadError) {
        console.log("Erro ao carregar home do professor:", loadError);
        setError("Não foi possível carregar os dados da sua página inicial.");
        throw loadError;
      }
    }
  }

  useEffect(() => {
    void loadData().catch(() => undefined);
  }, [appUser]);

  const { refreshing, refresh } = useManualRefresh({
    onRefresh: loadData,
    errorMessage: "Não foi possível carregar os dados. Tente novamente.",
  });

  function irPara(aba: string) {
    const resetFiltersToken = createResetFiltersToken();

    if (aba === "Minhas Solicitações") {
      navigation.navigate("Minhas Solicitações", {
        screen: "MinhasSolicitacoesList",
        params: { resetFiltersToken },
      });
      return;
    }

    if (aba === "Ocorrências") {
      navigation.navigate("Ocorrências", {
        screen: "OccurrenceList",
        params: { resetFiltersToken },
      });
      return;
    }

    navigation.navigate(aba);
  }

  function irParaSolicitacoesFiltradas(status: string) {
    navigation.navigate("Minhas Solicitações", {
      screen: "MinhasSolicitacoesList",
      params: {
        initialStatus: status,
        resetFiltersToken: createResetFiltersToken(),
      },
    });
  }

  function irParaSolicitacoesEmAnalise() {
    navigation.navigate("Minhas Solicitações", {
      screen: "MinhasSolicitacoesList",
      params: {
        initialAnalysisPending: true,
        resetFiltersToken: createResetFiltersToken(),
      },
    });
  }

  function verDetalhes(id: string) {
    navigation.navigate("Minhas Solicitações", {
      screen: "ProfessorSolicitationDetails",
      params: { solicitationId: id },
    });
  }

  function irParaNovaSolicitacao() {
    clearDraft();
    navigation.navigate("Nova Solicitação");
  }

  function renderCard(solicitation: Solicitation, isAtrasada: boolean = false) {
    const mainResource =
      solicitation.maquinas[0] || solicitation.ferramentas[0];
    
    const secondResource =
      solicitation.maquinas[1] ||
      solicitation.ferramentas[solicitation.maquinas.length > 0 ? 0 : 1];
      
    const remainingCount =
      solicitation.maquinas.length + solicitation.ferramentas.length - 2;

    const resourceDesc = secondResource
      ? `${secondResource.nome}${remainingCount > 0 ? ` +${remainingCount}` : ""}`
      : null;

    let badgeText = "Pendente";
    let badgeStyle = styles.solCardBadgeOrange;

    if (solicitation.status === "APROVADA") {
      badgeText = "Aprovada";
      badgeStyle = styles.solCardBadgeGreen;
    } else if (solicitation.status === "EM_USO") {
      badgeText = "Em uso";
      badgeStyle = styles.solCardBadge;
    }

    return (
      <TouchableOpacity
        key={solicitation.id}
        style={[styles.solCard, isAtrasada && styles.solCardAtrasada]}
        onPress={() => verDetalhes(solicitation.id)}
      >
        <View style={styles.solCardLeft}>
          <Text style={styles.solCardTitle} numberOfLines={1}>
            {mainResource?.nome || "Recurso"}
          </Text>
          <Text style={styles.solCardSub}>
            {solicitation.dataUtilizacao} • {solicitation.turno}
          </Text>
          {resourceDesc && (
            <Text style={styles.solCardResources}>{resourceDesc}</Text>
          )}
        </View>
        <View style={[styles.solCardBadge, badgeStyle]}>
          <Text style={styles.solCardBadgeText}>{badgeText}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <ScreenContainer style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        >
        {!!error && <AppAlert variant="error" message={error} />}

        <View style={styles.header}>
          <View style={styles.avatar}>
            <Feather name="user" size={22} color="#fff" />
          </View>
          <View>
            <Text style={styles.greeting}>Olá, Professor</Text>
            <Text style={styles.userName}>{primeiroNome}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="clock" size={16} color={colors.warning} />
            <Text style={styles.sectionTitle}>Aguardando análise</Text>
            {data.pendentes.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>
                  {data.pendentes.length}
                </Text>
              </View>
            )}
          </View>

          {data.pendentes.length === 0 ? (
            <Text style={styles.emptyText}>
              Nenhuma solicitação aguardando análise nos próximos 7 dias
            </Text>
          ) : (
            <>
              {data.pendentes.slice(0, 2).map((sol) => renderCard(sol))}
              {data.pendentes.length > 2 && (
                <TouchableOpacity
                  style={styles.showMoreContainer}
                  onPress={irParaSolicitacoesEmAnalise}
                >
                  <Text style={styles.showMoreText}>Mostrar mais</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {data.emUso.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="package" size={16} color={colors.primary} />
              <Text style={styles.sectionTitle}>Recursos em uso</Text>
              <View style={[styles.countBadge, styles.countBadgeRed]}>
                <Text style={styles.countBadgeText}>{data.emUso.length}</Text>
              </View>
            </View>

            {data.emUso.slice(0, 2).map((sol) => (
              <View key={sol.id}>
                {sol.atrasada && (
                  <View style={styles.atrasadaRow}>
                    <Feather name="alert-circle" size={12} color={colors.error} />
                    <Text style={styles.atrasadaText}>Devolução atrasada</Text>
                  </View>
                )}
                {renderCard(sol, sol.atrasada)}
              </View>
            ))}
            {data.emUso.length > 2 && (
              <TouchableOpacity
                style={styles.showMoreContainer}
                onPress={() => irParaSolicitacoesFiltradas("EM_USO")}
              >
                <Text style={styles.showMoreText}>Mostrar mais</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="calendar" size={16} color={colors.greenMedium} />
            <Text style={styles.sectionTitle}>Aprovadas</Text>
          </View>

          {data.proximasAprovadas.length === 0 ? (
            <Text style={styles.emptyText}>
              Nenhuma solicitação aprovada nos próximos 7 dias
            </Text>
          ) : (
            <>
              {data.proximasAprovadas.slice(0, 2).map((sol) => renderCard(sol))}
              {data.proximasAprovadas.length > 2 && (
                <TouchableOpacity
                  style={styles.showMoreContainer}
                  onPress={() => irParaSolicitacoesFiltradas("APROVADA")}
                >
                  <Text style={styles.showMoreText}>Mostrar mais</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        <Text style={styles.shortcutsTitle}>Acesso rápido</Text>
        <View style={styles.shortcutsRow}>
          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={irParaNovaSolicitacao}
          >
            <View style={styles.shortcutIcon}>
              <Feather name="plus-circle" size={20} color="#fff" />
            </View>
            <Text style={styles.shortcutLabel}>Nova{"\n"}solicitação</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={() => irPara("Minhas Solicitações")}
          >
            <View style={styles.shortcutIcon}>
              <Feather name="file-text" size={20} color="#fff" />
            </View>
            <Text style={styles.shortcutLabel}>Minhas{"\n"}solicitações</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={() => irPara("Notificações")}
          >
            <View style={styles.shortcutIcon}>
              <Feather name="bell" size={20} color="#fff" />
            </View>
            <Text style={styles.shortcutLabel}>Notificações</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={() => irPara("Ocorrências")}
          >
            <View style={styles.shortcutIcon}>
              <Feather name="alert-triangle" size={20} color="#fff" />
            </View>
            <Text style={styles.shortcutLabel}>Ocorrências</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
