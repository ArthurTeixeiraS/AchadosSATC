import React from "react";
import Feather from "@expo/vector-icons/Feather";
import {
  getFocusedRouteNameFromRoute,
  NavigatorScreenParams,
} from "@react-navigation/native";
import { createDrawerNavigator } from "@react-navigation/drawer";

import { DashboardScreen } from "../screens/admin/DashboardScreen";
import { AdministrativeConsultationsScreen } from "../screens/admin/AdministrativeConsultationsScreen";
import { AuditReportScreen } from "../screens/admin/AuditReportScreen";
import { NotificationsScreen } from "../screens/shared/NotificationsScreen";
import { AppDrawerContent } from "../components/AppDrawerContent";
import { NotificationDrawerLabel } from "../components/NotificationDrawerLabel";
import {
  FuncionarioSolicitacaoStackParamList,
  FuncionarioSolicitacaoStackRoutes,
} from "./FuncionarioSolicitacaoStackRoutes";
import {
  ProfileStackParamList,
  ProfileStackRoutes,
} from "./ProfileStackRoutes";
import {
  ResourceStackParamList,
  ResourceStackRoutes,
} from "./ResourceStackRoutes";
import { getDrawerHeaderOptions } from "./drawerHelpers";
import { colors } from "../styles/colors";
import { typography } from "../styles/typography";
import { KeysStackRoutes, KeysStackParamList } from "./KeysStackRoutes";

export type AdminDrawerParamList = {
  Dashboard: undefined;
  Solicitações: NavigatorScreenParams<FuncionarioSolicitacaoStackParamList>;
  Recursos: NavigatorScreenParams<ResourceStackParamList>;
  Chaves: NavigatorScreenParams<KeysStackParamList>;
  Consultas: undefined;
  Relatórios: undefined;
  Notificações: undefined;
  Perfil: NavigatorScreenParams<ProfileStackParamList>;
};

const Drawer = createDrawerNavigator<AdminDrawerParamList>();

export function AdminRoutes() {
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
        name="Dashboard"
        component={DashboardScreen}
        options={({ navigation }) => ({
          ...getDrawerHeaderOptions(navigation, {
            title: "Dashboard",
            subtitle: "Visão geral da ferramentaria",
          }),
          drawerIcon: ({ color, size }) => (
            <Feather name="grid" size={size} color={color} />
          ),
        })}
      />

      <Drawer.Screen
        name="Solicitações"
        component={FuncionarioSolicitacaoStackRoutes}
        options={({ navigation, route }) => {
          const routeName =
            getFocusedRouteNameFromRoute(route) ?? "ReceivedSolicitations";
          const isDetails = routeName === "FuncionarioSolicitationDetails";
          const isReturn = routeName === "RegisterSolicitationReturn";

          return {
            ...getDrawerHeaderOptions(navigation, {
              title: isReturn
                ? "Registrar devolução"
                : isDetails
                  ? "Detalhes da solicitação"
                  : "Solicitações",
              subtitle: isReturn
                ? "Selecione os recursos devolvidos"
                : isDetails
                  ? "Analise e atualize o atendimento"
                  : "Gerencie os pedidos recebidos",
              showMenu: !isDetails && !isReturn,
              onBack: () => {
                const nestedState = (
                  route as typeof route & {
                    state?: {
                      index: number;
                      routes: Array<{
                        name: string;
                        params?: {
                          solicitationId?: string;
                          origin?: "CONSULTAS" | "AUDITORIA";
                        };
                      }>;
                    };
                  }
                ).state;
                const activeRoute =
                  nestedState?.routes[nestedState.index ?? 0];

                if (
                  isReturn &&
                  activeRoute?.params?.solicitationId
                ) {
                  navigation.navigate("Solicitações", {
                    screen: "FuncionarioSolicitationDetails",
                    params: {
                      solicitationId:
                        activeRoute.params.solicitationId,
                    },
                  });
                  return;
                }

                if (
                  isDetails &&
                  activeRoute?.params?.origin === "CONSULTAS"
                ) {
                  navigation.navigate("Consultas");
                  return;
                }

                if (
                  isDetails &&
                  activeRoute?.params?.origin === "AUDITORIA"
                ) {
                  navigation.navigate("Relatórios");
                  return;
                }

                navigation.navigate("Solicitações", {
                  screen: "ReceivedSolicitations",
                });
              },
            }),
            drawerIcon: ({ color, size }) => (
              <Feather name="clipboard" size={size} color={color} />
            ),
            popToTopOnBlur: true,
          };
        }}
      />

      <Drawer.Screen
        name="Recursos"
        component={ResourceStackRoutes}
        options={({ navigation, route }) => {
          const nestedState = (
            route as typeof route & {
              state?: {
                index: number;
                routes: Array<{
                  name: string;
                  params?:
                    & ResourceStackParamList["EditResource"]
                    & ResourceStackParamList["CreateResource"]
                    & ResourceStackParamList["ResourceDetails"];
                }>;
              };
            }
          ).state;
          const activeRoute = nestedState?.routes[
            nestedState.index ?? 0
          ] as
            | {
                name: string;
                params?:
                  & ResourceStackParamList["EditResource"]
                  & ResourceStackParamList["CreateResource"]
                  & ResourceStackParamList["ResourceDetails"];
              }
            | undefined;
          const routeName =
            activeRoute?.name ??
            getFocusedRouteNameFromRoute(route) ??
            "ResourceList";
          const screenConfig = {
            ResourceList: {
              title: "Recursos",
              subtitle: "Ferramentas, máquinas e laboratórios",
              showMenu: true,
            },
            ResourceDetails: {
              title: "Detalhes do recurso",
              subtitle: "Informações e ações disponíveis",
              showMenu: false,
            },
            CreateResource: {
              title: activeRoute?.params?.duplicateFrom ? "Cópia de Recurso" : "Novo recurso",
              subtitle: activeRoute?.params?.duplicateFrom
                ? "Cadastre uma cópia do recurso"
                : "Cadastre um recurso da ferramentaria",
              showMenu: false,
            },
            EditResource: {
              title: "Editar recurso",
              subtitle: "Atualize os dados cadastrados",
              showMenu: false,
            },
          }[routeName] ?? {
            title: "Recursos",
            subtitle: "Gerencie os recursos",
            showMenu: true,
          };

          return {
            ...getDrawerHeaderOptions(navigation, {
              ...screenConfig,
              onBack: () => {
                if (
                  routeName === "ResourceDetails" &&
                  activeRoute?.params?.origin === "AUDITORIA"
                ) {
                  navigation.navigate("Relatórios");
                  return;
                }

                if (
                  routeName === "EditResource" &&
                  activeRoute?.params?.resource
                ) {
                  navigation.navigate("Recursos", {
                    screen: "ResourceDetails",
                    params: {
                      resource: activeRoute.params.resource,
                    },
                  });
                  return;
                }

                navigation.navigate("Recursos", {
                  screen: "ResourceList",
                });
              },
            }),
            drawerIcon: ({ color, size }) => (
              <Feather name="briefcase" size={size} color={color} />
            ),
            popToTopOnBlur: true,
          };
        }}
      />

      <Drawer.Screen
        name="Consultas"
        component={AdministrativeConsultationsScreen}
        options={({ navigation }) => ({
          ...getDrawerHeaderOptions(navigation, {
            title: "Consultas",
            subtitle: "Recursos alocados e histórico",
          }),
          drawerIcon: ({ color, size }) => (
            <Feather name="search" size={size} color={color} />
          ),
        })}
      />

      <Drawer.Screen
        name="Relatórios"
        component={AuditReportScreen}
        options={({ navigation }) => ({
          ...getDrawerHeaderOptions(navigation, {
            title: "Relatórios",
            subtitle: "Auditoria de operações",
          }),
          drawerIcon: ({ color, size }) => (
            <Feather name="bar-chart-2" size={size} color={color} />
          ),
        })}
      />

      <Drawer.Screen
        name="Chaves"
        component={KeysStackRoutes} 
        options={({ navigation, route }) => {
          
          const routeName = getFocusedRouteNameFromRoute(route) ?? "KeysList";
          const isCreate = routeName === "KeyCreate";
          const isDetails = routeName === "KeyDetails";
          const isEdit = routeName === "KeyEdit";

          const screenConfig = {
            KeysList: {
              title: "Chaves",
              subtitle: "Controle de acesso aos laboratórios",
              showMenu: true,
            },
            KeyCreate: {
              title: "Cadastrar Nova Chave",
              subtitle: "Adicione uma chave ao inventário",
              showMenu: false,
            },
            KeyDetails: {
              title: "Detalhes da Chave",
              subtitle: "Visualize e gerencie a chave selecionada",
              showMenu: false,
            },
            KeyEdit: {
              title: "Editar Chave",
              subtitle: "Atualize os dados da chave",
              showMenu: false,
            },
          }[routeName] ?? {
            title: "Chaves",
            subtitle: "Controle de acesso",
            showMenu: true,
          };

          return {
            ...getDrawerHeaderOptions(navigation, {
              ...screenConfig,
              onBack: () => {
                
                if (isEdit) {
                  navigation.goBack();
                  return;
                }
                
                navigation.navigate("Chaves", { screen: "KeysList" });
              },
            }),
            drawerIcon: ({ color, size }) => (
              <Feather name="key" size={size} color={color} />
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
            subtitle: "Atualizações das solicitações",
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
