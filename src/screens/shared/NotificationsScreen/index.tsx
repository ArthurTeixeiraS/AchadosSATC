import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  TouchableOpacity,
  View,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { Text } from "react-native-paper";

import { AppCard } from "../../../components/AppCard";
import { EmptyState } from "../../../components/EmptyState";
import { Loading } from "../../../components/Loading";
import { ScreenContainer } from "../../../components/ScreenContainer";
import { useAuth } from "../../../contexts/AuthContext";
import { useNotifications } from "../../../contexts/NotificationContext";
import { getSolicitationById } from "../../../services/solicitations/solicitationServices";
import { AppNotification } from "../../../types/Notification";
import { colors } from "../../../styles/colors";
import { styles } from "./styles";

function formatNotificationDate(notification: AppNotification) {
  const date = notification.criadaEm?.toDate();

  if (!date) {
    return "Agora";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getNotificationIcon(type: AppNotification["tipo"]) {
  if (type.includes("RECUS")) return "x-circle";
  if (type.includes("APROV")) return "check-circle";
  if (type.includes("ATRAS")) return "alert-triangle";
  if (type.includes("DEVOLUCAO")) return "corner-down-left";
  if (type.includes("RETIRADA")) return "log-out";
  if (type.includes("CANCELADA")) return "slash";
  if (type.includes("ALTERACAO")) return "edit-3";
  return "file-plus";
}

export function NotificationsScreen({ navigation }: { navigation: any }) {
  const { appUser } = useAuth();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
  } = useNotifications();
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  async function handleNotificationPress(notification: AppNotification) {
    if (!appUser || openingId) return;

    try {
      setOpeningId(notification.id);

      if (!notification.lida) {
        await markAsRead(notification.id);
      }

      const solicitation = await getSolicitationById(
        notification.solicitacaoId
      );

      if (!solicitation) {
        Alert.alert(
          "Solicitação não encontrada",
          "O registro relacionado a esta notificação não está mais disponível."
        );
        return;
      }

      if (appUser.tipoUsuario === "FUNCIONARIO") {
        navigation.navigate("Solicitações", {
          screen: "FuncionarioSolicitationDetails",
          params: {
            solicitationId: solicitation.id,
            origin: "NOTIFICACOES",
          },
        });
        return;
      }

      navigation.navigate("Minhas Solicitações", {
        screen: "ProfessorSolicitationDetails",
        params: {
          solicitationId: solicitation.id,
          origin: "NOTIFICACOES",
        },
      });
    } catch (notificationError) {
      console.log("Erro ao abrir notificação:", notificationError);
      Alert.alert(
        "Erro",
        "Não foi possível abrir esta notificação. Tente novamente."
      );
    } finally {
      setOpeningId(null);
    }
  }

  async function handleMarkAllAsRead() {
    if (markingAll || unreadCount === 0) return;

    try {
      setMarkingAll(true);
      await markAllAsRead();
    } catch (markError) {
      console.log("Erro ao marcar notificações:", markError);
      Alert.alert(
        "Erro",
        "Não foi possível marcar todas as notificações como lidas."
      );
    } finally {
      setMarkingAll(false);
    }
  }

  if (loading && notifications.length === 0) {
    return <Loading message="Carregando notificações..." />;
  }

  return (
    <ScreenContainer>
      {notifications.length > 0 && (
        <View style={styles.actions}>
          <Text style={styles.counter}>
            {unreadCount} não lida{unreadCount !== 1 ? "s" : ""}
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            disabled={unreadCount === 0}
            onPress={() => void handleMarkAllAsRead()}
            style={[
              styles.markAllButton,
              unreadCount === 0 && styles.markAllButtonDisabled,
            ]}
          >
            {markingAll ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Feather name="check-circle" size={16} color={colors.primary} />
            )}

            <Text style={styles.markAllButtonText}>
              Marcar todas como lidas
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {!!error && <Text style={styles.errorText}>{error}</Text>}

      {notifications.length === 0 ? (
        <AppCard>
          <EmptyState
            icon="bell"
            title="Nenhuma notificação"
            message="As atualizações das solicitações aparecerão aqui."
          />
        </AppCard>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.78}
              disabled={openingId === item.id}
              onPress={() => void handleNotificationPress(item)}
            >
              <AppCard
                style={[
                  styles.notificationCard,
                  !item.lida && styles.unreadCard,
                ]}
              >
                <View
                  style={[
                    styles.iconContainer,
                    !item.lida && styles.unreadIconContainer,
                  ]}
                >
                  <Feather
                    name={getNotificationIcon(item.tipo)}
                    size={20}
                    color={colors.primary}
                  />
                </View>

                <View style={styles.notificationContent}>
                  <View style={styles.titleRow}>
                    <Text style={styles.title}>{item.titulo}</Text>
                    {!item.lida && <View style={styles.unreadDot} />}
                  </View>

                  <Text style={styles.message}>{item.mensagem}</Text>
                  <Text style={styles.date}>
                    {formatNotificationDate(item)}
                  </Text>
                </View>

                <Feather
                  name="chevron-right"
                  size={18}
                  color={colors.textSecondary}
                />
              </AppCard>
            </TouchableOpacity>
          )}
        />
      )}
    </ScreenContainer>
  );
}
