import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { SolicitationInfoScreen } from "../screens/professor/SolicitationInfoScreen";
import { SelectMachinesScreen } from "../screens/professor/SelectMachinesScreen";
import { SelectToolsScreen } from "../screens/professor/SelectToolsScreen";
import { ReviewSolicitationScreen } from "../screens/professor/ReviewSolicitationScreen";

export type NovaSolicitacaoStackParamList = {
  SolicitationInfo: undefined;
  SelectMachines: undefined;
  SelectTools: undefined;
  ReviewSolicitation: undefined;
};

const Stack = createNativeStackNavigator<NovaSolicitacaoStackParamList>();

export function NovaSolicitacaoStackRoutes() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="SolicitationInfo"
        component={SolicitationInfoScreen}
      />

      <Stack.Screen
        name="SelectMachines"
        component={SelectMachinesScreen}
      />

      <Stack.Screen
        name="SelectTools"
        component={SelectToolsScreen}
      />

      <Stack.Screen
        name="ReviewSolicitation"
        component={ReviewSolicitationScreen}
      />
    </Stack.Navigator>
  );
}