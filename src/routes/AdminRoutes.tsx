import React from "react";
import Feather from "@expo/vector-icons/Feather";
import {
  getFocusedRouteNameFromRoute,
  NavigatorScreenParams,
} from "@react-navigation/native";
import { createDrawerNavigator } from "@react-navigation/drawer";

import { DashboardScreen } from "../screens/admin/DashboardScreen";
import { ChavesScreen } from "../screens/admin/ChavesScreen";
import { AppDrawerContent } from "../components/AppDrawerContent";
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

export type AdminDrawerParamList = {
  Dashboard: undefined;
  Solicitações: NavigatorScreenParams<FuncionarioSolicitacaoStackParamList>;
  Recursos: NavigatorScreenParams<ResourceStackParamList>;
  Chaves: undefined;
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

          return {
            ...getDrawerHeaderOptions(navigation, {
              title: isDetails
                ? "Detalhes da solicitação"
                : "Solicitações",
              subtitle: isDetails
                ? "Analise e atualize o atendimento"
                : "Gerencie os pedidos recebidos",
              showMenu: !isDetails,
              onBack: () =>
                navigation.navigate("Solicitações", {
                  screen: "ReceivedSolicitations",
                }),
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
                  params?: ResourceStackParamList["EditResource"];
                }>;
              };
            }
          ).state;
          const activeRoute = nestedState?.routes[
            nestedState.index ?? 0
          ] as
            | {
                name: string;
                params?: ResourceStackParamList["EditResource"];
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
              title: "Novo recurso",
              subtitle: "Cadastre um recurso da ferramentaria",
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
        name="Chaves"
        component={ChavesScreen}
        options={({ navigation }) => ({
          ...getDrawerHeaderOptions(navigation, {
            title: "Chaves",
            subtitle: "Controle de acesso aos laboratórios",
          }),
          drawerIcon: ({ color, size }) => (
            <Feather name="key" size={size} color={color} />
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
