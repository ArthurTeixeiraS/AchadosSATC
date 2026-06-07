import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { SolicitacoesRecebidasScreen } from "../screens/admin/SolicitacoesRecebidasScreen";
import { FuncionarioSolicitationDetailsScreen } from "../screens/admin/SolicitacaoDetailsScreen";

export type FuncionarioSolicitacaoStackParamList = {
  ReceivedSolicitations: undefined;
  FuncionarioSolicitationDetails: {
    solicitationId: string;
  };
};

const Stack =
  createNativeStackNavigator<FuncionarioSolicitacaoStackParamList>();

export function FuncionarioSolicitacaoStackRoutes() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="ReceivedSolicitations"
        component={SolicitacoesRecebidasScreen}
      />

      <Stack.Screen
        name="FuncionarioSolicitationDetails"
        component={FuncionarioSolicitationDetailsScreen}
      />
    </Stack.Navigator>
  );
}