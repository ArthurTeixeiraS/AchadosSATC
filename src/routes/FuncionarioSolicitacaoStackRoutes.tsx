import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { SolicitacoesRecebidasScreen } from "../screens/admin/SolicitacoesRecebidasScreen";
// import { EmployeeSolicitationDetailsScreen } from "../screens/employee/EmployeeSolicitationDetailsScreen";

export type FuncionarioSolicitacaoStackParamList = {
  ReceivedSolicitations: undefined;
  EmployeeSolicitationDetails: {
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

      {/* <Stack.Screen
        name="EmployeeSolicitationDetails"
        component={EmployeeSolicitationDetailsScreen}
      /> */}
    </Stack.Navigator>
  );
}