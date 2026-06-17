import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { MinhasSolicitacoesScreen } from "../screens/professor/MinhasSolicitacoesScreen";
import { ProfessorSolicitationDetailsScreen } from "../screens/professor/ProfessorSolicitationDetailsScreen";

export type MinhasSolicitacoesStackParamList = {
  MinhasSolicitacoesList:
    | {
        initialStatus?: string;
        initialAnalysisPending?: boolean;
      }
    | undefined;
  ProfessorSolicitationDetails: {
    solicitationId: string;
    origin?: "NOTIFICACOES";
  };
};

const Stack = createNativeStackNavigator<MinhasSolicitacoesStackParamList>();

export function MinhasSolicitacoesStackRoutes() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="MinhasSolicitacoesList"
        component={MinhasSolicitacoesScreen}
      />

      <Stack.Screen
        name="ProfessorSolicitationDetails"
        component={ProfessorSolicitationDetailsScreen}
      />
    </Stack.Navigator>
  );
}
