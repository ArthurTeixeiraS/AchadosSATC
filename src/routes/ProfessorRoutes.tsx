import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { ProfessorHomeScreen } from "../screens/professor/ProfessorHomeScreen/ProfessorHomeScreen";

const Stack = createNativeStackNavigator();

//Módulo exclusivo para rotas de professores
export function ProfessorRoutes() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ProfessorHome"
        component={ProfessorHomeScreen}
        options={{ title: "Ferramentaria" }}
      />
    </Stack.Navigator>
  );
}