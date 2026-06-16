import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { SolicitacoesRecebidasScreen } from "../screens/admin/SolicitacoesRecebidasScreen";
import { FuncionarioSolicitationDetailsScreen } from "../screens/admin/SolicitacaoDetailsScreen";
import { RegisterSolicitationReturnScreen } from "../screens/admin/RegisterSolicitationReturnScreen";
import type { SolicitationStatus } from "../types/Solicitation";

export type FuncionarioSolicitacaoStackParamList = {
  ReceivedSolicitations:
    | {
        initialStatus?: SolicitationStatus;
        initialAnalysisPending?: boolean;
        clearFilters?: boolean;
      }
    | undefined;
  FuncionarioSolicitationDetails: {
    solicitationId: string;
    origin?: "CONSULTAS" | "AUDITORIA";
  };
  RegisterSolicitationReturn: {
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

      <Stack.Screen
        name="RegisterSolicitationReturn"
        component={RegisterSolicitationReturnScreen}
      />
    </Stack.Navigator>
  );
}
