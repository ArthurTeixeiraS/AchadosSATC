import React from "react";
import Feather from "@expo/vector-icons/Feather";
import {
  getFocusedRouteNameFromRoute,
  NavigatorScreenParams,
} from "@react-navigation/native";
import { createDrawerNavigator } from "@react-navigation/drawer";

import { ProfessorHomeScreen } from "../screens/professor/ProfessorHomeScreen/ProfessorHomeScreen";
import { NotificationsScreen } from "../screens/shared/NotificationsScreen";
import { AppDrawerContent } from "../components/AppDrawerContent";
import { NotificationDrawerLabel } from "../components/NotificationDrawerLabel";
import { SolicitationDraftProvider } from "../contexts/SolicitationDraftContext";
import {
  MinhasSolicitacoesStackParamList,
  MinhasSolicitacoesStackRoutes,
} from "./MinhasSolicitacoesStackRoutes";
import {
  NovaSolicitacaoStackParamList,
  NovaSolicitacaoStackRoutes,
} from "./NovaSolicitacaoStackRoutes";
import {
  ProfileStackParamList,
  ProfileStackRoutes,
} from "./ProfileStackRoutes";
import { getDrawerHeaderOptions } from "./drawerHelpers";
import { colors } from "../styles/colors";
import { typography } from "../styles/typography";
import {
  OccurrenceStackParamList,
  OccurrenceStackRoutes,
} from "./OccurrenceStackRoutes";

export type ProfessorDrawerParamList = {
  Home: undefined;
  "Nova Solicitação": NavigatorScreenParams<NovaSolicitacaoStackParamList>;
  "Minhas Solicitações": NavigatorScreenParams<MinhasSolicitacoesStackParamList>;
  Ocorrências: NavigatorScreenParams<OccurrenceStackParamList>;
  Notificações: undefined;
  Perfil: NavigatorScreenParams<ProfileStackParamList>;
};

const Drawer = createDrawerNavigator<ProfessorDrawerParamList>();

function NovaSolicitacaoFlow() {
  return <NovaSolicitacaoStackRoutes />;
}

function ProfessorDrawerRoutes() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <AppDrawerContent {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontFamily: typography.fontFamily.bold,
        },
        headerLeftContainerStyle: {
          paddingLeft: 16,
        },
        drawerActiveTintColor: colors.primary,
        drawerActiveBackgroundColor: "#E8F5EE",
        drawerInactiveTintColor: colors.textSecondary,
        drawerLabelStyle: {
          marginLeft: 8,
          fontFamily: typography.fontFamily.medium,
        },
      }}
    >
      <Drawer.Screen
        name="Home"
        component={ProfessorHomeScreen}
        options={({ navigation }) => ({
          ...getDrawerHeaderOptions(navigation, {
            title: "Início",
            subtitle: "Visão geral da ferramentaria",
          }),
          drawerLabel: "Início",
          drawerIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        })}
      />

      <Drawer.Screen
        name="Nova Solicitação"
        component={NovaSolicitacaoFlow}
        options={({ navigation, route }) => {
          const routeName =
            getFocusedRouteNameFromRoute(route) ?? "SolicitationInfo";

          const config = {
            SolicitationInfo: {
              title: "Nova solicitação",
              subtitle: "Etapa 1 de 4 · Informações básicas",
              showMenu: true,
            },
            SelectMachines: {
              title: "Nova solicitação",
              subtitle: "Etapa 2 de 4 · Selecionar máquinas",
              onBack: () =>
                navigation.navigate("Nova Solicitação", {
                  screen: "SolicitationInfo",
                }),
            },
            SelectTools: {
              title: "Nova solicitação",
              subtitle: "Etapa 3 de 4 · Selecionar ferramentas",
              onBack: () =>
                navigation.navigate("Nova Solicitação", {
                  screen: "SelectMachines",
                }),
            },
            ReviewSolicitation: {
              title: "Nova solicitação",
              subtitle: "Etapa 4 de 4 · Revisão",
              onBack: () =>
                navigation.navigate("Nova Solicitação", {
                  screen: "SelectTools",
                }),
            },
          }[routeName] ?? {
            title: "Nova solicitação",
            subtitle: "Preencha os dados da solicitação",
            onBack: () => navigation.navigate("Home"),
          };

          return {
            ...getDrawerHeaderOptions(navigation, {
              ...config,
              showMenu: config.showMenu ?? false,
            }),
            drawerIcon: ({ color, size }) => (
              <Feather name="plus-circle" size={size} color={color} />
            ),
            popToTopOnBlur: true,
          };
        }}
      />

      <Drawer.Screen
        name="Minhas Solicitações"
        component={MinhasSolicitacoesStackRoutes}
        options={({ navigation, route }) => {
          const routeName =
            getFocusedRouteNameFromRoute(route) ?? "MinhasSolicitacoesList";
          const isDetails = routeName === "ProfessorSolicitationDetails";

          return {
            ...getDrawerHeaderOptions(navigation, {
              title: isDetails
                ? "Detalhes da solicitação"
                : "Minhas solicitações",
              subtitle: isDetails
                ? "Acompanhe os recursos solicitados"
                : "Acompanhe seus pedidos",
              showMenu: !isDetails,
              onBack: () =>
                navigation.navigate("Minhas Solicitações", {
                  screen: "MinhasSolicitacoesList",
                }),
            }),
            drawerIcon: ({ color, size }) => (
              <Feather name="file-text" size={size} color={color} />
            ),
            popToTopOnBlur: true,
          };
        }}
      />

      <Drawer.Screen
        name="Ocorrências"
        component={OccurrenceStackRoutes}
        options={({ navigation, route }) => {
          const routeName =
            getFocusedRouteNameFromRoute(route) ?? "OccurrenceList";
          const isCreate = routeName === "CreateOccurrence";
          const isDetails = routeName === "OccurrenceDetails";

          return {
            ...getDrawerHeaderOptions(navigation, {
              title: isCreate
                ? "Nova ocorrência"
                : isDetails
                  ? "Detalhes da ocorrência"
                  : "Ocorrências",
              subtitle: isCreate
                ? "Informe o recurso e o problema"
                : isDetails
                  ? "Acompanhe o atendimento"
                  : "Registre e acompanhe problemas",
              showMenu: !isCreate && !isDetails,
              onBack: () =>
                navigation.navigate("Ocorrências", {
                  screen: "OccurrenceList",
                }),
            }),
            drawerIcon: ({ color, size }) => (
              <Feather name="alert-triangle" size={size} color={color} />
            ),
            popToTopOnBlur: true,
          };
        }}
      />

      <Drawer.Screen
        name="Notificações"
        component={NotificationsScreen}
        options={({ navigation }) => ({
          ...getDrawerHeaderOptions(navigation, {
            title: "Notificações",
            subtitle: "Atualizações das suas solicitações",
          }),
          drawerIcon: ({ color, size }) => (
            <Feather name="bell" size={size} color={color} />
          ),
          drawerLabel: ({ color }) => (
            <NotificationDrawerLabel color={color} />
          ),
        })}
      />

      <Drawer.Screen
        name="Perfil"
        component={ProfileStackRoutes}
        options={({ navigation, route }) => {
          const routeName = getFocusedRouteNameFromRoute(route) ?? "Profile";
          const isEditing = routeName === "EditProfile";

          return {
            drawerItemStyle: {
              display: "none",
            },
            ...getDrawerHeaderOptions(navigation, {
              title: isEditing ? "Editar perfil" : "Perfil",
              subtitle: isEditing
                ? "Atualize seus dados pessoais"
                : "Dados da sua conta",
              showMenu: !isEditing,
              onBack: () =>
                navigation.navigate("Perfil", {
                  screen: "Profile",
                }),
            }),
            drawerIcon: ({ color, size }) => (
              <Feather name="user" size={size} color={color} />
            ),
            popToTopOnBlur: true,
          };
        }}
      />
    </Drawer.Navigator>
  );
}

export function ProfessorRoutes() {
  return (
    <SolicitationDraftProvider>
      <ProfessorDrawerRoutes />
    </SolicitationDraftProvider>
  );
}
