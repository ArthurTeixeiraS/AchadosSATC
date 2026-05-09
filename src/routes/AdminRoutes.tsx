import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { AdminHomeScreen } from "../screens/admin/AdminHomeScreen/AdminHomeScreen";

const Stack = createNativeStackNavigator();

//Módulo exclusivo para rotas de funcionários
export function AdminRoutes() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AdminHome"
        component={AdminHomeScreen}
        options={{ title: "Ferramentaria" }}
      />
    </Stack.Navigator>
  );
}